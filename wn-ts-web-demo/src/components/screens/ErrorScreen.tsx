import React from 'react';

interface ErrorScreenProps {
  error?: Error | string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => {
  const errorMessage = error instanceof Error ? error.message : error || 'An unknown error occurred';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-lg text-gray-700 mb-6">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
