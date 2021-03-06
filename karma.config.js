module.exports = function(config) {
    config.set({
        frameworks: ['nodeunit'],
        files: ['temp/test.js'],
        reporters: ['progress'],
        logLevel: config.INFO,
        port: 9876,
        colors: true,
        browsers: ['ChromeHeadless', 'PhantomJS'],
        autoWatch: false,
        singleRun: true, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    });
};