// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BookModel, { IBook } from '@/app/models/Books';
import type { FilterQuery } from 'mongoose';

interface QueryParams {
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
}

// Helper to parse query params safely
function parseQueryParams(url: string): QueryParams {
  const { searchParams } = new URL(url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    genre: searchParams.get('genre') || undefined,
    search: searchParams.get('search') || undefined,
  };
}

// GET /api/books - Return books with pagination, search, and filter
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { page, limit, genre, search } = parseQueryParams(request.url);

    const filter:  FilterQuery<IBook> = {};

    // Filter by genre
    if (genre) filter.genre = { $in: [genre] };

    // Search by title, author, tags
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const books = await BookModel.find(filter)
      .skip((page! - 1) * limit!)
      .limit(limit!)
      .lean();

    const total = await BookModel.countDocuments(filter);

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / (limit || 1)),
      },
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}

// POST /api/books - Add a new book
export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    // TODO: Add authentication middleware for admin

    const newBook = new BookModel(data);
    await newBook.save();

    return NextResponse.json(newBook, { status: 201 });
  } catch (err) {
    console.error('Error creating book:', err);
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}

// PUT /api/books/:id - Update a book
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing book id' }, { status: 400 });

    // TODO: Add authentication middleware for admin

    const data = await request.json();
    const updatedBook = await BookModel.findByIdAndUpdate(id, data, { new: true }).lean();

    if (!updatedBook) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    return NextResponse.json(updatedBook);
  } catch (err) {
    console.error('Error updating book:', err);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/:id - Delete a book
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing book id' }, { status: 400 });

    // TODO: Add authentication middleware for admin

    const deletedBook = await BookModel.findByIdAndDelete(id).lean();

    if (!deletedBook) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    return NextResponse.json({ message: 'Book deleted successfully', book: deletedBook });
  } catch (err) {
    console.error('Error deleting book:', err);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
