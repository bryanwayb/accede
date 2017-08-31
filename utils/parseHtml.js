'use strict';

const defaultCallbacks = {
    // onText: (text) => {
    //     console.log(`Text node: ${text}`);
    // },
    // onOpenTag: (tag, selfClosed) => {
    //     console.log(`Open tag node: ${tag}, selfClosed = ${selfClosed}`);
    // },
    // onCloseTag: (tag) => {
    //     console.log(`Close tag node: ${tag}`);
    // },
    // onAttribute: (name, value) => {
    //     console.log(`Attribute: ${name} = ${value}`);
    // },
    // onComment: (text) => {
    //     console.log(`Comment: ${text}`);
    // }
};

const whiteSpaceRegex = /\s/;

function nextWhiteSpace(input, offset = 0) {
    let match = input.slice(offset).match(whiteSpaceRegex);

    if(match) {
        return offset + match.index;
    }

    return -1;
}

const specialTextEndLookup = {
    'script': (input, index) => {
        let scriptTagRegex = /<\s*?\/\s*script/i,
            match = scriptTagRegex.exec(input.slice(index));

        if(match != null) {
            return match.index + index;
        }
        else {
            return -1;
        }
    },
    'style': (input, index) => {
        let styleTagRegex = /<\s*?\/\s*style/i,
            match = styleTagRegex.exec(input.slice(index));

        if(match != null) {
            return match.index + index;
        }
        else {
            return -1;
        }
    }
};

