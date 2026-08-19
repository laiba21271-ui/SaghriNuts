/* =========================================================
   SAGHRI NUTS
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

const ALL_PRODUCTS = [...WHOLESALE_PRODUCTS, ...PRODUCTS];

/* =========================================================
   3. CART HELPERS
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

// Wholesale & Retail Cards Matcher
function productFromCard(card) {
    const prodNameEl = card.querySelector("#product_name, .product-name, h3, h4, .title");
    const headingEl = card.querySelector("#categories_heading");
    
    let titleText = prodNameEl ? prodNameEl.innerText.trim() : "";
    let headingText = headingEl ? headingEl.innerText.trim() : "";
    let combinedText = (headingText + " " + titleText + " " + card.innerText).toLowerCase();

    if (!titleText && !headingText) return null;

    const isWholesale = card.className.toLowerCase().includes("wholesale") || combinedText.includes("wholesale");
    if (isWholesale) {
        if (combinedText.includes("peanut")) return WHOLESALE_PRODUCTS.find(p => p.id === "wholesale-peanuts");
        if (combinedText.includes("almond")) return WHOLESALE_PRODUCTS.find(p => p.id === "wholesale-almonds");
    }

    const exactMatch = ALL_PRODUCTS.find(item => item.name.toLowerCase() === titleText.toLowerCase());
    if (exactMatch) return exactMatch;

    const matches = ALL_PRODUCTS.filter(item => combinedText.includes(item.name.toLowerCase()));
    if (matches.length > 0) {
        return matches.reduce((longest, item) => item.name.length > longest.name.length ? item : longest, matches[0]);
    }

    return null;
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
        if (!product) return;
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
   5. PRODUCT CARDS CLICK HANDLING
   ========================================================= */

