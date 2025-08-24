/**
 * ErrorDisplay Component
 *
 * Reusable error display components with retry functionality
 * Requirements: 3.4, 6.4
 */

import React from 'react';
import RetryButton from './RetryButton';

interface ErrorDisplayProps {
  error?: string | null;
  onRetry?: () => Promise<void> | void;
  title?: string;
  showRetry?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  showRetry = true,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <RetryButton
                onRetry={onRetry}
                className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </RetryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline Error Component
export const InlineError: React.FC<{
  error?: string | null;
  className?: string;
}> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center text-red-600 text-sm ${className}`}>
      <svg
        className="w-4 h-4 mr-2 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{error}</span>
    </div>
  );
};

// Full Page Error Component
export const FullPageError: React.FC<{
  error?: string;
  onRetry?: () => void;
  title?: string;
}> = ({
  error = 'An unexpected error occurred',
  onRetry,
  title = 'Something went wrong',
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
        {onRetry && (
          <RetryButton
            onRetry={onRetry}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </RetryButton>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
