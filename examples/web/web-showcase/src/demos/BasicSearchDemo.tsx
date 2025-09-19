import React, { useState } from 'react';
import { useWordnet } from '../hooks/useWordnet';
import { DemoPage } from '../components/DemoPage';

export const BasicSearchDemo: React.FC = () => {
  const { getDefinitions, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('water');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const synsets = await getDefinitions(searchTerm);
      setResults(synsets);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusMessage = () => {
    if (loading) return 'Loading WordNet data...';
    if (error) return `Error: ${error}`;
    if (!ready) return 'Initializing...';
    return 'Ready to search!';
  };

  const getStatusClass = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (ready) return 'ready';
    return 'loading';
  };

  return (
    <DemoPage
      title="Basic Word Search"
      description="Search for word definitions and examples using the basic WordNet functionality."
    >
      <div className="demo-section">
        <div className={`status ${getStatusClass()}`}>
          {getStatusMessage()}
        </div>

        <div className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter a word (e.g., water, happy, run)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!ready || isSearching}
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={!ready || isSearching || !searchTerm.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchError && (
          <div className="error">
            {searchError}
          </div>
        )}

        <div className="results">
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="synset-table">
                <thead>
                  <tr>
                    <th>POS</th>
                    <th>Definition</th>
                    <th>Synset ID</th>
                    <th>ILI ID</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="pos-cell">
                        <span className={`pos-tag pos-${result.pos}`}>
                          {result.pos}
                        </span>
                      </td>
                      <td className="definition-cell">
                        {result.definitions?.[0]?.text || 'No definition'}
                      </td>
                      <td className="id-cell">
                        <code>{result.id}</code>
                      </td>
                      <td className="ili-cell">
                        <code>{result.ili}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !isSearching && searchTerm && ready ? (
            <div className="no-results">
              No definitions found for "{searchTerm}"
            </div>
          ) : null}
        </div>
      </div>
    </DemoPage>
  );
};
