'use strict';

const Response = require('./Response'),
    Headers = require('./Headers');

let fetch = null;

if(!process.env.ACCEDE_DISABLE_FETCH) {
    fetch = window.fetch;
}

class Request {
    constructor(url, method = 'get', headers = null, body = null) {
        this.url = url;
        this.method = method;
        this.body = body;

        if(headers instanceof Headers) {
            this.headers = headers;
        }
        else {
            this.headers = new Headers(headers);
        }

        this._xhr = null;
        this._controller = null;
    }

    fetch() {
        return new Promise(async (resolve) => {
            if(fetch) {
                resolve(fetch(this.url, {
                    method: this.method,
                    headers: this.headers.entries(),
                    body: await this.body
                }).then((fetchResponse) => {
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

                xhr.send(await this.body);
            }
        });
    }

    abort() {

    }
}

module.exports = Request;