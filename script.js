// ==========================================
// 1. FIREBASE INITIALIZATION & DATA
// ==========================================
var firebaseConfig = {
    apiKey: "AIzaSyD6xns4wo0MfgeO8katl-0_sPIGKc2DAOo",
    authDomain: "nuts-store-b519c.firebaseapp.com",
    projectId: "nuts-store-b519c",
    storageBucket: "nuts-store-b519c.firebasestorage.app",
    messagingSenderId: "862119051910",
    appId: "1:862119051910:web:3bae190c8c7bbff7c94707"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

var db = typeof firebase !== "undefined" ? firebase.firestore() : null;

var DEFAULT_PRODUCTS = [
    { id: "raw-peanuts", name: "Raw Peanuts", price: 350, discount: 0, image: "raw_peanuts.png", description: "1kg Organic fresh raw peanuts direct from farm" },
    { id: "roasted-peanuts", name: "Roasted Peanuts", price: 500, discount: 0, image: "roasted_peanuts.png", description: "1kg Freshly roasted crunchy peanuts" },
    { id: "salted-peanuts", name: "Salted Peanuts", price: 600, discount: 0, image: "salted_peanuts.png", description: "1kg Premium quality lightly salted peanuts" },
    { id: "peanut-butter", name: "Peanut Butter", price: 850, discount: 0, image: "butter.png", description: "Organic creamy peanut butter jar" },
    { id: "raw-almonds", name: "Raw Almonds", price: 350, discount: 0, image: "raw-almond.png", description: "Fresh natural sweet almonds" },
    { id: "roasted-almonds", name: "Roasted Almonds", price: 500, discount: 0, image: "roasted-almond.png", description: "Crispy roasted almonds with rich flavor" },
    { id: "salted-almonds", name: "Salted Almonds", price: 600, discount: 0, image: "saltes-almonds.png", description: "Delicious salted almonds snack" },
    { id: "honey-almonds", name: "Honey Almonds", price: 850, discount: 0, image: "honey-almond.png", description: "Honey glazed organic crisp almonds" }
];

var WHOLESALE_PRODUCTS = [
    { id: "wholesale-raw-peanuts", name: "Wholesale Raw Peanuts", price: 5000, discount: 0, image: "raw_peanuts.png", description: "10kg Organic raw peanuts direct from farm" },
    { id: "wholesale-raw-almonds", name: "Wholesale Raw Almonds", price: 5000, discount: 0, image: "raw-almond.png", description: "10kg Organic raw almonds direct from farm" }
];

var dbProducts = [];

function safe(v) {
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function money(v) {
    return "Rs. " + Number(v || 0).toLocaleString("en-PK");
}

function getAllProducts() {
    return [...DEFAULT_PRODUCTS, ...WHOLESALE_PRODUCTS, ...dbProducts];
}

// Sync Firestore Products
if (db) {
    db.collection("products").onSnapshot(snap => {
        if (!snap.empty) {
            dbProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    });
}

// ==========================================
// 2. CART LOCAL STORAGE & HELPERS
// ==========================================
function getCart() {
    try {
        return JSON.parse(localStorage.getItem("saghriNutsCart")) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("saghriNutsCart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    document.querySelectorAll(".cart-count, #cart-count").forEach(el => {
        el.textContent = totalQty;
    });
}

function addToCart(product, quantity = 1) {
    let cart = getCart();
    const pId = product.id || product.name.toLowerCase().replace(/\s+/g, "-");
    const existingIndex = cart.findIndex(item => item.id === pId || item.name.toLowerCase() === product.name.toLowerCase());

    const origPrice = Number(product.price || 0);
    const disc = Number(product.discount || 0);
    const finalPrice = product.finalPrice ? Number(product.finalPrice) : (disc > 0 ? origPrice - (origPrice * disc / 100) : origPrice);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: pId,
            name: product.name,
            price: finalPrice,
            image: product.image || "raw_peanuts.png",
            quantity: quantity
        });
    }

    saveCart(cart);
    showToast(`✅ ${product.name} added to cart!`);
}

