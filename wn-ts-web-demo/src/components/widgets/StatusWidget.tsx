import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from 'wn-ts-web/react';
import type { WordNetState } from "wn-ts-web/react";

export const StatusWidget: React.FC<WordNetState> = ({ isInitializing, loading, error, progress, progressStage, loadedPackages }) => {
  const { clearCacheAndUnload, refreshPackages } = useWordNetContext();

  const handleForceReload = async () => {
    try {
      await clearCacheAndUnload();
      await refreshPackages();
    } catch (error) {
      console.error('Force reload failed:', error);
    }
  };

  return (
    <Card title="System Status">
      <div data-testid="system-status" className="space-y-4">
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

        {/* Force Reload Button */}
        <div className="pt-2">
          <button
            onClick={handleForceReload}
            disabled={loading || isInitializing}
            className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            title="Force reload all lexicons (clears cache and downloads fresh)"
          >
            🚀 Force Reload All
          </button>
        </div>
      </div>
    </Card>
  );
};
