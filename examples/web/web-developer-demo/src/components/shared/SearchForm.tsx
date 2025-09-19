import React, { useCallback } from 'react';

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
  // Simple event handlers without complex state management
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleTabClick = useCallback((tab: 'words' | 'synsets' | 'senses') => {
    setActiveTab?.(tab);
  }, [setActiveTab]);

  return (
    <div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchTerm}
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
      </div>
      
      {activeTab && setActiveTab && (
        <div className="border-b border-gray-200 mt-4">
          <nav className="flex space-x-4">
            {tabs.map(tab => (
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
