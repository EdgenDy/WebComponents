(function() {
  console.time('card-creation-js-dom');

  // Create card container
  const card = document.createElement('div');
  card.className = 'card flex flex-row';

  // Create card header
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  const h3 = document.createElement('h3');
  h3.className = 'card-title';
  h3.textContent = 'Card Header';

  cardHeader.appendChild(h3);

  // Create card body
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const h2 = document.createElement('h2');
  h2.className = 'card-title';
  h2.textContent = 'Card Title';

  const p = document.createElement('p');
  p.className = 'card-text';
  p.textContent = 'This is a simple card component.';

  const button = document.createElement('button');
  button.className = 'btn btn-primary';
  button.textContent = 'Click Me';

  cardBody.appendChild(h2);
  cardBody.appendChild(p);
  cardBody.appendChild(button);

  // Assemble card
  card.appendChild(cardHeader);
  card.appendChild(cardBody);

  // Add card to body
  document.body.appendChild(card);

  console.timeEnd('card-creation-js-dom');
})();

(function() {
  console.time("card-creation-innerHTML");
  document.body.innerHTML += `
  <div class="card flex flex-row">
    <div class="card-header">
      <h3 class="card-title">Card Header</h3>
    </div>
    <div class="card-body">
      <h2 class="card-title">Card Title</h2>
      <p class="card-text">This is a simple card component.</p>
      <button class="btn btn-primary">Click Me</button>
    </div>
  </div>`;
  console.timeEnd("card-creation-innerHTML");
})();

(function() {
  const { div, h2, h3, p, button } = WebComponent.getTemplateConstructors(["div", "h2", "h3", "p", "button"]);

  console.time("card-creation-template");
  const template = div({ className: "card flex flex-row" }, [
    div({ className: "card-header" }, [
      h3({ className: "card-title" }, "Card Header")
    ]),
    div({ className: "card-body" }, [
      h2({ className: "card-title" }, "Card Title"),
      p({ className: "card-text" }, "This is a simple card component."),
      button({ className: "btn btn-primary" }, "Click Me")
    ])
  ]);

  document.body.appendChild(template.toDOM());
  console.timeEnd("card-creation-template");

  console.time("card-creation-template-reuse");
  document.body.appendChild(template.toDOM());
  console.timeEnd("card-creation-template-reuse");

  console.time("card-creation-DOM-Parser");

  const parser = new DOMParser();
  const doc = parser.parseFromString(`
  <div class="card flex flex-row">
    <div class="card-header">
      <h3 class="card-title">Card Header</h3>
    </div>
    <div class="card-body">
      <h2 class="card-title">Card Title</h2>
      <p class="card-text">This is a simple card component.</p>
      <button class="btn btn-primary">Click Me</button>
    </div>
  </div>
  `, "text/html");
  document.body.appendChild(doc.body.firstChild);

  console.timeEnd("card-creation-DOM-Parser");
  
})();
