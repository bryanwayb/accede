const express = require('express'),
    app = express(),
    path = require('path');

app.use('/build', express.static(path.resolve(__dirname, './build')));

app.get('/*', function (req, res) {
    res.sendFile(path.resolve(__dirname, './index.html'));
});

app.listen(3000, function () {
    console.log('Demo live on localhost:3000');
});