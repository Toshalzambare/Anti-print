"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shopController_1 = require("../controllers/shopController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Public Routes
router.get('/', shopController_1.getAllShops);
// Protected Routes (Require Login)
router.use(authMiddleware_1.protect);
// Create Shop (One time setup)
router.post('/', (0, authMiddleware_1.authorize)('OWNER'), shopController_1.createShop);
// Get My Shop Details
router.get('/my-shop', (0, authMiddleware_1.authorize)('OWNER', 'EMPLOYEE'), shopController_1.getMyShop);
// Toggle Shop Status (Open/Closed)
router.put('/status', (0, authMiddleware_1.authorize)('OWNER'), shopController_1.toggleShopStatus);
// Add Employee
router.post('/employees', (0, authMiddleware_1.authorize)('OWNER'), shopController_1.addEmployee);
// Update Pricing
router.put('/pricing', (0, authMiddleware_1.authorize)('OWNER'), shopController_1.updatePricing);
// Update General Shop Info
router.put('/:id', (0, authMiddleware_1.authorize)('OWNER'), shopController_1.updateShop);
exports.default = router;
