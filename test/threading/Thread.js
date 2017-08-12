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
            test.ok(instance.start());
            test.ok(!instance.start(), 'Should not return true if thread was already created');
            test.ok(await instance.kill());
            test.ok(!await instance.kill(), 'Should not return true if thread was already killed');
            test.done();
        },
        'runInContext': async (test) => {
            let instance = new Thread();
            instance.start();

            test.equals(await instance.runInContext((p) => {
                return p * 10;
            }, 2), 20);

            instance.runInContext((p) => {
                throw new Error('I should bubble up to the main thread');
            }, 2).then(() => {
                test.ok(false, 'An exception was not throw');
                test.done();
            }, (ex) => {
                test.ok(ex != null, 'An exception should have been thrown and the exception returned in the reject reason');
                test.done();
            });
        }
    }
};