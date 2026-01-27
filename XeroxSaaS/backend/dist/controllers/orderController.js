"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getShopOrders = exports.verifyPayment = exports.createPaymentOrder = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Shop_1 = __importDefault(require("../models/Shop"));
// Helper: Generate a random 4-digit pickup code
const generatePickupCode = () => Math.floor(1000 + Math.random() * 9000).toString();
// @desc    Create new print order
// @route   POST /api/orders
// @access  Private (Student)
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { shopId, items } = req.body;
        // 1. Fetch Shop Rules
        const shop = yield Shop_1.default.findById(shopId);
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        // 2. Calculate Costs Server-Side (Security: Never trust client price)
        let grandTotal = 0;
        const processedItems = items.map((item) => {
            // Get base rate (e.g., 2.0 or 10.0)
            let rate = shop.pricing.baseRate[item.config.color];
            // Apply Side Multiplier (e.g., Double side might be 0.8x per page)
            if (item.config.side === 'double') {
                rate = rate * shop.pricing.multipliers.doubleSide;
            }
            // Cost for this file = Rate * Pages * Copies
            const fileCost = rate * item.pageCount * item.config.copies;
            grandTotal += fileCost;
            return Object.assign(Object.assign({}, item), { calculatedCost: fileCost });
        });
        // 3. Create the Order (Status: QUEUED, Payment: PENDING)
        const order = yield Order_1.default.create({
            shop: shopId,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            items: processedItems,
            totalAmount: grandTotal,
            pickupCode: generatePickupCode(),
            paymentStatus: 'PENDING',
            orderStatus: 'QUEUED'
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Order creation failed' });
    }
});
exports.createOrder = createOrder;
// @desc    Initiate Payment (Mock Razorpay)
// @route   POST /api/orders/checkout
// @access  Private (Student)
const createPaymentOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.body;
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        // Mock Razorpay Order ID
        const razorpayOrderId = `order_mock_${Math.floor(Math.random() * 1000000)}`;
        res.json({
            id: razorpayOrderId,
            currency: 'INR',
            amount: order.totalAmount * 100 // Rupees to Paise
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Payment initiation failed' });
    }
});
exports.createPaymentOrder = createPaymentOrder;
// @desc    Verify Payment & Notify Shop
// @route   POST /api/orders/verify
// @access  Private (Student)
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, paymentId } = req.body;
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        // Update Order
        order.paymentStatus = 'PAID';
        order.paymentId = paymentId || `pay_mock_${Date.now()}`;
        yield order.save();
        // Emit Socket Event (Only after payment success)
        const io = req.app.get('io');
        if (io) {
            io.to(order.shop.toString()).emit('new_order', order);
        }
        res.json({ status: 'success', order });
    }
    catch (error) {
        res.status(500).json({ message: 'Payment verification failed' });
    }
});
exports.verifyPayment = verifyPayment;
// @desc    Get Orders for My Shop
// @route   GET /api/orders/shop
// @access  Private (Owner/Employee)
const getShopOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 1. Find the shop
        let shop;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'EMPLOYEE') {
            shop = yield Shop_1.default.findById(req.user.associatedShop);
        }
        else {
            shop = yield Shop_1.default.findOne({ owner: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id });
        }
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        // 2. Get orders, sort by newest
        const orders = yield Order_1.default.find({ shop: shop._id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getShopOrders = getShopOrders;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const order = yield Order_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        order.orderStatus = status;
        yield order.save();
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
});
exports.updateOrderStatus = updateOrderStatus;
