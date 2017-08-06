let isBrowser = typeof window !== 'undefined';
    
if(isBrowser) {
    require("babel-polyfill");
}

const tests = {
    async: require('./test/async')
};

const path = require('path');

// Only export tests if we're not the entry script
if(process.mainModule != null && path.basename(__filename) != path.basename(process.mainModule.filename)) {
    module.exports = tests;
}
else { // Otherwise run them
    const nodeunit = require('nodeunit');

    nodeunit.runModules(tests, {
        moduleStart: function (name) {
            console.log(name.toString());
        },
        testDone: function (name, assertions) {
            console.log(' -> [' + (assertions.failures() > 0 ? 'FAIL' : 'PASS') + '] ' + name.toString());
        },
        moduleDone: function () {
            console.log('\n');
        },
        done: function (assertions) {
            let success = assertions.failures() == 0;
            
            if(isBrowser) {
                if(typeof window.callPhantom === 'function') {
                    window.callPhantom(success ? 0 : 1);
                }
            }
            else {
                process.exit(success ? 0 : 1);
            }
        }
    });
}