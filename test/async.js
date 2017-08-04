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
        }
    }
}