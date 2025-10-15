// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BookModel, { IBook } from '@/app/models/Books'; // Assuming IBook is available
import CartModel, { ICart } from '@/app/models/Cart'; // Assuming ICart is available

// Define a minimal type for errors to satisfy linter rules
interface CustomError extends Error {
    message: string;
    code?: number;
    name: string;
}

// --- GET: Fetch Cart Items ---
export async function GET(request: Request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        // Use a secure method for session management in a real app (e.g., cookies/tokens)
        const sessionId = searchParams.get('sessionId') || 'default-session';

        const cartItems = await CartModel.find({ sessionId })
            .populate<{ bookId: IBook }>({ // Explicitly type the populated field
                path: 'bookId',
                model: BookModel,
                select: '-description -tags -reviews' // Optimize payload, exclude large fields
            })
            .exec();

        // Filter out any items where the book might have been deleted
        const validCartItems = cartItems.filter(item => item.bookId);

        return NextResponse.json({
            success: true,
            data: validCartItems,
            count: validCartItems.length
        });
    } catch (error: unknown) { // ✅ Use 'unknown'
        const err = error as CustomError;
        console.error('Error fetching cart items:', err.message);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch cart items', details: err.message },
            { status: 500 }
        );
    }
}
// ------------------------------------------------------------------

// --- POST: Add or Increment Item in Cart ---
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { bookId, quantity = 1, sessionId = 'default-session' } = body;

        // 1. Validation and Stock Check
        if (!bookId || typeof quantity !== 'number' || quantity < 1) {
             return NextResponse.json(
                { success: false, error: 'Invalid bookId or quantity' },
                { status: 400 }
            );
        }

        const book = await BookModel.findOne({ _id: bookId });

        if (!book || !book.inStock) { // Check if book exists AND is in stock
            return NextResponse.json(
                { success: false, error: 'Book not found or currently out of stock' },
                { status: 404 }
            );
        }

        // 2. Check for Existing Item
        const existingCartItem = await CartModel.findOne({ sessionId, bookId });
        let cartItem: ICart;
        
        if (existingCartItem) {
            // 3. Update existing item
            existingCartItem.quantity += quantity;
            cartItem = await existingCartItem.save();
        } else {
            // 4. Create new item
            cartItem = await CartModel.create({
                sessionId,
                bookId,
                quantity,
                addedAt: new Date()
            });
        }

        // 5. Populate and Return
        // The type assertion ensures TypeScript knows the populated field is a BookModel document
        const populatedCartItem = await cartItem.populate<{ bookId: IBook }>('bookId');

        return NextResponse.json({
            success: true,
            message: 'Item added to cart successfully',
            data: populatedCartItem
        });

    } catch (error: unknown) { // ✅ Use 'unknown'
        const err = error as CustomError;
        console.error('Error adding item to cart:', err.message);
        return NextResponse.json(
            { success: false, error: 'Failed to add item to cart', details: err.message },
            { status: 500 }
        );
    }
}
// ------------------------------------------------------------------

// --- PUT: Update Item Quantity ---
export async function PUT(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { itemId, quantity, sessionId = 'default-session' } = body;

        if (!itemId || typeof quantity !== 'number' || quantity < 1) {
             return NextResponse.json(
                { success: false, error: 'Invalid itemId or quantity (must be >= 1)' },
                { status: 400 }
            );
        }

        // Optional: Implement stock check here if your BookModel tracks inventory levels
        // ... (find book and check quantity against stock)

        const cartItem = await CartModel.findOneAndUpdate(
            { _id: itemId, sessionId },
            { quantity },
            { new: true, runValidators: true } // runValidators ensures Mongoose Schema rules apply
        ).populate<{ bookId: IBook }>('bookId');

        if (!cartItem) {
            return NextResponse.json(
                { success: false, error: 'Cart item not found or does not belong to session' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Cart item updated successfully',
            data: cartItem
        });
    } catch (error: unknown) { // ✅ Use 'unknown'
        const err = error as CustomError;
        console.error('Error updating cart item:', err.message);
        return NextResponse.json(
            { success: false, error: 'Failed to update cart item', details: err.message },
            { status: 500 }
        );
    }
}
// ------------------------------------------------------------------

// --- DELETE: Remove Item from Cart ---
export async function DELETE(request: Request) {
    await dbConnect();
    
    try {
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
            sessionId // Ensure only items for the current session/user can be deleted
        });

        if (!cartItem) {
            return NextResponse.json(
                { success: false, error: 'Cart item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Item removed from cart successfully',
            data: { _id: itemId }
        });
    } catch (error: unknown) { // ✅ Use 'unknown'
        const err = error as CustomError;
        console.error('Error removing cart item:', err.message);
        return NextResponse.json(
            { success: false, error: 'Failed to remove item from cart', details: err.message },
            { status: 500 }
        );
    }
}