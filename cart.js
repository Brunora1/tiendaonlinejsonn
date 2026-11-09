const STORAGE_KEY = "gremio-aurora-cart";
const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const elements = {
  count: document.querySelector("#cart-count"),
  backdrop: document.querySelector("#cart-backdrop"),
  dialog: document.querySelector("#cart-dialog"),
  items: document.querySelector("#cart-items"),
  empty: document.querySelector("#cart-empty"),
  summary: document.querySelector("#cart-summary"),
  subtotal: document.querySelector("#cart-subtotal"),
  titleCount: document.querySelector("#cart-title-count"),
};

let products = [];
let cart = loadCart();
let lastFocusedElement = null;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedCart)) {
      throw new TypeError("El contenido guardado de la cesta no es válido.");
    }
    return savedCart.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch (error) {
    console.warn("No se pudo recuperar la cesta guardada.", error);
    return [];
  }
}

function saveCart(showToast) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("No se pudo guardar la cesta en el navegador.", error);
    showToast("No se han podido guardar los cambios de la cesta.");
  }
}

function createCartItem(cartItem, showToast) {
  const product = products.find((item) => item.id === cartItem.id);
  if (!product) return null;

  const row = document.createElement("article");
  row.className = "cart-item";
  const art = document.createElement("div");
  art.className = `cart-item-art product-art-${product.color || "clay"}`;
  const sprite = document.createElement("img");
  Object.assign(sprite, { src: product.sprite, alt: "", width: 40, height: 40 });
  const spriteFallback = document.createElement("span");
  spriteFallback.className = "sprite-fallback";
  spriteFallback.textContent = "✦";
  spriteFallback.setAttribute("aria-hidden", "true");
  spriteFallback.hidden = true;
  sprite.addEventListener("error", () => {
    sprite.hidden = true;
    spriteFallback.hidden = false;
  }, { once: true });
  art.append(sprite, spriteFallback);

  const info = document.createElement("div");
  info.className = "cart-item-info";
  const name = document.createElement("h3");
  name.textContent = product.name;
  const price = document.createElement("p");
  price.className = "cart-item-price";
  price.textContent = currency.format(product.price);
  const quantity = document.createElement("div");
  quantity.className = "quantity-control";

  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.textContent = "−";
  decrease.setAttribute("aria-label", `Quitar una unidad de ${product.name}`);
  decrease.addEventListener("click", () => updateQuantity(product.id, -1, showToast));
  const quantityText = document.createElement("span");
  quantityText.textContent = String(cartItem.quantity);
  const increase = document.createElement("button");
  increase.type = "button";
  increase.textContent = "+";
  increase.setAttribute("aria-label", `Añadir una unidad de ${product.name}`);
  increase.disabled = cartItem.quantity >= product.stock;
  increase.addEventListener("click", () => updateQuantity(product.id, 1, showToast));
  quantity.append(decrease, quantityText, increase);
  info.append(name, price, quantity);

  const remove = document.createElement("button");
  remove.className = "remove-button";
  remove.type = "button";
  remove.textContent = "Eliminar";
  remove.addEventListener("click", () => removeFromCart(product.id, showToast));
  row.append(art, info, remove);
  return row;
}

function renderCart(showToast) {
  const validItems = cart.filter((item) => products.some((product) => product.id === item.id));
  const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  elements.count.textContent = String(itemCount);
  elements.count.setAttribute("aria-label", `${itemCount} artículos`);
  elements.titleCount.textContent = itemCount ? `(${itemCount})` : "";
  elements.subtotal.textContent = currency.format(subtotal);
  elements.items.replaceChildren(...validItems.map((item) => createCartItem(item, showToast)).filter(Boolean));
  elements.empty.hidden = validItems.length > 0;
  elements.summary.hidden = validItems.length === 0;
}

function removeFromCart(productId, showToast) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart(showToast);
  renderCart(showToast);
}

function updateQuantity(productId, change, showToast) {
  const product = products.find((item) => item.id === productId);
  const cartItem = cart.find((item) => item.id === productId);
  if (!product || !cartItem) return;

  const nextQuantity = cartItem.quantity + change;
  if (nextQuantity < 1) {
    removeFromCart(productId, showToast);
    return;
  }
  if (nextQuantity > product.stock) {
    showToast(`Solo quedan ${product.stock} unidades de ${product.name}.`);
    return;
  }

  cartItem.quantity = nextQuantity;
  saveCart(showToast);
  renderCart(showToast);
}

function addToCart(productId, showToast) {
  const product = products.find((item) => item.id === productId);
  if (!product || product.stock < 1) {
    showToast("Este producto no está disponible.");
    return;
  }

  const cartItem = cart.find((item) => item.id === productId);
  if (cartItem && cartItem.quantity >= product.stock) {
    showToast(`No quedan más unidades de ${product.name}.`);
    return;
  }

  if (cartItem) cartItem.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  saveCart(showToast);
  renderCart(showToast);
  showToast(`${product.name} guardado en la bolsa`);
}

function openCart() {
  lastFocusedElement = document.activeElement;
  elements.backdrop.hidden = false;
  document.body.classList.add("cart-open");
  elements.dialog.focus();
}

function closeCart() {
  elements.backdrop.hidden = true;
  document.body.classList.remove("cart-open");
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

export function createCart(showToast) {
  document.querySelector("#open-cart").addEventListener("click", openCart);
  document.querySelector("#close-cart").addEventListener("click", closeCart);
  document.querySelector("#continue-shopping").addEventListener("click", closeCart);
  document.querySelector("#continue-shopping-link").addEventListener("click", closeCart);
  document.querySelector("#checkout-button").addEventListener("click", () => {
    showToast("¡Gracias! La compra estará disponible próximamente.");
  });
  elements.backdrop.addEventListener("click", (event) => {
    if (event.target === elements.backdrop) closeCart();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.backdrop.hidden) closeCart();
  });

  renderCart(showToast);
  return {
    addToCart: (productId) => addToCart(productId, showToast),
    setProducts(productData) {
      products = productData;
      cart = cart.filter((item) =>
        products.some((product) => product.id === item.id && product.stock > 0),
      );
      renderCart(showToast);
    },
  };
}
