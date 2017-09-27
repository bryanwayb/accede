const ui = require('../../../../ui');

class Home extends ui.Component {
    constructor() {
        super(async () => '<div>Home Page</div>');
    }
}

module.exports = ui.router.register(Home, ['/']);