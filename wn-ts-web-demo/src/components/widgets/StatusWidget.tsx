import React from 'react';
import { Card } from '../shared/Card';
import type { WordNetState } from '../../hooks/useWordNet';

export const StatusWidget: React.FC<WordNetState> = ({ isInitializing, loading, error, progress, progressStage, loadedPackages }) => {
  return (
    <Card title="System Status">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Overall Status</p>
          {isInitializing ? (
            <p className="text-yellow-600 font-semibold">Initializing...</p>
          ) : error ? (
            <p className="text-red-600 font-semibold">Error</p>
          ) : (
            <p className="text-green-600 font-semibold">Ready</p>
          )}
        </div>
        
        {loading && (
          <div>
            <p className="text-sm font-medium text-gray-500">{progressStage}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-500">Loaded Lexicons</p>
          {loadedPackages.length > 0 ? (
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {loadedPackages.map(pkg => <li key={pkg}>{pkg}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No lexicons loaded.</p>
          )}
        </div>
      </div>
    </Card>
  );
};
