// Student Logic

// State
let currentShop = null;
let cartFiles = []; // { id, name, pages, type: 'pdf', config: { color: 'bw', side: 'single' } }
let currentOrderId = null;

// DOM Elements
const views = {
    shops: document.getElementById('view-shops'),
    order: document.getElementById('view-order'),
    success: document.getElementById('view-success')
};

const shopContainer = document.getElementById('shops-grid');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileConfigList = document.getElementById('file-config-list');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('btn-checkout');
const shopSearch = document.getElementById('shop-search');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderShops();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    document.getElementById('btn-back-shops').addEventListener('click', () => switchView('shops'));

    // Search
    shopSearch.addEventListener('input', (e) => renderShops(e.target.value));

    // File Upload
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--bg-input)'; });
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Checkout
    checkoutBtn.addEventListener('click', handleCheckout);
}

function switchView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    if (viewName === 'shops') {
        currentShop = null;
        cartFiles = [];
        updateCartUI();
    }
}

// --- Shop Listing ---

function renderShops(filter = '') {
    const shops = window.db.getShops();
    shopContainer.innerHTML = '';

    const filtered = shops.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(shop => {
        const isOpen = shop.status === 'open' || shop.status === 'busy';
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="flex-between mb-4">
                <div class="badge ${shop.status === 'open' ? 'badge-green' : (shop.status === 'busy' ? 'badge-yellow' : 'badge-danger')}">
                    ${shop.status}
                </div>
                <span class="text-sm text-muted"> <i class="fa-solid fa-star text-warning"></i> 4.8</span>
            </div>
            <h3>${shop.name}</h3>
            <p class="text-sm">B&W: ₹${shop.rateCard.bw_single} | Color: ₹${shop.rateCard.color_single}</p>
            <button class="btn btn-primary w-full mt-4" ${!isOpen ? 'disabled' : ''} onclick="selectShop('${shop.id}')">
                ${isOpen ? 'Order Print' : 'Closed'}
            </button>
        `;
        shopContainer.appendChild(card);
    });
}

window.selectShop = (shopId) => {
    currentShop = window.db.getShopById(shopId);
    if (!currentShop) return;

    document.getElementById('selected-shop-name').innerText = currentShop.name;
    document.querySelector('.rate-card-display').innerHTML = `
        <div class="grid-2 text-sm text-muted" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            <div>B&W Single: <b>₹${currentShop.rateCard.bw_single}</b></div>
            <div>B&W Dual: <b>₹${currentShop.rateCard.bw_double}</b></div>
            <div>Color Single: <b>₹${currentShop.rateCard.color_single}</b></div>
            <div>Color Dual: <b>₹${currentShop.rateCard.color_double}</b></div>
        </div>
    `;

    switchView('order');
};

// --- File Handling ---

function handleDrop(e) {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--bg-input)';
    processFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    processFiles(e.target.files);
    fileInput.value = ''; // Reset
}

function processFiles(fileList) {
    Array.from(fileList).forEach(file => {
        // Simulate page count (mock)
        const mockPages = Math.floor(Math.random() * 20) + 1;

        const fileObj = {
            id: Date.now() + Math.random(),
            name: file.name,
            pages: mockPages,
            config: {
                color: 'bw', // bw, color
                side: 'single', // single, double
                orientation: 'portrait' // portrait, landscape
            }
        };
        cartFiles.push(fileObj);
    });
    renderFileConfigs();
    updateCartUI();
}

function renderFileConfigs() {
    fileConfigList.innerHTML = '';
    cartFiles.forEach((file, index) => {
        const el = document.createElement('div');
        el.className = 'card flex-between';
        el.style.padding = '16px';
        el.innerHTML = `
            <div style="flex: 1;">
                <h4 style="font-size: 1rem; margin-bottom: 4px;">${file.name}</h4>
                <p class="text-sm mb-4">${file.pages} Pages • <span class="text-primary">Detected</span></p>
                
                <div class="flex-center gap-4" style="justify-content: flex-start; flex-wrap: wrap;">
                    <select class="input-field" style="width: auto; padding: 6px;" onchange="updateFileConfig(${index}, 'color', this.value)">
                        <option value="bw" ${file.config.color === 'bw' ? 'selected' : ''}>Black & White</option>
                        <option value="color" ${file.config.color === 'color' ? 'selected' : ''}>Color</option>
                    </select>
                    
                    <select class="input-field" style="width: auto; padding: 6px;" onchange="updateFileConfig(${index}, 'side', this.value)">
                        <option value="single" ${file.config.side === 'single' ? 'selected' : ''}>Single Sided</option>
                        <option value="double" ${file.config.side === 'double' ? 'selected' : ''}>Back to Back</option>
                    </select>

                     <select class="input-field" style="width: auto; padding: 6px;" onchange="updateFileConfig(${index}, 'orientation', this.value)">
                        <option value="portrait" ${file.config.orientation === 'portrait' ? 'selected' : ''}>Portrait</option>
                        <option value="landscape" ${file.config.orientation === 'landscape' ? 'selected' : ''}>Landscape</option>
                    </select>
                </div>
            </div>
            <div class="text-right">
                <button class="btn btn-danger" style="padding: 8px;" onclick="removeFile(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        fileConfigList.appendChild(el);
    });
}

window.updateFileConfig = (index, key, value) => {
    cartFiles[index].config[key] = value;
    updateCartUI();
};

window.removeFile = (index) => {
    cartFiles.splice(index, 1);
    renderFileConfigs();
    updateCartUI();
};

// --- Cart & Checkout ---

function calculatePrice(file) {
    let key = `${file.config.color}_${file.config.side}`; // e.g. bw_single
    // Fix key mapping if needed (double -> double in rate card?)
    // data.js keys: bw_single, bw_double, color_single, color_double
    // config values: single, double.
    // So key mapping is correct if exact match.

    let rate = currentShop.rateCard[key] || 0;

    // For back to back, usually rate is per sheet (2 pages) or per page side?
    // User data says "bw_double: 1.5 // per side".
    // So distinct rate per page.
    return file.pages * rate;
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cartFiles.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted">No files added.</p>';
        checkoutBtn.disabled = true;
    } else {
        checkoutBtn.disabled = false;
        cartFiles.forEach(file => {
            const price = calculatePrice(file);
            total += price;

            const div = document.createElement('div');
            div.className = 'flex-between text-sm';
            div.innerHTML = `
                <span style="max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                <span>₹${price.toFixed(2)}</span>
            `;
            cartItemsContainer.appendChild(div);
        });
    }

    cartTotalEl.innerText = '₹' + total.toFixed(2);
    document.getElementById('cart-count').innerText = cartFiles.length;
    document.getElementById('cart-indicator').classList.toggle('hidden', cartFiles.length === 0);
}

function handleCheckout() {
    if (!currentShop || cartFiles.length === 0) return;

    // Simulate Payment
    const total = cartFiles.reduce((sum, f) => sum + calculatePrice(f), 0);
    const confirmMsg = `Total Amount: ₹${total.toFixed(2)}\n\nProceed to mock payment?`;

    if (confirm(confirmMsg)) {
        // Create Order
        const orderData = {
            shopId: currentShop.id,
            files: cartFiles,
            totalAmount: total,
            studentName: 'Demo Student' // Mock Auth
        };

        const newOrder = window.db.createOrder(orderData);

        // Show Success
        document.getElementById('success-order-code').innerText = '#' + newOrder.id.split('-')[1]; // Just show the backend part
        switchView('success');
    }
}
