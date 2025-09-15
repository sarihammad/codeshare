'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
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

        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Something went wrong!
        </h2>

        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. Please try again or contact
          support if the problem persists.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} className="flex-1">
            Try again
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="flex-1"
          >
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
