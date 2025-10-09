// src/app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartItem from '../components/CartItem';
import { Book } from '../types';

interface DatabaseCartItem {
  _id: string;
  bookId: Book & { _id: string };
  quantity: number;
  addedAt: string;
}

interface CartItemData {
  cartItemId: string; 
  book: Book & { _id: string }; 
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
          throw new Error('Failed to fetch cart items');
        }

        const result = await response.json();
        console.log('Cart API response:', result); // Debug log
        
        if (result.success) {
          // Filter out items where book data might be missing
          const validItems = result.data.filter((item: DatabaseCartItem) => 
            item.bookId && item.bookId._id
          );
          
          console.log('Valid cart items:', validItems); // Debug log
          
          const itemsWithBooks: CartItemData[] = validItems.map((item: DatabaseCartItem) => ({
            cartItemId: item._id,
            book: item.bookId,
            quantity: item.quantity
          }));
          
          setCartItems(itemsWithBooks);
          
          // Update localStorage for navbar counter
          const totalItems = itemsWithBooks.reduce((total: number, item: CartItemData) => total + item.quantity, 0);
          localStorage.setItem('cartCount', totalItems.toString());
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        } else {
          throw new Error(result.error || 'Failed to fetch cart items');
        }
      } catch (error) {
        console.error('Failed to fetch cart items from API', error);
        setError('Failed to load cart items');
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: cartItemId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedItems = cartItems.map(item => 
          item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);

        // Update localStorage for navbar
        const totalItems = updatedItems.reduce((total: number, item: CartItemData) => total + item.quantity, 0);
        localStorage.setItem('cartCount', totalItems.toString());
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        throw new Error(result.error || 'Failed to update cart item');
      }

    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update cart item. Please try again.');
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart?itemId=${cartItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove cart item');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedItems = cartItems.filter(item => item.cartItemId !== cartItemId);
        setCartItems(updatedItems);

        // Update localStorage for navbar
        const totalItems = updatedItems.reduce((total: number, item: CartItemData) => total + item.quantity, 0);
        localStorage.setItem('cartCount', totalItems.toString());
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        throw new Error(result.error || 'Failed to remove cart item');
      }

    } catch (error) {
      console.error('Error removing cart item:', error);
      alert('Failed to remove cart item. Please try again.');
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      // Remove all items one by one
      const deletePromises = cartItems.map(item => 
        fetch(`/api/cart?itemId=${item.cartItemId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);

      setCartItems([]);
      localStorage.setItem('cartCount', '0');
      window.dispatchEvent(new CustomEvent('cartUpdated'));

    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart. Please try again.');
    }
  };

  const totalPrice = cartItems.reduce((total: number, item: CartItemData) => {
    return total + (item.book?.price || 0) * item.quantity;
  }, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center py-10 bg-red-50 rounded-lg">
          <h2 className="text-xl text-red-600 mb-4">{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
          <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            {cartItems.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-800">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1 bg-gray-500 text-white text-center py-3 rounded-md hover:bg-gray-600 transition-colors cursor-pointer">
                Continue Shopping
              </Link>
              <button 
                onClick={clearCart}
                className="flex-1 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}