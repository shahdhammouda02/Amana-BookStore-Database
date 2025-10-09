// src/app/models/Cart.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICart extends Document {
  sessionId: string;
  bookId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

const CartSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

CartSchema.index({ sessionId: 1, bookId: 1 }, { unique: true });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);