try {
    require("babel-polyfill");

    const tests = require('./test/index')

    window.$ = window.jQuery = require('jquery');

    require('nodeunit').runModules(tests, {
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
            if(typeof window.callPhantom === 'function') {
                window.callPhantom(assertions.failures() == 0 ? 0 : 1);
            }
        }
    });
}
catch(ex) {
    window.callPhantom(1);
}