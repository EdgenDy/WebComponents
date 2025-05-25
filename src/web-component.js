(function() {
  const createElement = document.createElement.bind(document);
  const createTextNode = document.createTextNode.bind(document);

  function HTMLElementTemplate(element) {
    this.element = element;
    this.childNodes = [];
  }

  HTMLElementTemplate.prototype.createInstance = function(properties) {
    const childNodes = this.childNodes;
    const element = this.element.cloneNode();

    for (const child of childNodes)
      element.appendChild(child.createInstance(properties));

    return element;
  }

  function HTMLTextNodeTemplate(text) {
    this.node = createTextNode(text);
  }

  HTMLTextNodeTemplate.prototype.createInstance = function() {
    return this.node.cloneNode();
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
      element.value = value;
    },
    "type": function(element, value) {
      element.type = value;
    }
  };

  function element(attributes, children) {
    const element = createElement(this);
    const domTemplate = new HTMLElementTemplate(element);
    const childNodes = domTemplate.childNodes;

    if (toString.call(attributes) == classObject) {
      for (const name in attributes) {
        const manager = attributeManager[name];

        if (manager)
          manager.call(null, element, attributes[name]);
        else
          element.setAttribute(name, attributes[name]);
      }

      if (typeof children == "string") {
        // elm.appendChild(createTextNode(children));
        childNodes.push(new HTMLTextNodeTemplate(children));
        return domTemplate;
      }

      if (isArray(children))
        attributes = children;
    }

    if (isArray(attributes))
      for (const child of attributes)
        if (typeof child == "string")
          // element.appendChild(createTextNode(child));
          childNodes.push(new HTMLTextNodeTemplate(child));
        else
          // element.appendChild(child);
          childNodes.push(child);

    if (typeof attributes == "string") {
      // element.appendChild(createTextNode(attributes));
      childNodes.push(new HTMLTextNodeTemplate(attributes));
      return domTemplate;
    }
    
    return domTemplate;
  }

  function getDomConstructors(domNameList) {
    if (!isArray(domNameList))
      throw new Error("DOM name list must be an array.");

    const object = createObject(null);

    for (const name of domNameList) {
      if (name.length < 1)
        throw new Error("Invalid DOM name.");

      object[name] = element.bind(name);
    }

    return object;
  }

  function WebComponent() {
    this.getDomConstructors = getDomConstructors;
  }
  
  this.WebComponent = new WebComponent();
})();