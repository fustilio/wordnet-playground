import React, { useState } from 'react';
import { useWordnet } from './hooks/useWordnet';
import './index.css';

function App() {
  const { getDefinitions, getSynsetWords, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('water');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [synonymsData, setSynonymsData] = useState<Record<string, any[]>>({});

  const handleSearch = async (termToSearch?: string) => {
    const searchWord = termToSearch || searchTerm;

    if (!searchWord.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    setSynonymsData({});

    try {
      const synsets = await getDefinitions(searchWord);
      setResults(synsets);

      // Automatically fetch synonyms for each synset
      const synonymsMap: Record<string, any[]> = {};

      // Fetch synonyms for all synsets in parallel
      const synonymPromises = synsets.map(async (synset) => {
        try {
          const words = await getSynsetWords(synset.id);
          synonymsMap[synset.id] = words;
        } catch (err) {
          console.warn(`Failed to fetch synonyms for synset ${synset.id}:`, err);
          synonymsMap[synset.id] = [];
        }
      });

      await Promise.all(synonymPromises);
      setSynonymsData(synonymsMap);
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

  // Add this new function to handle clicking on synonym words
  const handleSynonymClick = (word: string) => {
    setSearchTerm(word);
    handleSearch(word);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Dictionary Basic Demo</h1>
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
            disabled={!ready || isSearching}
          />
          <button
            className="search-button"
            onClick={() => handleSearch()}
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
                    <th>Synonyms</th>
                    {/* <th>Synset ID</th>
                    <th>ILI ID</th> */}
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
                      <td className="synonym-cell">
                        {synonymsData[result.id] ? (
                          <div className="synonyms-list">
                            {synonymsData[result.id].slice(0, 3).map((word, wordIndex) => (
                              <span key={wordIndex} className="synonym-word">
                                <button className="synonym-word clickable"
                                  onClick={() => handleSynonymClick(word.lemma)}
                                >
                                  {word.lemma}
                                </button>
                                {wordIndex < Math.min(2, synonymsData[result.id].length - 1) && ', '}
                              </span>
                            ))}
                            {synonymsData[result.id].length > 3 && (
                              <span className="synonym-count">
                                +{synonymsData[result.id].length - 3} more
                              </span>
                            )}
                          </div>
                        ) : isSearching ? (
                          <span className="loading-synonyms">Loading...</span>
                        ) : (
                          <span className="no-synonyms">-</span>
                        )}
                      </td>
                      {/* <td className="id-cell">
                        <code>{result.id}</code>
                      </td>
                      <td className="ili-cell">
                        <code>{result.ili}</code>
                      </td> */}
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
    </div>
  );
}


export default App;
