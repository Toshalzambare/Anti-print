"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // All order routes require login
router.post('/', orderController_1.createOrder);
router.post('/checkout', orderController_1.createPaymentOrder);
router.post('/verify', orderController_1.verifyPayment);
router.get('/shop', (0, authMiddleware_1.authorize)('OWNER', 'EMPLOYEE'), orderController_1.getShopOrders);
router.put('/:id/status', (0, authMiddleware_1.authorize)('OWNER', 'EMPLOYEE'), orderController_1.updateOrderStatus);
exports.default = router;
