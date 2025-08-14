import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('BasicDemo');

export const BasicDemo: React.FC = () => {
  const { queryWords, querySynsets, loading, error } = useWordNetContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'synsets'>('words');
  const [isSearching, setIsSearching] = useState(false);

  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for basic word and synset search functionality',
      priority: 'high' as const
    }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    logger.start(`search for "${searchTerm}"`);
    logger.step('starting search', { term: searchTerm, type: activeTab });
    
    setIsSearching(true);
    setSearchResults(null);
    
    try {
      let results;
      if (activeTab === 'words') {
        results = await queryWords(searchTerm);
      } else {
        results = await querySynsets(searchTerm);
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
      setSearchResults({ error: error instanceof Error ? error.message : String(error) });
      logger.end(`search for "${searchTerm}"`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTabChange = (tab: 'words' | 'synsets') => {
    logger.debug('Search tab changed', { from: activeTab, to: tab });
    setActiveTab(tab);
  };

  return (
    <Card title="Basic WordNet Explorer">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Use this simple interface to search for words and synsets in the loaded WordNet database.
        </p>
        
        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., happy, run, computer"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4">
            {['words', 'synsets'].map(tab => (
              <button 
                key={tab}
                onClick={() => handleTabChange(tab as 'words' | 'synsets')}
                className={`${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } py-2 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {searchResults && (
          <div className="mt-4 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">
              {activeTab === 'words' ? 'Words' : 'Synsets'} for "{searchTerm}"
            </h4>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};
