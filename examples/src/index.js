const accede = require('../../index.js');

let thread = new accede.threading.Thread(() => {
    // Types
    /// 0 = added
    /// 1 = deleted
    /// 2 = changed
    thread.findDiffs = function findDiffs(left, right, diff, path) {
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
                        findDiffs(left[i], right[i], diff, [...path.slice(0), i]);
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
                        findDiffs(left[key], right[key], diff, [...path.slice(0), key]);
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
});

(async () => {
    await thread.start();

    let treeA = [
        { // Node object
            t: false, // Is text node? false == element node

            // Below are only valid for element nodes
            e: 'p', // Element name
            a: [ // Element attributes
                { // Attribute object
                    n: 'class',
                    v: 'testing'
                }
            ],
            c: [ // Child nodes
                { // Text node
                    t: true, // Text node == true
                    v: 'P tag testing' // Text value
                },
                { // Child element
                    t: false,
                    e: 'small',
                    c: [
                        {
                            t: true,
                            v: 'small text here'
                        }
                    ]
                }
            ]
        }
    ];

    let treeB = [
        {
            t: true,
            v: 'stuff'
        }
    ];

    for(let i = 0; i < 100000; i++) {
        treeB.push({
            t: false,
            e: 'p',
            a: [
                {
                    n: 'class',
                    v: 'testing'
                }
            ],
            c: [
                {
                    t: true,
                    v: 'P tag testing'
                },
                {
                    t: false,
                    e: 'small',
                    c: [
                        {
                            t: true,
                            v: 'small text here'
                        }
                    ]
                }
            ]
        });
    }

    function findDiffs(left, right, diff, path) {
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
                        findDiffs(left[i], right[i], diff, [...path.slice(0), i]);
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
                        findDiffs(left[key], right[key], diff, [...path.slice(0), key]);
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

    let start = Date.now();

    console.log('started');

    //debugger;
    ((left, right) => {
        let diff = [];
        //this.findDiffs(left, right, diff, []);
        findDiffs(left, right, diff, []);
        return diff;
    })(treeA, treeB);

    console.log(`Done in ${Date.now() - start}ms`)

    await thread.kill();
})();