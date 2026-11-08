const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const elements = {
  categories: document.querySelector("#category-list"),
  products: document.querySelector("#product-grid"),
  results: document.querySelector("#results-count"),
  empty: document.querySelector("#empty-state"),
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
};

let products = [];
let categories = [];
let activeCategory = "todos";
let addToCart;

function renderCategories() {
  elements.categories.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.textContent = category.name;
    button.setAttribute("aria-pressed", String(activeCategory === category.id));
    button.addEventListener("click", () => {
      activeCategory = category.id;
      renderCategories();
      renderProducts();
    });
    elements.categories.append(button);
  });
}

function getVisibleProducts() {
  const searchTerm = elements.search.value.trim().toLocaleLowerCase("es");
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "todos" || product.category === activeCategory;
    const searchableText = `${product.name} ${product.description}`.toLocaleLowerCase("es");
    return product.stock > 0 && matchesCategory && searchableText.includes(searchTerm);
  });

  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "name-asc": (a, b) => a.name.localeCompare(b.name, "es"),
    featured: (a, b) => products.indexOf(a) - products.indexOf(b),
  };
  visibleProducts.sort(sorters[elements.sort.value] || sorters.featured);
  return visibleProducts;
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const image = document.createElement("div");
  image.className = `product-art product-art-${product.color || "clay"}`;
  const sprite = document.createElement("img");
  Object.assign(sprite, {
    className: "pixel-sprite",
    src: product.sprite,
    alt: `${product.name}, retrato pixel art de Pokémon Mystery Dungeon`,
    width: 40,
    height: 40,
  });
  image.append(sprite);

  if (product.tag) {
    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = product.tag;
    image.append(tag);
  }

  const details = document.createElement("div");
  details.className = "product-details";
  const text = document.createElement("div");
  text.className = "product-copy";
  const name = document.createElement("h3");
  name.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  const artistCredit = document.createElement("p");
  artistCredit.className = "artist-credit";
  const creditLink = document.createElement("a");
  Object.assign(creditLink, {
    href: product.spriteSource,
    target: "_blank",
    rel: "noreferrer",
    textContent: `${product.spriteCredit} · ${product.spriteLicense}`,
  });
  creditLink.setAttribute("aria-label", `Crédito del retrato: ${product.spriteCredit}`);
  artistCredit.append("Sprite: ", creditLink);
  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = currency.format(product.price);
  text.append(name, description, artistCredit, price);

  const addButton = document.createElement("button");
  addButton.className = "add-button";
  addButton.type = "button";
  addButton.textContent = "+";
  addButton.setAttribute("aria-label", `Añadir ${product.name} a la cesta`);
  addButton.addEventListener("click", () => addToCart(product.id));
  details.append(text, addButton);
  article.append(image, details);
  return article;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  elements.products.replaceChildren(...visibleProducts.map(createProductCard));
  elements.results.textContent = `${visibleProducts.length} ${
    visibleProducts.length === 1 ? "objeto disponible" : "objetos disponibles"
  }`;
  elements.empty.hidden = visibleProducts.length > 0;
}

export function initializeCatalog(productData, categoryData, addProductToCart) {
  products = productData;
  categories = categoryData;
  addToCart = addProductToCart;

  elements.search.addEventListener("input", renderProducts);
  elements.sort.addEventListener("change", renderProducts);
  document.querySelector("#reset-filters").addEventListener("click", () => {
    activeCategory = "todos";
    elements.search.value = "";
    elements.sort.value = "featured";
    renderCategories();
    renderProducts();
  });

  renderCategories();
  renderProducts();
}
