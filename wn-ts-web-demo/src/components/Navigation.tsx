import React from 'react';

interface NavigationProps {
  currentPage: 'basic' | 'kitchen-sink';
  onPageChange: (page: 'basic' | 'kitchen-sink') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-8 flex gap-2">
        <button
          onClick={() => onPageChange('basic')}
          className={`px-6 py-4 border-none font-medium rounded-t-lg cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 ${
            currentPage === 'basic' 
              ? 'bg-blue-600 text-white font-semibold border-b-4 border-blue-700' 
              : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          🎯 Basic Core
        </button>
        <button
          onClick={() => onPageChange('kitchen-sink')}
          className={`px-6 py-4 border-none font-medium rounded-t-lg cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 ${
            currentPage === 'kitchen-sink' 
              ? 'bg-blue-600 text-white font-semibold border-b-4 border-blue-700' 
              : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          🍳 Kitchen Sink
        </button>
      </div>
    </nav>
  );
}; 