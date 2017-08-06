const path = require('path');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            bin: {
                PATH: () => {
                    return `${path.resolve(__dirname, './node_modules/.bin')}${/^win/.test(process.platform) ? ';' : ':'}${process.env.PATH}`;
                }
            }
        },
        shell: {
            'test': 'phantomjs ./test/phantomjs/index.js'
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
                    'test/phantomjs/test.js': [
                        'test.js'
                    ]
                }
            },
            options: {
                browserifyOptions: {
                    debug: true
                }
            }
        },
        babel: {
            options: {
                presets: ['es2015', 'es2017'],
                plugins: ['transform-regenerator'],
                sourceMaps: 'inline'
            },
            test: {
                files: {
                    './test/phantomjs/test.js': './test/phantomjs/test.js'
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
            test: {
                src: [
                    'test/phantomjs/test.js'
                ]
            }
        },
        nodeunit: {
            test: {
                src: 'test.js'
            },
            options: {
                reporter: 'default'
            }
        }
    });

    grunt.task.registerTask('dev', ['clean:dist', 'browserify:dist']);
    grunt.task.registerTask('test', ['clean:test', 'nodeunit:test', 'browserify:test', 'babel:test', 'shell:test']);

    // grunt.task.registerTask('default', ['bgShell:dev', 'watch:dev']);

    // grunt.task.registerTask('dev', ['clean:dist', 'env:dev', 'copy:dev', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('debug', ['clean:dist', 'babel:dist', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('dist', ['clean:dist', 'env:dist', 'babel:dist', 'copy:dist', 'browserify:dist', 'exorcise:dist', 'uglify:dist', 'clean:temp']);

    // grunt.task.registerTask('fix', ['jscs:fix']);
    // grunt.task.registerTask('test', ['jscs:test', 'jslint:test']);
};