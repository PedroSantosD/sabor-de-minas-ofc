const SUPABASE_URL = "https://dkajekepsxbgjzaznfgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_ph00G7Qw0EOkHF0qZNeRRg_HKycEpfD";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let selectedProductIndex = 0;
let cart = JSON.parse(localStorage.getItem("saborDeMinasCart")) || [];

const coffeePrices = {
  "250g": 22.90,
  "500g": 42.90,
  "1kg": 79.90
};

const productTabs = document.querySelector("#productTabs");
const productImage = document.querySelector("#productImage");
const productTitle = document.querySelector("#productTitle");
const productDescription = document.querySelector("#productDescription");
const productPrice = document.querySelector("#productPrice");
const productTags = document.querySelector("#productTags");
const productOrderBtn = document.querySelector("#productOrderBtn");
const coffeeOptions = document.querySelector("#coffeeOptions");
const coffeeWeight = document.querySelector("#coffeeWeight");

const cartList = document.querySelector("#cartList");
const cartCount = document.querySelector("#cartCount");
const floatingCartCount = document.querySelector("#floatingCartCount");
const cartSubtotal = document.querySelector("#cartSubtotal");
const clearCart = document.querySelector("#clearCart");
const panel = document.querySelector("#orderPanel");
const toast = document.querySelector("#toast");

function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    return;
  }

  products = data.map(product => ({
    ...product,
    price: Number(product.price),
    tags: product.tags ? product.tags.split(",") : []
  }));

  renderTabs();
  setProduct(0);
}

function renderTabs() {
  productTabs.innerHTML = "";

  products.forEach((product, index) => {
    const tab = document.createElement("button");
    tab.className = "product-tab";
    tab.innerHTML = `<span>${product.name}</span><span>→</span>`;
    tab.addEventListener("click", () => setProduct(index));
    productTabs.appendChild(tab);
  });
}

function setProduct(index) {
  selectedProductIndex = index;
  const product = products[index];

  if (!product) return;

  productImage.src = product.image;
  productImage.classList.toggle("contain", product.name === "Farofas Mineiras");

  productTitle.textContent = product.name;
  productDescription.textContent = product.description;

  productPrice.textContent = product.coffee
    ? `${formatPrice(coffeePrices[coffeeWeight.value])} / ${coffeeWeight.value}`
    : formatPrice(product.price);

  productTags.innerHTML = product.tags
    .map(tag => `<span class="tag">${tag.trim()}</span>`)
    .join("");

  coffeeOptions.classList.remove("show");

  if (product.name === "Café em Grãos") {
    coffeeOptions.classList.add("show");
  }

  document.querySelectorAll(".product-tab").forEach((tab, tabIndex) => {
    tab.classList.toggle("active", tabIndex === index);
  });
}

if (coffeeWeight) {
  coffeeWeight.addEventListener("change", () => {
    setProduct(selectedProductIndex);
  });
}

function addToCart(productName) {
  const product = products.find(item => item.name === productName);
  if (!product) return;

  let cartName = product.name;
  let cartPrice = Number(product.price);

  if (product.coffee && coffeeWeight) {
    cartName = `${product.name} - ${coffeeWeight.value}`;
    cartPrice = coffeePrices[coffeeWeight.value];
  }

  const existingItem = cart.find(item => item.name === cartName);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: Date.now(),
      name: cartName,
      price: cartPrice,
      quantity: 1
    });
  }

  updateCart();
  saveCart();
  showToast();
  panel.classList.add("open");
}

function updateCart() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  cartCount.textContent = totalItems;

  if (floatingCartCount) {
    floatingCartCount.textContent = totalItems;
  }

  if (cart.length === 0) {
    cartList.innerHTML = `<p class="empty-cart">Nenhum produto adicionado ainda.</p>`;
    cartSubtotal.textContent = formatPrice(0);
    return;
  }

  cartList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <span>${item.quantity} unidade(s) • ${formatPrice(item.price)}</span>
        <small>Subtotal: ${formatPrice(item.price * item.quantity)}</small>
      </div>

      <div class="cart-actions">
        <button data-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade de ${item.name}">−</button>
        <button data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade de ${item.name}">+</button>
        <button data-action="remove" data-id="${item.id}" aria-label="Remover ${item.name}">×</button>
      </div>
    </div>
  `).join("");

  cartSubtotal.textContent = formatPrice(getCartTotal());
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function saveCart() {
  localStorage.setItem("saborDeMinasCart", JSON.stringify(cart));
}

function increaseItem(id) {
  const item = cart.find(item => item.id === id);
  if (item) item.quantity++;
  updateCart();
  saveCart();
}

function decreaseItem(id) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity--;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  updateCart();
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
  saveCart();
}

function showToast() {
  if (!toast) return;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

productOrderBtn.addEventListener("click", () => {
  if (!products[selectedProductIndex]) return;
  addToCart(products[selectedProductIndex].name);
});

clearCart.addEventListener("click", () => {
  cart = [];
  updateCart();
  saveCart();
});

// Cart event delegation
cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === "decrease") decreaseItem(id);
  else if (action === "increase") increaseItem(id);
  else if (action === "remove") removeFromCart(id);
});

// Mobile menu
const menuBtn = document.querySelector("#menuBtn");
const menuNav = document.querySelector("#menu");
menuBtn.addEventListener("click", () => {
  const isOpen = menuNav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", isOpen);
  menuBtn.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});

// Close menu on nav link click
menuNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    menuNav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Abrir menu");
  });
});

// Active nav on scroll
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");
const observerNav = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
      });
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
sections.forEach(s => observerNav.observe(s));

document.querySelectorAll(".open-order").forEach(btn => {
  btn.addEventListener("click", () => {
    panel.classList.add("open");
  });
});

document.querySelector("#closePanel").addEventListener("click", () => {
  panel.classList.remove("open");
});

document.querySelector("#sendOrder").addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Adicione pelo menos um produto ao pedido.");
    return;
  }

  const items = cart.map((item, index) => {
    return `${index + 1}. ${item.name} - ${item.quantity} unidade(s) - Valor: ${formatPrice(item.price * item.quantity)}`;
  }).join("%0A");

  const total = formatPrice(getCartTotal());

 const now = new Date();

const horario = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
});

const clientName = document.querySelector("#clientName").value || "Não informado";

const clientAddress = document.querySelector("#clientAddress").value || "Não informado";

const subtotal = formatPrice(getCartTotal());

const message =
`*NOVO PEDIDO - SABOR DE MINAS*

 Cliente: ${clientName}

 Endereço:
${clientAddress}

 Horário:
${horario}

Pedido:
${items}

 Subtotal:
${subtotal}

Obrigado pela preferência `;
const orderData = {
  items: items,
  total: getCartTotal(),
  status: "Pendente"
};

const { error } = await supabaseClient
  .from("orders")
  .insert([orderData]);

if (error) {
  console.error(error);
  alert("Erro ao salvar pedido.");
}

  window.open(`https://wa.me/5583988551234?text=${encodeURIComponent(message)}`, "_blank");
});

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, {
  threshold: .12
});

reveals.forEach(item => observer.observe(item));

updateCart();
loadProducts();