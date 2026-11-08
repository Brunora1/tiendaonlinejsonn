import { createCart } from "./cart.js";
import { initializeCatalog } from "./catalogo.js";

const loadError = document.querySelector("#load-error");
const toastRegion = document.querySelector("#toast-region");
let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.replaceChildren(toast);
  toastTimer = window.setTimeout(() => toast.remove(), 3000);
}

function validateProduct(product) {
  return (
    product &&
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    Number.isInteger(product.stock) &&
    product.stock >= 0 &&
    typeof product.sprite === "string" &&
    typeof product.spriteCredit === "string" &&
    typeof product.spriteLicense === "string" &&
    typeof product.spriteSource === "string"
  );
}

function validateCategory(category) {
  return category && typeof category.id === "string" && typeof category.name === "string";
}

async function loadStoreData(cart) {
  try {
    const responses = await Promise.all([
      fetch("./json/products.json"),
      fetch("./json/categories.json"),
    ]);

    if (responses.some((response) => !response.ok)) {
      throw new Error("No se pudieron cargar los archivos de la tienda.");
    }

    const [productData, categoryData] = await Promise.all(
      responses.map((response) => response.json()),
    );
    if (!Array.isArray(productData) || !Array.isArray(categoryData)) {
      throw new TypeError("Los datos de la tienda no tienen un formato válido.");
    }

    const products = productData.filter(validateProduct);
    const categories = categoryData.filter(validateCategory);
    cart.setProducts(products);
    initializeCatalog(products, categories, cart.addToCart);
  } catch (error) {
    console.error("Error al cargar los datos de la tienda.", error);
    loadError.hidden = false;
  }
}

const cart = createCart(showToast);
loadStoreData(cart);
