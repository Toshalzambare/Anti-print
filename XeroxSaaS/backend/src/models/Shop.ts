import mongoose, { Document, Schema } from 'mongoose';

// 1. The TypeScript Interface (The Contract)
export interface IShop extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  address: string; // <--- This was missing or mismatched in your type definition
  location: {
    type: string;
    coordinates: number[];
  };
  status: 'OPEN' | 'CLOSED' | 'BUSY';
  pricing: {
    baseRate: {
      bw: number;
      color: number;
    };
    multipliers: {
      doubleSide: number;
    };
  };
}

// 2. The Mongoose Schema (The Database Structure)
const ShopSchema = new Schema<IShop>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true }, 
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'CLOSED', 'BUSY'], 
    default: 'OPEN' 
  },
  pricing: {
    baseRate: {
      bw: { type: Number, default: 2.0 },
      color: { type: Number, default: 10.0 }
    },
    multipliers: {
      doubleSide: { type: Number, default: 0.8 } 
    }
  }
}, { timestamps: true });

export default mongoose.model<IShop>('Shop', ShopSchema);