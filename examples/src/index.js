const accede = require('../../index.js');

let thread = new accede.threading.Thread(async () => {
    console.log('in thread');
});

thread.start();

thread.runInContext((p) => {
    console.log('hello ' + p);
}, 'testing');