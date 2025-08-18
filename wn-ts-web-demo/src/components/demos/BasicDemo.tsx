import React, { useMemo, useCallback } from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from "wn-ts-web/react";
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from 'utils/logger';
import { SearchForm } from '../shared/SearchForm';
import { SearchResults } from '../shared/SearchResults';
import { useSearch } from '../../hooks/useSearch';

const logger = createScopedLogger('BasicDemo');

export const BasicDemo: React.FC = () => {
  const { loading, error } = useWordNetContext();
  const { searchTerm, setSearchTerm, searchResults, isSearching, activeTab, setActiveTab, handleSearch } = useSearch('');

  // Define lexicon requirements for this demo - memoized to prevent unnecessary re-renders
  const lexiconRequirements = useMemo(() => [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for basic word and synset search functionality',
      priority: 'high' as const
    }
  ], []);

  const handleTabChange = useCallback((tab: 'words' | 'synsets' | 'senses') => {
    logger.debug('Search tab changed', { from: activeTab, to: tab });
    setActiveTab(tab);
  }, [activeTab, setActiveTab]);

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
        
        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          isSearching={isSearching}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          tabs={['words', 'synsets']}
        />

        <SearchResults
          title={useMemo(() => `${activeTab === 'words' ? 'Words' : 'Synsets'} for "${searchTerm}"`, [activeTab, searchTerm])}
          results={searchResults}
        />
      </div>
    </Card>
  );
};
