'use strict';

const Response = require('./Response'),
    Headers = require('./Headers');

let fetch = null;

if(!process.env.ACCEDE_DISABLE_FETCH) {
    fetch = null;
}

const RequestCacheEnum = {
    Default: 'default',
    NoStore: 'no-store',
    Reload: 'reload',
    NoCache: 'no-cache',
    ForceCache: 'force-cache',
    OnlyIfCached: 'only-if-cached'
};

class Request {
    constructor(url, method = 'get', headers = null, body = null) {
        this.url = url;
        this.method = method;
        this.body = body;
        this.cache = RequestCacheEnum.Default;
        this.aborted = false;

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
                let signal = null;
                if(window.FetchController) {
                    this._controller = new FetchController();
                    signal = this._controller.signal;
                }

                resolve(fetch(this.url, {
                    method: this.method,
                    headers: this.headers.entries(),
                    body: await this.body,
                    cache: this.cache,
                    signal
                }).then((fetchResponse) => {
                    let ret = null;

                    if(!this._controller.signal.aborted) {
                        ret = new Response(this, fetchResponse);
                    }

                    return ret;
                }));
            }
            else {
                this._xhr = new XMLHttpRequest();

                this._xhr.addEventListener('load', () => {
                    if(this._xhr.readyState === 4) {
                        if(!this.aborted) {
                            resolve(new Response(this, this._xhr));
                        }
                        else {
                            resolve(null);
                        }
                    }
                });
                this._xhr.open(this.method, this.url);

                if(this.cache !== RequestCacheEnum.Default
                    && this.cache !== RequestCacheEnum.ForceCache) {
                    let cacheHeader = this.cache;

                    if(cacheHeader === RequestCacheEnum.Reload) {
                        cacheHeader = RequestCacheEnum.NoCache;
                    }

                    this.headers.set('cache-control', cacheHeader);
                }

                let headerKeys = this.headers.keys();
                for(let i = 0; i < headerKeys.length; i++) {
                    this._xhr.setRequestHeader(headerKeys[i], this.headers.get(headerKeys[i]));
                }

                this._xhr.send(await this.body);
            }
        });
    }

    abort() {
        if(this._controller) {
            this._controller.abort();
        }
        else if(this._xhr) {
            this._xhr.abort();
        }
        this.aborted = true;
    }
}

Request.Cache = RequestCacheEnum;

module.exports = Request;