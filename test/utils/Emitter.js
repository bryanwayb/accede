const Emitter = require('../../utils/Emitter');

module.exports = {
    'setting listeners': (test) => {
        let instance = new Emitter();
        
        test.doesNotThrow(() => {
            test.ok(instance.on('testing', () => {}) != null);
            test.ok(instance.counter('testing', 5, () => {}) != null);
            test.ok(instance.one('example', () => {}) != null);
        });

        test.done();
    },
    'setting invalid listeners': (test) => {
        let instance = new Emitter();
        
        test.throws(() => {
            instance.on('testing', null);
        });

        test.throws(() => {
            instance.on('testing');
        });

        test.throws(() => {
            instance.on('testing', new Promise((resolve) => { resolve(() => { }) }));
        });

        test.done();
    },
    'emitting events': {
        'on callbacks': (test) => {
            let instance = new Emitter();

            test.doesNotThrow(() => {
                let counter = 0;

                instance.on('testing', () => {
                    counter++;
                });

                 instance.on('testing', () => {
                    counter++;
                });

                for(let i = 0; i < 10; i++) {
                    instance.emit('testing');
                }

                test.equals(counter, 20); // Total of 10 per callback
            });

            test.done();
        },
        'one callbacks': (test) => {
            let instance = new Emitter();

            test.doesNotThrow(() => {
                let counter = 0;

                instance.one('testing', () => {
                    counter++;
                });

                instance.one('testing', () => {
                    counter++;
                });

                for(let i = 0; i < 10; i++) {
                    instance.emit('testing');
                }

                test.equals(counter, 2); // Should have only executed once for each callback
            });

            test.done();
        },
        'counter callbacks': (test) => {
            let instance = new Emitter();

            test.doesNotThrow(() => {
                let counter = 0;

                instance.counter('testing', 2, () => {
                    counter++;
                });

                instance.counter('testing', 3, () => {
                    counter++;
                });

                for(let i = 0; i < 10; i++) {
                    instance.emit('testing');
                }

                test.equals(counter, 5); // 2 executions for the first, 3 for the second
            });

            test.done();
        },
        'passing arguments': (test) => {
            let instance = new Emitter();

            test.doesNotThrow(() => {
                let passedArg = null;
                instance.on('testing', (arg) => {
                    passedArg = arg;
                });

                instance.emit('testing', true);

                test.ok(passedArg);
            });

            test.done();
        },
        'error handling': (test) => {
            let instance = new Emitter();

            let count = 0;

            test.throws(() => {
                instance.on('testing', () => {
                    count++;
                    throw new Error('Should be thrown');
                });

                instance.on('testing', () => {
                    count++;
                    throw new Error('Should also thrown');
                });

                instance.emit('testing');
            });

            test.equals(count, 2, 'All callbacks were not ran, thrown exceptions may be killing the event stack');

            test.done();
        }
    },
    'removing listeners': (test) => {
        test.doesNotThrow(() => {
            let instance = new Emitter();

            let listenerId = instance.on('testing', () => {
                throw new Error('I should never get thrown');
            });

            test.ok(instance.off('testing', listenerId));

            instance.emit('testing');
        }, 'Failed to remove event listener');

        test.doesNotThrow(() => {
            let instance = new Emitter(),
                count = 0;

            instance.on('testing', () => {
                count++;
            });

            let listenerId = instance.on('testing', () => {
                throw new Error('I should never get thrown');
            });

            instance.on('testing', () => {
                count++;
            });

            test.ok(instance.off('testing', listenerId));
            test.ok(instance.off('testing', listenerId) === false); // Should return false since it wasn't removed

            instance.emit('testing');

            test.equals(count, 2, 'Some events that were not removed were not ran');
        }, 'Failed to remove event listener');

        test.done();
    }
};