import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { useWordNetContext } from '../contexts/WordNetContext';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('BasicWordNetDemo');

export const BasicWordNetDemo: React.FC = () => {
  const { wordnet, dataLoader, availablePackages, loadedPackages, loadPackageData, refreshPackages, loading } = useWordNetContext();
  const [searchTerm, setSearchTerm] = useState('water');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'synsets'>('words');

  const handleSearch = async () => {
    if (!wordnet || !searchTerm.trim()) return;

    logger.start(`search for "${searchTerm}"`);
    logger.step('starting search', { term: searchTerm, type: activeTab });

    try {
      let results;
      if (activeTab === 'words') {
        results = await wordnet.getQueryService().getWords({ form: searchTerm, searchAllForms: true });
      } else {
        results = await wordnet.getQueryService().getSynsets({ form: searchTerm });
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

  const loadLanguageWordNet = async (langCode: string) => {
    logger.start(`loading ${langCode} WordNet`);
    
    try {
      // Find the best available package for this language
      const bestPackage = availablePackages.find(pkg => pkg.id.startsWith(langCode));
      if (bestPackage) {
        const packageId = `${bestPackage.id}:${bestPackage.version}`;
        logger.step(`loading package ${packageId}`);
        await loadPackageData(packageId);
        logger.success(`${langCode} WordNet loaded successfully`);
        logger.end(`loading ${langCode} WordNet`, { packageId });
      } else {
        logger.warn(`No package found for language ${langCode}`);
        logger.end(`loading ${langCode} WordNet`);
      }
    } catch (error) {
      logger.fail(`Failed to load ${langCode} WordNet`, error);
      logger.end(`loading ${langCode} WordNet`);
    }
  };

  const searchCILI = async (query: string) => {
    logger.start(`CILI search for "${query}"`);
    
    try {
      if (!wordnet) return [];
      const results = await wordnet.getQueryService().getSynsets({ form: query });
      const resultCount = Array.isArray(results) ? results.length : 0;
      logger.success('CILI search completed successfully', { resultCount });
      logger.end(`CILI search for "${query}"`, { resultCount });
      return results;
    } catch (error) {
      logger.fail('CILI search failed', error);
      logger.end(`CILI search for "${query}"`);
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
      <Card title="Basic WordNet Demo">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Use this simple interface to search for words and synsets in the loaded WordNet database.
          </p>
          
          {/* Search Interface */}
          <div className="space-y-3">
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Search Results</h4>
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

          {/* Language Loading */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Load Language WordNets</h4>
            <div className="flex flex-wrap gap-2">
              {['eng', 'spa', 'fra', 'deu', 'ita', 'por'].map(langCode => (
                <button
                  key={langCode}
                  onClick={() => loadLanguageWordNet(langCode)}
                  disabled={loading}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50 text-sm"
                >
                  {langCode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* CILI Search */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">CILI Cross-Language Search</h4>
            <button
              onClick={() => searchCILI(searchTerm)}
              disabled={loading || !wordnet}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Search CILI
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
