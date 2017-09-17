'use strict';

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
}

class DOM {
    static select(sel, scope = window.document) {
        let ret = sel;

        if(typeof sel === 'string') {
            ret = null;

            if (!Array.isArray(scope)) {
                scope = [scope];
            }

            for(let i = 0; i < scope.length; i++) {
                let scopeIndex = scope[i];

                if(scopeIndex.matches && scopeIndex.matches(sel)) {
                    ret = scopeIndex;
                    break;
                }

                if(scopeIndex.querySelector) {
                    ret = scopeIndex.querySelector(sel);

                    if(ret) {
                        break;
                    }
                }
            }
        }

        return ret;
    }

    static selectAll(sel, scope = window.document) {
        let ret = sel;

        if (typeof sel === 'string') {
            if (!Array.isArray(scope)) {
                scope = [scope];
            }

            ret = [];

            for (let i = 0; i < scope.length; i++) {
                let scopeIndex = scope[i];

                if (scopeIndex.matches && scopeIndex.matches(sel)) {
                    ret.push(scopeIndex);
                }

                let selected = scopeIndex.querySelectorAll(sel);

                if (selected) {
                    if (selected.length != null) {
                        if (selected.length > 0) {
                            Array.prototype.push.apply(ret, selected);
                        }
                    }
                    else {
                        ret.push(selected);
                    }
                }
            }
        }
        else if (!Array.isArray(sel)) {
            if (sel.length != null) { // Object is a fake array
                ret = Array.from(sel);
            }
            else {
                ret = [sel];
            }
        }

        return ret;
    }

    static fromHTML(html) {
        let container = document.createElement('div');
        container.innerHTML = html;
        return Array.from(container.childNodes);
    }
}

module.exports = DOM;