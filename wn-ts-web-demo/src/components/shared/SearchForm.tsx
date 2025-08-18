import React, { useCallback, useMemo, useState, useEffect } from 'react';

interface SearchFormProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  loading: boolean;
  activeTab?: string;
  setActiveTab?: (tab: 'words' | 'synsets' | 'senses') => void;
  tabs?: Array<'words' | 'synsets' | 'senses'>;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  isSearching,
  loading,
  activeTab,
  setActiveTab,
  tabs = ['words', 'synsets']
}) => {
  // Local state for debounced input to prevent excessive re-renders
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Update local state when parent searchTerm changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Debounced update to parent state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, setSearchTerm]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleTabClick = useCallback((tab: 'words' | 'synsets' | 'senses') => {
    setActiveTab?.(tab);
  }, [setActiveTab]);

  // Memoize the tabs array to prevent unnecessary re-renders
  const memoizedTabs = useMemo(() => tabs, [tabs]);

  // Check if the local search term differs from the parent (debouncing in progress)
  const isDebouncing = localSearchTerm !== searchTerm;

  return (
    <div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={localSearchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
        {isDebouncing && (
          <div className="text-xs text-gray-500 flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-1"></div>
            Updating...
          </div>
        )}
      </div>
      
      {activeTab && setActiveTab && (
        <div className="border-b border-gray-200 mt-4">
          <nav className="flex space-x-4">
            {memoizedTabs.map(tab => (
              <button 
                key={tab}
                onClick={() => handleTabClick(tab as any)}
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
      )}
    </div>
  );
};
