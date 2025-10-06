import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from 'wn-react';
import type { WordNetContextValue } from "wn-react";

export const StatusWidget: React.FC = () => {
  const { loading, error, initialized, initialize, close } = useWordNetContext();

  const handleForceReload = async () => {
    try {
      await close();
      await initialize();
    } catch (error) {
      console.error('Force reload failed:', error);
    }
  };

  // Enhanced status display with more context
  const getStatusDisplay = () => {
    if (!initialized && loading) {
      return (
        <div className="space-y-2">
          <p className="text-yellow-600 font-semibold flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            Initializing WordNet System...
          </p>
          <p className="text-xs text-gray-500">
            Setting up worker system and preparing lexicon data
          </p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-red-600 font-semibold flex items-center gap-2">
            ❌ System Error
          </p>
          <p className="text-xs text-gray-500">
            An error occurred during initialization
          </p>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="space-y-2">
          <p className="text-blue-600 font-semibold flex items-center gap-2">
            <span className="animate-spin">🔄</span>
            Loading Lexicon Data...
          </p>
          <p className="text-xs text-gray-500">
            Downloading and processing lexicon files
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <p className="text-green-600 font-semibold flex items-center gap-2">
          ✅ System Ready
        </p>
        <p className="text-xs text-gray-500">
          WordNet system is fully operational
        </p>
      </div>
    );
  };

  return (
    <Card title="System Status">
      <div data-testid="system-status" className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Overall Status</p>
          {getStatusDisplay()}
        </div>
        
        {loading && getProgressDisplay()}

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