function setupProductCards() {
    createProductModal();

    const cards = document.querySelectorAll(".image_box, .wholesale_peanuts, [class*='wholesale'], .product_box");
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

/* =========================================================
   6. SEARCH BAR
   ========================================================= */

function setupSearch() {
    const inputs = document.querySelectorAll('.search_bar input, .search-bar input, input[placeholder*="search" i]');

    inputs.forEach(input => {
        const parentDiv = input.parentElement;
        parentDiv.style.position = "relative";

        let resultsDiv = parentDiv.querySelector(".search-results");
        if (!resultsDiv) {
            resultsDiv = document.createElement("div");
            resultsDiv.className = "search-results";
            resultsDiv.style.cssText = "position:absolute; top:100%; left:0; width:100%; background:#fff; border:1px solid #ddd; border-radius:4px; box-shadow:0 4px 10px rgba(0,0,0,0.15); z-index:9999; max-height:250px; overflow-y:auto; display:none;";
            parentDiv.appendChild(resultsDiv);
        }

        input.addEventListener("input", () => {
            const query = input.value.trim().toLowerCase();
            resultsDiv.innerHTML = "";

            if (!query) {
                resultsDiv.style.display = "none";
                return;
            }

            const matches = ALL_PRODUCTS.filter(product =>
                (product.name + " " + product.description + " " + product.category).toLowerCase().includes(query)
            );

            if (!matches.length) {
                resultsDiv.innerHTML = `<div style="padding:10px; color:#777; font-size:0.9rem;">No product found</div>`;
            } else {
                matches.forEach(product => {
                    const item = document.createElement("div");
                    item.style.cssText = "padding:10px; border-bottom:1px solid #eee; cursor:pointer; display:flex; justify-content:space-between; align-items:center;";
                    item.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${product.image}" style="width:30px; height:30px; object-fit:cover; border-radius:3px;">
                            <span style="font-size:0.9rem; font-weight:500; color:#333;">${product.name}</span>
                        </div>
                        <strong style="font-size:0.85rem; color:#2e7d32;">${money(product.price)}</strong>
                    `;
                    item.addEventListener("click", () => {
                        resultsDiv.style.display = "none";
                        input.value = "";
                        window.openProductModal(product);
                    });
                    resultsDiv.appendChild(item);
                });
            }
            resultsDiv.style.display = "block";
        });

        document.addEventListener("click", (e) => {
            if (!parentDiv.contains(e.target)) {
                resultsDiv.style.display = "none";
            }
        });
    });
}

/* =========================================================
   7. CATEGORIES CLICK HANDLING
   ========================================================= */

function setupCategories() {
    const categoryItems = document.querySelectorAll(".catergories-menu .item, .category-card, [class*='category']");

    categoryItems.forEach(item => {
        item.style.cursor = "pointer";

        item.addEventListener("click", () => {
            const text = item.innerText.toLowerCase();
            let selectedCat = "";

            if (text.includes("wholesale")) selectedCat = "wholesale-peanuts";
            else if (text.includes("peanut")) selectedCat = "peanuts";
            else if (text.includes("almond")) selectedCat = "almonds";
            else if (text.includes("butter")) selectedCat = "butter";

            if (selectedCat) {
                if (window.location.pathname.includes("shop.html")) {
                    filterProductsByCategory(selectedCat);
                } else {
                    window.location.href = "shop.html?category=" + encodeURIComponent(selectedCat);
                }
            }
        });
    });

    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("category");
    if (catParam && window.location.pathname.includes("shop.html")) {
        filterProductsByCategory(catParam);
    }
}

function filterProductsByCategory(categoryName) {
    const cards = document.querySelectorAll(".image_box, .wholesale_peanuts");
    cards.forEach(card => {
        const product = productFromCard(card);
        if (product) {
            if (categoryName === "all" || product.category.includes(categoryName)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        }
    });
}

/* =========================================================
   8. CART PAGE RENDER
   ========================================================= */

function setupCartPage() {
    const list = document.getElementById("cartItems");
    if (!list) return;

    function renderCart() {
        const cart = getCart();
        list.innerHTML = "";

        if (!cart.length) {
            list.innerHTML = `
                <div class="empty-cart" style="padding: 20px; text-align: center;">
                    <i class="fa-solid fa-basket-shopping" style="font-size: 2rem; color: #888;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious nuts to your cart.</p>
                    <a href="shop.html" style="color: #2e7d32; font-weight: bold;">Start Shopping</a>
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
                    <button class="remove-item" type="button" style="background:none; border:none; color:red; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
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

        const subtotalEl = document.querySelector(".subtotal-value");
        const shippingEl = document.querySelector(".shipping-value");
        const totalEl = document.querySelector(".total-value");

        if (subtotalEl) subtotalEl.textContent = money(subtotal);
        if (shippingEl) shippingEl.textContent = shipping === 0 && subtotal > 0 ? "FREE" : money(shipping);
        if (totalEl) totalEl.textContent = money(total);

        const checkoutBtn = document.querySelector(".checkout-btn");
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    }

    renderCart();
}

/* =========================================================
   9. INITIALIZATION & CHECKOUT SUBMISSION (STRICT ISOLATION FIX)
   ========================================================= */

window.toggleMenu = function() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) navLinks.classList.toggle("active");
};

document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    setupSearch();
    setupCategories();
    setupProductCards();
    setupCartPage();

    const form = document.querySelector("#checkoutForm") || document.querySelector(".checkout-box form") || document.querySelector("form");
    
    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();

            const cart = getCart();
            if (!cart.length) {
                alert("Your cart is empty.");
                return;
            }

            const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
            let nameVal = "", emailVal = "", phoneVal = "", addressVal = "", cityVal = "", paymentVal = "cod";

            // Strict Classification to prevent Cross-Matching (e.g. Email matching Address)
            inputs.forEach(input => {
                const type = (input.type || "").toLowerCase();
                const id = (input.id || "").toLowerCase();
                const name = (input.name || "").toLowerCase();
                const placeholder = (input.placeholder || "").toLowerCase();
                const val = input.value.trim();

                if (!val) return;

                // 1. EMAIL (Must check first to isolate)
                if (type === "email" || val.includes("@") || id.includes("email") || name.includes("email")) {
                    emailVal = val;
                }
                // 2. PHONE
                else if (type === "tel" || id.includes("phone") || name.includes("phone") || placeholder.includes("phone") || placeholder.includes("+92") || placeholder.includes("03")) {
                    phoneVal = val;
                }
                // 3. CITY
                else if (id.includes("city") || name.includes("city") || placeholder.includes("city")) {
                    cityVal = val;
                }
                // 4. PAYMENT
                else if (id.includes("payment") || name.includes("payment")) {
                    paymentVal = val;
                }
                // 5. ADDRESS (Excludes Email fields)
                else if (input.tagName === "TEXTAREA" || id.includes("address") || name.includes("address") || placeholder.includes("address") || placeholder.includes("house") || placeholder.includes("street")) {
                    if (!id.includes("email") && !name.includes("email")) {
                        addressVal = val;
                    }
                }
                // 6. NAME
                else if (id.includes("name") || name.includes("name") || placeholder.includes("full name")) {
                    if (!id.includes("email") && !name.includes("email")) {
                        nameVal = val;
                    }
                }
            });

            const finalName = nameVal || "Guest";
            const finalEmail = emailVal || "N/A";
            const finalPhone = phoneVal || "N/A";
            const finalAddress = (addressVal ? addressVal : "N/A") + (cityVal ? ", " + cityVal : "");

            const subtotal = cart.reduce((t, i) => t + Number(i.price) * Number(i.quantity), 0);
            const shipping = subtotal >= 3000 ? 0 : 250;

            const orderData = {
                orderNumber: "SN-" + Date.now().toString().slice(-8),
                items: cart,
                subtotal: subtotal,
                shipping: shipping,
                totalAmount: subtotal + shipping,
                
                customerName: finalName,
                customerPhone: finalPhone,
                customerAddress: finalAddress,
                customerEmail: finalEmail,
                paymentMethod: paymentVal,

                status: "Pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection("orders").add(orderData);

                alert("Order Placed Successfully!\nOrder ID: " + orderData.orderNumber);
                localStorage.removeItem("saghriNutsCart");
                window.location.href = "index.html";
            } catch (error) {
                console.error("Firebase Error:", error);
                alert("Order Save Nahi Hua: " + error.message);
            }
        });
    }
});