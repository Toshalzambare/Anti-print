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

    // Populate User for Socket Emission
    await order.populate('user', 'name email');

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

// @desc    Cancel Order (Student or Shop)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Check permissions (User owns it OR Shop owns it)
    const isOwner = order.user.toString() === req.user?._id.toString();
    
    // Check if shop owner/employee
    let isShopStaff = false;
    if (req.user?.role === 'OWNER' || req.user?.role === 'EMPLOYEE') {
       const shop = await Shop.findById(order.shop);
       if (shop && (shop.owner.toString() === req.user._id.toString() || req.user.associatedShop?.toString() === shop._id.toString())) {
          isShopStaff = true;
       }
    }

    if (!isOwner && !isShopStaff) {
       res.status(401).json({ message: 'Not authorized' });
       return;
    }

    // Can only cancel if QUEUED
    if (order.orderStatus !== 'QUEUED') {
       res.status(400).json({ message: 'Cannot cancel order in progress or already completed' });
       return;
    }

    // Refund Logic (Mock)
    if (order.paymentStatus === 'PAID') {
       console.log(`[Refund] Initiating refund for Order ${order._id} Amount: ${order.totalAmount}`);
       // Here we would call Razorpay refund API
       order.paymentStatus = 'FAILED'; // Using FAILED to signify refunded/reversed for now or add REFUNDED enum
    }

    order.orderStatus = 'CANCELLED';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Cancellation failed' });
  }
};

// @desc    Get Shop History with Filters
// @route   GET /api/orders/history
// @access  Private (Owner/Employee)
export const getShopHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, search } = req.query;

    // 1. Find Shop
    let shopId;
    if (req.user?.role === 'EMPLOYEE') {
       shopId = req.user.associatedShop;
    } else {
       const shop = await Shop.findOne({ owner: req.user?._id });
       shopId = shop?._id;
    }

    if (!shopId) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    // 2. Build Query
    let query: any = { shop: shopId };

    // Date Filter
    if (startDate || endDate) {
       query.createdAt = {};
       if (startDate) query.createdAt.$gte = new Date(startDate as string);
       if (endDate) query.createdAt.$lte = new Date(new Date(endDate as string).setHours(23,59,59));
    }

    // Search (Complex: Need to search by populated User Name)
    // Mongoose doesn't support direct filtering on populated fields easily in `find`.
    // We can filter AFTER fetch or use Aggregate. For scale, Aggregate is better.
    // For MVP, if search is present, we might need to find users first?
    // Actually, let's keep it simple: Search by Order ID (last 6 chars) or exact match.
    // Or if search string provided, we fetch orders and filter in JS (okay for small scale).
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    if (search) {
       const searchStr = (search as string).toLowerCase();
       const filtered = orders.filter((o: any) => 
          o.user?.name.toLowerCase().includes(searchStr) || 
          o._id.toString().includes(searchStr)
       );
       res.json(filtered);
       return;
    }

    res.json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get My Orders (Student)
// @route   GET /api/orders/my
// @access  Private (Student)
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user?._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};