import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BookModel from "@/app/models/Books";
import mongoose from "mongoose";

// Interface for Next.js dynamic route context
interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  try {
    await dbConnect();

    // ✅ Must await context.params in Next.js 15+
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Book ID format" },
        { status: 400 }
      );
    }

    const bookIdObject = new mongoose.Types.ObjectId(id);

    const books = await BookModel.aggregate([
      { $match: { _id: bookIdObject } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "bookId",
          as: "reviews",
        },
      },
      { $limit: 1 },
    ]);

    const book = books.length > 0 ? books[0] : null;

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Error fetching single book:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch book details" },
      { status: 500 }
    );
  }
}
