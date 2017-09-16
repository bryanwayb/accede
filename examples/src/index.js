const accede = require('../../index.js');

let req1 = new accede.network.Request('/testing');

req1.fetchQueue().then((response) => {
    console.log(response);
}, (error) => {
    console.log(error);
});

let req2 = new accede.network.Request('/testing');

req2.fetchQueue().then((response) => {
    console.log(response);
}, (error) => {
    console.log(error);
});

req1.abort();
req2.abort();