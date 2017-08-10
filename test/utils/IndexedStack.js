const IndexedStack = require('../../utils/IndexedStack.js');

module.exports = {
    'inserting objects': (test) => {
        let instance = new IndexedStack();

        test.equals(instance.insert({}), 0);
        test.equals(instance.insert({}), 1);

        test.doesNotThrow(() => {
            test.equals(instance.insert(null), 2);
        });

        test.equals(instance.indexes.length, 3);

        test.done();
    },
    'getting objects': (test) => {
        let instance = new IndexedStack();

        let obj = {},
            id = instance.insert(obj);

        test.ok(obj === instance.get(id));

        test.done();
    },
    'removing objects': (test) => {
        let instance = new IndexedStack();

        instance.insert({});

        let id = instance.insert({});
        test.ok(instance.remove(id)); // Should only remove the second entry

        test.ok(!instance.remove(id), 'Should not return true when removing an id that does not exist'); // Should not return true since entry is already deleted

        instance.insert({});

        test.equals(instance.indexes.length, 2);

        test.doesNotThrow(() => {
            test.ok(instance.get(id) === undefined, 'Getting an id that does not exist should return undefined');
        });

        test.done();
    }
};