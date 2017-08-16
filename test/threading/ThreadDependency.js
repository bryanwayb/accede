'use strict';

const ThreadDependency = require('../../threading/ThreadDependency');

if(ThreadDependency) {
    module.exports = {
        'basic setup': (test) => {
            test.doesNotThrow(() => {
                new ThreadDependency('testing', () => { });
                new ThreadDependency('testing', function test() { });
                new ThreadDependency('testing', 1234);
                new ThreadDependency('testing', '1234');
                new ThreadDependency('testing', 'asdf');
                new ThreadDependency('testing', {test:1234});
                new ThreadDependency('testing', [1,2,3,4]);
                new ThreadDependency('testing', null);
                new ThreadDependency('testing');
            });

            test.done();
        },
        'invalid names': (test) => {
            test.throws(() => {
                new ThreadDependency('test obj', () => { });
            });

            test.throws(() => {
                new ThreadDependency('test\nobj', () => { });
            });

            test.throws(() => {
                new ThreadDependency('test\tobj', () => { });
            });

            test.throws(() => {
                new ThreadDependency('test\robj', () => { });
            });

            test.done();
        },
        'script creation': (test) => {
            test.doesNotThrow(() => {
                new ThreadDependency('testingObject', () => { return 'testing'; }).createScript();
            });

            test.done();
        },
        'dependencies': (test) => {
            test.doesNotThrow(() => {
                new ThreadDependency('testingObject', () => { return childDep(); }, new ThreadDependency('childDep', () => { return 'testing'; })).createScript();
            });

            test.doesNotThrow(() => {
                new ThreadDependency('testingObject', () => { return childDep(); }, [new ThreadDependency('childDep', () => { return 'testing'; })]).createScript();
            });

            test.doesNotThrow(() => {
                new ThreadDependency('testingObject', () => { return 'testing'; }, []).createScript();
            });

            test.done();
        },
        'invalid dependencies': (test) => {
            test.throws(() => {
                new ThreadDependency('test obj', () => { }, [{}]);
            });

            test.throws(() => {
                new ThreadDependency('test obj', () => { }, [[]]);
            });

            test.throws(() => {
                new ThreadDependency('test obj', () => { }, ['invalid']);
            });

            test.throws(() => {
                new ThreadDependency('test\robj', () => { }, 'more invalid');
            });

            test.done();
        }
    };
}
else {
    console.warn('Skipping ThreadDependency test, not supported in current build');
}