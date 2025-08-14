import { useState, useEffect } from 'react';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('useSearch');

export const useSearch = (wordnet: any) => {
  const [searchTerm, setSearchTerm] = useState('happy');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('words');

  const handleSearch = async () => {
    if (!wordnet || !searchTerm.trim()) return;

    logger.start(`search for "${searchTerm}"`);
    logger.step('starting search', { term: searchTerm, type: activeTab });

    try {
      let results;
      switch (activeTab) {
        case 'words':
          // Prefer fuzzy search if available for richer matches
          if (typeof wordnet.searchWords === 'function') {
            logger.step('using fuzzy search for words');
            results = await wordnet.searchWords(searchTerm, { limit: 100 });
          } else {
            logger.step('using basic word search');
            results = await wordnet.words(searchTerm);
          }
          break;
        case 'synsets':
          logger.step('searching synsets');
          results = await wordnet.synsets(searchTerm);
          break;
        case 'senses':
          logger.step('searching senses');
          results = await wordnet.senses(searchTerm);
          break;
        default:
          logger.step('using default word search');
          results = await wordnet.words(searchTerm);
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

  // Perform initial search when wordnet is available
  useEffect(() => {
    if (wordnet && searchTerm.trim()) {
      handleSearch();
    }
  }, [wordnet, searchTerm, activeTab]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    activeTab,
    setActiveTab,
    handleSearch
  };
}; 