'use strict';

class IndexedStack {
    constructor(indexStart = 0) {
        this._nextIndex = indexStart;
        this._stack = {};
        this.indexes = [];
    }

    insert(obj) {
        let index = this._nextIndex++;
        this._stack[index] = obj;
        this.indexes.push(index);
        return index;
    }

    remove(index) {
        let ret = false,
            indexPosition = this.indexes.indexOf(index);

        if(indexPosition !== -1
            && this._stack[index] !== undefined) {
            this.indexes.splice(indexPosition, 1);
            ret = delete this._stack[index];
        }
        
        return ret;
    }

    get(index) {
        return this._stack[index];
    }
}

module.exports = IndexedStack;