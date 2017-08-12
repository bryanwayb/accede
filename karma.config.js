module.exports = function(config) {
    config.set({
        frameworks: ['nodeunit'],
        files: ['temp/test.js'],
        reporters: ['dots'],
        logLevel: config.INFO,
        port: 9876,
        colors: true,
        browsers: ['ChromeHeadless', 'ChromeCanaryHeadless', 'Edge', 'Firefox'],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    });
};