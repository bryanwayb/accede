'use strict';

const parseHtml = require('../utils/parseHtml');

function _renderNode(child) {
    let node = null;
    
    if(child.t) {
        node = document.createTextNode(child.v);
    }
    else {
        node = document.createElement(child.e);

        if(child.c && child.c.length) {
            let childNodes = _renderTree(child.c);
            for(let i = 0; i < childNodes.length; i++) {
                node.appendChild(childNodes[i]);
            }
        }
    }

    child._ = node;

    return node;
}

function _renderTree(children) {
    let ret = new Array(children.length);

    for(let i = 0; i < children.length; i++) {
        ret[i] = _renderNode(children[i]);
    }

    return ret;
}

// Types
/// 0 = added
/// 1 = deleted
/// 2 = changed
function _findDiffs(left, right, diff, path) {
    if(left != null) {
        if(right == null) {
            diff.push({
                t: 1,
                p: path
            });
        }
        else if(typeof right !== typeof left) {
            diff.push({
                t: 2,
                p: path
            });
        }
        else if(typeof left === 'object') {
            if(Array.isArray(left)) {
                let length = Math.max(left.length, right.length);
                for(let i = 0; i < length; i++) {
                    _findDiffs(left[i], right[i], diff, [...path.slice(0), i]);
                }
            }
            else {
                let leftKeys = Object.keys(left),
                    rightKeys = Object.keys(right),
                    found = {},
                    keys = [...leftKeys, ...rightKeys].filter((value) => {
                        return found[value] ? false : (found[value] = true);
                    });
                
                for(let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if(key !== '_') { // Ignore nodes
                        _findDiffs(left[key], right[key], diff, [...path.slice(0), key]);
                    }
                }
            }
        }
        else if(left != right) {
            diff.push({
                t: 2,
                p: path
            });
        }
    }
    else if(right != null) {
        diff.push({
            t: 0,
            p: path
        });
    }
};

function _scopePath(elements, path) {
    let currentValue = elements,
        len = path.length - 1; // Don't include the last entry, we'll just get the parent object
    for(let i = 0; i < len; i++) {
        currentValue = currentValue[path[i]];
    }
    return currentValue;
}

function _patchTree(elements, childrenA, childrenB) {
    let diff = [];
    _findDiffs(childrenA, childrenB, diff, []);

    for(let i = 0; i < diff.length; i++) {
        let pathValue = _scopePath(childrenA, diff[i].p),
            valueProperty = diff[i].p[diff[i].p.length - 1];

        if(diff[i].t === 0) {

        }
        else if(diff[i].t === 1) {

        }
        else if(diff[i].t === 2) {
            if(Array.isArray(pathValue)) {

            }
            else {
                let updatedPathValue = _scopePath(childrenB, diff[i].p);
                if(valueProperty === 'v') {
                    pathValue._.nodeValue = updatedPathValue[valueProperty];
                }
            }
        }
    }
}

class VirtualDom {
    constructor(html = null) {
        this.tree = null;
        this.renderedTree = null;
        this.renderedElements = null;

        if(html != null) {
            this.loadHtml(html);
        }
    }

    loadHtml(html) {
        this.tree = {
            r: true,
            c: []
        };

        let nodePath = [this.tree],
            currentNode = this.tree;

        parseHtml(html, {
            onOpenTag: (name, selfClosed) => {
                let elementNode = {
                    e: name,
                    s: selfClosed,
                    a: [],
                    c: []
                };

                currentNode.c.push(elementNode);

                if(!selfClosed) {
                    nodePath.push(elementNode);
                    currentNode = elementNode;
                }
            },
            onCloseTag: (name) => {
                if(currentNode.r) {
                    throw new Error(`Unexpected closing tag '${name}'`);
                }
                else if(currentNode.e.toLowerCase() !== name.toLowerCase()) {
                    throw new Error(`Closing tag '${name}' did not match the previous tag '${currentNode.e}'`);
                }

                nodePath.pop();
                currentNode = nodePath[nodePath.length - 1];
            },
            onAttribute: (name, value) => {
                currentNode.a.push({
                    n: name,
                    v: value
                });
            },
            onText: (text) => {
                currentNode.c.push({
                    t: true,
                    v: text
                });
            }
        });
    }

    render(html = null) {
        if(html != null) {
            this.loadHtml(html);
        }
        else if(!this.tree && !process.env.production) {
            throw new Error('Cannot render a VirtalDom object, call .loadHtml or initialize object with HTML input');
        }

        if(!this.renderedTree) {
            this.renderedTree = this.tree;
            this.renderedElements = _renderTree(this.tree.c);
        }
        else {
            _patchTree(this.renderedElements, this.renderedTree.c, this.tree.c);
            this.renderedTree = this.tree;
        }

        return this.renderedElements;
    }
}

module.exports = VirtualDom;