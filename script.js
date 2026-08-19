/* =========================================================
   SAGHRI NUTS - COMPLETE WORKING STORE & FIREBASE (NO IMPORT)
   ========================================================= */

/* =========================================================
   1. FIREBASE INITIALIZATION
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyD6xns4wo0MfgeO8katl-0_sPIGKc2DAOo",
    authDomain: "nuts-store-b519c.firebaseapp.com",
    projectId: "nuts-store-b519c",
    storageBucket: "nuts-store-b519c.firebasestorage.app",
    messagingSenderId: "862119051910",
    appId: "1:862119051910:web:3bae190c8c7bbff7c94707"
};

// Initialize Firebase App & Database
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================================================
   2. PRODUCTS DATA
   ========================================================= */

const PRODUCTS = [
    { id: "raw-peanuts", name: "Raw Peanuts", price: 350, category: "peanuts", image: "raw_peanuts.png", description: "1kg Organic raw peanuts", rating: "4.8" },
    { id: "roasted-peanuts", name: "Roasted Peanuts", price: 500, category: "peanuts", image: "roasted_peanuts.png", description: "1kg Organic roasted peanuts", rating: "4.5" },
    { id: "salted-peanuts", name: "Salted Peanuts", price: 600, category: "peanuts", image: "salted_peanuts.png", description: "1kg Organic salted peanuts", rating: "5.0" },
    { id: "peanut-butter", name: "Peanut Butter", price: 850, category: "butter", image: "butter.png", description: "Organic peanut butter - 1 jar", rating: "4.8" },
    { id: "raw-almonds", name: "Raw Almonds", price: 350, category: "almonds", image: "raw-almond.png", description: "1 pack Organic raw almonds", rating: "4.9" },
    { id: "roasted-almonds", name: "Roasted Almonds", price: 500, category: "almonds", image: "roasted-almond.png", description: "1 pack Organic roasted almonds", rating: "5.0" },
    { id: "salted-almonds", name: "Salted Almonds", price: 600, category: "almonds", image: "saltes-almonds.png", description: "1 pack Organic salted almonds", rating: "5.0" },
    { id: "honey-almonds", name: "Honey Almonds", price: 850, category: "almonds", image: "honey-almond.png", description: "1 pack Organic honey almonds", rating: "4.5" }
];

const WHOLESALE_PRODUCTS = [
    { id: "wholesale-peanuts", name: "Wholesale Raw Peanuts", price: 5000, category: "wholesale-peanuts", image: "wholesale1.png", description: "10kg Organic raw peanuts direct from our farm", rating: "4.8" },
    { id: "wholesale-almonds", name: "Wholesale Raw Almonds", price: 5000, category: "wholesale-almonds", image: "wholesale almonds.jpg", description: "10kg Organic raw almonds direct from our farm", rating: "4.8" }
];

const ALL_PRODUCTS = [...PRODUCTS, ...WHOLESALE_PRODUCTS];

/* =========================================================
   3. CART FUNCTIONS
   ========================================================= */

function getCart() {
    try {
        return JSON.parse(localStorage.getItem("saghriNutsCart")) || [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("saghriNutsCart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = count;
    });
}

function money(value) {
    return "Rs. " + Number(value).toLocaleString("en-PK");
}

window.addToCart = function(product, quantity = 1, goToCart = true) {
    const cart = getCart();
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: qty
        });
    }

    saveCart(cart);
    if (goToCart) window.location.href = "cart.html";
};

function findProduct(id) {
    return ALL_PRODUCTS.find(product => product.id === id);
}

function productFromCard(card) {
    const cardText = card.innerText.toLowerCase();
    return ALL_PRODUCTS.find(item => cardText.includes(item.name.toLowerCase())) || null;
}

/* =========================================================
   4. PRODUCT MODAL POPUP
   ========================================================= */

