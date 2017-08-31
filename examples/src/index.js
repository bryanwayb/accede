const accede = require('../../index.js');

window.onload = () => {
    let element = new accede.ui.VirtualDom();

    document.body.appendChild(element.render('<p class="stuff" extra="attribute">Hello</p><div>Should be removed</div>'));
    
    setTimeout(function() {
        element.render('<p class="stuff" extra="attribute">Should be updated</p>');
    }, 500);
};