const Headers = require('../../network/Headers');

module.exports = {
    'initializing': (test) => {
        test.doesNotThrow(() => {
            new Headers();
        }, 'Should be allowed to create a blank Header object');

        test.doesNotThrow(() => {
            new Headers({
                'test': '1234'
            });
        }, 'Should be allowed to create a Header object with initialized values');

        test.throws(() => {
            new Headers('invalid data');
        }, 'Should not be allowed to create a Header object with a string passed as the source param');

        test.throws(() => {
            new Headers(1234);
        }, 'Should not be allowed to create a Header object with a number passed as the source param');

        test.throws(() => {
            new Headers(() => { });
        }, 'Should not be allowed to create a Header object with a function passed as the source param');

        test.done();
    },
    'getters': {
        'keys': (test) => {
            let headerValues = {
                'TESTING-header': 'testing-value'
            };

            let instance = new Headers(headerValues);

            headerValues['does not exist'] = '1234';

            let keys = instance.keys();

            test.equal(keys.length, 1, 'Header instance expected to only have 1 key entry');

            test.equal(keys[0], 'testing-header');

            test.done();
        },
        'has': (test) => {
            let headerValues = {
                'TESTING-header': 'testing-value'
            };

            let instance = new Headers(headerValues);

            headerValues['does not exist'] = '1234';

            test.ok(instance.has('testing-header'), 'This Header.has() call is expected to return true');
            test.ok(!instance.has('does not exist'), 'This Header.has() call is expected to return false');

            test.done();
        },
        'get': (test) => {
            let headerValues = {
                'TESTING-header': 'testing-value'
            };

            let instance = new Headers(headerValues);

            headerValues['does not exist'] = '1234';

            test.equal(instance.get('testing-header'), 'testing-value');
            test.equal(instance.get('does not exist'), null, 'Header.get() should return null when a header name does not exist');

            test.done();
        },
        'entries': (test) => {
            let headerValues = {
                'TESTING-header': 'testing-value',
                'another-test': '1234'
            };

            let instance = new Headers(headerValues);

            let entries = instance.entries();

            test.equal(Object.keys(entries).length, Object.keys(headerValues).length, 'Header.entries() should return an object with header names as keys');

            test.equal(headerValues['TESTING-header'], entries['TESTING-header']);
            test.equal(headerValues['another-test'], entries['another-test']);

            test.done();
        },
        'iterator': (test) => {
            let headerValues = {
                'TESTING-header': 'testing-value',
                'another-test': '1234'
            };

            let instance = new Headers(headerValues);

            let count = 0;
            for(let kv of instance) {
                test.equal(kv.value, instance.get(kv.name));
                count++;
            }

            test.equal(count, 2, 'Header iterator returned more than the expected 2 header key/values');

            test.done();
        }
    },
    'setters': {
        'set': (test) => {
            let instance = new Headers();

            instance.set('testing-header', 'testing-value');

            test.equal(instance.get('testing-header'), 'testing-value');
            test.equal(instance.get('does not exist'), null, 'Header.get() should return null when a header name does not exist');

            test.done();
        },
        'remove': (test) => {
            let instance = new Headers();

            instance.set('testing-header', 'testing-value');
            instance.set('does not exist', 'should get removed');
            instance.remove('does not exist');

            test.equal(instance.get('testing-header'), 'testing-value');
            test.equal(instance.get('does not exist'), null, 'Header.get() should return null when a header name does not exist');

            test.done();
        }
    }
};