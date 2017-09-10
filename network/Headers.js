'use strict';

class Headers {
    constructor(source = null) {
        if(!process.env.production && typeof source !== 'object' && !Array.isArray(source)) {
            throw new Error(`Header source must be an object, instead found type ${typeof source}`);
        }

        this._private = {
            headers: null,
            headerKeys: null,
            headerCaseMap: null,
            xhr: null,
            fetchHeader: null
        };

        if(source != null) {
            if(source instanceof XMLHttpRequest) {
                this._private.xhr = source;
            }
            else if(window.Headers && source instanceof window.Headers) {
                this._private.fetchHeader = source;
            }
            else {
                this._private.headers = {};
                for(let i in source) {
                    this._private.headers[i] = source[i];
                }

                this._private.headerKeys = [];
                this._private.headerCaseMap = {};
                for(let i in source) {
                    if(source.hasOwnProperty(i)) {
                        let _i = i.toLowerCase();
                        this._private.headerKeys.push(_i);
                        this._private.headerCaseMap[_i] = i;
                    }
                }
            }
        }
        else {
            this._private.headerKeys = [];
            this._private.headers = {};
            this._private.headerCaseMap = {};
        }
    }

    keys() {
        let ret = null;

        if(this._private.xhr) {
            // XHR responses are stupid and don't return a list of header names. Instead parse them from the getAllResponseHeaders() value
            if(this._private.headerKeys == null) {
                this._private.headerKeys = this._private.xhr.getAllResponseHeaders().split('\n').map(v => {
                    let pos = v.indexOf(':');
                    return v.slice(0, pos === -1 ? null : pos).toLowerCase();
                }).filter(v => v);
            }
        }
        else if(this._private.fetchHeader) {
            ret = Array.from(this._private.fetchHeader.keys());
        }

        if(ret == null) {
            ret = this._private.headerKeys;
        }

        return ret;
    }

    has(name) {
        let ret = false;

        if(this._private.fetchHeader) {
            ret = this._private.fetchHeader.has(name);
        }
        else {
            ret = this.keys().indexOf(name.toLowerCase()) !== -1;
        }

        return ret;
    }

    get(name) {
        let ret = null;

        if(this._private.xhr) {
            ret = this._private.xhr.getResponseHeader(name);
        }
        else if(this._private.fetchHeader) {
            ret = this._private.fetchHeader.get(name);
        }
        else if(this._private.headers) {
            let actualName = this._private.headerCaseMap[name.toLowerCase()];
            if(actualName) {
                ret = this._private.headers[actualName];
            }
        }

        return ret;
    }

    set(name, value) {
        if(!process.env.production && (this._private.xhr || this._private.fetchHeader)) {
            throw new Error('Cannot set headers for request object instances');
        }
        else {
            let lowerCaseName = name.toLowerCase();
            if(this._private.headerCaseMap[lowerCaseName] != null) {
                delete this._private.headers[this._private.headerCaseMap[lowerCaseName]];
            }
            else {
                this._private.headerKeys.push(lowerCaseName);
            }

            this._private.headerCaseMap[lowerCaseName] = name;
            this._private.headers[name] = value;
        }
    }

    remove(name) {
        if(!process.env.production && (this._private.xhr || this._private.fetchHeader)) {
            throw new Error('Cannot delete headers for request object instances');
        }
        else {
            let lowerCaseName = name.toLowerCase();
            if(this._private.headerCaseMap[lowerCaseName] != null) {
                this._private.headerKeys.splice(this._private.headerKeys.indexOf(lowerCaseName), 1);

                let actualName = this._private.headerCaseMap[lowerCaseName];

                delete this._private.headerCaseMap[lowerCaseName];
                delete this._private.headers[actualName];
            }
        }
    }

    entries() {
        let ret = this._private.headers;

        if(!ret) {
            ret = {};

            for(let i of this.keys()) {
                ret[i] = this.get(i);
            }
        }

        return ret;
    }
    
    [Symbol.iterator]() {
        let keys = this.keys(),
            index = 0;
        return {
            next: () => {
                let value = null,
                    done = index >= keys.length;
                    
                if(!done) {
                    value = {
                        name: keys[index],
                        value: this.get(keys[index++])
                    }
                }

                return {
                    value: value,
                    done: done
                };
            }
        }
    }
}

module.exports = Headers;