const accede = require('../index.js');

module.exports = {
    'isPromise': {
        'promise': function (test) {
            test.ok(accede.async.isPromise(new Promise((resolve) => { resolve(); })));
            test.done();
        },
        'function': function (test) {
            test.ok(!accede.async.isPromise(() => { }));
            test.done();
        },
        'null/undefined': function (test) {
            test.doesNotThrow(() => {
                test.ok(!accede.async.isPromise(null));
                test.ok(!accede.async.isPromise());
            });
            test.done();
        }
    },
    'isAsyncFunction': {
        'async function': function (test) {
            test.ok(accede.async.isAsyncFunction(async () => { return await new Promise((r) => { r() }); }));
            test.done();
        },
        'function': function (test) {
            test.ok(!accede.async.isAsyncFunction(() => { }));
            test.done();
        },
        'null/undefined': function (test) {
            test.doesNotThrow(() => {
                test.ok(!accede.async.isAsyncFunction(null));
                test.ok(!accede.async.isAsyncFunction());
            });
            test.done();
        }
    },
    'fromResult': async function(test) {
        test.ok(accede.async.isPromise(accede.async.fromResult(null)));

        test.ok(await accede.async.fromResult('1') === '1');

        test.done();
    },
    'delay': async function(test) {
        test.ok(accede.async.isPromise(accede.async.delay(0)));

        let success = true;

        setTimeout(() => {
            success = false;
        }, 10);

        await accede.async.delay(1);

        test.ok(success); // Should still be true by this point

        test.done();
    },
    'call': {
        'function': {
            'run': function (test) {
                test.doesNotThrow(() => {
                    accede.async.call(() => {
                        test.done();
                    });
                });
            },
            'async check': function (test) {
                let check = false;
                accede.async.call(() => {
                    test.ok(check);
                    test.done();
                });
                check = true;
            },
            'cancel': function (test) {
                test.doesNotThrow(() => {
                    accede.async.call(() => {
                        throw new Error('I should never get thrown');
                    })();
                    accede.async.call(() => {
                        test.done(); // But I should
                    });
                });
            },
            'null/undefined': function (test) {
                test.throws(() => {
                    accede.async.call(null);
                });

                test.throws(() => {
                    accede.async.call();
                });

                test.done();
            }
        }
    },
    'defer': {
        'function': {
            'single': function (test) {
                accede.async.defer((done) => {
                    done(true);
                }).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.defer((done) => {
                    done(true);
                },
                (done) => {
                    done(false);
                },
                (done) => {
                    done(true);
                }).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'async functions': {
            'single': function (test) {
                accede.async.defer(async () => {
                    return true;
                }).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.defer(async () => {
                    return true;
                },
                async () => {
                    return false;
                },
                async () => {
                    return true;
                }).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'promise': {
            'single': function (test) {
                accede.async.defer(new Promise((resolve) => {
                    resolve(true);
                })).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.defer(new Promise((resolve) => {
                    resolve(true);
                }),
                new Promise((resolve) => {
                    resolve(false);
                }),
                new Promise((resolve) => {
                    resolve(true);
                })).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'functionality verification': async function(test) {
            let callbacks = new Array(2),
                count = 0;

            for(let i = 0; i < callbacks.length; i++) {
                let _i = i;
                callbacks[i] = async () => {
                    await accede.async.delay((callbacks.length - i) * 10);
                    return await accede.async.fromResult(count++ === _i);
                };
            }

            test.equals((await accede.async.defer.apply(this, callbacks)).filter(v => v).length, 0); // Functions should be executed out of order

            test.done();
        },
        'null': async function(test) {
            accede.async.defer(null).then(() => {
                test.ok(false, 'Promise was not rejected');
                test.done();
            }, () => {
                test.ok(true);
                test.done();
            });
        },
        'empty': function(test) {
            accede.async.defer().then(() => {
                test.ok(true);
                test.done();
            }).catch((ex) => {
                test.ok(false, ex);
                test.done();
            });
        }
    },
    'chain': {
        'function': {
            'single': function (test) {
                accede.async.chain((done) => {
                    done(true);
                }).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.chain((done) => {
                    done(true);
                },
                (done) => {
                    done(false);
                },
                (done) => {
                    done(true);
                }).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'async functions': {
            'single': function (test) {
                accede.async.chain(async () => {
                    return true;
                }).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.chain(async () => {
                    return true;
                },
                async () => {
                    return false;
                },
                async () => {
                    return true;
                }).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'promise': {
            'single': function (test) {
                accede.async.chain(new Promise((resolve) => {
                    resolve(true);
                })).then((results) => {
                    test.ok(results[0]);
                    test.done();
                });
            },
            'multiple': function (test) {
                accede.async.chain(new Promise((resolve) => {
                    resolve(true);
                }),
                new Promise((resolve) => {
                    resolve(false);
                }),
                new Promise((resolve) => {
                    resolve(true);
                })).then((results) => {
                    test.ok(results[0]);
                    test.ok(!results[1]);
                    test.ok(results[2]);
                    test.done();
                });
            }
        },
        'functionality verification': async function(test) {
            let callbacks = new Array(2),
                count = 0;

            for(let i = 0; i < callbacks.length; i++) {
                let _i = i;
                callbacks[i] = async () => {
                    await accede.async.delay((callbacks.length - i) * 10);
                    return await accede.async.fromResult(count++ === _i);
                };
            }

            test.equals((await accede.async.chain.apply(this, callbacks)).filter(v => !v).length, 0); // Functions should be executed in order

            test.done();
        },
        'null': function(test) {
            accede.async.chain(null).then(() => {
                test.ok(false, 'Promise was not rejected');
                test.done();
            }, () => {
                test.ok(true);
                test.done();
            });
        },
        'empty': function(test) {
            accede.async.chain().then(() => {
                test.ok(true);
                test.done();
            }).catch((ex) => {
                test.ok(false, ex);
                test.done();
            });
        }
    }
}