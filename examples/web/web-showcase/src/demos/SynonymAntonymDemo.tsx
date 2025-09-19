import React, { useState } from 'react';
import { useWordnet } from '../hooks/useWordnet';
import { DemoPage } from '../components/DemoPage';

export const SynonymAntonymDemo: React.FC = () => {
  const { getDefinitions, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('happy');
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
      title="Synonyms & Antonyms"
      description="Explore word relationships, synonyms, and antonyms using WordNet's semantic network."
    >
      <div className="demo-section">
        <div className={`status ${getStatusClass()}`}>
          {getStatusMessage()}
        </div>

        <div className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter a word (e.g., happy, big, fast)"
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
            {isSearching ? 'Searching...' : 'Find Relationships'}
          </button>
        </div>

        {searchError && (
          <div className="error">
            {searchError}
          </div>
        )}

        <div className="results">
          {results.length > 0 ? (
            <div className="synonym-antonym-results">
              {results.map((result, index) => (
                <div key={index} className="synset-card">
                  <div className="synset-header">
                    <span className={`pos-tag pos-${result.pos}`}>
                      {result.pos}
                    </span>
                    <span className="synset-id">ID: {result.id}</span>
                  </div>
                  
                  <div className="synset-definition">
                    <strong>Definition:</strong> {result.definitions?.[0]?.text || 'No definition'}
                  </div>
                  
                  {result.definitions?.[0]?.example && (
                    <div className="synset-example">
                      <strong>Example:</strong> <em>"{result.definitions[0].example}"</em>
                    </div>
                  )}

                  <div className="word-relationships">
                    <div className="relationship-section">
                      <h4>Words in this synset:</h4>
                      <div className="word-list">
                        {/* This would show the actual words in the synset */}
                        <span className="word-item">{searchTerm}</span>
                        {/* Additional words would be shown here */}
                      </div>
                    </div>

                    <div className="relationship-section">
                      <h4>Related concepts:</h4>
                      <div className="relationship-info">
                        <p>This demo shows the basic synset structure. In a full implementation, 
                        you would see synonyms, antonyms, hypernyms, hyponyms, and other 
                        semantic relationships.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
