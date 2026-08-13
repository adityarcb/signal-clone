import React from 'react';

export default function StoriesPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-8 text-center">
      <div className="mb-6 rounded-full bg-blue-100 dark:bg-blue-900/50 p-6 text-blue-600 dark:text-blue-400">
        <svg
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Stories are Coming Soon
      </h2>
      <p className="max-w-md text-gray-500 dark:text-gray-400">
        Share ephemeral updates with your friends and family. Stories disappear after 24 hours and are end-to-end encrypted.
      </p>
      <button className="mt-8 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Learn More
      </button>
    </div>
  );
}
