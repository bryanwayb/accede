const tests = {
    async: require('./test/async')
};

if(typeof module !== 'undefined' && module.exports != null) {
    const path = require('path');

    // Only export tests if we're not the entry script
    if(path.basename(__filename) != path.basename(process.mainModule.filename)) {
        module.exports = tests;
    }
    else { // Otherwise run them
        const nodeunit = require('nodeunit').reporters.default;

        nodeunit.run({
            async: require('./test/async')
        });
    }
}