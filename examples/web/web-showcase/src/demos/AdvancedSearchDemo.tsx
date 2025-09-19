import React, { useState } from 'react';
import { useWordnet } from '../hooks/useWordnet';
import { DemoPage } from '../components/DemoPage';

export const AdvancedSearchDemo: React.FC = () => {
  const { getDefinitions, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('run');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<string>('all');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const synsets = await getDefinitions(searchTerm);
      let filteredResults = synsets;
      
      // Filter by part of speech if not 'all'
      if (selectedPos !== 'all') {
        filteredResults = synsets.filter(synset => synset.pos === selectedPos);
      }
      
      setResults(filteredResults);
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

  const getPosCounts = () => {
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.pos] = (counts[result.pos] || 0) + 1;
    });
    return counts;
  };

  const posCounts = getPosCounts();

  return (
    <DemoPage
      title="Advanced Word Search"
      description="Search with part-of-speech filtering and detailed results analysis."
    >
      <div className="demo-section">
        <div className={`status ${getStatusClass()}`}>
          {getStatusMessage()}
        </div>

        <div className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter a word (e.g., run, bank, light)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!ready || isSearching}
          />
          <select
            className="pos-filter"
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            disabled={!ready || isSearching}
          >
            <option value="all">All Parts of Speech</option>
            <option value="n">Noun (n)</option>
            <option value="v">Verb (v)</option>
            <option value="a">Adjective (a)</option>
            <option value="r">Adverb (r)</option>
          </select>
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

        {results.length > 0 && (
          <div className="results-summary">
            <h3>Results Summary</h3>
            <div className="pos-counts">
              {Object.entries(posCounts).map(([pos, count]) => (
                <span key={pos} className={`pos-count pos-${pos}`}>
                  {pos.toUpperCase()}: {count}
                </span>
              ))}
            </div>
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
                    <th>Examples</th>
                    <th>Synset ID</th>
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
                      <td className="examples-cell">
                        {result.definitions?.[0]?.example && (
                          <div className="example">
                            <em>"{result.definitions[0].example}"</em>
                          </div>
                        )}
                      </td>
                      <td className="id-cell">
                        <code>{result.id}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !isSearching && searchTerm && ready ? (
            <div className="no-results">
              No definitions found for "{searchTerm}"
              {selectedPos !== 'all' && ` (filtered by ${selectedPos})`}
            </div>
          ) : null}
        </div>
      </div>
    </DemoPage>
  );
};
