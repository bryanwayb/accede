const accede = require('../../index.js');

window.onload = () => {
    let element = new accede.ui.VirtualDom();
    let renderedElements = element.render('<p class="loading content">Loading</p>');
    
    for(let i in renderedElements) {
        document.body.append(renderedElements[i]);
    }
    
    setTimeout(function() {
        element.render('<p class="stuff">Hello</p>');
    }, 500);
};