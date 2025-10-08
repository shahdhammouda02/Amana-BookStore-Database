import mongoose, { Document, Schema, Model, models } from 'mongoose';

export interface IReview extends Document {
  bookId: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

const ReviewSchema: Schema<IReview> = new Schema({
  bookId: { type: String, required: true },
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const ReviewModel: Model<IReview> = models.Review || mongoose.model<IReview>('Review', ReviewSchema, 'reviews');

export default ReviewModel;