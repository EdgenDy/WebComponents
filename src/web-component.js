(function() {
  const createElement = document.createElement.bind(document);
  const createTextNode = document.createTextNode.bind(document);
  const createElementNS = document.createElementNS.bind(document);

  const styleTag = createElement('style');
  styleTag.appendChild(createTextNode('wc-instance, wc-property { display: none; }'));
  document.head.appendChild(styleTag);

  const symbolCreateInstance = Symbol("createInstance");
  const symbolBindings = Symbol("bindings");
  const symbolNode = Symbol("node");
  const symbolChildNodes = Symbol("childNodes");

  function VirtualElementNode(node) {
    this[symbolNode] = node;
    this[symbolChildNodes] = [];
    this[symbolBindings] = new VirtualNodeBindings();
  }

  VirtualElementNode.prototype[symbolCreateInstance] = function(properties, component, webcomponent) {
    const childNodes = this[symbolChildNodes];
    const element = this[symbolNode].cloneNode();

    this[symbolBindings].bindNode(element, properties, component, webcomponent);

    for (const child of childNodes)
      element.appendChild(child[symbolCreateInstance](properties, component, webcomponent));

    return element;
  }

  VirtualElementNode.prototype.bindAttribute = function(name, propertyName) {
    this[symbolBindings].setAttribute(name, propertyName);
  }

  VirtualElementNode.prototype.bindContent = function(propertyName) {
    this[symbolBindings].textContent = propertyName;
  }

  VirtualElementNode.prototype.toComponent = function(name, props) {
    componentMap[name] = { properties: props, template: this };
  }

  VirtualElementNode.prototype.toDOM = function() {
    return this[symbolCreateInstance]();
  }

  VirtualElementNode.prototype.appendTo = function(parent) {
    const element = this[symbolCreateInstance]();
    parent.appendChild(element);
    return element;
  }

  function VirtualTextNode(text) {
    this[symbolNode] = createTextNode(text);
    this[symbolBindings] = new VirtualNodeBindings();
  }

  VirtualTextNode.prototype[symbolCreateInstance] = function(properties, component) {
    const node = this[symbolNode].cloneNode();
    this[symbolBindings].bindNode(node, properties, component);
    return node;
  }

  const defineProperty = Object.defineProperty;

  function BindedComponentProperty(propertyName) {
    defineProperty(this, "name", {
      get: function() {
        return propertyName;
      }
    });
  }

  BindedComponentProperty.prototype = Object.create(null);

  function VirtualNodeBindings() {
    this.textContent = null;
    this.attributes = {};
    this.className = null;
    this.events = {};
    this.properties = {};
  }

  VirtualNodeBindings.prototype.addProperty = function(propertyName, bindedPropertyName) {
    this.properties[propertyName] = bindedPropertyName;
  }

  VirtualNodeBindings.prototype.setEventListener = function(name, bindedPropertyName) {
    this.events[name] = bindedPropertyName;;
  }

  VirtualNodeBindings.prototype.setAttribute = function(name, bindedPropertyName) {
    this.attributes[name] = bindedPropertyName;
  }

  VirtualNodeBindings.prototype.getAttribute = function(name) {
    return this.attributes[name];
  }

  VirtualNodeBindings.prototype.bindNode = function(element, properties, component, webcomponent) {
    if (!component || !properties)
      return;

    // Bind the text content of the element to the value of the property name
    if (typeof this.textContent == "string") {
      if (!(this.textContent in properties))
        throw new Error("Component property named '" + this.textContent + "' was not defined.");

      const property = properties[this.textContent];
      const propertyType = typeof property;
      if (propertyType != "string" && propertyType != "number" && propertyType != "boolean")
        throw new Error("Component property value must be primitive.");
      
      component[symbolAddEventListener](this.textContent, handleTextContentBindedValueChanged.bind({element}));
    }

    if (typeof this.className == "string") {
      if (!(this.className in properties))
        throw new Error("Component property named '" + this.className + "' was not defined.");

      const property = properties[this.className];
      if (typeof property != "string")
        throw new Error("Component bindings for className must be a string.");

      component[symbolAddEventListener](this.className, handleClassNameBindedValueChanged.bind({element, oldValue: property}));
    }

    for (const propertyName in this.properties) {
      const bindingPropertyName = this.properties[propertyName];
      component[symbolAddEventListener](bindingPropertyName, handlePropertyBindedValueChange.bind({ element, propertyName }));
    }

    for (const attributeName in this.attributes) {
      const attributeValue = this.attributes[attributeName];
      component[symbolAddEventListener](this.attributeName, handleAttributeBindedValueChanged.bind({element, name: attributeName}));
    }

    for (const eventName in this.events) {
      const propertyName = this.events[eventName];
      element.addEventListener(eventName, component[symbolProperties][propertyName].bind(webcomponent));
    }
  }

  function handlePropertyBindedValueChange(event) {
    // expected this value
    // { element: HTMLELement, propertyName: string }
    this.element[this.propertyName] = event.detail.newValue;
  }

  function handleAttributeBindedValueChanged(event) {
    // expected this value
    // { element: HTMLElement, name: string }
    this.element.setAttribute(this.name, event.detail.newValue);
  }

  function handleTextContentBindedValueChanged(event) {
    // expected this value
    // { element: HTMLElement }
    this.element.textContent = event.detail.newValue;
  }

  function handleClassNameBindedValueChanged(event) {
    // expected this value
    // { element: HTMLElement, oldValue: string }
    this.element.classList.replace(this.oldValue, event.detail.newValue);
  }

  const toString = Object.prototype.toString;
  const isArray = Array.isArray;
  const createObject = Object.create;
  const classObject = "[object Object]";

  const attributeManager = {
    "id": function(element, value) {
      element.id = value;
    },
    "className": function(element, value) {
      element.className = value;
    },
    "style": function(element, value) {
      if (toString.call(value) == classObject) {
        const styleObject = element.style;
        
        for (const propName in value)
          styleObject[propName] = value[propName];

        return;
      }

      element.style = value;
    },
    "value": function(element, value) {
      if (value instanceof BindedComponentProperty) {
        this[symbolBindings].addProperty("value", value.name);
        return;
      }

      element.value = value;
    },
    "type": function(element, value) {
      if (value instanceof BindedComponentProperty) {
        this[symbolBindings].addProperty("type", value.name);
        return;
      }
      element.type = value;
    }
  };

  function createEventAttributeHandler(eventAttributeName, eventName) {
    return function(element, value) {
      if (value instanceof BindedComponentProperty) {
        this[symbolBindings].setEventListener(eventName, value.name);
        return;
      }

      element[eventAttributeName.toLowerCase()] = value;
    }
  }

  const eventAttributesList = {onClick: "click", onSubmit: "submit"};
  for (const attributeName in eventAttributesList) {
    const eventName = eventAttributesList[attributeName];
    attributeManager[attributeName] = createEventAttributeHandler(attributeName, eventName);
  }

  function element(attributes, children) {
    const element = this.cloneNode();
    const domTemplate = new VirtualElementNode(element);
    const childNodes = domTemplate[symbolChildNodes];

    if (toString.call(attributes) == classObject) {
      for (const name in attributes) {
        const manager = attributeManager[name];

        if (manager)
          manager.call(domTemplate, element, attributes[name]);
        else
          element.setAttribute(name, attributes[name]);
      }

      if (typeof children == "string") {
        childNodes.push(new VirtualTextNode(children));
        return domTemplate;
      }

      if (children instanceof BindedComponentProperty) {
        const textNode = new VirtualTextNode("");
        childNodes.push(textNode);
        textNode[symbolBindings].textContent = children.name;
        return domTemplate;
      }

      if (isArray(children))
        attributes = children;
    }

    if (isArray(attributes)) {
      for (const child of attributes)
        if (typeof child == "string")
          childNodes.push(new VirtualTextNode(child));
        else if (child instanceof BindedComponentProperty) {
          const virtualTextNode = new VirtualTextNode();
          virtualTextNode[symbolBindings].textContent = child.name;
          childNodes.push(virtualTextNode);
        } else
          childNodes.push(child);
    }

    if (typeof attributes == "string") {
      childNodes.push(new VirtualTextNode(attributes));
      return domTemplate;
    }

    if (attributes instanceof BindedComponentProperty) {
      const virtualTextNode = new VirtualTextNode();
      virtualTextNode[symbolBindings].textContent = attributes.name;
      childNodes.push(virtualTextNode);
    }
    
    return domTemplate;
  }

  this.element = element;

  function createElementSafe(name) {
    try {
      return createElement(name);
    } catch(e) {
      return null;
    }
  }

  function createSVGElementSafe(name) {
    try {
      return createElementNS("http://www.w3.org/2000/svg", name);
    } catch(e) {
      return null;
    }
  }

  function property(propName) {
    return new BindedComponentProperty(propName);
  }

  function getDOMConstructors(domNameList) {
    if (!isArray(domNameList))
      throw new Error("DOM name list must be an array.");

    const object = createObject(null);

    for (const name of domNameList) {
      let createdElement = null;
      let elementName = name;

      if (name.indexOf("svg") == 0) {
        elementName = name;
        // If the name starts with "svg-", we remove that prefix
        // to get the actual SVG element name.
        if (name.indexOf("svg-") == 0)
          elementName = name.slice(4);
        
        createdElement = createSVGElementSafe(elementName);
      } else {
        createdElement = createElementSafe(name);
      }

      if (createdElement == null)
        throw new Error("Invalid DOM name: " + name + ".");

      object[elementName] = element.bind(createdElement);
    }

    return object;
  }

  const componentMap = {};

  function define(name, template, properties) {
    componentMap[name] = { template, properties };
  }

  const DOMBuilder = (function() {
    const bindings = createObject(null);
    bindings.property = property;

    function DOMBuilder() {
      this.getDOMConstructors = getDOMConstructors;
      this.bindings = bindings;
    }

    return new DOMBuilder();
  })();

  function defineGetSetProperty(component, name, properties) {
    defineProperty(component, name, {
      get() {
        return properties[symbolProperties][name];
      },

      set(value) {
        properties.dispatchEvent(new CustomEvent(name, { detail: { newValue: value, name }}));
        properties[symbolProperties][name] = value;
        return true;
      }
    });
  }

  const defineProperties = Object.defineProperties;
  const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;

  const symbolAddEventListener = Symbol("addEventListener");
  const symbolRemoveEventListener = Symbol("removeEventListener");
  const symbolListenerCallbacks = Symbol("listenerCallbacks");
  const symbolProperties = Symbol("properties");
  const symbolDestruct = Symbol("destruct");

  class WebComponentInternal extends EventTarget {
    [symbolListenerCallbacks] = new Set();
    [symbolProperties] = createObject(null);

    constructor(userProperties) {
      super();
      defineProperties(this[symbolProperties], getOwnPropertyDescriptors(userProperties));
    }

    [symbolAddEventListener](type, callback) {
      this[symbolListenerCallbacks].add(callback);
      super.addEventListener(type, callback);
    }

    [symbolRemoveEventListener](type, callback) {
      this[symbolListenerCallbacks].delete(callback);
      super.removeEventListener(type, callback);
    }

    [symbolDestruct]() {
      // Remove all listeners 
      for (const value of this[symbolListenerCallbacks]) {
        super.removeEventListener(value);
      }
      this[symbolListenerCallbacks].clear();
    }
  }

  const symbolWCName = Symbol("name");

  function WebComponent(name, properties) {
    this[symbolWCName] = name;

    if (!properties)
      return;

    for (const propName in properties[symbolProperties])
      defineGetSetProperty(this, propName, properties);
  }

  this.DOMBuilder = DOMBuilder;
  this.counter0 = new WebComponent("counter");

  const symbolWebComponentInstance = Symbol("webComponentInstance");
  const symbolWebComponentTemplate = Symbol("webComponentTemplate");

  function initComponent(wcInstance, name) {
    const componentConfig = componentMap[name];
    if (!componentConfig)
      throw new Error("Unknown component '" + name + "'.");

    const template = componentConfig.template;
    const properties = componentConfig.properties;

    const internalComponent = new WebComponentInternal(properties);
    const webComponent = new WebComponent(name, internalComponent);
    const templateInstance = template[symbolCreateInstance](properties, internalComponent, webComponent);

    wcInstance[symbolWebComponentInstance] = webComponent;
    wcInstance[symbolWebComponentTemplate] = templateInstance;

    for (const propName in properties)
      webComponent[propName] = properties[propName];
  }

  class WebComponentInstance extends HTMLElement {
    constructor() {
      super();
      console.time("webcomponent");
      const componentName = this.getAttribute("name");
      if (componentName)
        initComponent(this, componentName);
    }

    get componentInstance() {
      return this[symbolWebComponentInstance];
    }

    get componentTemplate() {
      return this[symbolWebComponentTemplate];
    }

    connectedCallback() {
      this.after(this[symbolWebComponentTemplate]);
      console.timeEnd("webcomponent");
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "name" && oldValue == null) {
        const componentName = newValue;
        if (componentName)
          initComponent(this, componentName);
      }
    }

    static get observedAttributes() {
      return ["name"];
    }
  }

  class WebComponentProperty extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {

    }
  }

  customElements.define("wc-instance", WebComponentInstance);
  customElements.define("wc-property", WebComponentProperty);
})();