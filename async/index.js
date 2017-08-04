'use strict';

class Async {
    static isPromise(obj) {
        return obj != null && Promise.prototype === obj.__proto__;
    }

    static call(callback, ...args) {
        if(typeof callback !== 'function') {
            throw new Error('Invalid parameter passed, expecting a function type');
        }

        let complete = false,
            id = setTimeout(() => {
                callback.apply(this, args);
                complete = true;
        }, 0);

        return () => {
            if(!complete) {
                clearTimeout(id);
                complete = true;
                return true;
            }
            return false;
        };
    }

    static defer(...callbacks) {
        return new Promise((resolve, reject) => {
            let count = 0,
                length = callbacks.length,
                data = new Array(callbacks.length);

            function checkResolve() {
                if(++count === length) {
                    resolve(data);
                }
            }

            for(let i = 0; i < length; i++) {
                let _i = i;

                if(Async.isPromise(callbacks[i])) {
                    callbacks[i].then((results) => {
                        data[_i] = results;
                        checkResolve();
                    }).catch(reject);
                }
                else if(typeof callbacks[i] === 'function') {
                    new Promise((resolve, reject) => {
                        try {
                            callbacks[i]((results) => {
                                data[_i] = results;
                                checkResolve();
                            });
                        }
                        catch(ex) {
                            reject(ex);
                        }
                    }).catch(reject);
                }
                else {
                    reject(new Error(`Invalid object with the type ${typeof callbacks[i]} was passed`));
                }
            }
        });
    }
}

module.exports = Async;