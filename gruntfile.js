const path = require('path'),
    fs = require('fs');

Object.assign(require('uglify-js'), require('uglify-es')); // Override uglify-js with uglify-es for ES7 support

const filetypes = ['.js'],
    ignore = ['node_modules', '.git', 'test', 'test.js', 'build', 'gruntfile.js', 'temp'];

const sourceFiles = (function recursiveLookup(dir = path.resolve(__dirname, './')) {
    let ret = [];

    for(let name of fs.readdirSync(dir)) {
        try {
            if(ignore.indexOf(name) === -1) {
                let fullpath = path.resolve(dir, name);

                if(fs.statSync(fullpath).isDirectory()) {
                    ret.push.apply(ret, recursiveLookup(fullpath));
                }
                else {
                    if(filetypes.indexOf(path.extname(name)) !== -1) {
                        ret.push(fullpath);
                    }
                }
            }
        }
        catch(ex) { }
    }

    return ret;
})();

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
            'test-primary': 'karma start --single-run --browsers ChromeHeadless karma.config.js',
            'test-all': 'karma start --single-run --browsers ChromeHeadless,Firefox karma.config.js'
        },
        browserify: {
            dev: {
                files: {
                    'examples/build/index.js': [
                        'examples/src/index.js'
                    ]
                }
            },
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
        uglify: {
            test: {
                files: {
                    'temp/test.js': ['temp/test.js']
                }
            },
            dist: {
                files: {
                    'dist/accede.min.js': ['dist/accede.js']
                }
            },
            options: {
                sourceMap: false,
                compress: {
                    properties: true,
                    dead_code: true,
                    drop_debugger: true,
                    conditionals: true,
                    comparisons: true,
                    evaluate: true,
                    booleans: true,
                    loops: true,
                    unused: true,
                    hoist_funs: true,
                    if_return: true,
                    join_vars: true,
                    cascade: true,
                    collapse_vars: true,
                    reduce_vars: true,
                    warnings: true,
                    drop_console: true
                },
                report: 'gzip'
            }
        },
        clean: {
            options: {
                force: true
            },
            dev: {
                src: [
                    'examples/build'
                ]
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
        watch: {
            options: {
                spawn: false
            },
            dev: {
                files: sourceFiles,
                tasks: ['dev']
            },
            test: {
                files: [
                    'test/*.js',
                    'test/**/*.js',
                    ...sourceFiles
                ],
                tasks: ['test']
            }
        },
        bgShell: {
            dev: {
                cmd: 'node ./examples/server.js',
                bg: true
            }
        }
    });

    grunt.task.registerTask('default', ['bgShell:dev', 'watch:dev']);

    grunt.task.registerTask('dev', ['clean:dev', 'browserify:dev']);
    grunt.task.registerTask('dev:test', ['watch:test']);

    grunt.task.registerTask('dist', ['clean:dist', 'browserify:dist', 'uglify:dist']);

    grunt.task.registerTask('test', ['test:debug', 'test:dist']);
    grunt.task.registerTask('test:debug', ['test:build:debug', 'test:run:primary', 'clean:temp']);
    grunt.task.registerTask('test:dist', ['test:build:dist', 'test:run:primary', 'clean:temp']);

    grunt.task.registerTask('test:all', ['test:all:debug', 'test:all:dist']);
    grunt.task.registerTask('test:all:debug', ['test:build:debug', 'test:run:all', 'clean:temp']);
    grunt.task.registerTask('test:all:dist', ['test:build:dist', 'test:run:all', 'clean:temp']);

    grunt.task.registerTask('test:build:debug', ['clean:test', 'browserify:test']);
    grunt.task.registerTask('test:build:dist', ['clean:test', 'browserify:test', 'uglify:test']);

    grunt.task.registerTask('test:run:primary', ['env:bin', 'shell:test-primary']);
    grunt.task.registerTask('test:run:all', ['env:bin', 'shell:test-all']);

    // grunt.task.registerTask('default', ['bgShell:dev', 'watch:dev']);

    // grunt.task.registerTask('dev', ['clean:dist', 'env:dev', 'copy:dev', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('debug', ['clean:dist', 'babel:dist', 'copy:dist', 'browserify:demo', 'clean:temp']);
    // grunt.task.registerTask('dist', ['clean:dist', 'env:dist', 'babel:dist', 'copy:dist', 'browserify:dist', 'exorcise:dist', 'uglify:dist', 'clean:temp']);

    // grunt.task.registerTask('fix', ['jscs:fix']);
    // grunt.task.registerTask('test', ['jscs:test', 'jslint:test']);
};