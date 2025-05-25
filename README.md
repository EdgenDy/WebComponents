# web-component
Re-implementation of Web Component in Web

ReactJs is one of the most popular in implementation of Web Components, each component represents by a single function that can accept properties and return html elements in direct html format. On the other hand, native implementation of Web Components unable to catch up with React due to the complicated implementation of each components. Native implementation unable to use HTML directly in the JavaScript and still it is not possible at the time to implement JSX in modern JavaScript Engines (e.g. V8, SpiderMonkey). Instead of writing an HTML directly to the JavaScript, why not write the HTML in JavaScript format, not the native functions like `document.createElement`, `document.createTextNode`, or even the `innerHTML`.

React Component in JSX format. 

```jsx
function Message() {
  return (
    <div className="flex flex-row">
      <p className="text-lg">Hello Web Component</p>
    </div>
  );
}
```

Reusable Web Component in plain JavaScript.

```javascript
function Message() {
  return (
    div({ className: "flex flex-row" }, [
      p({ className: "text-lg" }, "Hello Web Component")
    ])
  );
}
```

or much better renaming element into understandable name as the following:

```javascript
function Message() {
  return (
    container({ className: "flex flex-row" }, [
      text({ className: "text-lg" }, "Hello Web Component")
    ])
  );
}
```

*Note: The above code is not the proposed implementation of a component, it is only used to be compared with the ReactJs.*

## Proposed Format (WebComponent api)

The component must be implemented first in JavaScript before it is used in HTML directly.

```javascript
const messageComponent = div({ className: "flex flex-row" }, [
  p({ className: "text-lg" }, "Hello Web Component")
]);

WebComponent.define("message", messageComponent, {});
```

And in HTML the following is how it is used, it is not like in React that will used the name of the component directly in html, we all know that it is impossible due to possible clashing of React Component's name and known HTML elements, and HTML has a rule that all custom element must have a *hypen* (`-`). Therefore, instead of using a component directly using its name, we will use a single known element and hopefully will be adopt by the HTML Standard.

```html
<webcomponent name="message"></webcomponent>
```

With this format, all Web Components will have the same tag, but different value of the name attribute. The value of the `name` attribute must be the name of the defined component.

Instead of placing the components inside this element like the current implementation of web component, the defined component will replaced the `<webcomponent>` tag directly in DOM like in React. Therefore if the DOM will be accessed you will not see any webcomponent tag present in the DOM Tree.

## Adding Component Properties

Components can have its own properties that can be modified and used in JavaScript.

```javascript
const messageComponent = div({ className: "flex flex-row" }, [
  p({ className: "text-sm" }, jsBind("message-value"))
]);

webcomponent.define("message", messageComponent);
```

In HTML, the following will set the initial value of the `message-value` property.

```html
<webcomponent name="message">
  <property name="message-value">Hello Web Component</property>
</webcomponent>
```

This is the difference of proposed Web Component from the React Component, instead of directly use the property name inside the opening tag of a component, each property must have its corresponding `<property>` tag. This format is intentionally used to separate the logic between the HTML (view) and the JavaScript (functionality). 

The goal of this new implementation is not to cross the boundary of JavaScript and HTML, keeping from each other, web component in html will remain in html format, while the web component in javascript will remain in JavaScript syntax. This logic comes from the idea of how HTML rendering works and how JavaScript executes instructions. 

Once an HTML was rendered it is not re-render except it is modified by the JavaScript, while the JavaScript will not be re-executed except it is inside a loop or a function that being called by an event. In summary the execution of JavaScript is not the same with the rendering process of an HTML. React components is inside a function, meaning that it will be called multiple times by just updating a state that will lead to re-rendering, that is why there is `useEffect` function that can be used inside a React Function due it possibly be called multiple times.

## The Counter implementation

In JavaScript:
```javascript
const { div, p, button } = WebComponent.getDomConstructors(["div", "p", "button"]);

const counterComponent = div({ className: "flex flex-row"}, [
  p({ className: "text-sm" }, jsBind("count")),
  button({ className: "bg-primary text-white", onClick: "increaseCount" }, "Decrease"),
  button({ className: "bg-primary text-white", onClick: "decreseCount" }, "Increase")
]);

WebComponent.define("counter", counterComponent, {
  increaseCount() {
    this.count++;
  },

  decreaseCount() {
    this.count--;
  }
});
```
\
In HTML:

```html
<webcomponent name="counter">
  <property name="count" type="number">0</property>
</webcomponent>
```

Right now the implementation of web component tag is in custom HTML format `<web-component>`.