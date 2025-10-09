// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BookModel from '@/app/models/Books';
import CartModel from '@/app/models/Cart';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default-session';

    const cartItems = await CartModel.find({ sessionId })
      .populate({
        path: 'bookId',
        model: BookModel
      })
      .exec();

    console.log('Cart items found:', cartItems.length);
    
    // Debug: Check if books are populated
    cartItems.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        hasBookId: !!item.bookId,
        bookData: item.bookId
      });
    });

    return NextResponse.json({
      success: true,
      data: cartItems,
    });
  } catch (err) {
    console.error('Error fetching cart items:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { bookId, quantity = 1, sessionId = 'default-session' } = body;

    // Check if book exists
    const book = await BookModel.findById(bookId);
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await CartModel.findOne({
      sessionId,
      bookId
    });

    let cartItem;
    
    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += quantity;
      cartItem = await existingCartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartModel.create({
        sessionId,
        bookId,
        quantity,
        addedAt: new Date()
      });
    }

    await cartItem.populate('bookId');

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItem
    });
  } catch (err) {
    console.error('Error adding item to cart:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { itemId, quantity, sessionId = 'default-session' } = body;

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const cartItem = await CartModel.findOneAndUpdate(
      { _id: itemId, sessionId },
      { quantity },
      { new: true }
    ).populate('bookId');

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartItem
    });
  } catch (err) {
    console.error('Error updating cart item:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const sessionId = searchParams.get('sessionId') || 'default-session';

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Cart item ID is required' },
        { status: 400 }
      );
    }

    const cartItem = await CartModel.findOneAndDelete({
      _id: itemId,
      sessionId
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (err) {
    console.error('Error removing cart item:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}