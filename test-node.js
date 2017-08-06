const path = require('path');

const jsdom = require("jsdom"),
    currentDOM = new jsdom.JSDOM();

global.window = currentDOM.window;

for(let i in currentDOM.window) {
    if(global[i] === undefined) {
        global[i] = currentDOM.window[i];
    }
}

window.$ = window.jQuery = require('jquery');

const tests = require('./test/index');

// Only export tests if we're not the entry script
if(process.mainModule != null && path.basename(__filename) != path.basename(process.mainModule.filename)) {
    module.exports = tests;
}
else { // Otherwise run them
    const nodeunit = require('nodeunit');

    nodeunit.reporters.default.run(tests, {}, (error) => {
        process.exit(error != null ? 1 : 0);
    });
}