'use strict';

const Emitter = require('./Emitter');

class Queue extends Emitter {
    constructor() {
        super();

        this._private = {
            index: 0,
            indexes: [],
            callbackStack: {},
            completeArgs: null
        };
    }

    get length() {
        return this._private.indexes.length;
    }

    subscribe(callback, unsubscribedCallback = null) {
        if(!process.env.production && typeof callback !== 'function') {
            throw new Error(`Callback must be a function, instead found ${typeof callback}`);
        }

        let ret = 0;
        if(this._private.completeArgs != null) { // Queue has already been completed
            new Promise((resolve) => {
                callback.apply(null, this._private.completeArgs);
                resolve();
            });
        }
        else {
            this._private.indexes.push(this._private.index);
            this._private.callbackStack[this._private.index] = {
                callback: callback,
                unsubscribedCallback: unsubscribedCallback
            };
            ret = this._private.index++;

            this.emit('subscribed', ret, callback, unsubscribedCallback);
        }

        return ret;
    }

    unsubscribe(id) {
        if(!process.env.production && this._private.callbackStack == null) {
            throw new Error('Cannot unsubscribe from a queue that has already been completed');
        }

        let indexPosition = this._private.indexes.indexOf(id),
            ret = indexPosition !== -1;

        if(ret) {
            this._private.indexes.splice(indexPosition, 1);
            let toDelete = this._private.callbackStack[id];

            if(toDelete.unsubscribedCallback != null) {
                toDelete.unsubscribedCallback();
            }

            this.emit('unsubscribed', id, toDelete.callback, toDelete.unsubscribedCallback);

            delete this._private.callbackStack[id];
        }
        else if(!process.env.production) {
            throw new Error(`Subscription id ${id} was not found in queue`);
        }

        return ret;
    }

    complete(...args) {
        if(!process.env.production && this._private.callbackStack == null) {
            throw new Error('Queue has already been completed');
        }

        let errors = [];

        for(let i = 0; i < this._private.indexes.length; i++) {
            try {
                this._private.callbackStack[this._private.indexes[i]].callback.apply(null, args);
            }
            catch(ex) {
                errors.push(ex);
            }
        }

        this.emit('completed', args);

        delete this._private.callbackStack;
        delete this._private.indexes;
        delete this._private.index;

        this._private.completeArgs = args;

        if(errors.length) {
            throw errors;
        }
    }
}

module.exports = Queue;