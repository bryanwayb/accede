'use strict';

const DOM = require('./DOM');

const defaultOptions = {
    events: null
};

let registerElement = null,
    componentRegistry = null,
    componentRegistryNames = null;

if(!process.env.ACCEDE_DISABLE_COMPONENT_REG && false) { // Testing
    registerElement = document.registerElement;
}
else {
    componentRegistry = {};
    componentRegistryNames = [];
}

class Component {
    constructor(template, options) {
        this.template = template;
        this.options = Object.assign({}, defaultOptions, options);

        this.parentContainer = null;
        this.renderedElement = null;
        this.ids = null;

        this._mutationListener = null;
        this._ignoreDOMEvents = false; // This is to prevent removing DOM elements when DOM events are raised by async methods
    }

    static register(component, init = () => new component()) {
        if(registerElement) {

        }
        else {
            let name = component.name.toLowerCase();

            if(componentRegistry[name]) {
                throw new Error(`Component with the name ${name} has already been registered`);
            }

            componentRegistry[name] = init;
            componentRegistryNames.push(name);
        }

        return this;
    }

    static get defaultOptions() {
        return defaultOptions;
    }
    
    attach(container) {
        if(!container) {
            throw new Error('Attempted to attach to a null parent');
        }

        this.parentContainer = DOM.select(container);

        this._mutationListener = new MutationObserver((mutations) => {
            if(this.renderedElement == null
                || this.renderedElement.length === 0
                || this._ignoreDOMEvents) {
                return;
            }

            // IE 11 has a bug with MutationObserver where an element can be both removed and added at the same time when added
            // then removed in quick succession. So need to filter the added from the removed nodes before running logic to see
            // if we should detach.

            let addedNodes = [],
                removedNodes = [];

            for(let i = 0; i < mutations.length; i++) {
                addedNodes.push.apply(addedNodes, mutations[i].addedNodes);
                removedNodes.push.apply(removedNodes, mutations[i].removedNodes);
            }

            let diff = removedNodes.filter(item => addedNodes.indexOf(item) === -1);

            for(let i = 0; i < diff.length; i++) {
                if(diff[i].parentElement !== this.parentContainer
                    && this.renderedElement.indexOf(diff[i]) !== -1) {
                    this.detach();
                    return;
                }
            }
        });

        this._mutationListener.observe(this.parentContainer, {
            childList: true
        });

        return this;
    }

    detach() {
        let ret = true;

        if(this.renderedElement != null && typeof this.onDetaching === 'function') {
            ret = this.onDetaching();
        }

        if(ret) {
            if(this.listener) {
                if(window.MutationObserver) {
                    this.listener.disconnect();
                }
                else {
                    this.parentContainer.removeEventListener('DOMNodeRemoved', this.listener);
                }
            }

            this.remove();

            if(deleteElement) {
                this.renderedElement = null;
            }

            this.parentContainer = null;
        }

        return ret;
    }

    remove() {
        if(this.renderedElement != null) {
            for(let i = this.renderedElement.length - 1; i >= 0; i--) {
                let renderedElement = this.renderedElement[i];

                if(renderedElement.parentElement != null) {
                    if(renderedElement.remove) {
                        renderedElement.remove()
                    }
                    else if(renderedElement.removeNode) {
                        try {
                            renderedElement.removeNode(true);
                        }
                        catch(ex) {
                            renderedElement.parentElement.removeChild(renderedElement);
                        }
                    }
                }
            }
        }
    }

    async render(...args) {
        let rendered = await this.template;

        if(typeof rendered === 'function') {
            rendered = rendered.apply(this, args);
        }

        if(typeof rendered === 'string') {
            rendered = DOM.fromHTML(rendered);
        }
        else if(!(rendered instanceof HTMLElement)) {
            throw new Error('Template should return either a string or a HTMLElement');
        }

        // Perfom binding

        let toSelect = ['[id]'];

        if(this.options.events && this.options.events.length) {
            toSelect.push.apply(toSelect, this.options.events.map(v => `[on${v}]`));
        }

        let subcomponentRenderPromises = null;
        if(componentRegistry != null) {
            toSelect.push.apply(toSelect, componentRegistryNames);
            subcomponentRenderPromises = [];
        }

        let selected = DOM.selectAll(toSelect.join(','), rendered);
        this.ids = {};

        for(let i = 0; i < selected.length; i++) {
            let element = selected[i];

            if(componentRegistry != null) {
                let name = element.tagName.toLowerCase(),
                    componentInit = componentRegistry[name];

                if(componentInit) {
                    subcomponentRenderPromises.push(componentInit().attach(element).render());
                }
            }

            if(this.options.events) {
                for(let o = 0; o < this.options.events.length; o++) {
                    let eventAttributeName = `on${this.options.events[o]}`,
                        eventAttributeValue = element.getAttribute(eventAttributeName);
    
                    if(eventAttributeValue != null) {
                        let compiledFunction = null,
                            self = this;
    
                        element.addEventListener(this.options.events[o], (event) => {
                            if(compiledFunction == null) {
                                compiledFunction = eval(`(function(event) {${eventAttributeValue}});`).bind(this);
                            }
    
                            compiledFunction(event, self);
                        });
    
                        element.removeAttribute(eventAttributeName);
                    }
                }
            }

            let idAtrributeValue = element.getAttribute('id');
            if(idAtrributeValue != null) {
                if(this.ids[idAtrributeValue] != null) {
                    if(!Array.isArray(this.ids[idAtrributeValue])) {
                        this.ids[idAtrributeValue] = [this.ids[idAtrributeValue]];
                    }
                    this.ids[idAtrributeValue].push(element);
                }
                else {
                    this.ids[idAtrributeValue] = element;
                }
            }
            element.removeAttribute('id');
        }

        // Insert into the parent container

        this._ignoreDOMEvents = true;

        while (this.parentContainer.firstChild) {
            this.parentContainer.removeChild(this.parentContainer.firstChild);
        }

        for(let i = 0; i < rendered.length; i++) {
            this.parentContainer.appendChild(rendered[i]);
        }

        // Remove previous render is parent was changed

        if(this.renderedElement
            && this.renderedElement.parentElement !== this.parentContainer
            && this.renderedElement !== rendered) {
            for(let i = this.renderedElement.length - 1; i >= 0; i--) {
                let renderedElement = this.renderedElement[i];

                if(renderedElement.parentElement != null) {
                    if(renderedElement.remove) {
                        renderedElement.remove()
                    }
                    else if(renderedElement.removeNode) {
                        try {
                            renderedElement.removeNode(true);
                        }
                        catch(ex) {
                            renderedElement.parentElement.removeChild(renderedElement);
                        }
                    }
                }
            }
        }

        this._ignoreDOMEvents = false;

        if(this.onComponentReady) {
            await this.onComponentReady();
        }

        if(subcomponentRenderPromises && subcomponentRenderPromises.length) {
            await Promise.all(subcomponentRenderPromises);
        }
    }
}

module.exports = Component;