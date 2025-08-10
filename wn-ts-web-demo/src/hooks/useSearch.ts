import { useState, useEffect } from 'react';

export const useSearch = (wordnet: any) => {
  const [searchTerm, setSearchTerm] = useState('happy');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('words');

  const handleSearch = async () => {
    if (!wordnet || !searchTerm.trim()) return;

    try {
      const started = performance.now();
      let results;
      switch (activeTab) {
        case 'words':
          // Prefer fuzzy search if available for richer matches
          if (typeof wordnet.searchWords === 'function') {
            results = await wordnet.searchWords(searchTerm, { limit: 100 });
          } else {
            results = await wordnet.words(searchTerm);
          }
          break;
        case 'synsets':
          results = await wordnet.synsets(searchTerm);
          break;
        case 'senses':
          results = await wordnet.senses(searchTerm);
          break;
        default:
          results = await wordnet.words(searchTerm);
      }
      const durationMs = performance.now() - started;
      console.log(`🔎 Query '${activeTab}' for "${searchTerm}" took ${durationMs.toFixed(1)}ms and returned ${Array.isArray(results) ? results.length : 0} items`);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ error: error instanceof Error ? error.message : 'Search failed' });
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