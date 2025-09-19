import React, { useState } from 'react';
import { useWordnet } from '../hooks/useWordnet';
import { DemoPage } from '../components/DemoPage';

export const WordRelationshipsDemo: React.FC = () => {
  const { getDefinitions, loading, error, ready } = useWordnet({ lang: 'en-US' });
  const [searchTerm, setSearchTerm] = useState('car');
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
      title="Word Relationships"
      description="Explore hierarchical relationships, semantic networks, and word connections in WordNet."
    >
      <div className="demo-section">
        <div className={`status ${getStatusClass()}`}>
          {getStatusMessage()}
        </div>

        <div className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter a word (e.g., car, animal, music)"
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
            {isSearching ? 'Analyzing...' : 'Analyze Relationships'}
          </button>
        </div>

        {searchError && (
          <div className="error">
            {searchError}
          </div>
        )}

        <div className="results">
          {results.length > 0 ? (
            <div className="relationship-analysis">
              <h3>Semantic Analysis for "{searchTerm}"</h3>
              
              {results.map((result, index) => (
                <div key={index} className="relationship-card">
                  <div className="card-header">
                    <span className={`pos-tag pos-${result.pos}`}>
                      {result.pos}
                    </span>
                    <span className="synset-id">Synset: {result.id}</span>
                  </div>
                  
                  <div className="card-content">
                    <div className="definition">
                      <strong>Definition:</strong> {result.definitions?.[0]?.text || 'No definition'}
                    </div>
                    
                    {result.definitions?.[0]?.example && (
                      <div className="example">
                        <strong>Example:</strong> <em>"{result.definitions[0].example}"</em>
                      </div>
                    )}

                    <div className="relationship-tree">
                      <h4>Semantic Hierarchy</h4>
                      <div className="hierarchy-info">
                        <p>This demo shows the basic synset information. In a full implementation, 
                        you would see:</p>
                        <ul>
                          <li><strong>Hypernyms:</strong> More general concepts (e.g., car → vehicle)</li>
                          <li><strong>Hyponyms:</strong> More specific concepts (e.g., car → sedan, SUV)</li>
                          <li><strong>Meronyms:</strong> Part-whole relationships (e.g., car → engine, wheels)</li>
                          <li><strong>Holonyms:</strong> Whole-part relationships (e.g., wheel → car)</li>
                          <li><strong>Troponyms:</strong> Manner relationships (e.g., walk → stroll, march)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="semantic-features">
                      <h4>Semantic Features</h4>
                      <div className="features-grid">
                        <div className="feature-item">
                          <span className="feature-label">Abstractness:</span>
                          <span className="feature-value">Concrete</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-label">Animacy:</span>
                          <span className="feature-value">Inanimate</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-label">Countability:</span>
                          <span className="feature-value">Countable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching && searchTerm && ready ? (
            <div className="no-results">
              No relationships found for "{searchTerm}"
            </div>
          ) : null}
        </div>
      </div>
    </DemoPage>
  );
};
