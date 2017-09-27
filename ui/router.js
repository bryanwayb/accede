'use strict';

let routeParameterRegex = /{(.+?)}/g,
    routeQueryStringRegex = /[^{]\?[^}]/,
    escapeRegExpRegex = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

function escapeRegExp(str) {
    return str.replace(escapeRegExpRegex, "\\$&");
}

function extractRouteSections(route) {
    let match = route.match(routeQueryStringRegex),
        queryStringPosition = match ? match.index + 1 : route.length;
    let urlSections = [route.slice(0, queryStringPosition), route.slice(queryStringPosition + 1, route.length)];

    return {
        path: urlSections[0] ? urlSections[0].split('/').splice(1).map(section => {
            return decodeURIComponent(section);
        }) : null,
        query: urlSections[1] ? urlSections[1].split('&').map(section => {
            let keyValueSection = section.split('=');

            return {
                key: decodeURIComponent(keyValueSection[0]),
                value: keyValueSection[1] ? decodeURIComponent(keyValueSection[1]) : true
            };
        }) : null
    };
}

module.exports = {
    attach: () => {

    },
    register: (component, routes, options = {}) => {
    }
};