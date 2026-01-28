import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Order from '../models/Order';
import Shop from '../models/Shop';

// Helper: Generate a random 4-digit pickup code
const generatePickupCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// @desc    Create new print order
// @route   POST /api/orders
// @access  Private (Student)
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId, items } = req.body;

    // 1. Fetch Shop Rules
    const shop = await Shop.findById(shopId);
    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    // 2. Calculate Costs Server-Side (Security: Never trust client price)
    let grandTotal = 0;
    const processedItems = items.map((item: any) => {
      const isColor = item.config.color === 'color';
      const isDouble = item.config.side === 'double';
      const totalPages = item.pageCount * item.config.copies; // Total pages for this specific doc batch

      let ratePerPage = 0;

      // 1. Check Bulk Discount First
      const bulk = shop.pricing.bulkDiscount;
      if (bulk && bulk.enabled && totalPages >= bulk.threshold) {
        // Bulk Pricing applies
        ratePerPage = isColor ? bulk.colorPrice : bulk.bwPrice;
      } else {
        // 2. Standard Pricing
        if (isColor) {
           ratePerPage = isDouble ? shop.pricing.color.double : shop.pricing.color.single;
        } else {
           ratePerPage = isDouble ? shop.pricing.bw.double : shop.pricing.bw.single;
        }
      }

      // Cost for this file
      const fileCost = ratePerPage * totalPages;
      
      grandTotal += fileCost;

      return {
        ...item,
        calculatedCost: fileCost
      };
    });

    // 3. Create the Order (Status: QUEUED, Payment: PENDING)
    const order = await Order.create({
      shop: shopId,
      user: req.user?._id,
      items: processedItems,
      totalAmount: grandTotal,
      pickupCode: generatePickupCode(),
      paymentStatus: 'PENDING',
      orderStatus: 'QUEUED' 
    });

    res.status(201).json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Order creation failed' });
  }
};

// @desc    Initiate Payment (Mock Razorpay)
// @route   POST /api/orders/checkout
// @access  Private (Student)
export const createPaymentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
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

  } catch (error) {
    res.status(500).json({ message: 'Payment initiation failed' });
  }
};

// @desc    Verify Payment & Notify Shop
// @route   POST /api/orders/verify
// @access  Private (Student)
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Update Order
    order.paymentStatus = 'PAID';
    order.paymentId = paymentId || `pay_mock_${Date.now()}`;
    await order.save();

    // Emit Socket Event (Only after payment success)
    const io = req.app.get('io');
    if (io) {
      io.to(order.shop.toString()).emit('new_order', order);
    }

    res.json({ status: 'success', order });

  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// @desc    Get Orders for My Shop
// @route   GET /api/orders/shop
// @access  Private (Owner/Employee)
export const getShopOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Find the shop
    let shop;
    if (req.user?.role === 'EMPLOYEE') {
       shop = await Shop.findById(req.user.associatedShop);
    } else {
       shop = await Shop.findOne({ owner: req.user?._id });
    }

    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    // 2. Get orders, sort by newest
    const orders = await Order.find({ shop: shop._id })
      .populate('user', 'name email') 
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body; 
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    order.orderStatus = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};