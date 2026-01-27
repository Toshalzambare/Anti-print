import express from 'express';
import {
  createOrder,
  getShopOrders,
  updateOrderStatus,
  createPaymentOrder,
  verifyPayment
} from '../controllers/orderController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect); // All order routes require login

router.post('/', createOrder);
router.post('/checkout', createPaymentOrder);
router.post('/verify', verifyPayment);

router.get('/shop', authorize('OWNER', 'EMPLOYEE'), getShopOrders);
router.put('/:id/status', authorize('OWNER', 'EMPLOYEE'), updateOrderStatus);

export default router;