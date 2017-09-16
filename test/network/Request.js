const Request = require('../../network/Request'),
    Headers = require('../../network/Headers'),
    Response = require('../../network/Response'),
    Async = require('../../async');

async function watchRequest(requestBlock, cb) {
    let _fetch = window.fetch;
    if(_fetch) {
        window.fetch = (...args) => {
            cb();
            return _fetch.apply(this, args);
        };
    }

    let _send = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function() {
        cb();
        return _send.apply(this, arguments);
    };

    await requestBlock();

    XMLHttpRequest.prototype.send = _send;
    window.fetch = _fetch;
}

module.exports = {
    'setup': (test) => {
        let instance = null;

        test.doesNotThrow(() => {
            instance = new Request();
        }, 'Request should be allowed to be instantiated without any paramaters');

        instance = new Request('testing');

        test.equal(instance.method, 'get', 'Request method should default to "get" when not specified');

        instance = new Request('testing', 'post');

        test.equal(instance.url, 'testing', 'Constructors url parameter should set to the .url field');
        test.equal(instance.method, 'post', 'Constructors method parameter should set to the .method field');

        instance.url = '/updated';
        instance.method = 'get';

        test.equal(instance.url, '/updated', 'The .url field should be settable');
        test.equal(instance.method, 'get', 'The .method field should be settable');

        test.ok(instance.headers instanceof Headers, 'Request.headers should always be created as an instance of Headers');

        instance = new Request('testing', 'post', { 'testing': 'value' });

        test.equal(instance.headers.get('testing'), 'value', 'Constructors headers parameter should be passed into a Headers object');

        instance = new Request('testing', 'post', new Headers({ 'testing': 'value' }), 'body value');

        test.equal(instance.headers.get('testing'), 'value', 'Constructors headers parameter should accept Headers objects');

        instance.headers = new Headers({
            'updated': 'value'
        });

        test.equal(instance.headers.get('updated'), 'value', 'The .header field should be settable');

        test.equal(instance.body, 'body value', 'Constructors headers parameter should set to the .body field');

        instance.body = 'updated value';

        test.equal(instance.body, 'updated value', 'The .body field should be settable');

        test.done();
    },
    'requests': {
        'normal': async (test) => {
            let request = new Request(window.location.href);
    
            let response = null;
    
            try {
                response = await request.fetch();
                test.ok(response instanceof Response, 'Response should not be null when not rejected');
            }
            catch(ex) {
                test.ok(false, 'Request for current URL failed');
            }
    
            test.ok(response.statusText != null, 'Status text should not be null');
            test.ok(response.status != null, 'Status code should not be null');
            test.ok(response.headers != null, 'Response headers should not be null');
            test.ok(response.ok, 'Request for the current URL should not have an error status code');
            test.ok(Async.isPromise(response.body), 'Response body should always be a Promise object');
            test.ok(await response.body, 'Request for the current URL was expected to return a result');
    
            request = new Request('/should-not-exist');
    
            try {
                response = await request.fetch();
            }
            catch(ex) {
                test.ok(false, 'Request for a URL that does not exist should not throw an error');
            }
    
            test.ok(response instanceof Response, 'Error responses should be instances of the Reponse class');
    
            test.equal(response.status, 404, 'Response code for a non-existent URL should be 404');
            test.ok(!response.ok);
    
            request = new Request('http://0.0.0.0/invalid-url');
    
            try {
                response = await request.fetch();
                test.ok(false, 'An error should be thrown when an invalid request is made');
            }
            catch(ex) {
                test.ok(true);
            }
    
            let count = 0;
            try {
                await watchRequest(async () => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href),
                        req1Promise = req1.fetch(),
                        req2Promise = req2.fetch();
        
                    await req1Promise;
                    await req2Promise;
                }, () => count++);
            }
            catch(ex) {
                test.ok(false, 'An error should not of been thrown when requesting multiple valid resources at the same time');
            }
    
            test.equal(count, 2, 'There should have been two actual requests made');
    
            test.done();
        },
        'queued': async (test) => {
            let count = 0;
            try {
                await watchRequest(async () => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href),
                        req1Promise = req1.fetchQueue(),
                        req2Promise = req2.fetchQueue();
        
                    await req1Promise;
                    await req2Promise;
                }, () => count++);
            }
            catch(ex) {
                test.ok(false, 'An error should not of been thrown when requesting multiple valid resources at the same time');
            }
    
            test.equal(count, 1, 'There should have been one actual request made');
    
            test.done();
        }
    },
    'aborting': {
        'normal': async (test) => {
            let request = new Request(window.location.href);

            let responsePromise = request.fetch();

            request.abort();

            let response = await responsePromise;

            test.ok(response == null, 'Aborted requests should always return a null response object');

            test.done();
        },
        'queued': {
            'req1 then req2': {
                'abort req1 then req2': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req1Promise = req1.fetchQueue(),
                        req2Promise = req2.fetchQueue();
    
                    req1.abort();
                    req2.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                },
                'abort req2 then req1': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req1Promise = req1.fetchQueue(),
                        req2Promise = req2.fetchQueue();
    
                    req2.abort();
                    req1.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                },
                'abort req1': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req1Promise = req1.fetchQueue(),
                        req2Promise = req2.fetchQueue();
    
                    req1.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise != null, 'Request 2 not expected to return null');
    
                    test.done();
                },
                'abort req2': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req1Promise = req1.fetchQueue(),
                        req2Promise = req2.fetchQueue();
    
                    req2.abort();
                    
                    test.ok(await req1Promise != null, 'Request 1 not expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                }
            },
            'req2 then req1': {
                'abort req1 then req2': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req2Promise = req2.fetchQueue(),
                        req1Promise = req1.fetchQueue();
    
                    req1.abort();
                    req2.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                },
                'abort req2 then req1': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req2Promise = req2.fetchQueue(),
                        req1Promise = req1.fetchQueue();
    
                    req2.abort();
                    req1.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                },
                'abort req1': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req2Promise = req2.fetchQueue(),
                        req1Promise = req1.fetchQueue();
    
                    req1.abort();
                    
                    test.ok(await req1Promise == null, 'Request 1 expected to return null');
                    test.ok(await req2Promise != null, 'Request 2 not expected to return null');
    
                    test.done();
                },
                'abort req2': async (test) => {
                    let req1 = new Request(window.location.href),
                        req2 = new Request(window.location.href);
                    
                    let req2Promise = req2.fetchQueue(),
                        req1Promise = req1.fetchQueue();
    
                    req2.abort();
                    
                    test.ok(await req1Promise != null, 'Request 1 not expected to return null');
                    test.ok(await req2Promise == null, 'Request 2 expected to return null');
    
                    test.done();
                }
            }
        }
    }
};