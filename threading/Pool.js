'use strict';

if(!process.env.ACCEDE_DISABLE_THREAD) {
    const Thread = require('./Thread');
    
    class Pool {
        constructor(maxConcurrent = 1, threadCount = window.navigator.hardwareConcurrency || 1) {
            if(maxConcurrent < 1) {
                throw new Error('Max concurrent thread operations must be at least 1 or greater');
            }
            else if(threadCount < 1) {
                throw new Error('Pool thread count must be 1 or greater');
            }

            this._mutex = new Array(threadCount);
            this._maxConcurrent = maxConcurrent;
            this._threadFinished = [];
    
            for(let i = 0; i < threadCount; i++) {
                this._mutex[i] = {
                    thread: new Thread(),
                    concurrent: 0
                };
            }
        }
    
        async start() {
            let p = new Array(this._mutex.length);
            for(let i = 0; i < this._mutex.length; i++) {
                p[i] = this._mutex[i].thread.start();
            }
            await Promise.all(p);
        }
    
        async run(func, ...args) {
            let id = null;
    
            let mutexIndex = null,
                leastCount = this._maxConcurrent,
                found = false;
    
            for(let i = 0; i < this._maxConcurrent && !found; i++) {
                for(let o = 0; o < this._mutex.length; o++) {
                    if(this._mutex[o].concurrent < leastCount) {
                        mutexIndex = o;
                        leastCount = this._mutex[i].concurrent;
                        if(leastCount === 0) {
                            found = true;
                            break;
                        }
                    }
                }
            }
    
            if(mutexIndex != null
                && leastCount <= this._maxConcurrent) {
                id = mutexIndex;
            }
            else {
                id = await new Promise((resolve) => {
                    this._threadFinished.push((mutexIndex) => {
                        resolve(mutexIndex);
                    });
                });
            }
    
            let mutex = this._mutex[id],
                thread = mutex.thread;
            
            mutex.concurrent++;
    
            if(thread.id == null) {
                await thread.start();
            }
    
            let ret = null;
    
            try {
                ret = await thread.runInContext.apply(thread, [func, ...args]);
            }
            catch (ex) {
                throw ex;
            }
            finally {
                mutex.concurrent--;
            }
    
            if(this._threadFinished.length) {
                this._threadFinished.pop()(id);
            }
    
            return ret;
        }
    
        async cluster(concurrent, func, ...args) {
            let promises = new Array(concurrent);
    
            for(let i = 0; i < concurrent; i++) {
                promises[i] = this.run.apply(this, [func, ...args]);
            }
    
            return await Promise.all(promises);
        }
    
        async kill() {
            for(let i = 0; i < this._mutex.length; i++) {
                await this._mutex[i].thread.kill();
            }
        }
    }
    
    module.exports = Pool;
}
else {
    module.exports = null;
}