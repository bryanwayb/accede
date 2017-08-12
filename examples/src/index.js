const accede = require('../../index.js');

let thread = new accede.threading.Thread();

thread.start();

async function test() {
    try {
        console.log('I should catch an exception');
        console.log(await thread.runInContext(async (p) => {
            throw new Error('test');
            return await this.runInMain((p) => {
                return p + ' here';
            }, p);
        }, 'hello'));
        console.log('Exception not caught');
    }
    catch(ex) {
        console.log('Exception caught');
    }

    console.log('now here');

    await thread.kill();

    console.log('made it this far');
}

test();