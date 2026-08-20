// ==========================================
// 1. FIREBASE INITIALIZATION & CONFIG
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyD6xns4wo0MfgeO8katl-0_sPIGKc2DAOo",
    authDomain: "nuts-store-b519c.firebaseapp.com",
    projectId: "nuts-store-b519c",
    storageBucket: "nuts-store-b519c.firebasestorage.app",
    messagingSenderId: "862119051910",
    appId: "1:862119051910:web:3bae190c8c7bbff7c94707"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let orders = [], products = [], customers = [], reviews = [];

const imageMapping = {
    "salted-peanuts": "salted_peanuts.png",
    "roasted-peanuts": "roasted_peanuts.png",
    "raw-peanuts": "raw_peanuts.png",
    "peanut-butter": "butter.png",
    "salted-almonds": "saltes-almonds.png",
    "roasted-almonds": "roasted-almond.png",
    "raw-almonds": "raw-almond.png",
    "honey-almonds": "honey-almond.png"
};

const defaultProducts = [
    { id: "salted-peanuts", name: "Salted Peanuts", price: 600, discount: 0, image: "salted_peanuts.png", stock: 100 },
    { id: "roasted-peanuts", name: "Roasted Peanuts", price: 500, discount: 0, image: "roasted_peanuts.png", stock: 100 },
    { id: "salted-almonds", name: "Salted Almonds", price: 600, discount: 0, image: "saltes-almonds.png", stock: 100 },
    { id: "peanut-butter", name: "Peanut Butter", price: 850, discount: 0, image: "butter.png", stock: 100 },
    { id: "raw-peanuts", name: "Raw Peanuts", price: 350, discount: 0, image: "raw_peanuts.png", stock: 100 },
    { id: "raw-almonds", name: "Raw Almonds", price: 350, discount: 0, image: "raw-almond.png", stock: 100 },
    { id: "honey-almonds", name: "Honey Almonds", price: 850, discount: 0, image: "honey-almond.png", stock: 100 },
    { id: "roasted-almonds", name: "Roasted Almonds", price: 500, discount: 0, image: "roasted-almond.png", stock: 100 }
];

function safe(v) {
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function money(v) {
    return "Rs. " + Number(v || 0).toLocaleString("en-PK");
}

// Image Resizer Helper to prevent Firestore Payload Limits
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const maxWidth = 300;
            const scaleSize = maxWidth / img.width;
            
            canvas.width = maxWidth;
            canvas.height = img.height * scaleSize;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            callback(compressedBase64);
        };
    };
}

// ==========================================
// 2. DOM LOAD & AUTHENTICATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById("loginPopup")?.remove();
            startAdmin();
        } else {
            showLogin();
        }
    });

    setupMenu();
    setupAdminUser();
    setupModalControls();
});

function showLogin() {
    if (document.getElementById("loginPopup")) return;

    const p = document.createElement("div");
    p.id = "loginPopup";
    p.innerHTML = `
    <div class="login-overlay">
        <div class="login-box">
            <h2>Admin Login</h2>
            <p style="color:#777; font-size:12px; margin-bottom:15px;">Login to manage Saghri Nuts</p>
            <input id="adminEmail" type="email" placeholder="Admin Email">
            <input id="adminPassword" type="password" placeholder="Password">
            <button id="loginButton">Login</button>
            <p id="loginError"></p>
        </div>
    </div>`;

    document.body.appendChild(p);
    document.getElementById("loginButton").onclick = login;
    document.getElementById("adminPassword").onkeydown = e => { if (e.key === "Enter") login(); };
}

async function login() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const error = document.getElementById("loginError");
    const btn = document.getElementById("loginButton");

    if (!email || !password) {
        error.textContent = "Please enter email and password.";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Logging in...";

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
        console.error(e);
        error.textContent = "Invalid email or password.";
        btn.disabled = false;
        btn.textContent = "Login";
    }
}

function startAdmin() {
    loadProducts();
    listenOrders();
    listenReviews();
}