function createProductModal() {
    if (document.getElementById("productModal")) return;

    const modal = document.createElement("div");
    modal.id = "productModal";
    modal.className = "product-modal";

    modal.innerHTML = `
        <div class="product-modal-backdrop"></div>
        <div class="product-modal-card">
            <button class="modal-close" type="button">&times;</button>
            <div class="modal-image-wrap">
                <img id="modalImage" src="" alt="">
            </div>
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
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.classList.remove("show");

    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.querySelector(".product-modal-backdrop").addEventListener("click", closeModal);

    let currentProduct = null;
    let quantity = 1;

    window.openProductModal = function(product) {
        currentProduct = product;
        quantity = 1;

        document.getElementById("modalImage").src = product.image;
        document.getElementById("modalImage").alt = product.name;
        document.getElementById("modalName").textContent = product.name;
        document.getElementById("modalCategory").textContent = product.category.replaceAll("-", " ").toUpperCase();
        document.getElementById("modalRating").textContent = "★ " + product.rating + " rating";
        document.getElementById("modalDescription").textContent = product.description;
        document.getElementById("modalPrice").textContent = money(product.price);
        document.getElementById("modalQuantity").textContent = quantity;

        modal.classList.add("show");
    };

    document.getElementById("modalMinus").addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        document.getElementById("modalQuantity").textContent = quantity;
    });

    document.getElementById("modalPlus").addEventListener("click", () => {
        quantity++;
        document.getElementById("modalQuantity").textContent = quantity;
    });

    document.getElementById("modalAdd").addEventListener("click", () => {
        if (currentProduct) window.addToCart(currentProduct, quantity, true);
    });
}

/* =========================================================
   5. CARDS & SEARCH CLICK HANDLING
   ========================================================= */

function setupProductCards() {
    createProductModal();

    const cards = document.querySelectorAll(".image_box, .wholesale_peanuts, [class*='product']");
    cards.forEach(card => {
        const product = productFromCard(card);
        if (!product) return;

        card.style.cursor = "pointer";

        card.addEventListener("click", event => {
            if (event.target.closest(".add-to-cart, .add-2-cart, button")) return;
            window.openProductModal(product);
        });

        const btn = card.querySelector(".add-to-cart, .add-2-cart, button");
        if (btn) {
            btn.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                window.addToCart(product, 1, true);
            });
        }
    });
}

function setupSearch() {
    document.querySelectorAll(".search_bar").forEach(searchBar => {
        const input = searchBar.querySelector(".input");
        if (!input) return;

        searchBar.style.position = "relative";
        const results = document.createElement("div");
        results.className = "search-results";
        searchBar.appendChild(results);

        input.addEventListener("input", () => {
            const query = input.value.trim().toLowerCase();
            results.innerHTML = "";

            if (!query) {
                results.style.display = "none";
                return;
            }

            const matches = ALL_PRODUCTS.filter(product =>
                (product.name + " " + product.description).toLowerCase().includes(query)
            );

            if (!matches.length) {
                results.innerHTML = `<div class="no-result">No product found</div>`;
            } else {
                matches.forEach(product => {
                    const row = document.createElement("div");
                    row.className = "search-result-item";
                    row.innerHTML = `<span>${product.name}</span><strong>${money(product.price)}</strong>`;
                    row.addEventListener("click", () => {
                        window.location.href = "shop.html?product=" + encodeURIComponent(product.id);
                    });
                    results.appendChild(row);
                });
            }
            results.style.display = "block";
        });

        document.addEventListener("click", event => {
            if (!searchBar.contains(event.target)) results.style.display = "none";
        });
    });
}

/* =========================================================
   6. CART PAGE RENDER & FIREBASE SAVE
   ========================================================= */

function setupCartPage() {
    const cartLeft = document.querySelector(".cart-left");
    if (!cartLeft) return;

    document.querySelectorAll(".cart-product").forEach(el => el.remove());

    const continueShopping = cartLeft.querySelector(".continue-shopping");
    const list = document.createElement("div");
    list.id = "cartItems";

    if (continueShopping) {
        cartLeft.insertBefore(list, continueShopping);
    } else {
        cartLeft.appendChild(list);
    }

    function renderCart() {
        const cart = getCart();
        list.innerHTML = "";

        if (!cart.length) {
            list.innerHTML = `
                <div class="empty-cart">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious nuts to your cart.</p>
                    <a href="shop.html">Start Shopping</a>
                </div>
            `;
        } else {
            cart.forEach(item => {
                const product = findProduct(item.id) || item;
                const row = document.createElement("div");
                row.className = "cart-product";

                row.innerHTML = `
                    <div class="product-image"><img src="${product.image}" alt="${product.name}"></div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ""}</p>
                        <div class="product-bottom">
                            <div class="quantity">
                                <button type="button" data-action="minus">−</button>
                                <span>${item.quantity}</span>
                                <button type="button" data-action="plus">+</button>
                            </div>
                            <strong>${money(product.price * item.quantity)}</strong>
                        </div>
                    </div>
                    <button class="remove-item" type="button"><i class="fa-solid fa-trash"></i></button>
                `;

                row.querySelector('[data-action="minus"]').onclick = () => changeQuantity(item.id, -1);
                row.querySelector('[data-action="plus"]').onclick = () => changeQuantity(item.id, 1);
                row.querySelector(".remove-item").onclick = () => removeFromCart(item.id);

                list.appendChild(row);
            });
        }
        renderSummary();
    }

    function changeQuantity(id, amount) {
        const cart = getCart();
        const item = cart.find(p => p.id === id);
        if (!item) return;

        item.quantity += amount;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
        saveCart(cart);
        renderCart();
    }

    function removeFromCart(id) {
        const cart = getCart().filter(item => item.id !== id);
        saveCart(cart);
        renderCart();
    }

    function renderSummary() {
        const cart = getCart();
        const subtotal = cart.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
        const shipping = subtotal === 0 ? 0 : subtotal >= 3000 ? 0 : 250;
        const total = subtotal + shipping;

        const subtotalEl = document.querySelector(".summary-row .subtotal-value");
        const shippingEl = document.querySelector(".summary-row .shipping-value");
        const totalEl = document.querySelector(".summary-row .total-value");

        if (subtotalEl) subtotalEl.textContent = money(subtotal);
        if (shippingEl) shippingEl.textContent = shipping === 0 && subtotal > 0 ? "FREE" : money(shipping);
        if (totalEl) totalEl.textContent = money(total);

        const checkoutBtn = document.querySelector(".checkout-btn");
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    }

    renderCart();
}

/* =========================================================
   7. INITIALIZATION & CHECKOUT SUBMISSION
   ========================================================= */

window.toggleMenu = function() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) navLinks.classList.toggle("active");
};

document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    setupSearch();
    setupProductCards();
    setupCartPage();

    // Direct Firestore Order Save
    const form = document.querySelector(".checkout-box form");
    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const cart = JSON.parse(localStorage.getItem("saghriNutsCart")) || [];

            if (!cart.length) {
                alert("Your cart is empty.");
                return;
            }

            const subtotal = cart.reduce((t, i) => t + Number(i.price) * Number(i.quantity), 0);
            const shipping = subtotal >= 3000 ? 0 : 250;

            const orderData = {
                orderNumber: "SN-" + Date.now().toString().slice(-8),
                items: cart,
                subtotal: subtotal,
                shipping: shipping,
                totalAmount: subtotal + shipping,
                customerName: form.querySelector('[name="name"]')?.value || "Guest",
                customerPhone: form.querySelector('[name="phone"]')?.value || "",
                customerAddress: form.querySelector('[name="address"]')?.value || "",
                status: "Pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                // Save Order in Firebase Firestore "orders" collection
                await db.collection("orders").add(orderData);
                
                alert("Order Placed Successfully! Order ID: " + orderData.orderNumber);
                localStorage.removeItem("saghriNutsCart");
                window.location.href = "index.html";
            } catch (error) {
                console.error("Firebase Error:", error);
                alert("Order Save Nahi Hua: " + error.message);
            }
        });
    }
});