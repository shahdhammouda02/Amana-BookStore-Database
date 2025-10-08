import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BookModel, { IBook } from "@/app/models/Books";
import { FilterQuery } from "mongoose";

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const genre = searchParams.get("genre");
    const id = searchParams.get("id");

    // Type-safe query
    const query: FilterQuery<IBook> = {};
    if (genre) query.genre = { $in: [new RegExp(genre, "i")] }; // case-insensitive
    if (id) query._id = id;

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      BookModel.find(query).skip(skip).limit(limit),
      BookModel.countDocuments(query),
    ]);

    console.log(await BookModel.countDocuments());

    // Fetch reviews for each book
     const booksWithReviews = await BookModel.aggregate([
      { $match: query },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'reviews',       // the collection name in MongoDB
          localField: '_id',     // field from books
          foreignField: 'bookId',// field from reviews
          as: 'reviews'          // name of the array to return
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      count: books.length,
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
