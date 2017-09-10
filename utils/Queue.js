'use strict';

const Emitter = require('./Emitter');

class Queue extends Emitter {
    constructor() {
        super();

        this.index = 0;
        this.indexes = [];
        this.callbackStack = {};
        this.completeArgs = null;
    }

    get length() {
        return this.indexes.length;
    }

    subscribe(callback, unsubscribedCallback = null) {
        let ret = 0;
        if(this.completeArgs != null) { // Queue has already been completed
            new Promise((resolve) => {
                callback.apply(null, this.completeArgs);
                resolve();
            });
        }
        else {
            this.indexes.push(this.index);
            this.callbackStack[this.index] = {
                callback: callback,
                unsubscribedCallback: unsubscribedCallback
            };
            ret = this.index++;

            this.emit('subscribed', ret, callback, unsubscribedCallback);
        }

        return ret;
    }

    unsubscribe(id) {
        if(!process.env.production && this.callbackStack == null) {
            throw new Error('Cannot unsubscribe from a queue that has already been completed');
        }

        let indexPosition = this.indexes.indexOf(id),
            ret = indexPosition !== -1;

        if(ret) {
            this.indexes.splice(indexPosition, 1);
            let toDelete = this.callbackStack[id];

            if(toDelete.unsubscribedCallback != null) {
                toDelete.unsubscribedCallback();
            }

            this.emit('unsubscribed', id, toDelete.callback, toDelete.unsubscribedCallback);

            delete this.callbackStack[id];
        }
        else if(!process.env.production) {
            throw new Error(`Subscription id ${id} was not found in queue`);
        }

        return ret;
    }

    complete(...args) {
        if(!process.env.production && this.callbackStack == null) {
            throw new Error('Queue has already been completed');
        }

        let errors = [];

        for(let i = 0; i < this.indexes.length; i++) {
            try {
                this.callbackStack[this.indexes[i]].callback.apply(null, args);
            }
            catch(ex) {
                errors.push(ex);
            }
        }

        this.emit('completed', args);

        delete this.callbackStack;
        delete this.indexes;
        delete this.index;

        this.completeArgs = args;

        if(errors.length) {
            throw errors;
        }
    }
}

module.exports = Queue;