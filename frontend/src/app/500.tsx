'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ServerError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">500</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Server Error</h2>
        <p className="text-gray-600 mb-6">
          We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
            Try Again
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          If the problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
}
