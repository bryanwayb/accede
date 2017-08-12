const accede = require('../../index.js');

let pool = new accede.threading.Pool(4, 8);

(async () => {
    await pool.start();

    let start = Date.now();

    console.log('started');

    await pool.cluster(32, async () => {
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 50);
        });
    });

    console.log(`Done in ${Date.now() - start}ms`)

    await pool.kill();
})();