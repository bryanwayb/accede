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
    'fromResult': async function(test) {
        test.ok(accede.async.isPromise(accede.async.fromResult(null)));

        test.ok(await accede.async.fromResult('1') === '1');

        test.done();
    },
    'delay': async function(test) {
        test.ok(accede.async.isPromise(accede.async.delay(0)));

        let success = true;

        let p = accede.async.delay(1);

        setTimeout(() => {
            success = false;
        }, 2);

        await p;

        test.ok(success); // Should still be true by this point

        test.done();
    },
    'call': {
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
    },
    'until': {
        'setup': {
            'async function': async function (test) {
                let method = await accede.async.until(async () => {
                    return await accede.async.fromResult(() => {
                        return true;
                    });
                });

                test.ok(await method() === true);

                test.done();
            },
            'promise': async function (test) {
                let method = await accede.async.until(new Promise((resolve) => {
                    resolve(() => {
                        return true;
                    });
                }));

                test.ok(await method() === true);

                test.done();
            },
            'null': function (test) {
                accede.async.until(null).then(() => {
                    test.ok(false, 'Passing a null value should reject the Promise');
                    test.done();
                }).catch(ex => {
                    test.ok(true);
                    test.done();
                });
            },
            'empty': async function (test) {
                accede.async.until(null).then(() => {
                    test.ok(false, 'Not passing a valid value should reject the Promise');
                    test.done();
                }).catch(ex => {
                    test.ok(true);
                    test.done();
                });
            }
        },
        'resolved': {
            'async function': async function (test) {
                let method = await accede.async.until(async () => {
                    return await accede.async.fromResult(async () => {
                        return true;
                    });
                });

                test.ok(await method() === true);

                test.done();
            },
            'null': async function (test) {
                let method = await accede.async.until(async () => {
                    return await accede.async.fromResult(new Promise((resolve) => {
                        resolve(null);
                    }));
                });

                try {
                    await method();
                    test.ok(false, 'The resolved Promise should have been rejected');
                }
                catch(ex) {
                    test.ok(true);
                }

                test.done();
            },
            'empty': async function (test) {
                let method = await accede.async.until(async () => {
                    return await accede.async.fromResult(new Promise((resolve) => {
                        resolve(null);
                    }));
                });

                try {
                    await method();
                    test.ok(false, 'The resolved Promise should have been rejected');
                }
                catch(ex) {
                    test.ok(true);
                }

                test.done();
            }
        }
    }
}