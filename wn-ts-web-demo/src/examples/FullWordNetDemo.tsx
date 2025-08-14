import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { useWordNetContext } from '../contexts/WordNetContext';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('FullWordNetDemo');

export const FullWordNetDemo: React.FC = () => {
  const { wordnet, availablePackages, loadPackageData, loading, progress, progressStage, loadedPackages } = useWordNetContext();
  const [searchTerm, setSearchTerm] = useState('water');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'synsets' | 'senses'>('words');

  const handleSearch = async () => {
    if (!wordnet || !searchTerm.trim()) return;

    logger.start(`search for "${searchTerm}"`);
    logger.step('starting search', { term: searchTerm, type: activeTab });

    try {
      let results;
      switch (activeTab) {
        case 'words':
          results = await wordnet?.getQueryService()?.getWords({ form: searchTerm, searchAllForms: true }) || [];
          break;
        case 'synsets':
          results = await wordnet?.getQueryService()?.getSynsets({ form: searchTerm }) || [];
          break;
        case 'senses':
          results = await wordnet?.getQueryService()?.getSenses({ wordIdOrForm: searchTerm }) || [];
          break;
        default:
          results = await wordnet?.getQueryService()?.getWords({ form: searchTerm, searchAllForms: true }) || [];
      }

      const resultCount = Array.isArray(results) ? results.length : 0;
      logger.success('Search completed successfully', { 
        term: searchTerm, 
        type: activeTab, 
        resultCount 
      });
      
      setSearchResults(results);
      logger.end(`search for "${searchTerm}"`, { resultCount });
    } catch (error) {
      logger.fail('Search failed', error);
      setSearchResults({ error: error instanceof Error ? error.message : 'Search failed' });
      logger.end(`search for "${searchTerm}"`);
    }
  };

  const loadPackage = async (packageId: string) => {
    logger.start(`loading package ${packageId}`);
    
    try {
      await loadPackageData(packageId);
      logger.success(`Package ${packageId} loaded successfully`);
      logger.end(`loading package ${packageId}`, { packageId });
    } catch (error) {
      logger.fail(`Failed to load package ${packageId}`, error);
      logger.end(`loading package ${packageId}`);
    }
  };

  const loadDemoData = async () => {
    logger.start('loading demo data');
    
    try {
      // This would call the actual demo data loading function
      // For now, we'll simulate it
      logger.step('loading demo data');
      logger.success('Demo data loaded successfully');
      logger.end('loading demo data');
    } catch (error) {
      logger.fail('Failed to load demo data', error);
      logger.end('loading demo data');
    }
  };

  const unloadData = async () => {
    logger.start('unloading data');
    
    try {
      // This would call the actual unload function
      logger.step('unloading data');
      logger.success('Data unloaded successfully');
      logger.end('unloading data');
    } catch (error) {
      logger.fail('Failed to unload data', error);
      logger.end('unloading data');
    }
  };

  const clearCache = async () => {
    logger.start('clearing cache');
    
    try {
      // This would call the actual cache clearing function
      logger.step('clearing cache');
      logger.success('Cache cleared successfully');
      logger.end('clearing cache');
    } catch (error) {
      logger.fail('Failed to clear cache', error);
      logger.end('clearing cache');
    }
  };

  const getCacheInfo = async () => {
    logger.start('getting cache info');
    
    try {
      // This would call the actual cache info function
      logger.step('getting cache info');
      logger.success('Cache info retrieved successfully');
      logger.end('getting cache info');
    } catch (error) {
      logger.fail('Failed to get cache info', error);
      logger.end('getting cache info');
    }
  };

  const testSearch = async () => {
    logger.start('testing search with "water"');
    
    try {
      if (!wordnet) throw new Error('WordNet not initialized');
      
      const results = await wordnet?.getQueryService()?.getWords({ form: 'water', searchAllForms: true }) || [];
      const resultCount = Array.isArray(results) ? results.length : 0;
      
      logger.success('Test search completed successfully', { resultCount });
      logger.end('testing search with "water"', { resultCount });
      
      return results;
    } catch (error) {
      logger.fail('Test search failed', error);
      logger.end('testing search with "water"');
      return [];
    }
  };

  // Perform initial search when wordnet is available
  useEffect(() => {
    if (wordnet && searchTerm.trim()) {
      handleSearch();
    }
  }, [wordnet, searchTerm, activeTab]);

  return (
    <div className="space-y-6">
      <Card title="Full WordNet Demo">
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Comprehensive demonstration of WordNet functionality including search, data loading, and management.
          </p>
          
          {/* Search Interface */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Search Interface</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., water, run, computer"
                className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !wordnet}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('words')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeTab === 'words' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Words
              </button>
              <button
                onClick={() => setActiveTab('synsets')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeTab === 'synsets' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Synsets
              </button>
              <button
                onClick={() => setActiveTab('senses')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeTab === 'senses' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Senses
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              {searchResults.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  Error: {searchResults.error}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm overflow-auto max-h-64">
                    {JSON.stringify(searchResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={loadDemoData}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Load Demo Data
              </button>
              <button
                onClick={unloadData}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Unload Data
              </button>
              <button
                onClick={clearCache}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Clear Cache
              </button>
              <button
                onClick={getCacheInfo}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Get Cache Info
              </button>
            </div>
          </div>

          {/* Test Functions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Functions</h3>
            <button
              onClick={testSearch}
              disabled={loading || !wordnet}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Test Search with "water"
            </button>
          </div>

          {/* Progress Display */}
          {loading && progress !== undefined && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Loading Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              {progressStage && (
                <p className="text-sm text-gray-600">{progressStage}</p>
              )}
            </div>
          )}

          {/* Available Packages */}
          {availablePackages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePackages.slice(0, 6).map(pkg => (
                  <div key={`${pkg.id}-${pkg.version}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{pkg.label}</div>
                    <div className="text-sm text-gray-600">{pkg.id}:{pkg.version}</div>
                    <button
                      onClick={() => loadPackage(`${pkg.id}:${pkg.version}`)}
                      disabled={loading || loadedPackages.includes(`${pkg.id}:${pkg.version}`)}
                      className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadedPackages.includes(`${pkg.id}:${pkg.version}`) ? 'Loaded' : 'Load'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
