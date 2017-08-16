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