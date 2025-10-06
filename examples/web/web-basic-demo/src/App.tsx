import React, { useState } from 'react';
import { useWordNet } from 'wn-react';
import './index.css';

function App() {
  const { search, results, loading, error, initialized } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  const [searchTerm, setSearchTerm] = useState('water');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);

    try {
      await search(searchTerm);
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
    if (loading || isSearching) return 'Loading WordNet data...';
    if (error) return `Error: ${error.message}`;
    if (!initialized) return 'Initializing...';
    return 'Ready to search!';
  };

  const getStatusClass = () => {
    if (loading || isSearching) return 'loading';
    if (error) return 'error';
    if (initialized) return 'ready';
    return 'loading';
  };

  return (
    <div className="container">
      <header className="header">
        <h1>WordNet Basic Demo</h1>
        <p>Simple word definitions using WordNet</p>
      </header>

      <div className="card">
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
            disabled={!initialized || loading || isSearching}
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={!initialized || loading || isSearching || !searchTerm.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {(searchError || error) && (
          <div className="error">
            {searchError || error?.message}
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
                ) : !isSearching && searchTerm && initialized ? (
                  <div className="no-results">
                    No definitions found for "{searchTerm}"
                  </div>
                ) : null}
              </div>
      </div>
    </div>
  );
}


export default App;
