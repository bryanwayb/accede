const path = require('path');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            bin: {
                PATH: () => {
                    return `${process.env.PATH}${/^win/.test(process.platform) ? ';' : ':'}${path.resolve(__dirname, './node_modules/.bin')}`;
                }
            }
        },
        shell: {
            'test': 'karma start --single-run --browsers ChromeHeadless karma.config.js'
        },
        browserify: {
            dist: {
                files: {
                    'dist/accede.js': [
                        'index.js'
                    ]
                }
            },
            test: {
                files: {
                    'temp/test.js': [
                        'test-browser.js'
                    ]
                }
            },
            options: {
                browserifyOptions: {
                    debug: true
                }
            }
        },
        clean: {
            options: {
                force: true
            },
            dist: {
                src: [
                    'dist'
                ]
            },
            temp: {
                src: [
                    'temp'
                ]
            },
            test: {
                src: [
                    'temp/test.js'
                ]
            }
        },
        nodeunit: {
            test: {
                src: 'test-node.js'
            },
            options: {
                reporter: 'default'
            }
        }
    });

    grunt.task.registerTask('dev', ['clean:dist', 'browserify:dist']);
    grunt.task.registerTask('test', ['test:build', 'test:run', 'clean:temp']);
    grunt.task.registerTask('test:build', ['clean:test', 'browserify:test']);
    grunt.task.registerTask('test:run', ['nodeunit:test', 'env:bin', 'shell:test']);

    // grunt.task.registerTask('default', ['bgShell:dev', 'watch:dev']);

    // grunt.task.registerTask('dev', ['clean:dist', 'env:dev', 'copy:dev', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('debug', ['clean:dist', 'babel:dist', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('dist', ['clean:dist', 'env:dist', 'babel:dist', 'copy:dist', 'browserify:dist', 'exorcise:dist', 'uglify:dist', 'clean:temp']);

    // grunt.task.registerTask('fix', ['jscs:fix']);
    // grunt.task.registerTask('test', ['jscs:test', 'jslint:test']);
};