module.exports = function(config) {
    config.set({
        frameworks: ['nodeunit'],
        files: ['temp/test.js'],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    });
};