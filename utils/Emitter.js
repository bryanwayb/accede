'use strict';

const IndexedStack = require('./IndexedStack');

class Emitter {
    counter(name, count, callback) {
        if(typeof callback !== 'function') {
            throw new Error('Invalid parameter passed, expecting a function type');
        }

        return this._getEventStack(this, name).insert({
            count: count,
            callback: callback
        });
    }

    _getEventStack(context, name) {
        let eventContext = context._eventContext;
        if(eventContext == null) {
            context._eventContext = eventContext = {};
        }

        let eventStack = eventContext[name];
        if(eventStack == null) {
            eventContext[name] = eventStack = new IndexedStack();
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
        return this._getEventStack(this, name).remove(index);
    }

    emit(name, ...args) {
        let errors = [];

        let eventStack = this._getEventStack(this, name);

        for(let i of eventStack.indexes) {
            let entry = eventStack.get(i);

            if(entry.count !== null
                && --entry.count <= 0) {
                    eventStack.remove(i);
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
}

module.exports = Emitter;