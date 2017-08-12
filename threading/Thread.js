'use strict';

const Emitter = require('../utils/Emitter');

let threadMain = (async (callback) => {
    class TinyEmitter {
        on(name, callback) {
            if(this._eventStack == null) {
                this._eventStack = {};
            }

            if(this._eventStack[name] == null) {
                this._eventStack[name] = [];
            }

            this._eventStack[name].push(callback);
        }

        emit(name, ...args) {
            let errors = [];
            if(this._eventStack) {
                if(this._eventStack[name]) {
                    for(let i = 0; i < this._eventStack[name].length; i++) {
                        try {
                            this._eventStack[name][i].apply(this, args);
                        }
                        catch(ex) {
                            errors.push(ex);
                        }
                    }
                }
            }

            if(errors.length) {
                throw errors;
            }
        }
    }

    class ThreadContext extends TinyEmitter {
        constructor() {
            super();

            this._functionIndex = 0;
            this._functionReturn = {};

            this.on('message', this.message.bind(this));
        }

        async kill() {
            await this.execute('kill');
        }

        async message(event) {
            if(event && event.data) {
                if(event.data.type === 'function') {
                    if(this[event.data.method]) {
                        let data = await this[event.data.method].apply(this, event.data.args);

                        postMessage({
                            type: 'return',
                            id: event.data.id,
                            data: data
                        });
                    }
                }
                else if(event.data.type === 'return') {
                    let handler = this._functionReturn[event.data.id];
                    if(handler != null) {
                        handler(event.data.data);
                        delete this._functionReturn[event.data.id];
                    }
                }
            }
        }

        execute(name, ...args) {
            return new Promise((resolve) => {
                let id = this._functionIndex++;

                this._functionReturn[id] = (data) => {
                    resolve(data);
                };

                postMessage({
                    type: 'function',
                    method: name,
                    args: args,
                    id: id
                });
            });
        }

        async _runInContext(func, ...args) {
            return await eval(`(${func})`).apply(this, args);
        }

        async runInMain(func, ...args) {
            return await this.execute.apply(this, ['_runInMain', func.toString(), ...args]);
        }
    }

    let threadContext = new ThreadContext();

    onerror = () => {
        threadContext.emit('error');
    };

    onmessage = (event) => {
        threadContext.emit('message', event);
    };

    try {
        let func = await callback(threadContext, null, null);

        if(typeof func === 'function') {
            await func();
        }
    }
    catch(ex) {
        await threadContext.execute('emit', 'error', ex.stack);
        threadContext.kill();
    }
}).toString();

class Thread extends Emitter {
    constructor(func) {
        if(func != null && typeof func !== 'function') {
            throw new Error(`Invalid argument passed to Thread constructor of type ${typeof func}`);
        }

        super();

        this._func = func;
        this._thread = null;
        this._functionIndex = 0;
        this._functionReturn = {};
    }

    start() {
        let ret = this._thread == null;

        if(ret) {
            let script = this._func == null ? 'null' : this._func.toString(),
                scriptBlob = new Blob([`(${threadMain})(async (thread, onerror, onmessage)=>{return (${script});});`], {type: 'application/javascript' }),
                scriptBlobURL = URL.createObjectURL(scriptBlob);

            this._thread = new Worker(scriptBlobURL);
            this._thread.onmessage = this.message.bind(this);

            this._thread.onerror = () => {
                this.emit('error');
            };

            URL.revokeObjectURL(scriptBlobURL);
        }

        return ret;
    }

    async message(event) {
        this.emit('message', event);

        if(event && event.data) {
            if(event.data.type === 'function') {
                if(this[event.data.method]) {
                    let data = await this[event.data.method].apply(this, event.data.args);

                    this._thread.postMessage({
                        type: 'return',
                        id: event.data.id,
                        data: data
                    });
                }
            }
            else if(event.data.type === 'return') {
                let handler = this._functionReturn[event.data.id];
                if(handler != null) {
                    handler(event.data.data);
                    delete this._functionReturn[event.data.id];
                }
            }
        }
    }

    execute(name, ...args) {
        if(this._thread != null) {
            return new Promise((resolve) => {
                let id = this._functionIndex++;

                this._functionReturn[id] = (data) => {
                    resolve(data);
                };

                this._thread.postMessage({
                    type: 'function',
                    method: name,
                    args: args,
                    id: id
                });
            });
        }
    }

    async _runInMain(func, ...args) {
        return await eval(`(${func})`).apply(this, args);
    }

    async runInContext(func, ...args) {
        return await this.execute.apply(this, ['_runInContext', func.toString(), ...args]);
    }

    async kill() {
        if(this._thread != null) {
            this._thread.terminate();
        }
    }
}

module.exports = Thread;