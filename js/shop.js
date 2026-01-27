// Shop Dashboard Logic

let currentShopId = null;

// DOM Elements
const shopSelector = document.getElementById('shop-selector');
const ordersTable = document.getElementById('orders-table-body');
const printOverlay = document.getElementById('print-overlay');

// Stats
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statRevenue = document.getElementById('stat-revenue');

document.addEventListener('DOMContentLoaded', () => {
    loadShopAndInit();
});

function loadShopAndInit() {
    const shops = window.db.getShops();

    shops.forEach(shop => {
        const opt = document.createElement('option');
        opt.value = shop.id;
        opt.innerText = shop.name;
        shopSelector.appendChild(opt);
    });

    currentShopId = shops[0].id; // Default
    shopSelector.value = currentShopId;

    shopSelector.addEventListener('change', (e) => {
        currentShopId = e.target.value;
        renderOrders();
    });

    // Auto Refresh every 5 secons (only if viewing orders)
    renderOrders();
    setInterval(() => {
        if (!document.getElementById('view-orders').classList.contains('hidden')) {
            renderOrders();
        }
    }, 5000);

    // Nav Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#') e.preventDefault();

            // Simple routing based on text content
            const text = link.innerText.trim();
            if (text.includes('Orders')) switchView('orders');
            if (text.includes('Settings')) switchView('settings');

            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function switchView(viewName) {
    document.getElementById('view-orders').classList.add('hidden');
    document.getElementById('view-settings').classList.add('hidden');

    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    if (viewName === 'settings') loadSettings();
    if (viewName === 'orders') renderOrders();
}

// --- Settings Logic ---
window.loadSettings = () => {
    const shop = window.db.getShopById(currentShopId);
    if (!shop) return;

    document.getElementById('rate-bw-single').value = shop.rateCard.bw_single;
    document.getElementById('rate-bw-double').value = shop.rateCard.bw_double;
    document.getElementById('rate-color-single').value = shop.rateCard.color_single;
    document.getElementById('rate-color-double').value = shop.rateCard.color_double;
};

window.saveSettings = () => {
    const newRates = {
        bw_single: parseFloat(document.getElementById('rate-bw-single').value),
        bw_double: parseFloat(document.getElementById('rate-bw-double').value),
        color_single: parseFloat(document.getElementById('rate-color-single').value),
        color_double: parseFloat(document.getElementById('rate-color-double').value)
    };

    window.db.updateShopRates(currentShopId, newRates);
    alert('Rate Card Updated Automatically!');
};

function renderOrders() {
    const orders = window.db.getOrdersForShop(currentShopId);

    // Update Stats
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'ready').length; // ready is effectively 'done printing'
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    statPending.innerText = pending;
    statCompleted.innerText = completed;
    statRevenue.innerText = '₹' + revenue.toFixed(2);

    // Update Table
    ordersTable.innerHTML = '';

    if (orders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No orders yet.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');

        // Format Files String
        const fileSummary = order.files.map(f => `${f.name} (${f.config.color}, ${f.config.side})`).join('<br>');

        let actionBtn = '';
        if (order.status === 'pending') {
            actionBtn = `<button class="btn btn-primary text-sm" onclick="triggerMagicPrint('${order.id}')"><i class="fa-solid fa-print"></i> Magic Print</button>`;
        } else if (order.status === 'ready') {
            actionBtn = `<button class="btn btn-secondary text-sm" onclick="markCollected('${order.id}')"><i class="fa-solid fa-check"></i> Mark Collected</button>`;
        } else {
            actionBtn = `<span class="text-muted text-sm">Archived</span>`;
        }

        // Status Badge Style
        let badgeClass = 'badge-yellow';
        if (order.status === 'ready') badgeClass = 'badge-blue';
        if (order.status === 'completed') badgeClass = 'badge-green';

        tr.innerHTML = `
            <td style="font-family: monospace;">#${order.id.split('-')[1]}</td>
            <td>${order.studentName}</td>
            <td class="text-sm text-muted">${fileSummary}</td>
            <td class="font-bold">₹${order.totalAmount.toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${order.status.toUpperCase()}</span></td>
            <td>${actionBtn}</td>
        `;
        ordersTable.appendChild(tr);
    });
}

window.triggerMagicPrint = async (orderId) => {
    const overlayTitle = printOverlay.querySelector('h2');
    const overlayText = printOverlay.querySelector('p');

    // 1. Show Overlay
    printOverlay.classList.remove('hidden');

    // Step 1: Connect
    overlayTitle.innerText = "Connecting...";
    overlayText.innerText = "Establishing secure connection to printer...";
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Download
    overlayTitle.innerText = "Downloading...";
    overlayText.innerText = "Fetching encrypted document stream...";
    await new Promise(r => setTimeout(r, 1500));

    // Step 3: Configure
    overlayTitle.innerText = "Configuring...";
    overlayText.innerText = "Setting paper tray, color mode, and duplexing...";
    await new Promise(r => setTimeout(r, 1000));

    // Step 4: Spooling
    overlayTitle.innerText = "Spooling...";
    overlayText.innerText = "Sending job to HP LaserJet Pro M404dw...";
    await new Promise(r => setTimeout(r, 2000));

    // 3. Update DB
    window.db.updateOrderStatus(orderId, 'ready');

    // 4. Hide Overlay & Refresh
    printOverlay.classList.add('hidden');
    renderOrders();

    // In a real app, this would send a WebSocket message to the student
    // alert(`Order ${orderId} Printed Successfully! Settings applied automatically.`); // Removed alert for smoother flow
};

window.markCollected = (orderId) => {
    if (confirm('Confirm student has collected the papers?')) {
        window.db.updateOrderStatus(orderId, 'completed');
        renderOrders();
    }
};
