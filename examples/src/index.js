const accede = require('../../index.js');

async function main() {
    let req1 = new accede.network.Request('/testing'),
        req2 = new accede.network.Request('/testing');

    let req1Promise = req1.fetchQueue(),
        req2Promise = req2.fetchQueue();

    req1.abort();
    //req2.abort();

    let res1 = await req1Promise,
        res2 = await req2Promise;

    console.log(res1);
    console.log(res2);

    debugger;
}

main();