'use strict';

const Pool = require('../../threading/Pool');

if(Pool) {
}
else {
    console.warn('Skipping Pool test, not supported in current build');
}