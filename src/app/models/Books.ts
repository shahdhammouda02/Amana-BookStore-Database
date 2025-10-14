import mongoose, { Document, Schema, Model, models } from 'mongoose';

// 1. Define TypeScript interface
export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  price: number;
  image: string;
  isbn: string;
  genre: string[];
  tags: string[];
  datePublished: string;
  pages: number;
  language: string;
  publisher: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
  objectId: mongoose.Types.ObjectId;
}

// 2. Define Schema
const BookSchema: Schema<IBook> = new Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '/images/default.jpg' },
  isbn: { type: String, required: true, unique: true },
  genre: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  datePublished: { type: String },
  pages: { type: Number, min: 1 },
  language: { type: String },
  publisher: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  objectId: {
    type: Schema.Types.ObjectId,
    default: function () { return new mongoose.Types.ObjectId(); } // ← توليد تلقائي
  }
}, { 
  versionKey: false,
  timestamps: true
});

// 3. Create Model with explicit collection name 'books'
const BookModel: Model<IBook> = models.Book || mongoose.model<IBook>('Book', BookSchema, 'books');

export default BookModel;
