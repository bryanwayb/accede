'use strict';

class Async {
    static isPromise(obj) {
        return obj != null && Promise.prototype === obj.__proto__;
    }

    static async fromResult(obj) {
        return obj;
    }

    static delay(timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
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

    static async defer(...callbacks) {
        let length = callbacks.length,
            promises = new Array(length),
            i;
        
        for(i = 0; i < length; i++) {
            if(Async.isPromise(callbacks[i])) {
                promises[i] = callbacks[i];
            }
            else if(typeof callbacks[i] === 'function') {
                promises[i] = callbacks[i]();
            }
            else {
                throw new Error(`Invalid object with the type ${typeof callbacks[i]} was passed`);
            }
        }

        return await Promise.all(promises);
    }

    static async chain(...callbacks) {
        let length = callbacks.length,
            data = new Array(length);

        for(let i = 0; i < length; i++) {
            if(Async.isPromise(callbacks[i])) {
                data[i] = await callbacks[i];
            }
            else if (typeof callbacks[i] === 'function') {
                data[i] = await callbacks[i]();
            }
            else {
                throw new Error(`Invalid object with the type ${typeof callbacks[i]} was passed`);
            }
        }

        return data;
    }

    static async until(callback) {
        let p = callback;

        if(!Async.isPromise(callback)) {
            if(typeof callback === 'function') {
                p = callback();
            }
            else {
                throw new Error(`Invalid object with the type ${typeof callback} was passed`);
            }
        }

        let resolved = null;

        return async (...args) => {
            if(!resolved) {
                resolved = await p;
            }

            let ret = null;

            if(typeof resolved === 'function') {
                ret = await resolved.apply(this, args);
            }
            else {
                throw new Error(`Invalid object with the type ${typeof resolved} was resolved`);
            }

            return ret;
        };
    }
}

module.exports = Async;