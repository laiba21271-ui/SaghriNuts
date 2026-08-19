/* =========================================================
   SAGHRI NUTS - STORE FUNCTIONALITY WITH FIREBASE FIRESTORE
   ========================================================= */

// Firebase Direct Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAb4xFHc9RmeDNCYaODvBWZ5A-WrpqZkTo",
  authDomain: "saghrinuts.firebaseapp.com",
  projectId: "saghrinuts",
  storageBucket: "saghrinuts.firebasestorage.app",
  messagingSenderId: "140449012690",
  appId: "1:140449012690:web:e0ce34796ca8ae5dab860b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PRODUCTS = [
  { id:'raw-peanuts', name:'Raw Peanuts', price:350, category:'peanuts', image:'raw_peanuts.png', description:'1kg Organic raw peanuts', rating:'4.8' },
  { id:'roasted-peanuts', name:'Roasted Peanuts', price:500, category:'peanuts', image:'roasted_peanuts.png', description:'1kg Organic roasted peanuts', rating:'4.5' },
  { id:'salted-peanuts', name:'Salted Peanuts', price:600, category:'peanuts', image:'salted_peanuts.png', description:'1kg Organic salted peanuts', rating:'5.0' },
  { id:'peanut-butter', name:'Peanut Butter', price:850, category:'butter', image:'butter.png', description:'Organic peanut butter - 1 jar', rating:'4.8' },
  { id:'raw-almonds', name:'Raw Almonds', price:350, category:'almonds', image:'raw-almond.png', description:'1 pack Organic raw almonds', rating:'4.9' },
  { id:'roasted-almonds', name:'Roasted Almonds', price:500, category:'almonds', image:'roasted-almond.png', description:'1 pack Organic roasted almonds', rating:'5.0' },
  { id:'salted-almonds', name:'Salted Almonds', price:600, category:'almonds', image:'saltes-almonds.png', description:'1 pack Organic salted almonds', rating:'5.0' },
  { id:'honey-almonds', name:'Honey Almonds', price:850, category:'almonds', image:'honey-almond.png', description:'1 pack Organic honey almonds', rating:'4.5' }
];

const WHOLESALE_PRODUCTS = [
  { id:'wholesale-peanuts', name:'Wholesale Raw Peanuts', price:5000, category:'wholesale-peanuts', image:'wholesale1.png', description:'10kg Organic raw peanuts direct from our farm', rating:'4.8' },
  { id:'wholesale-almonds', name:'Wholesale Raw Almonds', price:5000, category:'wholesale-almonds', image:'wholesale almonds.jpg', description:'10kg Organic raw almonds direct from our farm', rating:'4.8' }
];

const ALL_PRODUCTS = [...PRODUCTS, ...WHOLESALE_PRODUCTS];

