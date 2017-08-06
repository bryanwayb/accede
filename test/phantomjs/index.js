var fs = require('fs'),
    system = require('system'),
    page = require('webpage').create();

try {
    function getFullPath(filepath) {
        var base = system.args[0];
        if(base) {
            base = base.split('/').filter(function(v) {
                return !!v;
            });

            base = base.slice(0, base.length - 1).join('/');
        }

        return 'file:///' + encodeURI(fs.absolute([base, filepath].join('/')));
    }

    page.onConsoleMessage = function(msg) {
        console.log(msg);
    };

    page.onCallback = function(data) {
        phantom.exit(data);
    };

    page.open(getFullPath('./index.html'), function(status) {
        if(status !== 'success') {
            phantom.exit(1);
        }
    });
}
catch(ex) {
    console.log(ex);
    phantom.exit(1);
}