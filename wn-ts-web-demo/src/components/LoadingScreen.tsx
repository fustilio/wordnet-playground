import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading WordNet...</h2>
        <p className="text-gray-600">Initializing SQL.js and loading demo data...</p>
      </div>
    </div>
  );
}; 