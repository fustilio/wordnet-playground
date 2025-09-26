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

  // Add state to track which words are valid and being validated
  const [validWords, setValidWords] = useState<Record<string, boolean>>({});
  const [validatingWords, setValidatingWords] = useState<Set<string>>(new Set());

  // Add state to track search history
  const [searchHistory, setSearchHistory] = useState<string[]>(['water']);

  // Add state to track expanded synonym lists
  const [expandedSynonyms, setExpandedSynonyms] = useState<Set<string>>(new Set());

  // Function to toggle synonym expansion
  const toggleSynonymExpansion = (synsetId: string) => {
    setExpandedSynonyms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(synsetId)) {
        newSet.delete(synsetId);
      } else {
        newSet.add(synsetId);
      }
      return newSet;
    });
  };

  // Function to validate a word on hover
  const handleWordHover = async (word: string) => {
    const lowerWord = word.toLowerCase();

    // Don't validate if already validated or currently validating
    if (validWords[lowerWord] !== undefined || validatingWords.has(lowerWord)) {
      return;
    }

    // Mark as validating
    setValidatingWords(prev => new Set(prev).add(lowerWord));

    try {
      const isValid = await isValidWord(lowerWord);
      setValidWords(prev => ({
        ...prev,
        [lowerWord]: isValid
      }));
    } catch {
      setValidWords(prev => ({
        ...prev,
        [lowerWord]: false
      }));
    } finally {
      // Remove from validating set
      setValidatingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(lowerWord);
        return newSet;
      });
    }
  };

  // Updated function to render potentially clickable words in definitions
  const renderClickableDefinition = (definition: string) => {
    // Split the definition into words, preserving punctuation
    const words = definition.split(/(\s+|[.,;:!?()[\]{}"])/);

    return words.map((segment, index) => {
      // Check if the segment is a word (not whitespace or punctuation)
      const isWord = /^[a-zA-Z]+$/.test(segment);

      if (isWord && segment.length > 2) {
        const lowerSegment = segment.toLowerCase();
        const isValid = validWords[lowerSegment];

        return (
          <span
            key={index}
            onMouseEnter={() => handleWordHover(segment)}
            className={`definition-word ${isValid && 'hoverable'}`}
            onClick={isValid ? () => handleSynonymClick(segment) : undefined}
            style={{
              cursor: isValid ? 'pointer' : 'default'
            }}
          >
            {segment}
          </span>
        );
      }

      // Return non-word segments (spaces, punctuation) as plain text
      return <span key={index}>{segment}</span>;
    });
  };


  const handleSearch = async (termToSearch?: string) => {
    const searchWord = termToSearch || searchTerm;

    if (!searchWord.trim()) return;

    // Add to search history if it's a new search
    if (searchWord.toLowerCase() !== searchHistory[searchHistory.length - 1]?.toLowerCase()) {
      setSearchHistory(prev => [...prev, searchWord.toLowerCase()]);
    }

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

  // Function to handle clicking on history items
  const handleHistoryClick = (word: string, index: number) => {
    // Remove everything after the clicked item
    setSearchHistory(prev => prev.slice(0, index + 1));
    setSearchTerm(word);
    handleSearch(word);
  };

  // Function to clear history
  const clearHistory = () => {
    setSearchHistory([]);
    setSearchTerm('');
    setResults([]);
    setSynonymsData({});
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

  // Check if a word exists in WordNet
  const isValidWord = async (word: string): Promise<boolean> => {
    try {
      const synsets = await getDefinitions(word);
      return synsets.length > 0;
    } catch {
      return false;
    }
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

        {/* Search History Chain */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <div className="history-label">Search path:</div>
            <div className="history-chain">
              {searchHistory.map((word, index) => (
                <span key={index} className="history-item">
                  <button
                    className="history-word"
                    onClick={() => handleHistoryClick(word, index)}
                    disabled={isSearching}
                    title={`Go back to "${word}"`}
                  >
                    {word}
                  </button>
                  {index < searchHistory.length - 1 && (
                    <span className="history-arrow">→</span>
                  )}
                </span>
              ))}
              <button
                className="clear-history"
                onClick={clearHistory}
                disabled={isSearching}
                title="Clear search history"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
                        {renderClickableDefinition(result.definitions[0].text)}
                      </td>

                      <td className="synonym-cell">
                        {synonymsData[result.id] ? (
                          <div className="synonyms-list">
                            {synonymsData[result.id]
                              .slice(0, expandedSynonyms.has(result.id) ? undefined : 3)
                              .map((word, wordIndex) => (
                                <span key={wordIndex} className="synonym-word">
                                  <button className="synonym-word clickable"
                                    onClick={() => handleSynonymClick(word.lemma)}
                                  >
                                    {word.lemma}
                                  </button>
                                  {wordIndex < (expandedSynonyms.has(result.id)
                                    ? synonymsData[result.id].length - 1
                                    : Math.min(2, synonymsData[result.id].length - 1)
                                  ) && ', '}
                                </span>
                              ))}
                            {synonymsData[result.id].length > 3 && (
                              <button
                                className="synonym-toggle"
                                onClick={() => toggleSynonymExpansion(result.id)}
                              >
                                {expandedSynonyms.has(result.id)
                                  ? ' show less'
                                  : ` +${synonymsData[result.id].length - 3} more`
                                }
                              </button>
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
