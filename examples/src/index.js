const accede = require('../../index.js');

window.onload = () => {
    let element = new accede.ui.VirtualDom();

    element.attach(document.body);

    console.time('first render');
    element.render('<div><h1>Header</h1><p>This is a ton of content that should not get updated because it has not changed</p>1234</div>');
    console.timeEnd('first render');

    // element.on('node', (node) => {
    //     console.log(node);
    // });
    
    setTimeout(function() {
        console.time('second render');
        element.render('<h1>Header Updated</h1><p>This is a ton of content that should not get updated because it has not changed</p><p>But this is new content</p>423');
        console.timeEnd('second render');
    }, 500);
};