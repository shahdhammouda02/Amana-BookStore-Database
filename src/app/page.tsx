// src/app/page.tsx
'use client';

import BookGrid from './components/BookGrid';

export default function HomePage() {
  // Enhanced cart handler that works with the API
  const handleAddToCart = (bookId: string) => {
    console.log(`Added book ${bookId} to cart`);
    // The actual API call is now handled in the BookCard component
    // This callback is kept for backward compatibility
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <section className="text-center bg-blue-100 p-8 rounded-lg mb-12 shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to the Amana Bookstore!</h1>
        <p className="text-lg text-gray-600">
          Your one-stop shop for the best books. Discover new worlds and adventures.
        </p>
      </section>

      {/* Book Grid */}
      <BookGrid onAddToCart={handleAddToCart} />
    </div>
  );
}