'use strict';

class IndexedStack {
    constructor(indexStart = 0) {
        this.nextIndex = indexStart;
        this.indexes = [];
        this.stack = {};
    }

    insert(obj) {
        let index = this.nextIndex++;
        this.stack[index] = obj;
        this.indexes.push(index);
        return index;
    }

    remove(index) {
        return this.removePosition(this.indexes.indexOf(index));
    }

    removePosition(pos) {
        let ret = false;

        if(pos !== -1) {
            let index = this.indexes[pos];
            if((ret = delete this.stack[index])) {
                this.indexes.splice(pos, 1);
            }
        }

        return ret;
    }
}

module.exports = IndexedStack;