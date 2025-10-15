import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BookModel, { IBook } from "@/app/models/Books";
import { FilterQuery } from "mongoose";


interface MongooseError extends Error {
    code?: number;
    errors?: Record<string, { message: string }>;
    message: string;
    name: string;
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const genre = searchParams.get("genre");
    // const id = searchParams.get("id"); // ⬅️ REMOVED ID PARAMETER

    const skip = (page - 1) * limit;

    // Type-safe query - now only handles genre filtering
    const query: FilterQuery<IBook> = {};
    if (genre) query.genre = { $in: [new RegExp(genre, "i")] }; // case-insensitive
    // if (id) query._id = id; // ⬅️ REMOVED ID CONDITION

    // Use aggregation for fetching books with embedded reviews for the list
    const booksWithReviews = await BookModel.aggregate([
      { $match: query },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'reviews',      // the collection name in MongoDB
          localField: '_id',    // field from books
          foreignField: 'bookId',// field from reviews
          as: 'reviews'         // name of the array to return
        }
      }
    ]);
    
    // Count total documents for pagination based on the query
    const total = await BookModel.countDocuments(query); // ⬅️ Replaced Promise.all

    return NextResponse.json({
      success: true,
      count: booksWithReviews.length,
      data: booksWithReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const newBook = await BookModel.create(body); 

        return NextResponse.json({
            success: true,
            message: "Book successfully added.",
            data: newBook,
        }, { status: 201 });

    } catch (error: unknown) { // Use 'unknown' to satisfy the linter
        console.error("Error creating book:", error);

        // Assert 'error' as MongooseError for specific property checks
        const dbError = error as MongooseError; 
        
        let message = "Failed to add book";
        let status = 500;
        const details = dbError.message || "An unexpected error occurred";

        if (dbError.code === 11000) {
            // MongoDB duplicate key error (e.g., ISBN unique constraint)
            message = "ISBN must be unique.";
            status = 400; // Bad Request
        } else if (dbError.name === 'ValidationError') {
            // Mongoose validation error (missing required fields, min/max failed)
            const errorMessages = Object.values(dbError.errors || {})
                .map(err => err.message)
                .join(', ');
            message = `Validation failed: ${errorMessages}`;
            status = 400;
        }

        return NextResponse.json({ 
            success: false, 
            error: message,
            details: details 
        }, { status });
    }
}