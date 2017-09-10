'use strict';

class Emitter {
    counter(name, count, callback) {
        if(typeof callback !== 'function') {
            throw new Error('Invalid parameter passed, expecting a function type');
        }

        let stack = this._getEventStack(name);
        stack.data[stack.index] = {
            count: count,
            callback: callback
        };
        stack.length++;

        return stack.index++;
    }

    _getEventStack(name) {
        let eventContext = this._eventContext;
        if(eventContext == null) {
            this._eventContext = eventContext = {};
        }

        let eventStack = eventContext[name];
        if(eventStack == null) {
            eventContext[name] = eventStack = {
                index: 0,
                length: 0,
                data: {}
            };
        }

        return eventStack;
    }

    on(name, callback) {
        return this.counter(name, null, callback);
    }

    one(name, callback) {
        return this.counter(name, 1, callback);
    }

    off(name, index) {
        let eventStack = this._getEventStack(name),
            data = eventStack.data,
            ret = false;
            
        if(data[index] !== undefined) {
            ret = delete data[index];
            eventStack.length--;
        }

        return ret;
    }

    emit(name, ...args) {
        let errors = [];

        let eventStack = this._getEventStack(name);

        for(let i in eventStack.data) {
            let entry = eventStack.data[i];

            if(entry.count !== null
                && --entry.count <= 0) {
                this.off(name, i);
            }

            try {
                entry.callback.apply(this, args);
            }
            catch(ex) {
                errors.push(ex);
            }
        }

        if(errors.length) {
            throw errors;
        }
    }

    listeners(name) {
        return this._getEventStack(name).length;
    }
}

module.exports = Emitter;