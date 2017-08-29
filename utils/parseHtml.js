'use strict';

const defaultCallbacks = {
    onText: (text) => {
        console.log(`Text node: ${text}`);
    },
    onOpenTag: (tag) => {
        console.log(`Open tag node: ${tag}`);
    },
    onCloseTag: (tag) => {
        console.log(`Close tag node: ${tag}`);
    },
    onAttribute: (name, value) => {
        console.log(`Attribute: ${name} = ${value}`);
    }
};

const whiteSpaceRegex = /\s/;

function nextWhiteSpace(input, offset = 0) {
    let match = input.slice(offset).match(whiteSpaceRegex);

    if(match) {
        return offset + match.index;
    }

    return -1;
}

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
    let state = 0;

    for(let i = 0; i < input.length;) {
        let nextPos;

        if(state === 0) { // In text node
            nextPos = input.indexOf('<', i);

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
            
            if(typeof callbacks.onOpenTag === 'function') {
                callbacks.onOpenTag(input.slice(i, nextPos));
            }

            nextPos++;
        }
        else if(state === 2) { // Is attribute parsing
            nextPos = input.indexOf('>', i);

            if(nextPos === -1) {
                throw new Error(`Illegal syntax in HTML at index ${i}, missing closing '>'`);
            }

            if(typeof callbacks.onAttribute === 'function') {
                let attributes = input.slice(i, nextPos),
                    currentName = null;

                for(let o = 0; o < attributes.length;) {
                    if(currentName === null) {
                        let nameEndPos = attributes.indexOf('=', o),
                            nameOnly = false;

                        if(nameEndPos === -1) {
                            nameEndPos = Math.max(nextWhiteSpace(attributes, o), attributes.length);
                            nameOnly = true;
                        }

                        currentName = attributes.slice(o, nameEndPos).trim();

                        if(currentName.length === 0) {
                            throw new Error(`Illegal syntax in HTML at index ${i}, missing attribute name`);
                        }

                        if(nameOnly) {
                            callbacks.onAttribute(currentName, null);
                            currentName = null;
                        }

                        o = nameEndPos + 1;
                    }
                    else {
                        let startValuePos = attributes.indexOf('"', o),
                            isDouble = true;

                        if(startValuePos === -1) {
                            startValuePos = attributes.indexOf('\'', o);
                            isDouble = false;
                        }

                        let endValuePos = startValuePos;

                        if(startValuePos !== -1) {
                            startValuePos++;
                            endValuePos = attributes.indexOf(isDouble ? '"' : '\'', startValuePos);

                            if(endValuePos === -1) {
                                throw new Error(`Illegal syntax in HTML at index ${i}, missing matching close quote`);
                            }
                        }
                        else {
                            let match = attributes.slice(o).match(/\s+/);
                            if(match != null) {
                                startValuePos = o + match[0].length;
                            }
                            else { 
                                startValuePos = o;
                            }

                            endValuePos = Math.max(nextWhiteSpace(attributes, startValuePos), attributes.length);
                        }

                        callbacks.onAttribute(currentName, attributes.slice(startValuePos, endValuePos));
                        currentName = null;

                        o = endValuePos + 1;
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
                callbacks.onCloseTag(input.slice(i, nextPos));
            }

            nextPos++;
        }

        i = nextPos;
    }
};