const accede = require('../..');

module.exports = {
    ui: require('./ui')
};

window.addEventListener('load', () => {
    async function main() {
        accede.ui.router.attach(document.body);
    }
    
    main();
});