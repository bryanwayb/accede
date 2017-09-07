'use strict';

class Queue {
    constructor() {
        this.index = 0;
        this.indexes = [];
        this.callbackStack = {};
    }

    subscribe(callback) {
        if(!process.env.production && this.callbackStack == null) {
            throw new Error('Cannot subscribe to a queue that has already been completed');
        }

        this.indexes.push(this.index);
        this.callbackStack[this.index] = callback;
        return this.index++;
    }

    unsubscribe(id) {
        if(!process.env.production && this.callbackStack == null) {
            throw new Error('Cannot unsubscribe from a queue that has already been completed');
        }

        let indexPosition = this.indexes.indexOf(id),
            ret = indexPosition !== -1;

        if(ret) {
            this.indexes.splice(indexPosition, 1);
            delete this.callbackStack[id];
        }

        return ret;
    }

    complete(...args) {
        if(!process.env.production && this.callbackStack == null) {
            throw new Error('Cannot complete a queue that has already been completed');
        }

        let errors = [];

        for(let i = 0; i < this.indexes.length; i++) {
            try {
                this.callbackStack[this.indexes[i]].apply(null, args);
            }
            catch(ex) {
                errors.push(ex);
            }
        }

        delete this.callbackStack;
        delete this.indexes;
        delete this.index;

        if(errors.length) {
            throw errors;
        }
    }
}

module.exports = Queue;