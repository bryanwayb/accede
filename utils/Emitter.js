'use strict';

class Emitter {
    on(name, callback) {
        this.count(name, null, callback);
    }

    count(name, count, callback) {
        let eventStack = this.eventStack;

        if(eventStack == null) {
            this.eventStack = eventStack = {};
        }

        if(eventStack[name] == null) {
            eventStack[name] = [];
        }

        eventStack[name].push({
            count: count,
            callback: callback
        });
    }

    one(name, callback) {
        this.count(name, 1, callback);
    }

    emit(name, ...args) {
        let errors = [];

        if(this.eventStack != null && this.eventStack[name]) {
            let callbacks = this.eventStack[name];

            for(let i = 0; i < callbacks.length; i++) {
                let entry = callbacks[i],
                    callback = entry.callback;
                if(entry.count != null) {
                    entry.count--;

                    if(entry.count <= 0) {
                        callbacks.splice(i, 1);
                        i--;
                    }
                }

                try {
                    callback.apply(this, args);
                }
                catch(ex) {
                    errors.push(ex);
                }
            }
        }

        if(errors.length) {
            throw errors;
        }
    }
}

module.exports = Emitter;