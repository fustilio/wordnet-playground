import React, { useState } from 'react';
import { useWordnet } from './hooks/useWordnet';
import './index.css';

function App() {
  const { getDefinitions, getSynsetWords, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('water');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // New state for synset word lookup
  const [synsetId, setSynsetId] = useState('');
  const [synsetWords, setSynsetWords] = useState<any[]>([]);
  const [isLoadingSynsetWords, setIsLoadingSynsetWords] = useState(false);
  const [synsetError, setSynsetError] = useState<string | null>(null);

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

  const handleSynsetLookup = async () => {
    if (!synsetId.trim()) return;

    setIsLoadingSynsetWords(true);
    setSynsetError(null);
    setSynsetWords([]);

    try {
      const words = await getSynsetWords(synsetId);
      setSynsetWords(words);
    } catch (err) {
      setSynsetError(err instanceof Error ? err.message : 'Synset lookup failed');
    } finally {
      setIsLoadingSynsetWords(false);
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

      {/* New Synset Lookup Section */}
      <div className="card">
        <h2>Synset Word Lookup</h2>
        <p>Enter a synset ID to see all words in that synset</p>

        <div className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter synset ID (e.g., oewn-02084071-n)"
            value={synsetId}
            onChange={(e) => setSynsetId(e.target.value)}
            disabled={!ready || isLoadingSynsetWords}
          />
          <button
            className="search-button"
            onClick={handleSynsetLookup}
            disabled={!ready || isLoadingSynsetWords || !synsetId.trim()}
          >
            {isLoadingSynsetWords ? 'Loading...' : 'Get Words'}
          </button>
        </div>

        {synsetError && (
          <div className="error">
            {synsetError}
          </div>
        )}

        <div className="results">
          {synsetWords.length > 0 ? (
            <div>
              <h3>Words in synset {synsetId}:</h3>
              <div className="synset-words-list">
                {synsetWords.map((word, index) => (
                  <div key={index} className="word-item">
                    <strong>{word.lemma} </strong>
                    {word.pos && <span className="pos-tag">{word.pos} </span>}
                    {word.language && <span className="language-tag">{word.language}  </span>}
                  </div>
                ))}
              </div>
            </div>
          ) : !isLoadingSynsetWords && synsetId && ready ? (
            <div className="no-results">
              No words found for synset "{synsetId}"
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


export default App;
