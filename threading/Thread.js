'use strict';

if(!process.env.ACCEDE_DISABLE_THREAD) {
    const Emitter = require('../utils/Emitter');
    
    let threadMain = require('./threadMain'),
        threadMainEntrypoint = threadMain.entrypoint.toString();
    
    let threadIndex = 0,
        threadStack = {};
    
    class Thread extends Emitter {
        constructor(func, exposed) {
            if(func != null) {
                if(exposed != null) {
                    if(typeof exposed !== 'object' || !Array.isArray(exposed)) {
                        throw new Error(`Invalid argument passed to Thread constructor for 'exposed' of type ${typeof exposed}`);
                    }
                }
                else if(typeof func === 'object' && Array.isArray(func)) {
                    exposed = func;
                    func = null;
                }

                if(func != null && typeof func !== 'function') {
                    throw new Error(`Invalid argument passed to Thread constructor for 'func' of type ${typeof func}`);
                }
            }

            if(exposed == null) {
                exposed = [];
            }
            else if(!Array.isArray(exposed)) {
                exposed = [exposed];
            }
            exposed.push.apply(exposed, threadMain.entrypointDependencies);

            // TODO verify exposed objects here
    
            super();
    
            this._func = func;
            this._exposed = exposed;
            this._thread = null;
            this._functionIndex = 0;
            this._functionReturn = {};
            this.id = null;
        }
    
        static get all() {
            return threadStack;
        }
    
        async start() {
            let ret = this._thread == null;
    
            if(ret) {
                let script = '';

                for(let i in this._exposed) {
                    script += this._exposed[i].createScript();
                }

                script += `(${threadMainEntrypoint})(async (thread, onerror, onmessage)=>{return (${this._func == null ? 'null' : this._func.toString()});});`;

                let scriptBlob = new Blob([script], {type: 'application/javascript' }),
                    scriptBlobURL = URL.createObjectURL(scriptBlob);
    
                this._thread = new Worker(scriptBlobURL);
                this.id = ++threadIndex;
                threadStack[this.id] = this;
                this._thread.onmessage = this.message.bind(this);
    
                this._thread.onerror = () => {
                    this.emit('error');
                };
    
                URL.revokeObjectURL(scriptBlobURL);
    
                await this.execute('_setupOnline', this.id);
            }
    
            return ret;
        }
    
        async message(event) {
            this.emit('message', event);
    
            if(event && event.data) {
                if(event.data.type === 'function') {
                    if(this[event.data.method]) {
                        let data = null,
                            error = null;
    
                        try {
                            data = await this[event.data.method].apply(this, event.data.args);
                        } catch(ex) {
                            error = ex.toString();
                        }
    
                        this._thread.postMessage({
                            type: 'return',
                            id: event.data.id,
                            data: data,
                            error: error
                        });
                    }
                }
                else if(event.data.type === 'return') {
                    let handler = this._functionReturn[event.data.id];
                    if(handler != null) {
                        handler(event.data);
                        delete this._functionReturn[event.data.id];
                    }
                }
            }
        }
    
        execute(name, ...args) {
            if(this._thread != null) {
                return new Promise((resolve, reject) => {
                    let id = this._functionIndex++;
    
                    this._functionReturn[id] = (results) => {
                        if(results.error) {
                            reject(results.error);
                        }
                        else {
                            resolve(results.data);
                        }
                    };
    
                    this._thread.postMessage({
                        type: 'function',
                        method: name,
                        args: args,
                        id: id
                    });
                });
            }
            else {
                throw new Error(`Cannot execute ${name}, thread is not started`);
            }
        }
    
        async _runInMain(func, ...args) {
            return await eval(`(${func})`).apply(this, args);
        }
    
        async runInContext(func, ...args) {
            if(typeof func !== 'function') {
                throw new Error(`First argument must be a function, found ${typeof func}`);
            }
            return await this.execute.apply(this, ['_runInContext', func.toString(), ...args]);
        }
    
        async kill() {
            let ret = false;
            if(this._thread != null) {
                this._thread.terminate();
                delete threadStack[this.id];
                this._thread = null;
                ret = true;
            }
            return ret;
        }
    }
    
    module.exports = Thread;
}
else {
    module.exports = null;
}