'use strict';

const Headers = require('./Headers'),
    async = require('../async');

class Response {
    constructor(request, rawResponseObject) {
        this.url = null;
        this.status = 0;
        this.statusText = null;
        this.headers = null;
        this.body = null;

        this.method = request.method;

        if(rawResponseObject instanceof XMLHttpRequest) {
            this.url = rawResponseObject.responseURL;
            this.body = async.fromResult(rawResponseObject.responseText);
            this.status = rawResponseObject.status;
            this.statusText = rawResponseObject.statusText;
            this.headers = new Headers(rawResponseObject);
        }
        else if(window.Response != null && rawResponseObject instanceof window.Response) {
            this.url = rawResponseObject.url;
            this.body = rawResponseObject.text(); // Only supporting reading strings at the moment
            this.status = rawResponseObject.status;
            this.statusText = rawResponseObject.statusText;
            this.headers = new Headers(rawResponseObject.headers);
        }
    }

    get ok() {
        return this.status >= 200 && this.status < 300;
    }
}

module.exports = Response;