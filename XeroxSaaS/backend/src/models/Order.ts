import mongoose, { Document, Schema } from 'mongoose';

interface IOrderItem {
  storageKey: string;   // MinIO ID
  originalName: string; 
  fileHash: string;     // SHA-256 for Batching
  pageCount: number;    // Total pages in doc
  config: {
    color: 'bw' | 'color';
    side: 'single' | 'double';
    copies: number;
    paperType: string;
    pageRange?: string;
  };
  calculatedCost: number; // The price for THIS specific file
}

export interface IOrder extends Document {
  shop: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  
  // Financials
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentId?: string; // Razorpay ID
  
  // Workflow Status
  orderStatus: 'QUEUED' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  
  // Security
  pickupCode: string; // A 4-digit code the student shows to collect
}

const OrderSchema = new Schema<IOrder>({
  shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  items: [{
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    fileHash: { type: String, required: true }, // <--- The Batching Key
    pageCount: { type: Number, required: true },
    config: {
      color: { type: String, enum: ['bw', 'color'], default: 'bw' },
      side: { type: String, enum: ['single', 'double'], default: 'single' },
      copies: { type: Number, default: 1 },
      paperType: { type: String, default: 'A4_75gsm' },
      pageRange: { type: String, default: 'All' }
    },
    calculatedCost: { type: Number, required: true }
  }],

  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'FAILED'], 
    default: 'PENDING' 
  },
  paymentId: { type: String },

  orderStatus: { 
    type: String, 
    enum: ['QUEUED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'], 
    default: 'QUEUED' 
  },
  
  pickupCode: { type: String, required: true }

}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);