/**
 * React Example demonstrating the new kernel-based WordNet architecture
 * 
 * This example shows how to use the new WordNetKernelProvider and useWordNetKernel
 * hook with the plugin system for relations, similarity, and translation.
 */

import React, { useState, useEffect } from 'react';
import { 
  WordNetKernelProvider, 
  useWordNetKernelContext 
} from '../src/react/index.js';

// Example component that uses the kernel architecture
const WordNetKernelDemo: React.FC = () => {
  const {
    wordnet,
    loading,
    error,
    initialized,
    initialize,
    close,
    words,
    synsets,
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getTranslations,
    getPlugins,
    has
  } = useWordNetKernelContext();

  const [searchTerm, setSearchTerm] = useState('computer');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSynset, setSelectedSynset] = useState<any>(null);
  const [relations, setRelations] = useState<any[]>([]);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [translations, setTranslations] = useState<any[]>([]);

  // Initialize the kernel on mount
  useEffect(() => {
    if (!initialized && !loading) {
      initialize('oewn:2024');
    }
  }, [initialized, loading, initialize]);

  // Search for words
  const handleSearch = async () => {
    if (!initialized) return;
    
    try {
      const wordResults = await words({ form: searchTerm });
      setSearchResults(wordResults);
      
      if (wordResults.length > 0) {
        const synsetResults = await synsets({ wordId: wordResults[0].id });
        if (synsetResults.length > 0) {
          setSelectedSynset(synsetResults[0]);
          await loadSynsetData(synsetResults[0]);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // Load synset-related data
  const loadSynsetData = async (synset: any) => {
    if (!initialized) return;
    
    try {
      // Load relations
      const hypernyms = await getHypernyms(synset.id);
      const hyponyms = await getHyponyms(synset.id);
      setRelations([...hypernyms, ...hyponyms]);

      // Load translations
      const translationResults = await getTranslations(synset.id);
      setTranslations(translationResults);

      // Calculate similarity with first hypernym if available
      if (hypernyms.length > 0) {
        const sim = await getPathSimilarity(synset.id, hypernyms[0].id);
        setSimilarity(sim);
      }
    } catch (err) {
      console.error('Failed to load synset data:', err);
    }
  };

  // Handle synset selection
  const handleSynsetSelect = async (synset: any) => {
    setSelectedSynset(synset);
    await loadSynsetData(synset);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>WordNet Kernel Demo</h2>
        <p>Initializing WordNet kernel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>WordNet Kernel Demo</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={() => initialize('oewn:2024')}>
          Retry Initialization
        </button>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>WordNet Kernel Demo</h2>
        <p>WordNet kernel not initialized</p>
        <button onClick={() => initialize('oewn:2024')}>
          Initialize WordNet Kernel
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🚀 WordNet Kernel Architecture Demo</h2>
      
      {/* Plugin Information */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>🔌 Available Plugins</h3>
        <p>Plugins: {getPlugins().join(', ')}</p>
        <p>Has Relations Plugin: {has('relations') ? '✅' : '❌'}</p>
        <p>Has Similarity Plugin: {has('similarity') ? '✅' : '❌'}</p>
        <p>Has Translation Plugin: {has('translation') ? '✅' : '❌'}</p>
      </div>

      {/* Search Interface */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🔍 Search Words</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter a word..."
            style={{ padding: '8px', flex: 1 }}
          />
          <button onClick={handleSearch} style={{ padding: '8px 16px' }}>
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📝 Search Results</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {searchResults.map((word, index) => (
              <div
                key={index}
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9'
                }}
                onClick={() => handleSynsetSelect(word)}
              >
                {word.lemma} ({word.pos})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Synset Information */}
      {selectedSynset && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📚 Selected Synset</h3>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <p><strong>ID:</strong> {selectedSynset.id}</p>
            <p><strong>POS:</strong> {selectedSynset.pos}</p>
            {selectedSynset.definitions && selectedSynset.definitions.length > 0 && (
              <p><strong>Definition:</strong> {selectedSynset.definitions[0].text}</p>
            )}
          </div>
        </div>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🔗 Relations</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {relations.slice(0, 10).map((relation, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {relation.lemma} ({relation.pos})
              </span>
            ))}
            {relations.length > 10 && (
              <span style={{ color: '#666' }}>
                ... and {relations.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Similarity */}
      {similarity !== null && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Similarity</h3>
          <p>Path Similarity: {similarity.toFixed(3)}</p>
        </div>
      )}

      {/* Translations */}
      {translations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🌍 Translations</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {translations.slice(0, 10).map((translation, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f3e5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {translation.lemma} ({translation.language})
              </span>
            ))}
            {translations.length > 10 && (
              <span style={{ color: '#666' }}>
                ... and {translations.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={close} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close WordNet Kernel
        </button>
      </div>
    </div>
  );
};

// Main App component with provider
const App: React.FC = () => {
  return (
    <WordNetKernelProvider lexicon="oewn:2024">
      <WordNetKernelDemo />
    </WordNetKernelProvider>
  );
};

export default App;


