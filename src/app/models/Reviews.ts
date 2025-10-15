// src/app/models/Review.ts
import mongoose, { Document, Schema, Model, models, Types } from 'mongoose';

export interface IReview extends Document {
  bookId: Types.ObjectId;
  user: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  verified?: boolean;
}

const ReviewSchema: Schema<IReview> = new Schema({
  bookId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'Book' // إضافة reference للكتاب
  },
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  title: { type: String },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  verified: { type: Boolean, default: false }
}, { 
  timestamps: true,
  collection: 'reviews'
});

const ReviewModel: Model<IReview> = models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default ReviewModel;