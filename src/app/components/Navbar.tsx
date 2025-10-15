// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface CartItemFromAPI {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    author: string;
    price: number;
  };
  quantity: number;
  addedAt: string;
}

const Navbar: React.FC = () => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        // Try to get count from database first
        const response = await fetch('/api/cart');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const totalItems = result.data.reduce((total: number, item: CartItemFromAPI) => total + item.quantity, 0);
            setCartItemCount(totalItems);
            localStorage.setItem('cartCount', totalItems.toString());
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch cart count from API', error);
      }

      // Fallback to localStorage
      const storedCount = localStorage.getItem('cartCount');
      if (storedCount) {
        setCartItemCount(parseInt(storedCount, 10));
      } else {
        setCartItemCount(0);
      }
    };

    // Initial update
    updateCartCount();

    // Listen for custom event to update cart count
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Clean up the event listener
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 cursor-pointer">
          Amana Bookstore
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className={`text-gray-600 hover:text-blue-500 cursor-pointer ${pathname === '/' ? 'text-blue-500 font-semibold' : ''}`}>
            Home
          </Link>
          <Link href="/cart" className={`text-gray-600 hover:text-blue-500 flex items-center cursor-pointer ${pathname === '/cart' ? 'text-blue-500 font-semibold' : ''}`}>
            My Cart
            {cartItemCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;