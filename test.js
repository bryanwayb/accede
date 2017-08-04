const nodeunit = require('nodeunit').reporters.default;

nodeunit.run({
    async: require('./test/async')
});