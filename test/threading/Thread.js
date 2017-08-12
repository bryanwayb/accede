'use strict';

const Thread = require('../../threading/Thread');

module.exports = {
    'setup': (test) => {
        test.doesNotThrow(() => {
            new Thread();
            new Thread(null);
        }, 'Should be allowed to create a thread with no main entrypoint');

        test.doesNotThrow(() => {
            new Thread(() => {
            });
        }, 'Should be allowed to set a main entrypoint for the thread in constructor');

        test.doesNotThrow(() => {
            new Thread(() => {
                asdf123();
            });
        }, 'There should be no validation of the function passed to the thread constructor');

        test.throws(() => {
            new Thread(1234);
        });

        test.throws(() => {
            new Thread({});
        });

        test.throws(() => {
            new Thread('2');
        });
        
        test.done();
    },
    'running': {
        'start/kill': async (test) => {
            let instance = new Thread();
            test.ok(await instance.start());
            test.ok(!await instance.start(), 'Should not return true if thread was already created');
            test.ok(await instance.kill());
            test.ok(!await instance.kill(), 'Should not return true if thread was already killed');
            test.done();
        },
        'runInContext': {
            'basic use': async (test) => {
                let instance = new Thread();
                await instance.start();

                test.equals(await instance.runInContext((p) => {
                    return p * 10;
                }, 2), 20);

                test.done();
            },
            'async functions': async (test) => {
                let instance = new Thread();
                await instance.start();

                test.equals(await instance.runInContext(async (p) => {
                    return await new Promise((resolve) => {
                        resolve(p * 10);
                    });
                }, 2), 20);

                test.done();
            },
            'concurrent executions': async (test) => {
                let instance = new Thread();
                await instance.start();

                let results = [];

                for(let i = 0; i < 10; i++) {
                    results.push({
                        expected: i,
                        actual: await instance.runInContext(async (p) => {
                            return await new Promise((resolve) => {
                                resolve(p);
                            });
                        }, i)
                    });
                }

                test.equals(results.filter((value) => {
                    return value.actual != value.expected;
                }).length, 0, 'Mismatch between expected results when running multiple concurrent functions on a thread');

                test.done();
            },
            'error handling': {
                'exception passthrough': async (test) => {
                    let instance = new Thread();

                    await instance.start();

                    instance.runInContext(() => {
                        throw new Error('I should bubble up to the main thread');
                    }).then(() => {
                        test.ok(false, 'An exception was not throw');
                        test.done();
                    }, (ex) => {
                        test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                        test.done();
                    });
                },
                'unstarted thread': async (test) => {
                    let instance = new Thread();

                    instance.runInContext(() => {}).then(() => {
                        test.ok(false, 'An exception was not throw');
                        test.done();
                    }, (ex) => {
                        test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                        test.done();
                    });
                },
                'no paramters': async (test) => {
                    let instance = new Thread();

                    await instance.start();

                    instance.runInContext().then(() => {
                        test.ok(false, 'An exception was not throw');
                        test.done();
                    }, (ex) => {
                        test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                        test.done();
                    });
                }
            }
        },
        'runInMain': {
            'basic use': async (test) => {
                let instance = new Thread();

                await instance.start();

                test.equals(await instance.runInContext(async (p) => {
                    return await this.runInMain((p) => {
                        return p * 2;
                    }, p * 10);
                }, 2), 40);

                test.done();
            },
            'async functions': async (test) => {
                let instance = new Thread();

                await instance.start();

                test.equals(await instance.runInContext(async (p) => {
                    return await this.runInMain(async (p) => {
                        return await new Promise((resolve) => {
                            resolve(p * 2);
                        });
                    }, p * 10);
                }, 2), 40);

                test.done();
            },
            'concurrent executions': async (test) => {
                let instance = new Thread();
                await instance.start();

                let results = [];

                for(let i = 0; i < 10; i++) {
                    results.push({
                        expected: i,
                        actual: await instance.runInContext(async (p) => {
                            return await this.runInMain(async (p) => {
                                return await new Promise((resolve) => {
                                    resolve(p);
                                });
                            }, p);
                        }, i)
                    });
                }

                test.equals(results.filter((value) => {
                    return value.actual != value.expected;
                }).length, 0, 'Mismatch between expected results when running multiple concurrent functions on a thread');

                test.done();
            },
            'error handling': {
                'exception passthrough': async (test) => {
                    let instance = new Thread();

                    await instance.start();

                    instance.runInContext(async () => {
                        await this.runInMain(() => {
                            throw new Error('I should bubble up to the main thread');
                        });
                    }).then(() => {
                        test.ok(false, 'An exception was not throw');
                        test.done();
                    }, (ex) => {
                        test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                        test.done();
                    });
                },
                'no paramters': async (test) => {
                    let instance = new Thread();

                    await instance.start();

                    instance.runInContext(async () => {
                        await this.runInMain();
                    }).then(() => {
                        test.ok(false, 'An exception was not throw');
                        test.done();
                    }, (ex) => {
                        test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                        test.done();
                    });
                }
            }
        }
    }
};