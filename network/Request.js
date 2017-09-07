'use strict';

const Response = require('./Response'),
    Headers = require('./Headers');

let FetchRequest = null && window.Request;

class Request {
    constructor(url, method = 'get') {
        this.url = url;
        this.method = method;
        this.headers = new Headers();
    }

    fetch() {
        return new Promise((resolve) => {
            if(FetchRequest) {
                resolve(fetch(new FetchRequest(this.url, {
                    method: this.method,
                    headers: this.headers.entries()
                })).then((fetchResponse) => {
                    return new Response(this, fetchResponse);
                }));
            }
            else {
                let xhr = new XMLHttpRequest();

                xhr.addEventListener('load', () => {
                    if(xhr.readyState === 4) {
                        resolve(new Response(this, xhr));
                    }
                });
                xhr.open(this.method, this.url);

                let headerKeys = this.headers.keys();
                for(let i = 0; i < headerKeys.length; i++) {
                    xhr.setRequestHeader(headerKeys[i], this.headers.get(headerKeys[i]));
                }

                xhr.send();
            }
        });
    }
}

module.exports = Request;