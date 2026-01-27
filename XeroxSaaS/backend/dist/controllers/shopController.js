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
exports.addEmployee = exports.toggleShopStatus = exports.updatePricing = exports.updateShop = exports.getAllShops = exports.getMyShop = exports.createShop = void 0;
const Shop_1 = __importDefault(require("../models/Shop"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// @desc    Register a new shop
// @route   POST /api/shops
// @access  Private (Owner)
const createShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { name, address, location } = req.body;
        // Check if user already has a shop
        const existingShop = yield Shop_1.default.findOne({ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (existingShop) {
            res.status(400).json({ message: 'User already owns a shop' });
            return;
        }
        const shop = yield Shop_1.default.create({
            owner: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            name,
            address,
            location,
            pricing: {
                baseRate: { bw: 2, color: 10 }, // Defaults
                multipliers: { doubleSide: 0.8 }
            }
        });
        res.status(201).json(shop);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createShop = createShop;
// @desc    Get Current User's Shop
// @route   GET /api/shops/my-shop
// @access  Private (Owner/Employee)
const getMyShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
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
        res.json(shop);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyShop = getMyShop;
// @desc    Get ALL Shops (For Students)
// @route   GET /api/shops
// @access  Public
const getAllShops = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shops = yield Shop_1.default.find({ status: { $ne: 'CLOSED' } });
        res.json(shops);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAllShops = getAllShops;
// @desc    Update Shop Details
// @route   PUT /api/shops/:id
// @access  Private (Owner)
const updateShop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const shop = yield Shop_1.default.findById(req.params.id);
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        // Ensure user owns this shop
        if (shop.owner.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        const updatedShop = yield Shop_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedShop);
    }
    catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
});
exports.updateShop = updateShop;
// @desc    Update Shop Pricing
// @route   PUT /api/shops/pricing
// @access  Private (Owner)
const updatePricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { bw, color } = req.body;
        const shop = yield Shop_1.default.findOne({ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        // Update pricing
        shop.pricing.baseRate.bw = bw;
        shop.pricing.baseRate.color = color;
        yield shop.save();
        res.json(shop);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Pricing update failed' });
    }
});
exports.updatePricing = updatePricing;
// @desc    Toggle Shop Status (Open/Closed)
// @route   PUT /api/shops/status
// @access  Private (Owner)
const toggleShopStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log(`[Toggle] Request from User: ${(_a = req.user) === null || _a === void 0 ? void 0 : _a._id}`);
        const shop = yield Shop_1.default.findOne({ owner: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id });
        if (!shop) {
            console.log('[Toggle] Shop not found for this user');
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        const oldStatus = shop.status;
        shop.status = shop.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        yield shop.save();
        console.log(`[Toggle] Success: ${oldStatus} -> ${shop.status}`);
        res.json(shop);
    }
    catch (error) {
        console.error('[Toggle] Error:', error);
        res.status(500).json({ message: 'Status update failed' });
    }
});
exports.toggleShopStatus = toggleShopStatus;
// @desc    Add Employee to Shop
// @route   POST /api/shops/employees
// @access  Private (Owner)
const addEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password } = req.body;
        // 1. Find the owner's shop
        const shop = yield Shop_1.default.findOne({ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }
        // 2. Check if user exists
        const userExists = yield User_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // 3. Create Employee User
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const employee = yield User_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: 'EMPLOYEE',
            associatedShop: shop._id
        });
        res.status(201).json({
            message: 'Employee added successfully',
            employee: {
                _id: employee._id,
                name: employee.name,
                email: employee.email
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add employee' });
    }
});
exports.addEmployee = addEmployee;
