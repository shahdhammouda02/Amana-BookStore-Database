import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BookModel from '@/app/models/Books';

// Define the number of items per page for initial setup
const ITEMS_PER_PAGE = 10;

/**
 * Handles GET requests to /api/books
 * Fetches a list of books from MongoDB with optional pagination.
 */
export async function GET(request: Request) {
  try {
    // 1. Establish Mongoose Connection
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // 2. Fetch Data using Mongoose Model
    
    // Total count for pagination metadata
    const totalBooks = await BookModel.countDocuments({});

    // Paginated and sorted results
    const books = await BookModel.find({})
      .sort({ title: 1 }) 
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .lean(); // Use .lean() for faster query results (returns plain JavaScript objects)

    return NextResponse.json({
      data: books,
      totalCount: totalBooks,
      totalPages: Math.ceil(totalBooks / ITEMS_PER_PAGE),
      currentPage: page,
    }, { status: 200 });

  } catch (error) {
    console.error('Mongoose GET Error:', error);
    return NextResponse.json(
      { message: 'Error fetching books from the database.' },
      { status: 500 }
    );
  }
}