// ==========================================
// 3. MODALS & FORMS HANDLING (ADD PRODUCT)
// ==========================================
function setupModalControls() {
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productForm');

    if (addProductBtn) {
        addProductBtn.onclick = () => {
            if (productForm) productForm.reset();
            if (productModal) productModal.style.display = 'flex';
        };
    }

    if (closeProductModal) {
        closeProductModal.onclick = () => {
            if (productModal) productModal.style.display = 'none';
        };
    }

    if (productForm) {
        productForm.onsubmit = async function (e) {
            e.preventDefault();

            const submitBtn = productForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Saving Product...";
            }

            const nameInput = document.getElementById('prodName');
            const priceInput = document.getElementById('prodPrice');

            if (!nameInput || !priceInput || !nameInput.value.trim() || !priceInput.value) {
                alert("Please enter Product Name and Price!");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Save Product";
                }
                return;
            }

            const name = nameInput.value.trim();
            const price = Number(priceInput.value);
            const discount = Number(document.getElementById('prodDiscount')?.value || 0);
            const fileInput = document.getElementById('prodImageFile');
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;

            const docId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const finalPrice = discount > 0 ? price - (price * discount / 100) : price;

            const saveDoc = async (imgData) => {
                try {
                    await db.collection("products").doc(docId).set({
                        id: docId,
                        name: name,
                        price: price,
                        discount: discount,
                        finalPrice: finalPrice,
                        image: imgData,
                        stock: 100,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    alert("✅ Success: Product is permanently saved in Database!");
                    
                    // Pop-up ko khud ba khud band karna
                    if (productModal) productModal.style.display = 'none';
                    productForm.reset();

                } catch (err) {
                    console.error("Save Error:", err);
                    alert("❌ Error: Product is not saved! " + err.message);
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Save Product";
                    }
                }
            };

            if (file) {
                compressImage(file, (compressedBase64) => {
                    saveDoc(compressedBase64);
                });
            } else {
                const fallbackImg = imageMapping[docId] || "raw-almond.png";
                saveDoc(fallbackImg);
            }
        };
    }
}

// ==========================================
// 4. PRODUCTS MANAGEMENT
// ==========================================
async function loadProducts() {
    try {
        const snap = await db.collection("products").get();
        if (snap.empty) {
            for (const p of defaultProducts) {
                const discount = Number(p.discount || 0);
                const finalPrice = p.price - (p.price * discount / 100);
                await db.collection("products").doc(p.id).set({
                    ...p,
                    finalPrice: finalPrice
                });
            }
        }
        listenProducts();
    } catch (e) {
        console.error("Products Load Error:", e);
    }
}

function listenProducts() {
    db.collection("products").onSnapshot(snap => {
        products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        displayProducts();
        updateDashboard();
    });
}

