window.onerror = (errorMsg, url, lineNumber) => {
    console.error(errorMsg);
    return false;
}

nodeunit.run(require('./test/index'));