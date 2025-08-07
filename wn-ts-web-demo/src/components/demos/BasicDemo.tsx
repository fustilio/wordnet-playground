import React from 'react';
import { Card } from '../shared/Card';
import type { useWordNet } from '../../hooks/useWordNet';
import type { useSearch } from '../../hooks/useSearch';

type BasicDemoProps = ReturnType<typeof useWordNet> & ReturnType<typeof useSearch>;

export const BasicDemo: React.FC<BasicDemoProps> = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  activeTab,
  setActiveTab,
  handleSearch,
}) => {
  return (
    <Card title="Basic WordNet Explorer">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Use this simple interface to search for words, synsets, and senses in the loaded WordNet database.
        </p>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
        
        <div className="border-b border-gray-200">
            <nav className="flex space-x-4">
                {['words', 'synsets', 'senses'].map(tab => (
                    <button key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-2 px-1 border-b-2 font-medium text-sm capitalize`}>
                        {tab}
                    </button>
                ))}
            </nav>
        </div>

        {searchResults && (
          <div className="mt-4 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-md">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};
