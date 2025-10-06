import { useState, useCallback, useMemo } from 'react';
import { createScopedLogger } from 'utils/logger';
import { useWordNetContext } from 'wn-react';

const logger = createScopedLogger('useSearch');

export const useSearch = (initialSearchTerm = 'happy') => {
  const { queryWords, querySynsets, querySenses } = useWordNetContext();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'synsets' | 'senses'>('words');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    logger.start(`search for "${searchTerm}"`);
    logger.step('starting search', { term: searchTerm, type: activeTab });

    setIsSearching(true);
    setSearchResults(null);

    try {
      let results;
      switch (activeTab) {
        case 'words':
          results = await queryWords(searchTerm);
          break;
        case 'synsets':
          results = await querySynsets(searchTerm);
          break;
        case 'senses':
          results = await querySenses(searchTerm);
          break;
        default:
          results = await queryWords(searchTerm);
      }
      
      const resultCount = Array.isArray(results) ? results.length : 0;
      logger.success('Search completed successfully', { 
        term: searchTerm, 
        type: activeTab, 
        resultCount 
      });
      
      setSearchResults(results);
    } catch (error) {
      logger.fail('Search failed', error);
      setSearchResults({ error: error instanceof Error ? error.message : 'Search failed' });
    } finally {
      setIsSearching(false);
      logger.end(`search for "${searchTerm}"`);
    }
  }, [searchTerm, activeTab, queryWords, querySynsets, querySenses]);

  return useMemo(() => ({
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    activeTab,
    setActiveTab,
    handleSearch,
  }), [searchTerm, searchResults, isSearching, activeTab, setActiveTab, handleSearch]);
};
