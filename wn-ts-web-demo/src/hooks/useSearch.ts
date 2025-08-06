import { useState } from 'react';

export const useSearch = (wordnet: any) => {
  const [searchTerm, setSearchTerm] = useState('happy');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('words');

  const handleSearch = async () => {
    if (!wordnet || !searchTerm.trim()) return;

    try {
      let results;
      switch (activeTab) {
        case 'words':
          results = await wordnet.words(searchTerm);
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
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ error: error instanceof Error ? error.message : 'Search failed' });
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    activeTab,
    setActiveTab,
    handleSearch
  };
}; 