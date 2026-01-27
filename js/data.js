/**
 * Mock Backend Service using LocalStorage
 * This simulates the database interactions for the prototype
 */

const SEED_SHOPS = [
    {
        id: 'shop_001',
        name: 'Campus Copy Center (Main Block)',
        status: 'open',
        rateCard: {
            bw_single: 2,
            bw_double: 1.5, // per side
            color_single: 10,
            color_double: 8
        }
    },
    {
        id: 'shop_002',
        name: 'Tech Library Xerox',
        status: 'busy',
        rateCard: {
            bw_single: 1.5,
            bw_double: 1.25,
            color_single: 12,
            color_double: 10
        }
    },
    {
        id: 'shop_003',
        name: 'Hostel 4 Print Hub',
        status: 'closed',
        rateCard: {
            bw_single: 2.5,
            bw_double: 2,
            color_single: 15,
            color_double: 12
        }
    }
];

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        this.memoryStore = {};
        this.useMemory = false;

        try {
            if (!localStorage.getItem('antiprint_shops')) {
                localStorage.setItem('antiprint_shops', JSON.stringify(SEED_SHOPS));
            }
            if (!localStorage.getItem('antiprint_orders')) {
                localStorage.setItem('antiprint_orders', JSON.stringify([]));
            }
        } catch (e) {
            console.warn('LocalStorage access denied. Using memory store. Data will reset on reload.');
            this.useMemory = true;
            this.memoryStore['antiprint_shops'] = JSON.stringify(SEED_SHOPS);
            this.memoryStore['antiprint_orders'] = JSON.stringify([]);
        }
    }

    _getItem(key) {
        if (this.useMemory) return this.memoryStore[key];
        return localStorage.getItem(key);
    }

    _setItem(key, val) {
        if (this.useMemory) {
            this.memoryStore[key] = val;
        } else {
            localStorage.setItem(key, val);
        }
    }

    getShops() {
        return JSON.parse(this._getItem('antiprint_shops'));
    }

    getShopById(id) {
        const shops = this.getShops();
        return shops.find(s => s.id === id);
    }

    // Student: Create Order
    createOrder(orderData) {
        const orders = JSON.parse(this._getItem('antiprint_orders'));
        const newOrder = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            timestamp: new Date().toISOString(),
            status: 'pending', // pending, printing, completed
            ...orderData
        };
        orders.push(newOrder);
        this._setItem('antiprint_orders', JSON.stringify(orders));
        return newOrder;
    }

    // Shop: Get Orders
    getOrdersForShop(shopId) {
        const orders = JSON.parse(this._getItem('antiprint_orders'));
        return orders.filter(o => o.shopId === shopId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Shop: Update Status
    updateOrderStatus(orderId, status) {
        const orders = JSON.parse(this._getItem('antiprint_orders'));
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index].status = status;
            this._setItem('antiprint_orders', JSON.stringify(orders));
            return orders[index];
        }
        return null;
    }

    // Shop: Update Rates
    updateShopRates(shopId, newRates) {
        const shops = this.getShops();
        const index = shops.findIndex(s => s.id === shopId);
        if (index !== -1) {
            shops[index].rateCard = { ...shops[index].rateCard, ...newRates };
            this._setItem('antiprint_shops', JSON.stringify(shops));
            return shops[index];
        }
        return null;
    }
}

// Global instance
window.db = new DataStore();
