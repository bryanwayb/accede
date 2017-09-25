const path = require('path'),
    fs = require('fs');

let defaultEnv = {};
Object.assign(defaultEnv, process.env);

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
            },
            babel: {
                ACCEDE_DISABLE_THREAD: true,
                ACCEDE_DISABLE_COMPONENT_CUST_ELEMENT: true
            }
        },
        shell: {
            'test-primary-next': 'karma start --single-run --browsers ChromeHeadless karma.config.js',
            'test-primary-es5': 'karma start --single-run --browsers ChromeHeadless,PhantomJS karma.config.js',
            'test-all-next': 'karma start --single-run --browsers ChromeHeadless karma.config.js',
            'test-all-es5': 'karma start --single-run --browsers ChromeHeadless,PhantomJS karma.config.js'
        },
        copy: {
            'test-entrypoint': {
                files: {
                    '_test.js': ['test.js']
                }
            },
            'index-entrypoint': {
                files: {
                    '_index.js': ['index.js']
                }
            },
            'dev-entrypoint': {
                files: {
                    'examples/src/_index.js': ['examples/src/index.js']
                }
            }
        },
        concat: {
            options: {
                seperator: '\n'
            },
            'test-babel': {
                src: [
                    'babel.prefix.js',
                    'test.js'
                ],
                dest: '_test.js'
            },
            'index-babel': {
                src: [
                    'babel.prefix.js',
                    'index.js'
                ],
                dest: '_index.js'
            },
            'dev-babel': {
                src: [
                    'babel.prefix.js',
                    'examples/src/index.js'
                ],
                dest: 'examples/src/_index.js'
            }
        },
        browserify: {
            dev: {
                files: {
                    'examples/build/index.js': [
                        'examples/src/_index.js'
                    ]
                }
            },
            'dist-next': {
                files: {
                    'dist/accede.js': [
                        '_index.js'
                    ]
                }
            },
            'dist-es5': {
                files: {
                    'dist/accede.es5.js': [
                        '_index.js'
                    ]
                }
            },
            test: {
                files: {
                    'temp/test.js': [
                        '_test.js'
                    ]
                }
            },
            options: {
                browserifyOptions: {
                    debug: true,
                    transform: [
                        ['envify', {
                            _: 'purge'
                        }]
                    ]
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
                    'temp/test.js': ['temp/test.js']
                }
            },
            dist: {
                files: {
                    'dist/accede.es5.js': ['dist/accede.es5.js']
                }
            },
            dev: {
                files: {
                    'examples/build/index.js': ['examples/build/index.js']
                }
            }
        },
        uglify: {
            test: {
                files: {
                    'temp/test.js': ['temp/test.js']
                }
            },
            'dist-next': {
                files: {
                    'dist/accede.min.js': ['dist/accede.js']
                }
            },
            'dist-es5': {
                files: {
                    'dist/accede.es5.min.js': ['dist/accede.es5.js']
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
            'dist-next': {
                src: [
                    'dist/accede.js',
                    'dist/accede.min.js'
                ]
            },
            'dist-es5': {
                src: [
                    'dist/accede.es5.js',
                    'dist/accede.es5.min.js'
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
            },
            'test-entrypoint': {
                src: [
                    '_test.js'
                ]
            },
            'index-entrypoint': {
                src: [
                    '_index.js'
                ]
            },
            'dev-entrypoint': {
                src: [
                    'examples/src/_index.js'
                ]
            }
        },
        watch: {
            options: {
                spawn: false
            },
            'dev-next': {
                files: sourceFiles,
                tasks: ['dev:next']
            },
            'dev-es5': {
                files: sourceFiles,
                tasks: ['dev:es5']
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

    grunt.task.registerTask('default', ['example']);

    grunt.task.registerTask('example', ['example:next']);
    grunt.task.registerTask('example:next', ['dev:next', 'bgShell:dev', 'watch:dev-next']);
    grunt.task.registerTask('example:es5', ['dev:es5', 'bgShell:dev', 'watch:dev-es5']);

    grunt.task.registerTask('dev', ['dev:next']);
    grunt.task.registerTask('dev:next', ['reset:env', 'clean:dev', 'copy:dev-entrypoint', 'browserify:dev', 'clean:dev-entrypoint']);
    grunt.task.registerTask('dev:es5', ['reset:env', 'clean:dev', 'concat:dev-babel', 'env:babel', 'browserify:dev', 'clean:dev-entrypoint', 'babel:dev']);

    grunt.task.registerTask('dev:test', ['watch:test']);

    grunt.task.registerTask('dist', ['clean:dist', 'dist:next', 'dist:es5']);
    grunt.task.registerTask('dist:next', ['reset:env', 'clean:dist-next', 'copy:index-entrypoint', 'browserify:dist-next', 'clean:index-entrypoint', 'uglify:dist-next']);
    grunt.task.registerTask('dist:es5', ['reset:env', 'clean:dist-es5', 'concat:index-babel', 'env:babel', 'browserify:dist-es5', 'clean:index-entrypoint', 'babel:dist', 'uglify:dist-es5']);

    grunt.task.registerTask('test', ['test:debug', 'test:dist']);

    grunt.task.registerTask('test:debug', ['test:debug:next', 'test:debug:es5']);
    grunt.task.registerTask('test:debug:next', ['test:build:debug:next', 'test:run:primary:next', 'clean:temp']);
    grunt.task.registerTask('test:debug:es5', ['test:build:debug:es5', 'test:run:primary:es5', 'clean:temp']);

    grunt.task.registerTask('test:dist', ['test:dist:next', 'test:dist:es5']);
    grunt.task.registerTask('test:dist:next', ['test:build:dist:next', 'test:run:primary:next', 'clean:temp']);
    grunt.task.registerTask('test:dist:es5', ['test:build:dist:es5', 'test:run:primary:es5', 'clean:temp']);

    grunt.task.registerTask('test:all', ['test:all:debug', 'test:all:dist']);

    grunt.task.registerTask('test:all:debug', ['test:all:debug:next', 'test:all:debug:es5']);
    grunt.task.registerTask('test:all:debug:next', ['test:build:debug:next', 'test:run:all:next', 'clean:temp']);
    grunt.task.registerTask('test:all:debug:es5', ['test:build:debug:es5', 'test:run:all:es5', 'clean:temp']);

    grunt.task.registerTask('test:all:dist', ['test:all:dist:next', 'test:all:dist:es5']);
    grunt.task.registerTask('test:all:dist:next', ['test:build:dist:next', 'test:run:all:next', 'clean:temp']);
    grunt.task.registerTask('test:all:dist:es5', ['test:build:dist:es5', 'test:run:all:es5', 'clean:temp']);

    grunt.task.registerTask('test:build:debug:next', ['reset:env', 'clean:test', 'copy:test-entrypoint', 'browserify:test', 'clean:test-entrypoint']);
    grunt.task.registerTask('test:build:debug:es5', ['reset:env', 'clean:test', 'concat:test-babel', 'env:babel', 'browserify:test', 'clean:test-entrypoint', 'babel:test']);

    grunt.task.registerTask('test:build:dist:next', ['reset:env', 'clean:test', 'copy:test-entrypoint', 'browserify:test', 'clean:test-entrypoint', 'uglify:test']);
    grunt.task.registerTask('test:build:dist:es5', ['reset:env', 'clean:test', 'concat:test-babel', 'env:babel', 'browserify:test', 'clean:test-entrypoint', 'babel:test', 'uglify:test']);

    grunt.task.registerTask('test:run:primary:next', ['reset:env', 'env:bin', 'shell:test-primary-next']);
    grunt.task.registerTask('test:run:primary:es5', ['reset:env', 'env:bin', 'shell:test-primary-es5']);

    grunt.task.registerTask('test:run:all:next', ['reset:env', 'env:bin', 'shell:test-all-next']);
    grunt.task.registerTask('test:run:all:es5', ['reset:env', 'env:bin', 'shell:test-all-es5']);

    grunt.task.registerTask('reset:env', () => {
        for(let i in process.env) {
            delete process.env[i];
        }
        Object.assign(process.env, defaultEnv);
    });
};