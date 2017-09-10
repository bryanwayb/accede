const Queue = require('../../utils/Queue');

module.exports = {
    'subscribing': (test) => {
        let instance = new Queue(),
            count = 0;

        test.equal(instance.subscribe((passed) => { count += passed; }), 0);
        test.equal(instance.subscribe((passed) => { count += passed; }), 1);

        test.throws(() => {
            instance.subscribe(null);
        });

        test.equal(instance.subscribe((passed) => { count += passed; }), 2);

        test.equal(instance.length, 3);

        instance.complete(2);

        test.equal(count, 6);

        test.throws(() => {
            instance.complete(2);
        });

        test.doesNotThrow(() => {
            instance.subscribe((passed) => { count += passed; });
        });

        test.equal(count, 8);

        test.done();
    },
    'unsubscribing': (test) => {
        let instance = new Queue(),
            count = 0;

        let id1 = instance.subscribe((passed) => { count += passed; }),
            id2 = instance.subscribe((passed) => { count += passed; });

        instance.unsubscribe(id1);

        test.equal(instance.length, 1);

        test.throws(() => {
            instance.unsubscribe(id1);
        });

        test.throws(() => {
            instance.unsubscribe(50);
        });

        instance.complete(2);

        test.equal(count, 2);

        test.throws(() => {
            instance.unsubscribe(id2);
        });

        test.done();
    },
    'events': {
        'subscribed': (test) => {
            let instance = new Queue();

            let ok = false;

            instance.on('subscribed', () => {
                ok = true;
            });

            instance.subscribe(() => { });

            test.ok(ok);

            test.done();
        },
        'unsubscribed': (test) => {
            let instance = new Queue();

            let ok = false;

            instance.on('unsubscribed', () => {
                ok = true;
            });

            instance.unsubscribe(instance.subscribe(() => { }));

            test.ok(ok);

            test.done();
        },
        'completed': (test) => {
            let instance = new Queue();

            let ok = false;

            instance.on('completed', () => {
                ok = true;
            });

            instance.subscribe(() => { });

            instance.complete();

            test.ok(ok);

            test.done();
        }
    }
};