function getCart() {
  try { return JSON.parse(localStorage.getItem('saghriNutsCart')) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('saghriNutsCart', JSON.stringify(cart));
  updateCartCount();
}

function money(value) {
  return `Rs. ${Number(value).toLocaleString('en-PK')}`;
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function addToCart(product, quantity = 1, goToCart = true) {
  const cart = getCart();
  const qty = Math.max(1, Number(quantity) || 1);
  const existing = cart.find(item => item.id === product.id);

  if (existing) existing.quantity += qty;
  else cart.push({ id:product.id, name:product.name, price:product.price, image:product.image, quantity:qty });

  saveCart(cart);

  if (goToCart) window.location.href = 'cart.html';
}

function findProduct(id) {
  return ALL_PRODUCTS.find(p => p.id === id);
}

function productFromCard(card) {
  const nameEl = card.querySelector('#product_name');
  const name = nameEl?.innerText.trim();
  if (!name) return null;

  if (card.classList.contains('wholesale_peanuts')) {
    return name.toLowerCase().includes('almond') ? WHOLESALE_PRODUCTS[1] : WHOLESALE_PRODUCTS[0];
  }

  return ALL_PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
}

/* ---------- PRODUCT MODAL ---------- */
function createProductModal() {
  if (document.getElementById('productModal')) return;

  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.className = 'product-modal';
  modal.innerHTML = `
    <div class="product-modal-backdrop"></div>
    <div class="product-modal-card" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div class="modal-image-wrap"><img id="modalImage" src="" alt=""></div>
      <div class="modal-details">
        <span id="modalCategory" class="modal-category"></span>
        <h2 id="modalName"></h2>
        <div id="modalRating" class="modal-rating"></div>
        <p id="modalDescription"></p>
        <div id="modalPrice" class="modal-price"></div>
        <div class="modal-actions">
          <div class="modal-quantity">
            <button id="modalMinus" type="button">−</button>
            <span id="modalQuantity">1</span>
            <button id="modalPlus" type="button">+</button>
          </div>
          <button id="modalAdd" class="modal-add" type="button">Add to Cart</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.classList.remove('show');
  modal.querySelector('.modal-close').onclick = close;
  modal.querySelector('.product-modal-backdrop').onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  let currentProduct = null;
  let quantity = 1;

  window.openProductModal = function(product) {
    currentProduct = product;
    quantity = 1;
    document.getElementById('modalImage').src = product.image;
    document.getElementById('modalImage').alt = product.name;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalPrice').textContent = money(product.price);
    document.getElementById('modalCategory').textContent = product.category.replaceAll('-', ' ').toUpperCase();
    document.getElementById('modalRating').innerHTML = `★ ${product.rating} rating`;
    document.getElementById('modalQuantity').textContent = quantity;
    modal.classList.add('show');
  };

  document.getElementById('modalMinus').onclick = () => {
    quantity = Math.max(1, quantity - 1);
    document.getElementById('modalQuantity').textContent = quantity;
  };
  document.getElementById('modalPlus').onclick = () => {
    quantity += 1;
    document.getElementById('modalQuantity').textContent = quantity;
  };
  document.getElementById('modalAdd').onclick = () => {
    if (currentProduct) addToCart(currentProduct, quantity, true);
  };
}

function setupProductCards() {
  createProductModal();

  document.querySelectorAll('.image_box').forEach(card => {
    const product = productFromCard(card);
    if (!product) return;

    card.style.cursor = 'pointer';
    card.dataset.productId = product.id;

    card.addEventListener('click', e => {
      if (e.target.closest('.add-to-cart')) return;
      openProductModal(product);
    });

    const btn = card.querySelector('.add-to-cart');
    if (btn) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1, true);
      });
    }
  });

  document.querySelectorAll('.wholesale_peanuts').forEach(card => {
    const product = productFromCard(card);
    if (!product) return;

    card.style.cursor = 'pointer';
    card.dataset.productId = product.id;
    card.addEventListener('click', e => {
      if (e.target.closest('.add-2-cart')) return;
      openProductModal(product);
    });

    const btn = card.querySelector('.add-2-cart');
    if (btn) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1, true);
      });
    }
  });
}

/* ---------- SEARCH ---------- */
function setupSearch() {
  document.querySelectorAll('.search_bar').forEach(bar => {
    const input = bar.querySelector('.input');
    if (!input) return;

    bar.style.position = 'relative';
    const results = document.createElement('div');
    results.className = 'search-results';
    bar.appendChild(results);

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) { results.style.display = 'none'; return; }

      const matches = ALL_PRODUCTS.filter(p =>
        `${p.name} ${p.description}`.toLowerCase().includes(q)
      );

      if (!matches.length) {
        results.innerHTML = '<div class="no-result">No product found</div>';
      } else {
        matches.forEach(p => {
          const row = document.createElement('div');
          row.className = 'search-result-item';
          row.innerHTML = `<span>${p.name}</span><strong>${money(p.price)}</strong>`;
          row.onclick = () => {
            window.location.href = `shop.html?product=${encodeURIComponent(p.id)}`;
          };
          results.appendChild(row);
        });
      }
      results.style.display = 'block';
    });

    document.addEventListener('click', e => {
      if (!bar.contains(e.target)) results.style.display = 'none';
    });
  });
}

/* ---------- SHOP PAGE ---------- */
function setupCategories() {
  const categoryMap = ['peanuts', 'peanuts', 'peanuts', 'butter'];
  document.querySelectorAll('.catergories-menu .item').forEach((item, index) => {
    const category = categoryMap[index];
    if (!category) return;
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      window.location.href = `shop.html?category=${encodeURIComponent(category)}`;
    });
  });
}

function setupShopPage() {
  const params = new URLSearchParams(location.search);
  const productId = params.get('product');
  const category = params.get('category');

  document.querySelectorAll('.image_box').forEach(card => {
    const product = productFromCard(card);
    if (!product) return;
    if (category && product.category !== category) card.style.display = 'none';
  });

  if (productId) {
    const product = findProduct(productId);
    if (product) setTimeout(() => openProductModal(product), 150);
  }
}

/* ---------- CART PAGE ---------- */
function setupCartPage() {
  const cartLeft = document.querySelector('.cart-left');
  if (!cartLeft) return;

  const oldProducts = cartLeft.querySelectorAll('.cart-product');
  oldProducts.forEach(el => el.remove());

  const heading = cartLeft.querySelector('.cart-heading');
  const continueShopping = cartLeft.querySelector('.continue-shopping');
  const list = document.createElement('div');
  list.id = 'cartItems';
  if (continueShopping) cartLeft.insertBefore(list, continueShopping);
  else cartLeft.appendChild(list);

  const render = () => {
    const cart = getCart();
    list.innerHTML = '';

    if (!cart.length) {
      list.innerHTML = `
        <div class="empty-cart">
          <i class="fa-solid fa-basket-shopping"></i>
          <h3>Your cart is empty</h3>
          <p>Add some delicious nuts to your cart.</p>
          <a href="shop.html">Start Shopping</a>
        </div>`;
    } else {
      cart.forEach(item => {
        const product = findProduct(item.id) || item;
        const row = document.createElement('div');
        row.className = 'cart-product';
        row.innerHTML = `
          <div class="product-image"><img src="${product.image}" alt="${product.name}"></div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description || ''}</p>
            <div class="product-bottom">
              <div class="quantity">
                <button type="button" data-action="minus">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-action="plus">+</button>
              </div>
              <strong>${money(product.price * item.quantity)}</strong>
            </div>
          </div>
          <button class="remove-item" type="button" title="Remove item"><i class="fa-solid fa-trash"></i></button>`;

        row.querySelector('[data-action="minus"]').onclick = () => changeQuantity(item.id, -1);
        row.querySelector('[data-action="plus"]').onclick = () => changeQuantity(item.id, 1);
        row.querySelector('.remove-item').onclick = () => removeFromCart(item.id);
        list.appendChild(row);
      });
    }
    renderSummary();
  };

  function changeQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) return removeFromCart(id);
    saveCart(cart);
    render();
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
    render();
  }

  function renderSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 0 ? (subtotal >= 3000 ? 0 : 250) : 0;
    const total = subtotal + shipping;

    const subtotalEl = document.querySelector('.summary-row .subtotal-value');
    const shippingEl = document.querySelector('.summary-row .shipping-value');
    const totalEl = document.querySelector('.summary-row .total-value');
    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 && subtotal > 0 ? 'FREE' : money(shipping);
    if (totalEl) totalEl.textContent = money(total);

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  }

  // --- FIRESTORE DIRECT SAVE ---
  const form = document.querySelector('.checkout-box form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cart = getCart();

      if (!cart.length) {
        alert('Your cart is empty. Please add a product first.');
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const orderNumber = 'SN-' + Date.now().toString().slice(-8);
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 0 ? (subtotal >= 3000 ? 0 : 250) : 0;
      const total = subtotal + shipping;

      const orderData = {
        orderNumber: orderNumber,
        items: cart,
        subtotal: subtotal,
        shipping: shipping,
        totalAmount: total,
        customerName: form.querySelector('[name="name"]')?.value || 'Guest',
        customerPhone: form.querySelector('[name="phone"]')?.value || '',
        customerAddress: form.querySelector('[name="address"]')?.value || '',
        createdAt: serverTimestamp(),
        status: 'Pending'
      };

      try {
        await addDoc(collection(db, "orders"), orderData);

        localStorage.setItem('saghriNutsLastOrder', JSON.stringify({
          ...orderData,
          createdAt: new Date().toISOString()
        }));

        localStorage.removeItem('saghriNutsCart');
        updateCartCount();
        render();
        alert(`FIREBASE TEST: Order ${orderNumber} database mein save ho gaya!`);
        window.location.href = 'index.html';
      } catch (err) {
        console.error("Firebase Error: ", err);
        alert("Firebase Save Failed: " + err.message);
      }
    });
  }

  render();
}

/* ---------- START ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  setupSearch();
  setupCategories();
  setupProductCards();
  setupShopPage();
  setupCartPage();
});