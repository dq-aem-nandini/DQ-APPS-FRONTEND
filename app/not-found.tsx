'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-2xl w-full text-center">
        {/* 404 */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white tracking-wider drop-shadow-2xl">
          404
        </h1>

        {/* Title */}
        <p className="text-2xl sm:text-3xl md:text-5xl font-light text-white mt-6 sm:mt-8 mb-3 sm:mb-4">
          Oops! Page Not Found
        </p>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-12 px-2">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Button */}
        <Link
          href="/"
          className="
            inline-block
            px-6 py-3 sm:px-6 sm:py-3
            bg-white text-indigo-900
            font-semibold text-base sm:text-lg
            rounded-full shadow-lg
            hover:bg-gray-100 hover:scale-105
            transition-all duration-300
          "
        >
          Go Back
        </Link>

        {/* SVG Illustration */}
        <div className="mt-10 sm:mt-16 opacity-40">
          <svg
            className="w-40 h-40 sm:w-56 sm:h-56 md:w-50 md:h-50 mx-auto text-white"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="8" />
            <circle cx="70" cy="80" r="12" fill="currentColor" />
            <circle cx="130" cy="80" r="12" fill="currentColor" />
            <path
              d="M60 130 Q100 160 140 130"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
