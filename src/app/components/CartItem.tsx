// src/app/components/CartItem.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Book } from '../types';

interface CartItemProps {
  item: { 
    cartItemId: string;
    book: Book & { _id: string }; 
    quantity: number 
  };
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const { book, quantity, cartItemId } = item;
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate subtotal for the cart item
  const subtotal = (book.price * quantity).toFixed(2);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Update in database
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId,
          quantity: newQuantity
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update localStorage count
        const currentCount = parseInt(localStorage.getItem('cartCount') || '0', 10);
        const difference = newQuantity - quantity;
        const newCount = Math.max(0, currentCount + difference);
        localStorage.setItem('cartCount', newCount.toString());
        
        // Trigger custom event to update Navbar
        window.dispatchEvent(new Event('cartUpdated'));
        
        onUpdateQuantity(cartItemId, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Remove from database
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItemId }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update localStorage count
        const currentCount = parseInt(localStorage.getItem('cartCount') || '0', 10);
        const newCount = Math.max(0, currentCount - quantity);
        localStorage.setItem('cartCount', newCount.toString());
        
        // Trigger custom event to update Navbar
        window.dispatchEvent(new Event('cartUpdated'));
        
        onRemoveItem(cartItemId);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <Link href={`/book/${book._id}`} className="cursor-pointer">
          <div className="relative h-24 w-16 bg-gray-200 flex items-center justify-center rounded-md hover:bg-gray-300 transition-colors duration-200">
            <div className="text-2xl text-gray-400">📚</div>
          </div>
        </Link>
        <div>
          <Link href={`/book/${book._id}`} className="text-lg font-semibold text-gray-800 hover:text-blue-500 cursor-pointer">
            {book.title}
          </Link>
          <p className="text-sm text-gray-600">by {book.author}</p>
          <p className="text-md font-bold text-gray-900 mt-1">${book.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1 || isUpdating}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            -
          </button>
          <span className="min-w-8 text-center">{quantity}</span>
          <button 
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={isUpdating}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            +
          </button>
        </div>
        <p className="text-md font-semibold w-20 text-right">${subtotal}</p>
        <button 
          onClick={handleRemove}
          disabled={isUpdating}
          className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;