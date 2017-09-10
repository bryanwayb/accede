'use strict';

const Response = require('./Response'),
    Headers = require('./Headers'),
    Queue = require('../utils/Queue');

let fetch = null;

if(!process.env.ACCEDE_DISABLE_FETCH) {
    fetch = window.fetch;
}

const RequestCacheEnum = {
    Default: 'default',
    NoStore: 'no-store',
    Reload: 'reload',
    NoCache: 'no-cache',
    ForceCache: 'force-cache',
    OnlyIfCached: 'only-if-cached'
};

const requestQueue = {};

class Request {
    constructor(url, method = 'get', headers = null, body = null) {
        this.url = url;
        this.method = method;
        this.body = body;
        this.cache = RequestCacheEnum.Default;

        this._private = {
            aborted: false,
            isRequesting: false,
            controller: null,
            xhr: null,
            isQueued: false,
            queue: null,
            queueKey: null,
            queueId: null
        };

        if(headers instanceof Headers) {
            this.headers = headers;
        }
        else {
            this.headers = new Headers(headers);
        }
    }
    
    get aborted() {
        return this._private.aborted;
    }

    get isRequesting() {
        return this._private.isRequesting;
    }

    _internalFetch(isRequesting) {
        return new Promise(async (resolve, reject) => {
            if(isRequesting) {
                reject(new Error('Cannot execute multiple requests simultaneously with the same request object'));
            }

            if(fetch) {
                let signal = null;
                if(window.FetchController) {
                    this._private.controller = new FetchController();
                    signal = this._private.controller.signal;

                    signal.onabort = function() {
                        resolve(null);
                    };
                }

                fetch(this.url, {
                    method: this.method,
                    headers: this.headers.entries(),
                    body: this.body,
                    cache: this.cache,
                    signal
                }).then((fetchResponse) => {
                    let ret = null;

                    if(!this._private.aborted || this._private.isQueued) {
                        ret = new Response(this, fetchResponse);
                    }

                    this._private.isRequesting = false;
                    this._private.controller = null;

                    resolve(ret);
                }, (error) => {
                    this._private.isRequesting = false;
                    this._private.controller = null;

                    reject(error);
                });
            }
            else {
                try {
                    let xhr = this._private.xhr = new XMLHttpRequest();
                    
                    xhr.addEventListener('load', () => {
                        if(xhr.readyState === 4) {
                            this._private.isRequesting = false;
                            this._private.xhr = null;

                            if(!this._private.aborted || this._private.isQueued) {
                                resolve(new Response(this, xhr));
                            }
                            else {
                                resolve(null);
                            }
                        }
                    });

                    xhr.addEventListener('error', () => {
                        this._private.isRequesting = false;
                        this._private.xhr = null;
                        
                        reject(new Error('A network error occurred'));
                    });

                    xhr.addEventListener('abort', () => {
                        this._private.isRequesting = false;
                        this._private.xhr = null;

                        resolve(null);
                    });
                    
                    xhr.open(this.method, this.url);
    
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
                        xhr.setRequestHeader(headerKeys[i], this.headers.get(headerKeys[i]));
                    }
    
                    xhr.send(this.body);
                }
                catch(ex) {
                    this._private.isRequesting = false;
                    this._private.xhr = null;

                    reject(ex);
                }
            }
        });
    }

    fetch() {
        let isRequesting = this._private.isRequesting;
        this._private.isRequesting = true;

        return this._internalFetch(isRequesting);
    }
    
    fetchQueue(extraKey = null) {
        let isRequesting = this._private.isRequesting;

        if(!isRequesting) {
            this._private.isQueued = true;
        }

        let key = JSON.stringify({
            url: this.url,
            method: this.method,
            body: this.body,
            cache: this.cache,
            headers: this.headers.entries(),
            extraKey: extraKey
        });

        let ret = null;

        let queue = requestQueue[key];
        if(queue == null) {
            queue = requestQueue[key] = new Queue();

            this._private.isRequesting = true;
            this._private.queue = queue;
            this._private.queueKey = key;

            ret = new Promise((resolve, reject) => {
                this._internalFetch(isRequesting).then((response) => {
                    if(!this._private.aborted) {
                        resolve(response);
                    }
                    else {
                        resolve(null);
                    }

                    queue.complete(null, response);

                    this._private.isQueued = false;
                    this._private.queue = null;
                    this._private.queueKey = null;
                    delete requestQueue[key];
                }, (error) => {
                    reject(error);

                    queue.complete(error, null);

                    this._private.isQueued = false;
                    this._private.queue = null;
                    this._private.queueKey = null;
                    delete requestQueue[key];
                });
            });
        }
        else {
            this._private.queue = queue;
            this._private.queueKey = key;
            
            ret = new Promise((resolve, reject) => {
                if(!this._private.aborted) {
                    this._private.queueId = queue.subscribe((error, response) => {
                        if(error) {
                            reject(error);
                        }
                        else {
                            resolve(response);
                        }

                        this._private.isQueued = false;
                        this._private.queue = null;
                        this._private.queueId = null;
                        this._private.queueKey = null;
                    }, () => {
                        resolve(null);

                        this._private.isQueued = false;
                        this._private.queue = null;
                        this._private.queueId = null;
                        this._private.queueKey = null;
                    });
                }
            });
        }

        return ret;
    }

    abort() {
        if(!this._private.aborted) {
            let shouldAbortRequest = true;
            if(this._private.isQueued) {
                if(this._private.isRequesting) {
                    if(this._private.queue.length === 0) {
                        delete requestQueue[this._private.queueKey]; // Remove from the global queue to prevent subscriptions to a aborted request
                    }
                    else {
                        if(this._private.queue.listeners('unsubscribed') === 0) {
                            this._private.queue.on('unsubscribed', () => {
                                if(this._private.queue.length === 0) { // If there are no more subscriptions to this queue then it's safe to abort
                                    this.abort();
                                }
                            });
                        }
                        shouldAbortRequest = false;
                    }
                }
                else if(this._private.queueId != null) {
                    this._private.queue.unsubscribe(this._private.queueId);
                    shouldAbortRequest = false;
                }
            }
    
            if(shouldAbortRequest) {
                if(this._private.controller) {
                    this._private.controller.abort();
                }
                else if(this._private.xhr) {
                    this._private.xhr.abort();
                }
            }
    
            this._private.aborted = true;
        }
    }
}

Request.Cache = RequestCacheEnum;

module.exports = Request;