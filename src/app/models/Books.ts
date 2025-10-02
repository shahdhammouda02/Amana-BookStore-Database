import mongoose, { Document, Schema, Model, models } from 'mongoose';

// 1. Define the TypeScript Interface for type safety
export interface IBook extends Document {
  _id: string;
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
}

// 2. Define the Mongoose Schema
const BookSchema: Schema<IBook> = new Schema({
  _id: { type: String, required: true },
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
}, { 
  // Disable Mongoose's default version key and automatic objectId generation
  _id: false, 
  versionKey: false,
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// 3. Create the Model
// Use mongoose.models.Book to check if the model has already been defined
const BookModel = (models.Book || mongoose.model<IBook>('Book', BookSchema));

export default BookModel as Model<IBook>;