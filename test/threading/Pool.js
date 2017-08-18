'use strict';

const Pool = require('../../threading/Pool');

if(Pool) {
    module.exports = {
        'setup': (test) => {
            test.doesNotThrow(() => {
                new Pool();
            }, 'Should be allowed to create a Pool instance with default options');
    
            test.throws(() => {
                new Pool(0);
            });
    
            test.throws(() => {
                new Pool(1, 0);
            });
            
            test.done();
        },
        'running': {
            'start': async (test) => {
                let instance = new Pool(1, 4);

                instance.start().then(() => {
                    test.ok(true);
                    test.done();
                }, () => {
                    test.ok(false, 'Error while starting pool threads');
                    test.done();
                });
            },
            'kill': async (test) => {
                let instance = new Pool(1, 4);

                await instance.start();

                instance.kill().then(() => {
                    test.ok(true);
                    test.done();
                }, () => {
                    test.ok(false, 'Error while killing pool threads');
                    test.done();
                })
            },
            'run': {
                'single task': async (test) => {
                    let instance = new Pool(1, 2);
                    await instance.start();
    
                    test.equals(await instance.run((p) => {
                        return p * 10;
                    }, 2), 20);
    
                    test.done();
                },
                'multiple tasks': async (test) => {
                    let instance = new Pool(2, 2);
                    await instance.start();

                    /*
                        A bit of an explaination on how the pool scheduler should work below
                        with a maxConcurrent param of 2 and threadCount of 2.
                        
                            - Task (task1) is scheduled to run --> Set to run on thread 0
                            - Task (task2) is scheduled to run --> Set to run on thread 1
                            - Task (task3) is scheduled to run --> Set to run on thread 0 (will queue until task1 gives exeution time)
                            - Task (task4) is scheduled to run --> Set to run on thread 1 (will queue until task2 gives exeution time)
                            - Task (task5) is scheduled to run --> Queue to run on first available thread since max concurrency has been reached (no guarantee on which one)

                        So when modifying the tasks below keep the above logic in mind.
                    */
    
                    let task1 = instance.run(() => {
                        this.hasRanFirst = true;
                        return this.id;
                    }),
                    task2 = instance.run(() => {
                        this.hasRanFirst = true;
                        return this.id;
                    }),
                    task3 = instance.run(() => {
                        let ret = null;
                        if(this.hasRanFirst) {
                            ret = this.id;
                        }
                        this.id = null;
                        return ret;
                    }),
                    task4 = instance.run(() => {
                        let ret = null;
                        if(this.hasRanFirst) {
                            ret = this.id;
                        }
                        this.id = null;
                        return ret;
                    }),
                    task5 = instance.run(() => {
                        return this.id;
                    });

                    test.ok(await task1 != null, 'Task 1 should have executed first on thread[0]');
                    test.ok(await task2 != null, 'Task 2 should have executed first on thread[1]');
                    test.ok(await task3 != null, 'Task 3 should have executed second on thread[0]');
                    test.ok(await task4 != null, 'Task 4 should have executed second on thread[1]');
                    test.ok(await task5 == null, 'Task 5 should have been ran on at least one of the threads that tasks 1 or 2 ran on');

                    test.notEqual(await task1, await task2, 'Task 1 and 2 should have been ran on different threads');
                    test.notEqual(await task3, await task4, 'Task 3 and 4 should have been ran on different threads'); 
                    test.equal(await task1, await task3, 'Task 1 and 3 should have been ran on the same thread');
                    test.equal(await task2, await task4, 'Task 1 and 3 should have been ran on the same thread');
    
                    test.done();
                }
            },
            'cluster': async (test) => {
                let instance = new Pool(2, 2);

                await instance.start();

                let values = await instance.cluster(40, () => {
                    if(this._clusterMax === undefined) {
                        this._clusterMax = 0;
                    }

                    this._clusterMax++

                    return new Promise((resolve) => {
                        setTimeout(() => { // Lower priority for other events
                            resolve(this._clusterMax--);
                        }, 0);
                    });
                });

                test.equal(values.filter(v => v <= 2).length, 40, 'All clustered threads should have had no more than 2 concurrent operations at a time');

                values = await instance.cluster(40, () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(this.id);
                        }, 0);
                    });
                });

                let foundValues = {};
                for(let i in values) {
                    foundValues[values[i]] = true;
                }

                test.equal(Object.keys(foundValues).length, 2, 'Thread count should not span more than 2 threads with current Pool instance');

                test.done();
            }
        }
    };
}
else {
    console.warn('Skipping Pool test, not supported in current build');
}