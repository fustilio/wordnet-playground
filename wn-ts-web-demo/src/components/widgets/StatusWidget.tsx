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

  // Enhanced progress stage display with more detailed information
  const getProgressDisplay = () => {
    if (!progressStage) return null;
    
          // Map progress stages to more user-friendly descriptions
      const stageMap: Record<string, string> = {
        'refreshing cache info': '🔄 Checking cache status...',
        'refreshing packages': '📦 Refreshing package information...',
        'starting WordNet initialization': '🚀 Starting WordNet system...',
        'setting initial state': '⚙️ Setting up system...',
        'initializing worker client': '🔧 Initializing worker...',
        'using worker client for initialization': '🔧 Using worker for initialization...',
        'detecting existing packages': '🔍 Detecting installed packages...',
        'downloading project': '📥 Downloading lexicon data...',
        'loading data into database': '💾 Loading data into database...',
        'starting format processing': '🔍 Processing data format...',
        'processing LMF data': '📋 Processing lexicon data...',
        'starting LMF parsing': '📖 Parsing lexicon content...',
        'inserting LMF data': '💾 Storing data in database...',
        'preparing data for insertion': '📝 Preparing data...',
        'inserting lexicons first': '📚 Inserting lexicon metadata...',
        'inserting words': '📝 Inserting word data...',
        'inserting synsets': '🔗 Inserting synset data...',
        'inserting senses': '💭 Inserting sense data...',
        'inserting definitions': '📖 Inserting definitions...',
        'building relationships': '🔗 Building word relationships...',
        'waiting for transaction commit': '⏳ Finalizing database...',
        'flushing database': '💾 Saving to disk...',
        'worker initialization': '🔧 Initializing worker system...',
        'testing worker connection': '🔌 Testing worker connection...',
        'worker ready': '✅ Worker system ready',
        'packages refreshed': '✅ Package refresh complete',
        'Starting download...': '📥 Starting download...',
        'Downloading data...': '📥 Downloading data...',
        'Processing XML...': '🔍 Processing XML...',
        'Parsing data...': '📖 Parsing data...',
        'Loading into database...': '💾 Loading into database...',
        'Finalizing...': '⏳ Finalizing...',
        'Complete': '✅ Complete'
      };

    const displayText = stageMap[progressStage] || progressStage;
    
    return (
      <div>
        <p className="text-sm font-medium text-gray-500">{displayText}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress * 100}%` }}></div>
        </div>
        {progress > 0 && (
          <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(progress * 100)}%</p>
        )}
      </div>
    );
  };

  // Enhanced status display with more context
  const getStatusDisplay = () => {
    if (isInitializing) {
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