function displayProducts() {
    const list = document.getElementById("productList") || document.querySelector(".product-list");
    if (!list) return;

    list.innerHTML = "";

    if (!products.length) {
        list.innerHTML = `<p style="padding:15px; text-align:center;">No products found.</p>`;
        return;
    }

    products.forEach(p => {
        const price = Number(p.price || 0);
        const discount = Number(p.discount || 0);
        const finalPrice = discount > 0 ? price - (price * discount / 100) : price;

        let imgSrc = p.image || imageMapping[p.id] || "raw-almond.png";

        const row = document.createElement("div");
        row.className = "product-row";

        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="${imgSrc}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #D8C5AE;">
                <div>
                    <h3 style="margin:0; font-size:16px; color:#4A3425;">${safe(p.name)}</h3>
                    <p style="margin:3px 0 0; font-size:12px; color:#666;">
                        Stock: ${Number(p.stock || 0)} 
                        ${discount > 0 ? `| <span style="color:#d32f2f; font-weight:600;">${discount}% OFF</span>` : ''}
                    </p>
                </div>
            </div>
            <div style="text-align:right;">
                ${discount > 0 ? `<div style="font-size:12px; text-decoration:line-through; color:#888;">${money(price)}</div>` : ''}
                <strong style="color:#2e7d32; font-size:15px;">${money(finalPrice)}</strong>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
            </div>`;

        list.appendChild(row);
    });
}

async function deleteProduct(id) {
    if (confirm("Permanently delete this product?")) {
        try {
            await db.collection("products").doc(id).delete();
            alert("Product deleted.");
        } catch (e) {
            console.error(e);
            alert("Product delete failed.");
        }
    }
}

// ==========================================
// 5. ORDERS MANAGEMENT & PERMANENT DELETE
// ==========================================
function listenOrders() {
    db.collection("orders").onSnapshot(snap => {
        orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        createCustomers();
        displayOrders();
        updateDashboard();
        updateNotifications();
    }, error => {
        console.error("Orders Listener Error:", error);
    });
}

function displayOrders() {
    const tbody = document.getElementById("ordersTableBody") || document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px">No orders found</td></tr>`;
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement("tr");
        const status = o.status || "Pending";

        tr.innerHTML = `
            <td><strong>#${safe(o.orderNumber || o.id.substring(0, 6))}</strong></td>
            <td>
                <strong>${safe(o.customerName || o.name || "Guest")}</strong><br>
                <small>${safe(o.customerPhone || o.phone || "")}</small>
            </td>
            <td><strong>${money(o.totalAmount || o.total || o.subtotal || 0)}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <select class="order-status" data-id="${o.id}">
                        ${statusOption("Pending", status)}
                        ${statusOption("Confirmed", status)}
                        ${statusOption("Shipped", status)}
                        ${statusOption("Delivered", status)}
                        ${statusOption("Cancelled", status)}
                    </select>
                    <button class="btn btn-primary" onclick="viewOrder('${o.id}')" style="padding:4px 10px; font-size:11px;">View</button>
                    <button class="btn btn-danger" onclick="deleteOrderPermanently('${o.id}')" style="padding:4px 10px; font-size:11px;">Delete</button>
                </div>
            </td>`;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".order-status").forEach(s => {
        s.onchange = () => updateOrderStatus(s.dataset.id, s.value);
    });
}

function statusOption(v, c) {
    return `<option value="${v}" ${v === c ? "selected" : ""}>${v}</option>`;
}

async function updateOrderStatus(id, status) {
    try {
        await db.collection("orders").doc(id).update({
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error(e);
        alert("Order status update failed.");
    }
}

function viewOrder(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;

    document.getElementById("orderDetailsModal")?.remove();

    const items = (o.items || o.orderedProducts || []).map(i => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
            <span><strong>${safe(i.name)}</strong> (Qty: ${Number(i.quantity || i.qty || 1)})</span>
            <strong>${money(Number(i.price || 0) * Number(i.quantity || i.qty || 1))}</strong>
        </div>`).join("");

    const m = document.createElement("div");
    m.id = "orderDetailsModal";
    m.className = "modal";
    m.style.display = "flex";

    m.innerHTML = `
    <div class="modal-content" style="max-width:550px;">
        <span onclick="document.getElementById('orderDetailsModal').remove()" class="close-btn">&times;</span>
        <h3>Order Details</h3>
        <div class="order-details-body" style="background:#f9f6f0; padding:15px; border-radius:8px; margin-bottom:15px;">
            <p><strong>Order ID:</strong> #${safe(o.orderNumber || o.id)}</p>
            <p><strong>Status:</strong> ${safe(o.status || "Pending")}</p>
            <p><strong>Customer Name:</strong> ${safe(o.customerName || o.name || "Guest")}</p>
            <p><strong>Email:</strong> ${safe(o.customerEmail || o.email || "N/A")}</p>
            <p><strong>Phone:</strong> ${safe(o.customerPhone || o.phone || "N/A")}</p>
            <p><strong>Address:</strong> ${safe(o.customerAddress || o.address || "N/A")}</p>
            <p><strong>Payment Method:</strong> ${safe(o.paymentMethod || o.payment || "COD")}</p>
        </div>
        <h4 style="margin-bottom:8px; color:#4A3425;">Ordered Items</h4>
        <div style="max-height:150px; overflow-y:auto; margin-bottom:15px;">
            ${items || "<p>No items details found.</p>"}
        </div>
        <div style="border-top:1px solid #D8C5AE; padding-top:10px; text-align:right;">
            <p style="font-size:16px; font-weight:600; color:#2e7d32;">Total: ${money(o.totalAmount || o.total || 0)}</p>
        </div>
        <div style="margin-top:15px; display:flex; justify-content:space-between;">
            <button class="btn btn-danger" onclick="deleteOrderPermanently('${o.id}'); document.getElementById('orderDetailsModal').remove();">Delete Order</button>
            <button class="btn btn-primary" onclick="document.getElementById('orderDetailsModal').remove()">Close</button>
        </div>
    </div>`;

    document.body.appendChild(m);
}

async function deleteOrderPermanently(id) {
    if (confirm("Are you sure you want to PERMANENTLY delete this order? It cannot be undone.")) {
        try {
            await db.collection("orders").doc(id).delete();
            alert("Order permanently deleted from Firestore and Dashboard.");
        } catch (e) {
            console.error(e);
            alert("Failed to delete order. Error: " + e.message);
        }
    }
}

// ==========================================
// 6. CUSTOMERS & REVIEWS & DASHBOARD
// ==========================================
function createCustomers() {
    const map = {};
    orders.forEach(o => {
        const key = o.customerEmail || o.email || o.customerPhone || o.phone;
        if (!key) return;

        if (!map[key]) {
            map[key] = {
                name: o.customerName || o.name || "Guest",
                email: o.customerEmail || o.email || "N/A",
                phone: o.customerPhone || o.phone || "N/A",
                address: o.customerAddress || o.address || "N/A",
                orders: []
            };
        }
        map[key].orders.push(o);
    });
    customers = Object.values(map);
    
}

function showCustomers() {
    document.getElementById("customerModal")?.remove();

    const m = document.createElement("div");
    m.id = "customerModal";
    m.className = "modal";
    m.style.display = "flex";

    let customerCards = "";
    if (!customers.length) {
        customerCards = "<p>No customers record found from orders.</p>";
    } else {
        customers.forEach(c => {
            customerCards += `
            <div style="border:1px solid #D8C5AE; background:#FAF4EB; border-radius:8px; padding:15px; margin-bottom:12px;">
                <h4 style="color:#4A3425; margin-bottom:5px;">${safe(c.name)}</h4>
                <p style="font-size:12px; color:#57402F;"><strong>Email:</strong> ${safe(c.email)}</p>
                <p style="font-size:12px; color:#57402F;"><strong>Phone:</strong> ${safe(c.phone)}</p>
                <p style="font-size:12px; color:#57402F;"><strong>Address:</strong> ${safe(c.address)}</p>
                <p style="font-size:12px; color:#2e7d32; font-weight:600; margin-top:5px;">Total Orders Placed: ${c.orders.length}</p>
            </div>`;
        });
    }

    m.innerHTML = `
    <div class="modal-content" style="max-width:600px; max-height:80vh; overflow-y:auto;">
        <span onclick="document.getElementById('customerModal').remove()" class="close-btn">&times;</span>
        <h3 style="margin-bottom:15px;">Customer Directory</h3>
        <div>${customerCards}</div>
    </div>`;

    document.body.appendChild(m);
}

function updateDashboard() {
    const pCount = document.getElementById("totalProductsCount");
    const oCount = document.getElementById("totalOrdersCount");
    const cCount = document.getElementById("totalCustomersCount");
    const sCount = document.getElementById("totalSalesCount");

    let sales = 0;
    orders.forEach(o => {
        if (o.status !== "Cancelled") sales += Number(o.totalAmount || o.total || o.subtotal || 0);
    });

    if (pCount) pCount.textContent = products.length;
    if (oCount) oCount.textContent = orders.length;
    if (cCount) cCount.textContent = customers.length;
    if (sCount) sCount.textContent = money(sales);
}

function listenReviews() {
    db.collection("reviews").onSnapshot(snap => {
        reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        displayReviews();
        updateNotifications();
    }, () => console.log("Reviews Collection Syncing."));
}

function displayReviews() {
    const list = document.getElementById("reviewList") || document.querySelector(".review-list");
    if (!list) return;

    list.innerHTML = "";

    if (!reviews.length) {
        list.innerHTML = "<p style='padding:15px;'>No reviews found.</p>";
        return;
    }

    reviews.forEach(r => {
        const row = document.createElement("div");
        row.className = "product-row";

        row.innerHTML = `
            <div>
                <strong>${safe(r.name || r.customerName || "Customer")}</strong>
                <p>${safe(r.review || r.comment || "No comment")}</p>
                <small>Rating: ${safe(r.rating || "N/A")} | Status: ${safe(r.status || "Pending")}</small>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn btn-primary" onclick="updateReview('${r.id}', 'Approved')">Approve</button>
                <button class="btn btn-danger" onclick="deleteReview('${r.id}')">Delete</button>
            </div>`;

        list.appendChild(row);
    });
}

async function updateReview(id, status) {
    try {
        await db.collection("reviews").doc(id).update({ status });
    } catch (e) {
        console.error(e);
    }
}

async function deleteReview(id) {
    if (confirm("Delete this review?")) {
        try {
            await db.collection("reviews").doc(id).delete();
        } catch (e) {
            console.error(e);
        }
    }
}

function updateNotifications() {
    const pendingOrders = orders.filter(o => (o.status || "Pending") === "Pending").length;
    const pendingReviews = reviews.filter(r => (r.status || "Pending") === "Pending").length;
    const total = pendingOrders + pendingReviews;

    const badge = document.querySelector(".notification span");
    if (badge) badge.textContent = total;

    const bell = document.querySelector(".notification");
    if (bell) {
        bell.onclick = () => {
            alert(`Notifications\n\nPending Orders: ${pendingOrders}\nPending Reviews: ${pendingReviews}`);
        };
    }
}

// ==========================================
// 7. MENU NAVIGATION
// ==========================================
function setupMenu() {
    document.querySelectorAll(".admin-menu a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const name = link.textContent.trim().toLowerCase();

            document.querySelectorAll(".admin-menu a").forEach(x => x.classList.remove("active"));
            link.classList.add("active");

            if (name === "dashboard") window.scrollTo({ top: 0, behavior: "smooth" });
            if (name === "products") document.querySelector(".product-list")?.scrollIntoView({ behavior: "smooth" });
            if (name === "orders") document.querySelector("table")?.scrollIntoView({ behavior: "smooth" });
            if (name === "customers") showCustomers();
            if (name === "reviews") document.querySelector("#reviewsSection")?.scrollIntoView({ behavior: "smooth" });
            if (name === "logout") auth.signOut();
        });
    });
}

function setupAdminUser() {
    const admin = document.querySelector(".admin-user");
    if (!admin) return;

    admin.onclick = () => {
        document.getElementById("adminDropdown")?.remove();

        const menu = document.createElement("div");
        menu.id = "adminDropdown";
        menu.style.cssText = "position:fixed;top:65px;right:20px;background:#fff;padding:15px;border-radius:8px;box-shadow:0 5px 20px rgba(0,0,0,.15);z-index:99999;font-size:12px;";

        menu.innerHTML = `
            <strong>Admin Account</strong>
            <p style="color:#666; margin-bottom:10px;">${auth.currentUser ? auth.currentUser.email : ''}</p>
            <button id="logoutBtn" class="btn btn-danger btn-block">Logout</button>`;

        document.body.appendChild(menu);
        document.getElementById("logoutBtn").onclick = () => auth.signOut();
    };
}

// Global functions for inline HTML click events
window.deleteProduct = deleteProduct;
window.viewOrder = viewOrder;
window.deleteOrderPermanently = deleteOrderPermanently;
window.showCustomers = showCustomers;
window.updateReview = updateReview;
window.deleteReview = deleteReview;