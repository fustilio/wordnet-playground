import React, { useState, useEffect, useMemo } from 'react';

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearch: () => void;
  wordnet?: any; // Add wordnet for autocomplete
}

interface SearchHistoryItem {
  term: string;
  timestamp: number;
  tab: string;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  onSearch,
  wordnet
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    partOfSpeech: '',
    language: '',
    minLength: 0,
    maxLength: 50,
    exactMatch: false,
    caseSensitive: false
  });

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wordnet-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('wordnet-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Generate autocomplete suggestions
  const generateAutocomplete = useMemo(() => {
    if (!wordnet || searchTerm.length < 2) return [];
    
    try {
      // This is a simplified autocomplete - in a real implementation,
      // you'd want to use a proper trie or indexed search
      const commonWords = [
        'happy', 'sad', 'good', 'bad', 'big', 'small', 'fast', 'slow',
        'beautiful', 'ugly', 'strong', 'weak', 'hot', 'cold', 'new', 'old',
        'young', 'rich', 'poor', 'smart', 'stupid', 'kind', 'mean', 'brave',
        'cowardly', 'honest', 'dishonest', 'generous', 'selfish', 'patient',
        'impatient', 'confident', 'shy', 'friendly', 'hostile', 'calm', 'angry'
      ];
      
      const filtered = commonWords.filter(word => 
        word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filtered.slice(0, 10);
    } catch (e) {
      console.warn('Autocomplete error:', e);
      return [];
    }
  }, [searchTerm, wordnet]);

  // Update autocomplete results
  useEffect(() => {
    setAutocompleteResults(generateAutocomplete);
    setShowAutocomplete(searchTerm.length >= 2 && generateAutocomplete.length > 0);
  }, [generateAutocomplete, searchTerm]);

  // Handle search with history tracking
  const handleSearchWithHistory = () => {
    if (searchTerm.trim()) {
      const newHistoryItem: SearchHistoryItem = {
        term: searchTerm.trim(),
        timestamp: Date.now(),
        tab: activeTab
      };
      
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item.term !== searchTerm.trim());
        return [newHistoryItem, ...filtered.slice(0, 19)]; // Keep last 20 items
      });
      
      onSearch();
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowAutocomplete(false);
    handleSearchWithHistory();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchWithHistory();
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };



  return (
    <div className="search-section">
      <div className="search-controls">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a word..."
            className="search-input"
          />
          
          {/* Autocomplete dropdown */}
          {showAutocomplete && (
            <div className="autocomplete-dropdown">
              {autocompleteResults.map((suggestion, index) => (
                <div
                  key={index}
                  className="autocomplete-item"
                  onClick={() => handleAutocompleteSelect(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={handleSearchWithHistory} className="search-button">
          Search
        </button>
        
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="filter-toggle-button"
        >
          {showAdvancedFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <label>
              Part of Speech:
              <select
                value={filters.partOfSpeech}
                onChange={(e) => setFilters(prev => ({ ...prev, partOfSpeech: e.target.value }))}
              >
                <option value="">All</option>
                <option value="n">Noun</option>
                <option value="v">Verb</option>
                <option value="a">Adjective</option>
                <option value="r">Adverb</option>
              </select>
            </label>
            
            <label>
              Language:
              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="">All</option>
                <option value="eng">English</option>
                <option value="fra">French</option>
                <option value="spa">Spanish</option>
                <option value="deu">German</option>
              </select>
            </label>
          </div>
          
          <div className="filter-row">
            <label>
              Min Length:
              <input
                type="number"
                min="0"
                max="50"
                value={filters.minLength}
                onChange={(e) => setFilters(prev => ({ ...prev, minLength: parseInt(e.target.value) || 0 }))}
              />
            </label>
            
            <label>
              Max Length:
              <input
                type="number"
                min="0"
                max="50"
                value={filters.maxLength}
                onChange={(e) => setFilters(prev => ({ ...prev, maxLength: parseInt(e.target.value) || 50 }))}
              />
            </label>
          </div>
          
          <div className="filter-row">
            <label>
              <input
                type="checkbox"
                checked={filters.exactMatch}
                onChange={(e) => setFilters(prev => ({ ...prev, exactMatch: e.target.checked }))}
              />
              Exact Match
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={filters.caseSensitive}
                onChange={(e) => setFilters(prev => ({ ...prev, caseSensitive: e.target.checked }))}
              />
              Case Sensitive
            </label>
          </div>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'words' ? 'active' : ''}`}
          onClick={() => setActiveTab('words')}
        >
          Words
        </button>
        <button
          className={`tab-button ${activeTab === 'synsets' ? 'active' : ''}`}
          onClick={() => setActiveTab('synsets')}
        >
          Synsets
        </button>
        <button
          className={`tab-button ${activeTab === 'senses' ? 'active' : ''}`}
          onClick={() => setActiveTab('senses')}
        >
          Senses
        </button>
        <button
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="search-history">
          <h4>Recent Searches</h4>
          <div className="history-items">
            {searchHistory.slice(0, 5).map((item, index) => (
              <button
                key={index}
                className="history-item"
                onClick={() => {
                  setSearchTerm(item.term);
                  setActiveTab(item.tab);
                  handleSearchWithHistory();
                }}
              >
                <span className="history-term">{item.term}</span>
                <span className="history-tab">{item.tab}</span>
                <span className="history-time">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 