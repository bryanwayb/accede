const accede = require('../../index.js');

window.onload = () => {
    let element = new accede.ui.VirtualDom();
    let renderedElements = element.render('<p>Nothing</p>');
    
    for(let i in renderedElements) {
        document.body.append(renderedElements[i]);
    }
    
    setTimeout(function() {
        element.render('<p>Testing</p>');
    }, 500);
};