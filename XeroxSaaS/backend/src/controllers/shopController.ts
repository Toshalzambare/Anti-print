import { Request, Response } from 'express';
import Shop, { IShop } from '../models/Shop';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Register a new shop
// @route   POST /api/shops
// @access  Private (Owner)
export const createShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, location } = req.body;
    
    // Check if user already has a shop
    const existingShop = await Shop.findOne({ owner: req.user?._id });
    if (existingShop) {
      res.status(400).json({ message: 'User already owns a shop' });
      return;
    }

    const shop = await Shop.create({
      owner: req.user?._id,
      name,
      address,
      location,
      pricing: {
        baseRate: { bw: 2, color: 10 }, // Defaults
        multipliers: { doubleSide: 0.8 }
      }
    });

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Current User's Shop
// @route   GET /api/shops/my-shop
// @access  Private (Owner/Employee)
export const getMyShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get ALL Shops (For Students)
// @route   GET /api/shops
// @access  Public
export const getAllShops = async (req: Request, res: Response): Promise<void> => {
  try {
    const shops = await Shop.find({ status: { $ne: 'CLOSED' } });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Shop Details
// @route   PUT /api/shops/:id
// @access  Private (Owner)
export const updateShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    // Ensure user owns this shop
    if (shop.owner.toString() !== req.user?._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const updatedShop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedShop);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// @desc    Toggle Shop Status (Open/Closed)
// @route   PUT /api/shops/status
// @access  Private (Owner)
export const toggleShopStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log(`[Toggle] Request from User: ${req.user?._id}`);
    
    // 1. Find the current status first
    const shop = await Shop.findOne({ owner: req.user?._id });
    if (!shop) {
      console.log('[Toggle] Shop not found for this user');
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    const newStatus = shop.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    
    // 2. Use findOneAndUpdate to bypass full document validation (safe for legacy data)
    const updatedShop = await Shop.findOneAndUpdate(
      { owner: req.user?._id },
      { $set: { status: newStatus } },
      { new: true }
    );
    
    console.log(`[Toggle] Success: ${shop.status} -> ${newStatus}`);
    res.json(updatedShop);
  } catch (error) {
    console.error('[Toggle] Error:', error);
    res.status(500).json({ message: 'Status update failed' });
  }
};

// @desc    Update Shop Pricing
// @route   PUT /api/shops/pricing
// @access  Private (Owner)
export const updatePricing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bw, color } = req.body;

    // Use findOneAndUpdate to avoid validation errors
    const updatedShop = await Shop.findOneAndUpdate(
      { owner: req.user?._id },
      { 
        $set: { 
          'pricing.baseRate.bw': bw, 
          'pricing.baseRate.color': color 
        } 
      },
      { new: true }
    );

    if (!updatedShop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    res.json(updatedShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Pricing update failed' });
  }
};

// @desc    Add Employee to Shop
// @route   POST /api/shops/employees
// @access  Private (Owner)
export const addEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Find the owner's shop
    const shop = await Shop.findOne({ owner: req.user?._id });
    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // 3. Create Employee User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = await User.create({
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

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add employee' });
  }
};