function showToast(message) {
    let toast = document.getElementById("sn-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "sn-toast";
        toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#2e7d32; color:#fff; padding:12px 20px; border-radius:8px; z-index:99999; font-family:'Poppins',sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:all 0.3s ease;";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

// ==========================================
// 3. PRODUCT POPUP MODAL & REVIEWS
// ==========================================
function openProductModal(product) {
    document.getElementById("productQuickViewModal")?.remove();

    const modal = document.createElement("div");
    modal.id = "productQuickViewModal";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px; box-sizing:border-box;";

    const pId = product.id || product.name.toLowerCase().replace(/\s+/g, "-");
    const imgSrc = product.image || "raw_peanuts.png";

    const origPrice = Number(product.price || 0);
    const disc = Number(product.discount || 0);
    const finalPrice = product.finalPrice ? Number(product.finalPrice) : (disc > 0 ? origPrice - (origPrice * disc / 100) : origPrice);

    let priceDisplayHTML = `<div style="font-size:20px; font-weight:700; color:#2e7d32; margin-bottom:12px;">${money(origPrice)}</div>`;

    if (disc > 0 && origPrice > finalPrice) {
        priceDisplayHTML = `
            <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:14px; text-decoration:line-through; color:#888;">${money(origPrice)}</span>
                <span style="font-size:20px; font-weight:700; color:#2e7d32;">${money(finalPrice)}</span>
                <span style="background:#d32f2f; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${disc}% OFF</span>
            </div>`;
    }

    modal.innerHTML = `
        <div style="background:#fff; width:100%; max-width:600px; border-radius:12px; padding:20px; position:relative; font-family:'Poppins',sans-serif; max-height:85vh; overflow-y:auto; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
            <button id="closeQuickModal" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:24px; cursor:pointer; color:#555;">&times;</button>
            
            <div style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:15px; align-items:center;">
                <img src="${safe(imgSrc)}" alt="${safe(product.name)}" style="width:160px; height:160px; object-fit:cover; border-radius:10px; border:1px solid #eee;" onerror="this.src='raw_peanuts.png';">
                <div style="flex:1; min-width:200px;">
                    <h2 style="margin:0 0 8px; color:#4A3425; font-size:20px;">${safe(product.name)}</h2>
                    <p style="color:#666; font-size:13px; margin-bottom:10px;">${safe(product.description || 'Organic fresh store product')}</p>
                    ${priceDisplayHTML}
                    
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label style="font-weight:600; font-size:14px;">Qty:</label>
                        <input type="number" id="popupQty" value="1" min="1" max="50" style="width:60px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center;">
                        <button id="popupAddToCartBtn" style="background:#2e7d32; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:600; cursor:pointer;">Add to Cart</button>
                    </div>
                </div>
            </div>

            <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">

            <div>
                <h3 style="color:#4A3425; margin-bottom:10px; font-size:15px;">Customer Reviews</h3>
                <div id="latestReviewsList" style="margin-bottom:15px;">
                    <p style="color:#888; font-size:12px;">Loading reviews...</p>
                </div>

                <div style="background:#FAF4EB; padding:12px; border-radius:8px;">
                    <h4 style="margin:0 0 8px; font-size:13px; color:#4A3425;">Write a Review</h4>
                    <form id="submitReviewForm">
                        <input type="text" id="revName" placeholder="Your Name" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px; box-sizing:border-box;">
                        <select id="revRating" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px;">
                            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value="4">⭐⭐⭐⭐ (4/5)</option>
                            <option value="3">⭐⭐⭐ (3/5)</option>
                            <option value="2">⭐⭐ (2/5)</option>
                            <option value="1">⭐ (1/5)</option>
                        </select>
                        <textarea id="revComment" placeholder="Write feedback..." required rows="2" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:6px; box-sizing:border-box;"></textarea>
                        <button type="submit" style="background:#4A3425; color:#fff; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-size:12px;">Submit Review</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeQuickModal").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    document.getElementById("popupAddToCartBtn").onclick = () => {
        const qty = parseInt(document.getElementById("popupQty").value) || 1;
        addToCart({ ...product, price: finalPrice }, qty);
        modal.remove();
    };

    fetchAndDisplayReviews(pId);

    document.getElementById("submitReviewForm").onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById("revName").value.trim();
        const rating = document.getElementById("revRating").value;
        const comment = document.getElementById("revComment").value.trim();

        if (!db) return alert("Database offline.");

        try {
            await db.collection("reviews").add({
                productId: pId,
                productName: product.name,
                name: name,
                rating: rating,
                review: comment,
                status: "Approved",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Thank you! Review submitted.");
            document.getElementById("submitReviewForm").reset();
            fetchAndDisplayReviews(pId);
        } catch (err) {
            console.error(err);
            alert("Error submitting review.");
        }
    };
}

async function fetchAndDisplayReviews(productId) {
    const list = document.getElementById("latestReviewsList");
    if (!list) return;

    if (!db) {
        list.innerHTML = `<p style="font-size:12px; color:#888;">Offline mode.</p>`;
        return;
    }

    try {
        const snap = await db.collection("reviews").where("productId", "==", productId).get();
        const reviews = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => (r.status || "Approved") === "Approved")
            .slice(-4)
            .reverse();

        if (!reviews.length) {
            list.innerHTML = `<p style="font-size:12px; color:#888;">No reviews yet. Be the first to review!</p>`;
            return;
        }

        list.innerHTML = reviews.map(r => `
            <div style="border-bottom:1px solid #f0f0f0; padding:6px 0;">
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <strong>${safe(r.name || "Customer")}</strong>
                    <span style="color:#fbc02d;">★ ${safe(r.rating || 5)}/5</span>
                </div>
                <p style="margin:2px 0 0; font-size:12px; color:#555;">${safe(r.review || r.comment || "")}</p>
            </div>
        `).join("");
    } catch (e) {
        list.innerHTML = `<p style="font-size:12px; color:#888;">Reviews could not be loaded.</p>`;
    }
}

// ==========================================
// 4. SHOP PAGE DYNAMIC RENDERER
// ==========================================
function renderShopPage() {
    const container = document.getElementById("sn_products_grid");
    if (!container) return;

    function renderCards(prods) {
        container.innerHTML = "";
        if (!prods.length) {
            container.innerHTML = "<p style='padding:20px; text-align:center; grid-column:1/-1;'>No products found.</p>";
            return;
        }

        prods.forEach(product => {
            const card = document.createElement("div");
            card.className = "sn-card-item";
            card.style.cursor = "pointer";

            const priceShow = product.finalPrice || product.price || 0;
            const imgSrc = product.image || 'raw_peanuts.png';

            card.innerHTML = `
                <div class="sn-card-img" style="background-image: url('${imgSrc}');"></div>
                <div class="sn-card-details">
                    <h3 class="sn-card-title">${safe(product.name)}</h3>
                    <p class="sn-card-desc">${safe(product.description || '1kg Organic fresh product')}</p>
                    <div class="sn-card-price">Rs.${priceShow}</div>
                    <div class="sn-card-rating">
                        <i class="fa-solid fa-star"></i>
                        <span>(5.0)rating</span>
                    </div>
                    <button class="sn-cart-btn add-to-cart">Add to Cart</button>
                </div>
            `;

            card.onclick = (e) => {
                if (e.target.classList.contains("add-to-cart") || e.target.tagName === "BUTTON") {
                    e.stopPropagation();
                    addToCart(product);
                } else {
                    openProductModal(product);
                }
            };

            container.appendChild(card);
        });
    }

    if (db) {
        db.collection("products").onSnapshot(snap => {
            if (!snap.empty) {
                dbProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                renderCards(dbProducts);
            } else {
                renderCards(DEFAULT_PRODUCTS);
            }
        }, () => renderCards(DEFAULT_PRODUCTS));
    } else {
        renderCards(DEFAULT_PRODUCTS);
    }
}

// ==========================================
// 5. GLOBAL CLICK LISTENERS & CATEGORIES
// ==========================================
function setupGlobalClickListeners() {
    document.addEventListener("click", (e) => {
        // Index Page Cards (.image_box)
        const indexBox = e.target.closest(".products_section .image_box");
        if (indexBox) {
            const name = indexBox.querySelector("#product_name")?.textContent.trim() || "";
            const matched = DEFAULT_PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase()) || {
                id: name.toLowerCase().replace(/\s+/g, "-"),
                name: name,
                price: 350,
                image: "raw_peanuts.png",
                description: "Organic fresh product"
            };

            if (e.target.closest(".add-to-cart") || e.target.tagName === "BUTTON") {
                addToCart(matched);
            } else {
                openProductModal(matched);
            }
            return;
        }

        // Wholesale Section (.wholesale_peanuts)
        const wholesaleSec = e.target.closest(".wholesale_peanuts");
        if (wholesaleSec) {
            const nameText = wholesaleSec.querySelector("#product_name")?.textContent.trim() || "";
            const isAlmond = nameText.toLowerCase().includes("almond");

            let wholesaleImg = isAlmond ? "raw-almond.png" : "raw_peanuts.png";
            const imgDiv = wholesaleSec.querySelector(".almonds_pic, .peanuts_pic");
            if (imgDiv) {
                const bgStyle = window.getComputedStyle(imgDiv).backgroundImage;
                if (bgStyle && bgStyle !== "none") {
                    const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1]) wholesaleImg = match[1];
                }
            }

            const wholesaleObj = {
                id: isAlmond ? "wholesale-raw-almonds" : "wholesale-raw-peanuts",
                name: isAlmond ? "Raw Almonds" : "Raw Peanuts",
                price: 5000,
                discount: 0,
                image: wholesaleImg,
                description: `10kg Organic raw ${isAlmond ? "almonds" : "peanuts"} direct from our farm`
            };

            if (e.target.closest(".add-2-cart") || e.target.tagName === "BUTTON") {
                addToCart(wholesaleObj);
            } else {
                openProductModal(wholesaleObj);
            }
            return;
        }
    });
}

function setupCategories() {
    document.querySelectorAll(".categories_section .item, .catergories-menu .item").forEach(item => {
        item.style.cursor = "pointer";
        item.onclick = () => {
            const cat = item.textContent.trim().toLowerCase();
            const matched = getAllProducts().find(p => p.name.toLowerCase().includes(cat));

            if (matched) {
                openProductModal(matched);
            } else {
                window.location.href = "shop.html";
            }
        };
    });
}

// ==========================================
// 6. SEARCH BAR WITH DROPDOWN LIST & CLICKABLE POPUP
// ==========================================
function setupSearch() {
    document.addEventListener("input", (e) => {
        if (e.target.matches(".search_bar input, input.input, .search_bar .input")) {
            const query = e.target.value.toLowerCase().trim();
            const searchContainer = e.target.closest(".search_bar");

            if (!searchContainer) return;

            searchContainer.style.position = "relative";

            let dropdown = searchContainer.querySelector(".search-dropdown-menu");
            if (!dropdown) {
                dropdown = document.createElement("div");
                dropdown.className = "search-dropdown-menu";
                dropdown.style.cssText = "position:absolute; top:100%; left:0; width:100%; background:#ffffff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.18); max-height:280px; overflow-y:auto; z-index:999999; border:1px solid #D8C5AE; margin-top:5px;";
                searchContainer.appendChild(dropdown);
            }

            if (!query) {
                dropdown.style.display = "none";
                dropdown.innerHTML = "";
                return;
            }

            const allProducts = getAllProducts();
            const matched = allProducts.filter(p => p.name.toLowerCase().includes(query));

            if (matched.length === 0) {
                dropdown.innerHTML = `<div style="padding:12px; font-size:12px; color:#888; text-align:center;">No matching products found</div>`;
            } else {
                dropdown.innerHTML = matched.map((product) => {
                    const origPrice = Number(product.price || 0);
                    const disc = Number(product.discount || 0);
                    const finalPrice = product.finalPrice ? Number(product.finalPrice) : (disc > 0 ? origPrice - (origPrice * disc / 100) : origPrice);

                    return `
                    <div class="search-item-row" style="display:flex; align-items:center; gap:12px; padding:10px 12px; cursor:pointer; border-bottom:1px solid #f0f0f0; transition:background 0.2s;" onmouseover="this.style.background='#FAF4EB'" onmouseout="this.style.background='#ffffff'">
                        <img src="${safe(product.image || 'raw_peanuts.png')}" style="width:38px; height:38px; object-fit:cover; border-radius:6px; border:1px solid #eee;" onerror="this.src='raw_peanuts.png';">
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:600; color:#4A3425; margin-bottom:2px;">${safe(product.name)}</div>
                            <div style="font-size:12px; color:#2e7d32; font-weight:700;">
                                ${disc > 0 ? `<span style="text-decoration:line-through; color:#888; font-size:11px; margin-right:4px;">${money(origPrice)}</span>` : ''}
                                ${money(finalPrice)}
                            </div>
                        </div>
                    </div>
                `;
                }).join("");

                dropdown.querySelectorAll(".search-item-row").forEach((itemEl, idx) => {
                    itemEl.onclick = (evt) => {
                        evt.stopPropagation();
                        dropdown.style.display = "none";
                        e.target.value = "";
                        openProductModal(matched[idx]);
                    };
                });
            }

            dropdown.style.display = "block";
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search_bar")) {
            document.querySelectorAll(".search-dropdown-menu").forEach(d => d.style.display = "none");
        }
    });
}

// ==========================================
// 7. CART PAGE EXECUTION (FULL ADDRESS MULTI-KEY SAVING FIX)
// ==========================================
function setupCartPage() {
    const list = document.getElementById("cartItems");
    if (!list) return;

    const paymentSelect = document.getElementById("paymentMethod");
    const bankBox = document.getElementById("bankDetailsBox");
    const checkoutForm = document.getElementById("checkoutForm");

    function renderCart() {
        const cart = getCart();
        list.innerHTML = "";

        if (!cart.length) {
            list.innerHTML = `
                <div style="padding:40px 20px; text-align:center;">
                    <i class="fa-solid fa-basket-shopping" style="font-size:3rem; color:#ccc; margin-bottom:10px;"></i>
                    <h3 style="margin:10px 0 5px; color:#4A3425; font-family:'Poppins',sans-serif;">Your Cart is Empty</h3>
                    <p style="color:#777; font-size:14px; margin-bottom:15px; font-family:'Poppins',sans-serif;">Add some delicious nuts to your cart!</p>
                    <a href="shop.html" style="color:#2e7d32; font-weight:700; text-decoration:none; font-size:14px; font-family:'Poppins',sans-serif;">← Start Shopping</a>
                </div>`;
        } else {
            cart.forEach(item => {
                const row = document.createElement("div");
                row.className = "cart-product-item";
                row.style.cssText = "display:flex; align-items:center; gap:15px; padding:15px 0; border-bottom:1px solid #eee; font-family:'Poppins',sans-serif;";

                const imgSrc = item.image || "raw_peanuts.png";
                const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);

                row.innerHTML = `
                    <img src="${safe(imgSrc)}" alt="${safe(item.name)}" style="width:65px; height:65px; object-fit:cover; border-radius:8px; border:1px solid #ddd; min-width:65px;" onerror="this.src='raw_peanuts.png';">
                    <div style="flex:1;">
                        <h4 style="margin:0 0 5px; color:#4A3425; font-size:15px; font-weight:600;">${safe(item.name)}</h4>
                        <div style="color:#2e7d32; font-size:14px; font-weight:700;">${money(itemTotal)}</div>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                            <button type="button" class="btn-minus" style="padding:2px 10px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-weight:bold;">-</button>
                            <span style="font-weight:600; font-size:14px; min-width:20px; text-align:center;">${item.quantity}</span>
                            <button type="button" class="btn-plus" style="padding:2px 10px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
                            <button type="button" class="btn-remove" style="background:none; border:none; color:#d32f2f; margin-left:auto; cursor:pointer; font-size:16px;" title="Remove Item"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>`;

                row.querySelector(".btn-minus").onclick = () => updateQty(item.id, -1);
                row.querySelector(".btn-plus").onclick = () => updateQty(item.id, 1);
                row.querySelector(".btn-remove").onclick = () => removeItem(item.id);

                list.appendChild(row);
            });
        }
        renderTotals();
    }

    function updateQty(id, amt) {
        let cart = getCart();
        const idx = cart.findIndex(i => i.id === id);
        if (idx > -1) {
            cart[idx].quantity += amt;
            if (cart[idx].quantity <= 0) {
                cart.splice(idx, 1);
            }
        }
        saveCart(cart);
        renderCart();
    }

    function removeItem(id) {
        let cart = getCart().filter(i => i.id !== id);
        saveCart(cart);
        renderCart();
    }

    function getOrderTotals() {
        const cart = getCart();
        const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
        const payMethod = paymentSelect ? paymentSelect.value : "cod";
        const shipFee = payMethod === "bank" ? 200 : 250;
        const shipping = subtotal === 0 ? 0 : (subtotal >= 3000 ? 0 : shipFee);
        return { subtotal, shipping, total: subtotal + shipping, payMethod };
    }

    function renderTotals() {
        const t = getOrderTotals();
        const subEl = document.querySelector(".subtotal-value");
        const shipEl = document.querySelector(".shipping-value");
        const totEl = document.querySelector(".total-value");

        if (subEl) subEl.textContent = money(t.subtotal);
        if (shipEl) shipEl.textContent = t.shipping === 0 && t.subtotal > 0 ? "FREE" : money(t.shipping);
        if (totEl) totEl.textContent = money(t.total);

        const checkoutBtn = document.querySelector(".checkout-btn");
        if (checkoutBtn) checkoutBtn.disabled = getCart().length === 0;
    }

    if (paymentSelect) {
        paymentSelect.onchange = () => {
            if (bankBox) bankBox.style.display = paymentSelect.value === "bank" ? "block" : "none";
            renderTotals();
        };
    }

    if (checkoutForm) {
        checkoutForm.onsubmit = async (e) => {
            e.preventDefault();
            const cart = getCart();

            if (!cart.length) {
                alert("Your cart is empty!");
                return;
            }

            const btn = checkoutForm.querySelector(".checkout-btn");
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Placing Order...";
            }

            try {
                const t = getOrderTotals();
                const orderNum = "SN-" + Date.now().toString().slice(-6);

                // Fetch Form Input Values
                const fullName = document.getElementById("fullName")?.value.trim() || "";
                const email = document.getElementById("email")?.value.trim() || "";
                const phone = document.getElementById("phone")?.value.trim() || "";
                const country = document.getElementById("country")?.value || "Pakistan";
                const streetAddress = document.getElementById("address")?.value.trim() || "";
                const city = document.getElementById("city")?.value.trim() || "";
                const state = document.getElementById("state")?.value.trim() || "";
                const postalCode = document.getElementById("zip")?.value.trim() || "";
                const transactionId = document.getElementById("transactionId")?.value.trim() || "";

                // Construct complete readable address string
                const addressParts = [streetAddress, city, state, postalCode, country].filter(Boolean);
                const fullAddressFormatted = addressParts.join(", ");

                const orderObj = {
                    orderNumber: orderNum,
                    orderId: orderNum,

                    // Customer Meta
                    name: fullName,
                    customerName: fullName,
                    email: email,
                    customerEmail: email,
                    phone: phone,
                    customerPhone: phone,

                    // Comprehensive Full Address String across all common database keys
                    address: fullAddressFormatted,
                    fullAddress: fullAddressFormatted,
                    customerAddress: fullAddressFormatted,
                    shippingAddress: fullAddressFormatted,
                    deliveryAddress: fullAddressFormatted,

                    // Individual Component Keys
                    street: streetAddress,
                    streetAddress: streetAddress,
                    city: city,
                    state: state,
                    province: state,
                    zip: postalCode,
                    zipCode: postalCode,
                    postalCode: postalCode,
                    country: country,

                    // Nested Address Structure (for admin dashboards reading nested objects)
                    addressDetails: {
                        street: streetAddress,
                        city: city,
                        state: state,
                        zip: postalCode,
                        country: country,
                        fullAddress: fullAddressFormatted
                    },
                    shippingDetails: {
                        name: fullName,
                        email: email,
                        phone: phone,
                        address: fullAddressFormatted,
                        street: streetAddress,
                        city: city,
                        state: state,
                        zip: postalCode,
                        country: country
                    },

                    // Payment & Cart Info
                    paymentMethod: t.payMethod,
                    transactionId: transactionId,
                    items: cart,
                    products: cart,
                    subtotal: t.subtotal,
                    shipping: t.shipping,
                    totalAmount: t.total,
                    total: t.total,
                    status: "Pending",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (db) {
                    await db.collection("orders").add(orderObj);
                }

                localStorage.removeItem("saghriNutsCart");
                updateCartCount();
                renderCart();
                checkoutForm.reset();

                if (bankBox) bankBox.style.display = "none";

                alert(`🎉 Order Placed Successfully!\n\nOrder Number: #${orderNum}\nThank you for shopping with Saghri Nuts!`);
            } catch (err) {
                console.error("Order error:", err);
                alert("Order failed. Please check internet connection.");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Place Order";
                }
            }
        };
    }

    renderCart();
}

function toggleMenu() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) {
        navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
        if (navLinks.style.display === "flex") navLinks.style.flexDirection = "column";
    }
}

// ==========================================
// 8. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderShopPage();
    setupGlobalClickListeners();
    setupCategories();
    setupSearch();
    setupCartPage();
});

window.toggleMenu = toggleMenu;