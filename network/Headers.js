'use strict';

class Headers {
    constructor(source = null) {
        if(!process.env.production && typeof source !== 'object' && !Array.isArray(source)) {
            throw new Error(`Header source must be an object, instead found type ${typeof source}`);
        }

        this._headers = null;
        this._headerKeys = null;;
        this._headersCaseMap = null;

        this._xhr = null;
        this._fetchHeader = null;

        if(source != null) {
            if(source instanceof XMLHttpRequest) {
                this._xhr = source;
            }
            else if(window.Headers && source instanceof window.Headers) {
                this._fetchHeader = source;
            }
            else {
                this._headers = source;

                this._headerKeys = [];
                this._headersCaseMap = {};
                for(let i in source) {
                    if(source.hasOwnProperty(i)) {
                        let _i = i.toLowerCase();
                        this._headerKeys.push(_i);
                        this._headersCaseMap[_i] = i;
                    }
                }
            }
        }
        else {
            this._headerKeys = [];
            this._headers = {};
            this._headersCaseMap = {};
        }
    }

    keys() {
        let ret = null;

        if(this._xhr) {
            // XHR responses are stupid and don't return a list of header names. Instead parse them from the getAllResponseHeaders() value
            if(this._headerKeys == null) {
                this._headerKeys = this._xhr.getAllResponseHeaders().split('\n').map(v => {
                    let pos = v.indexOf(':');
                    return v.slice(0, pos === -1 ? null : pos).toLowerCase();
                }).filter(v => v);
            }
        }
        else if(this._fetchHeader) {
            ret = Array.from(this._fetchHeader.keys());
        }

        if(ret == null) {
            ret = this._headerKeys;
        }

        return ret;
    }

    has(name) {
        let ret = false;

        if(this._fetchHeader) {
            ret = this._fetchHeader.has(name);
        }
        else {
            ret = this.keys().indexOf(name.toLowerCase()) !== -1;
        }

        return ret;
    }

    get(name) {
        let ret = null;

        if(this._xhr) {
            ret = this._xhr.getResponseHeader(name);
        }
        else if(this._fetchHeader) {
            ret = this._fetchHeader.get(name);
        }
        else if(this._headers) {
            let actualName = this._headersCaseMap[name.toLowerCase()];
            if(actualName) {
                ret = this._headers[actualName];
            }
        }

        return ret;
    }

    set(name, value) {
        if(!process.env.production && (this._xhr || this._fetchHeader)) {
            throw new Error('Cannot set headers for request object instances');
        }
        else {
            let lowerCaseName = name.toLowerCase();
            if(this._headersCaseMap[lowerCaseName] != null) {
                delete this._headers[this._headersCaseMap[lowerCaseName]];
            }
            else {
                this._headerKeys.push(lowerCaseName);
            }

            this._headersCaseMap[lowerCaseName] = name;
            this._headers[name] = value;
        }
    }

    remove(name) {
        if(!process.env.production && (this._xhr || this._fetchHeader)) {
            throw new Error('Cannot delete headers for request object instances');
        }
        else {
            let lowerCaseName = name.toLowerCase();
            if(this._headersCaseMap[lowerCaseName] != null) {
                this._headerKeys.splice(this._headerKeys.indexOf(lowerCaseName), 1);

                let actualName = this._headersCaseMap[lowerCaseName];

                delete this._headersCaseMap[lowerCaseName];
                delete this._headers[actualName];
            }
        }
    }

    entries() {
        let ret = this._headers;

        if(!ret) {
            ret = {};

            for(let i of this.keys()) {
                ret[i] = this.get(i);
            }
        }

        return ret;
    }
}

module.exports = Headers;