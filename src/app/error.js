'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fafafa] text-center px-6">
      <h1 className="text-[6rem] md:text-[10rem] font-anton text-[#111] leading-none mb-4 text-red-600">ERROR</h1>
      <div className="bg-red-600 text-white px-4 py-2 border-2 border-black font-anton uppercase text-xl mb-6 shadow-[4px_4px_0_0_#000] rotate-2">
        System Failure
      </div>
      <p className="font-poppins font-medium text-gray-600 max-w-md mb-8">
        A critical error occurred while attempting to process your request. Our engineers have been notified.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="bg-black text-white px-8 py-3.5 rounded-full font-poppins font-bold uppercase text-sm tracking-widest hover:bg-gray-800 border-2 border-black transition-colors duration-300"
        >
          Try Again
        </button>
        <Link href="/">
          <button className="bg-[#c1ff00] text-black px-8 py-3.5 rounded-full font-poppins font-bold uppercase text-sm tracking-widest hover:bg-white border-2 border-black transition-colors duration-300">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
