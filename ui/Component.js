'use strict';

const DOM = require('./DOM'),
    Emitter = require('../utils/Emitter');

const defaultOptions = {
    events: null
};

let defineElement = null,
    componentRegistry = null,
    componentRegistryNames = null;

if(!process.env.ACCEDE_DISABLE_COMPONENT_REG) {
    if((defineElement = window.customElements)) {
        defineElement = defineElement.define.bind(defineElement);
    }
    else if((defineElement = document.registerElement)) {
        defineElement = defineElement.bind(document);
    }
}

if (!defineElement) {
    componentRegistry = {};
    componentRegistryNames = [];
}

function attributesToObject(element, observedAttributes) {
    let attributes = {};

    if(observedAttributes) {
        for (let i = 0; i < observedAttributes.length; i++) {
            attributes[observedAttributes[i]] = element.getAttribute(observedAttributes[i]);
        }
    }

    return attributes;
}

class Component extends Emitter {
    constructor(template, options) {
        super();

        this.template = template;
        this.options = Object.assign({}, defaultOptions, options);

        this.parentContainer = null;
        this.renderedElement = null;
        this.nodes = null;
        this.components = null;

        this._mutationListener = null;
        this._ignoreDOMEvents = false; // This is to prevent removing DOM elements when DOM events are raised by async methods
        this._childComponents = null;
    }

    static register(name, component, options = {}) {
        options.init = options.init && typeof options.init === 'function' ? options.init : (() => new component());
        options.attributes = options.attributes ? Array.from(options.attributes).map(v => (typeof v === 'string' ? v.toLowerCase() : null)).filter(v => v) : [];

        if(!process.env.production && name.indexOf('-') === -1) {
            throw new Error(`Error registering tag "${name}". Registered element names must contain a hyphen ("-") in their name`);
        }

        if(defineElement) {
            class ComponentElement extends HTMLElement {
                constructor() {
                    super();

                    this._init();
                }

                _init() {
                    if(!this._initialized) {
                        this._component = options.init(); // Create component
                        this._connected = false;
                        this._initialized = true;
                    }
                }

                static get observedAttributes() {
                    return options.attributes;
                }

                connectedCallback() {
                    this._connected = true;
                    this._component.attach(this).render(attributesToObject(this, options.attributes));
                }

                disconnectedCallback() {
                    this._connected = false;
                    this._component.detach();
                }

                attributeChangedCallback(name) {
                    if(this._connected) {
                        if(window.customElements
                            || (options.attributes != null
                                && options.attributes.indexOf(name.toLowerCase()) !== -1
                            )) {
                            this._component.render(attributesToObject(this, options.attributes));
                        }
                    }
                }

                // document.registerElement support

                createdCallback() {
                    this._init();
                }

                attachedCallback() {
                    this.connectedCallback();
                }

                detachedCallback() {
                    this.disconnectedCallback();
                }
            }

            defineElement(name, ComponentElement);
        }
        else {
            name = name.toLowerCase();

            if(componentRegistry[name]) {
                throw new Error(`Component with the name ${name} has already been registered`);
            }

            componentRegistry[name] = options;
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

        this.emit('attaching');

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

        this.emit('attached');

        return this;
    }

    detach() {
        let ret = true;

        if(this.renderedElement != null && typeof this.onDetaching === 'function') {
            ret = this.onDetaching();
        }

        if(ret !== false) {
            this.emit('detaching');
            
            if(this._mutationListener) {
                this._mutationListener.disconnect();
            }

            this.remove();

            this.renderedElement = null;
            this.parentContainer = null;

            this.emit('detached');
        }

        return ret;
    }

    remove() {
        if(this._childComponents != null) {
            for(let i in this._childComponents) {
                this._childComponents[i].detach();
            }

            this._childComponents = null;
        }

        if(this.renderedElement != null) {
            this.emit('removing');

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

            this.emit('removed');
        }
    }

    async render(...args) {
        this.emit.apply(this, ['rendering', ...args]);
        
        if(this.onComponentRendering) {
            await this.onComponentRendering.apply(this, args);
        }

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

        if(componentRegistry != null) {
            toSelect.push.apply(toSelect, componentRegistryNames);
        }

        let selected = DOM.selectAll(toSelect.join(','), rendered);

        this.nodes = {};
        this.components = {};

        let childComponents = null;

        this._ignoreDOMEvents = true;

        for(let i = 0; i < selected.length; i++) {
            let element = selected[i];

            if(componentRegistry != null) {
                let name = element.tagName.toLowerCase(),
                    componentInit = componentRegistry[name].init;

                if(componentInit) {
                    let instance = componentInit();

                    if(childComponents == null) {
                        childComponents = [];
                    }

                    childComponents.push(instance);

                    instance.on('detached', () => {
                        let index = childComponents.indexOf(instance);
                        if(index !== -1) {
                            childComponents.splice(index, 1);
                        }
                    });

                    instance.attach(element).render(attributesToObject(element, options.attributes));
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
                if(this.nodes[idAtrributeValue] != null) {
                    if(!Array.isArray(this.nodes[idAtrributeValue])) {
                        this.nodes[idAtrributeValue] = [this.nodes[idAtrributeValue]];
                    }
                    this.nodes[idAtrributeValue].push(element);
                }
                else {
                    this.nodes[idAtrributeValue] = element;
                }

                let elementComponent = element._component;
                if(elementComponent) {
                    this.components[idAtrributeValue] = elementComponent;
                }

                element.removeAttribute('id');
            }
        }

        // Insert into the parent container

        while (this.parentContainer.firstChild) {
            this.parentContainer.removeChild(this.parentContainer.firstChild);
        }

        for(let i = 0; i < rendered.length; i++) {
            this.parentContainer.appendChild(rendered[i]);
        }

        this.remove();
        
        this.renderedElement = rendered;

        this._childComponents = childComponents;
        this._ignoreDOMEvents = false;

        if(this.onComponentReady) {
            await this.onComponentReady.apply(this, ...args);
        }

        this.emit.apply(this, ['rendered', ...args]);
    }
}

module.exports = Component;