module.exports = (input, callbacks = {}) => {
    if(input == null) {
        throw new Error('Input cannot be null or undefined');
    }

    Object.assign(callbacks, defaultCallbacks);

    // Current state the parser is in
    // 0 = Text (default)
    // 1 = Starting Element Tag
    // 2 = Attributes
    // 3 = End element tag
    // 4 = HTML special tags ('<!' prefixes)
    let state = 0,
        specialText = null;

    for(let i = 0; i < input.length;) {
        let nextPos;

        if(state === 0) { // In text node
            if(specialText != null) {
                nextPos = specialText(input, i);
                specialText = null;
            }
            else {
                nextPos = input.indexOf('<', i);
            }

            if(nextPos === -1) {
                nextPos = input.length;
            }

            if(i !== nextPos && typeof callbacks.onText === 'function') {
                let textValue = input.slice(i, nextPos).trim();
                
                if(textValue.length !== 0) {
                    callbacks.onText(textValue);
                }
            }

            state = 1; // Move to HTML tag parsing
        }
        else if(state === 1) { // In HTML tag node
            i++; // Skip first '<'

            if(input[i] === '/') { // Is this a closing tag?
                state = 3; // Move to closing tag parsing
                continue;
            }
            else if(input[i] === '!') {
                state = 4; // Move to special HTML tag parsing
                continue;
            }

            let nextSpace = nextWhiteSpace(input, i),
                nextClose = input.indexOf('>', i);

            if(nextClose === -1) {
                throw new Error(`Illegal syntax in HTML at index ${i}, missing closing '>'`);
            }
            else if(nextSpace !== -1 && nextSpace < nextClose) {
                state = 2; // Move to tag attribute parsing
                nextPos = nextSpace;
            }
            else {
                state = 0; // Move to text parsing in element
                nextPos = nextClose;
            }

            if(i === nextPos) {
                throw new Error(`Illegal syntax in HTML at index ${i}, no tag name is present`);
            }

            let selfCloseMatch = input.slice(i, nextClose + 1).match(/\/\s*>/),
                selfClosed = false;

            if(selfCloseMatch && (i + selfCloseMatch.index + selfCloseMatch[0].length - 1) === nextClose) {
                selfClosed = true;
            }
            
            if(typeof callbacks.onOpenTag === 'function') {
                let name = input.slice(i, nextPos);

                if(name[name.length - 1] === '/') {
                    name = name.slice(0, name.length - 1);
                }

                callbacks.onOpenTag(name, selfClosed);

                if(specialTextEndLookup[name] != null) {
                    specialText = specialTextEndLookup[name];
                }
            }

            nextPos++;
        }
        else if(state === 2) { // Is attribute parsing
            nextPos = input.indexOf('>', i);

            if(nextPos === -1) {
                throw new Error(`Illegal syntax in HTML at index ${i}, missing closing '>'`);
            }

            let selfCloseMatch = input.slice(i, nextPos + 1).match(/\/\s*>/);

            if(typeof callbacks.onAttribute === 'function') {
                let attributes = input.slice(i, selfCloseMatch ? i + selfCloseMatch.index : nextPos).trim(),
                    currentName = null;

                for(let o = 0; o < attributes.length;) {
                    if(currentName === null) {
                        let nameEndPos = attributes.indexOf('=', o),
                            nextWhiteSpacePos = nextWhiteSpace(attributes, o),
                            nameOnly = false;

                        if(nameEndPos === -1) {
                            nameEndPos = nextWhiteSpacePos;

                            if(nameEndPos === -1) {
                                nameEndPos = attributes.length;
                            }

                            nameOnly = true;
                        }
                        else if(nextWhiteSpacePos !== -1 && nextWhiteSpacePos < nameEndPos) {
                            nameEndPos = nextWhiteSpacePos;
                            nameOnly = true;
                        }

                        currentName = attributes.slice(o, nameEndPos).trim();

                        if(currentName.length === 0) {
                            throw new Error(`Illegal syntax in HTML at index ${o}, missing attribute name`);
                        }

                        if(nameOnly) {
                            callbacks.onAttribute(currentName, null);
                            currentName = null;
                        }

                        o = nameEndPos + 1;
                    }
                    else {
                        let match = attributes.slice(o).match(/\s+/),
                            startValuePos = o;

                        if(match != null && match.index === 0) {
                            startValuePos = o + match[0].length;
                        }

                        let singleQuote = attributes[startValuePos] === '\'',
                            doubleQuote = attributes[startValuePos] === '"',
                            endValuePos = startValuePos;

                        if(singleQuote) {
                            endValuePos = attributes.indexOf('\'', ++startValuePos);
                        }
                        else if(doubleQuote) {
                            endValuePos = attributes.indexOf('\"', ++startValuePos);
                        }
                        else {
                            endValuePos = nextWhiteSpace(attributes, startValuePos);

                            if(endValuePos === -1) {
                                endValuePos = attributes.length;
                            }
                        }

                        if(endValuePos === -1) {
                            throw new Error(`Illegal syntax in HTML at index ${o}, missing attribute end value signal`);
                        }

                        callbacks.onAttribute(currentName, attributes.slice(startValuePos, endValuePos));
                        currentName = null;

                        o = endValuePos + (singleQuote || doubleQuote ? 2 : 1);
                    }
                }
            }

            state = 0; // Move to text parsing

            nextPos++;
        }
        else if(state === 3) {
            i++; // Skip '/' character

            nextPos = input.indexOf('>', i);
            
            if(nextPos === -1) {
                throw new Error(`Illegal syntax in HTML at index ${i}, missing closing '>'`);
            }

            state = 0;
            
            if(typeof callbacks.onCloseTag === 'function') {
                let closeTagName = input.slice(i, nextPos).trim();

                if(nextWhiteSpace(closeTagName) !== -1) {
                    throw new Error(`Illegal syntax in HTML at index ${i}, closing tag names cannot contain spaces`);
                }

                callbacks.onCloseTag(closeTagName);
            }

            nextPos++;
        }
        else if(state === 4) {
            i++;

            let sliced = input.slice(i);
            if(sliced.startsWith('--')) {
                nextPos = sliced.indexOf('-->');

                let comment = null;

                if(nextPos === -1) {
                    comment = sliced.slice(2).trim();
                    nextPos = input.length;
                }
                else {
                    comment = sliced.slice(2, nextPos).trim();
                    nextPos += i + 3;
                }

                if(typeof callbacks.onComment === 'function') {
                    callbacks.onComment(comment);
                }
            }
            else {
                nextPos = input.indexOf('>', i) + 1;
            }

            state = 0;
        }

        i = nextPos;
    }
};