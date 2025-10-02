# Web Usage Guide

## 📖 **Overview**

This guide provides comprehensive patterns and examples for using `wn-ts-web` in browser applications, including React integration, worker patterns, and advanced usage scenarios.

## 🚀 **Quick Start**

### Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

### Basic Setup

```typescript
import { useWordNet } from 'wn-ts-web/react';

function WordNetApp() {
  const { 
    loading, 
    error, 
    loadPackageData, 
    queryWords 
  } = useWordNet();

  useEffect(() => {
    loadPackageData('oewn:2024');
  }, []);

  const handleSearch = async (term: string) => {
    const results = await queryWords(term);
    console.log('Results:', results);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => handleSearch('computer')}>
        Search for "computer"
      </button>
    </div>
  );
}
```

## ⚛️ **React Integration Patterns**

### Basic Hook Usage

```typescript
import { useWordNet } from 'wn-ts-web/react';

function WordNetComponent() {
  const { 
    wordnet, 
    loading, 
    error, 
    loadPackageData, 
    queryWords,
    statistics,
    introspectLexicon 
  } = useWordNet();

  // Component logic
}
```

### Context Provider Pattern

```typescript
import { WordNetConfigProvider, WordNetProvider, useWordNetContext } from 'wn-ts-web/react';

function SearchComponent() {
  const { queryWords, loading, error } = useWordNetContext();
  // Use context methods
}

function App() {
  return (
    <WordNetConfigProvider config={{ enableWorkers: true }}>
      <WordNetProvider>
        <SearchComponent />
      </WordNetProvider>
    </WordNetConfigProvider>
  );
}
```

### Custom Hooks

```typescript
import { useState, useCallback, useRef } from 'react';
import { useWordNet } from 'wn-ts-web/react';

export function useWordNetWithCache() {
  const { wordnet, isLoading, error, queryWords } = useWordNet();
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const searchWithCache = useCallback(async (word: string, pos?: string) => {
    const cacheKey = `${word}:${pos || 'all'}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      setSearchHistory(prev => [cacheKey, ...prev.slice(0, 9)]);
      return cache.get(cacheKey);
    }
    
    // Perform search
    const results = await queryWords(word, pos);
    
    // Cache results
    setCache(prev => new Map(prev.set(cacheKey, results)));
    setSearchHistory(prev => [cacheKey, ...prev.slice(0, 9)]);
    
    return results;
  }, [wordnet, queryWords, cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    setSearchHistory([]);
  }, []);

  return {
    searchWithCache,
    clearCache,
    searchHistory,
    cacheSize: cache.size,
    isLoading,
    error
  };
}
```

## 🔧 **Worker Architecture**

### Worker-First Principles

The library uses a worker-first architecture where all heavy operations are handled by Web Workers:

```typescript
// ❌ Wrong: Direct access to DataLoader
const dataLoader = useDataLoader();
await dataLoader.downloadAndLoad('oewn:2024');

// ✅ Correct: Through worker
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');
```

### Worker Readiness

Always check if the worker is ready before calling worker-dependent methods:

```typescript
const { workerReady, loadPackageData, getCacheInfo } = useWordNet();

// Check worker readiness
if (workerReady) {
  await loadPackageData('oewn:2024');
  const cacheInfo = await getCacheInfo();
} else {
  console.log('Worker not ready yet, please wait...');
}
```

### Automatic Queue Management

Requests are automatically queued if the worker isn't ready:

```typescript
const { workerReady, hasPendingLoads, loadPackageData } = useWordNet();

// This will be queued if worker isn't ready yet
await loadPackageData('oewn:2024');

// Check if there are pending loads
if (hasPendingLoads()) {
  console.log('Package load request queued, waiting for worker...');
}

// The queued request will be automatically processed when worker becomes ready
```

## 🗄️ **Storage & Persistence**

### OPFS Integration

For optimal performance with OPFS, create a dedicated hook:

```typescript
import { useState, useEffect } from 'react';
import { useWordNet } from 'wn-ts-web/react';

export function useWordNetWithOPFS() {
  const [isOPFSSupported, setIsOPFSSupported] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const { wordnet, isLoading, error, loadPackageData } = useWordNet();

  useEffect(() => {
    // Check OPFS support
    const checkOPFSSupport = async () => {
      try {
        // Test OPFS access
        const root = await navigator.storage.getDirectory();
        setIsOPFSSupported(true);
        
        // Get storage quota information
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          setStorageInfo(estimate);
        }
      } catch (error) {
        console.warn('OPFS not supported, falling back to in-memory storage');
        setIsOPFSSupported(false);
      }
    };

    checkOPFSSupport();
  }, []);

  return {
    isOPFSSupported,
    storageInfo,
    wordnet,
    isLoading,
    error,
    loadPackageData
  };
}
```

### Server Configuration for OPFS

To enable OPFS, your server must include these headers:

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
```

#### Production Server (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/your/react/app;
        try_files $uri $uri/ /index.html;
        
        # OPFS headers
        add_header Cross-Origin-Opener-Policy same-origin;
        add_header Cross-Origin-Embedder-Policy require-corp;
    }
}
```

## 🌐 **Cross-Lingual Operations**

### Resource Introspection

The library provides comprehensive introspection capabilities:

```typescript
function LexiconIntrospectionDemo() {
  const { 
    introspectLexicon, 
    introspectAllResources, 
    categorizeResources,
    analyzeCrossLingualCapabilities 
  } = useWordNet();
  
  const [lexiconInfo, setLexiconInfo] = useState<LexiconIntrospection | null>(null);
  const [allResources, setAllResources] = useState<LexiconIntrospection[]>([]);
  const [crossLingualAnalysis, setCrossLingualAnalysis] = useState<CrossLingualAnalysis | null>(null);

  const handleIntrospectLexicon = async (lexiconId: string) => {
    try {
      const info = await introspectLexicon(lexiconId);
      setLexiconInfo(info);
      console.log(`${lexiconId} introspection:`, info);
      console.log('Real sense count:', info.senseCount); // No more placeholder 0!
    } catch (error) {
      console.error('Introspection failed:', error);
    }
  };

  const handleIntrospectAll = async () => {
    try {
      const [resources, analysis] = await Promise.all([
        introspectAllResources(),
        analyzeCrossLingualCapabilities()
      ]);
      
      setAllResources(resources);
      setCrossLingualAnalysis(analysis);
      
      console.log('All resources:', resources);
      console.log('Cross-lingual analysis:', analysis);
    } catch (error) {
      console.error('Full introspection failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Lexicon Introspection</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button 
            onClick={() => handleIntrospectLexicon('oewn:2024')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Introspect OEWN
          </button>
          <button 
            onClick={() => handleIntrospectLexicon('cili:1.0')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Introspect CILI
          </button>
          <button 
            onClick={handleIntrospectAll}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Introspect All Resources
          </button>
        </div>

        {lexiconInfo && (
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">
              Lexicon Info: {lexiconInfo.id}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  lexiconInfo.type === 'lexicon' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {lexiconInfo.type.toUpperCase()}
                </span>
              </div>
              <div><span className="font-medium">Language:</span> {lexiconInfo.language}</div>
              <div><span className="font-medium">Words:</span> {lexiconInfo.wordCount.toLocaleString()}</div>
              <div><span className="font-medium">Synsets:</span> {lexiconInfo.synsetCount.toLocaleString()}</div>
              <div><span className="font-medium">Senses:</span> {lexiconInfo.senseCount.toLocaleString()}</div>
              <div><span className="font-medium">Has ILI Mappings:</span> {lexiconInfo.hasILIMappings ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Resource Type-Aware Components

Create components that automatically adapt based on resource types:

```typescript
function ResourceTypeIndicator({ lexiconId }: { lexiconId: string }) {
  const { introspectLexicon } = useWordNet();
  const [resourceType, setResourceType] = useState<'lexicon' | 'ili' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getResourceType = async () => {
      try {
        const info = await introspectLexicon(lexiconId);
        setResourceType(info.type);
      } catch (error) {
        console.error('Failed to get resource type:', error);
      } finally {
        setLoading(false);
      }
    };

    getResourceType();
  }, [lexiconId, introspectLexicon]);

  if (loading) return <div className="text-gray-400">...</div>;
  if (!resourceType) return null;

  const typeConfig = {
    lexicon: { label: 'Lexicon', color: 'bg-blue-100 text-blue-800', icon: '📚' },
    ili: { label: 'ILI Index', color: 'bg-green-100 text-green-800', icon: '🌐' }
  };

  const config = typeConfig[resourceType];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
```

## 🔍 **Advanced Query Patterns**

### Multi-Lexicon Queries

```typescript
function MultiLexiconSearch() {
  const { queryWords, loadPackageData } = useWordNet();
  const [results, setResults] = useState<Record<string, any[]>>({});

  const searchAcrossLexicons = async (term: string) => {
    const lexicons = ['oewn:2024', 'wn31:3.1'];
    const results: Record<string, any[]> = {};

    for (const lexicon of lexicons) {
      try {
        await loadPackageData(lexicon);
        const words = await queryWords(term);
        results[lexicon] = words;
      } catch (error) {
        console.error(`Failed to search in ${lexicon}:`, error);
        results[lexicon] = [];
      }
    }

    setResults(results);
  };

  return (
    <div>
      <button onClick={() => searchAcrossLexicons('computer')}>
        Search Across All Lexicons
      </button>
      
      {Object.entries(results).map(([lexicon, words]) => (
        <div key={lexicon}>
          <h3>{lexicon}: {words.length} results</h3>
          <ul>
            {words.slice(0, 5).map((word, i) => (
              <li key={i}>{word.lemma} ({word.pos})</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Semantic Similarity

```typescript
function SimilaritySearch() {
  const { queryWords, getPathSimilarity } = useWordNet();
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);

  const calculateSimilarity = async () => {
    try {
      const words1 = await queryWords(word1);
      const words2 = await queryWords(word2);
      
      if (words1.length > 0 && words2.length > 0) {
        const sim = await getPathSimilarity(words1[0].id, words2[0].id);
        setSimilarity(sim);
      }
    } catch (error) {
      console.error('Similarity calculation failed:', error);
    }
  };

  return (
    <div>
      <input 
        value={word1} 
        onChange={(e) => setWord1(e.target.value)} 
        placeholder="First word"
      />
      <input 
        value={word2} 
        onChange={(e) => setWord2(e.target.value)} 
        placeholder="Second word"
      />
      <button onClick={calculateSimilarity}>
        Calculate Similarity
      </button>
      
      {similarity !== null && (
        <div>
          Similarity: {similarity.toFixed(3)}
        </div>
      )}
    </div>
  );
}
```

## 🚨 **Error Handling & Loading States**

### Comprehensive Error Handling

```typescript
function RobustWordNetSearch() {
  const { wordnet, isLoading, error, queryWords } = useWordNet();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError('Please enter a search term');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const synsets = await queryWords(searchTerm);
      setResults(synsets);
      
      if (synsets.length === 0) {
        setSearchError(`No results found for "${searchTerm}"`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <h2>Initializing WordNet...</h2>
        <div className="loading-spinner"></div>
        <p>This may take a few moments on first load</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to Initialize WordNet</h2>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>WordNet Search</h2>
      
      <div className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a word..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch} 
          disabled={isSearching || !searchTerm.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {searchError && (
        <div className="search-error">
          {searchError}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="results">
          <h3>Results for "{searchTerm}" ({results.length} found):</h3>
          <ul>
            {results.map((synset, index) => (
              <li key={index} className="result-item">
                <strong>ID:</strong> {synset.id} | 
                <strong>POS:</strong> {synset.pos}
                {synset.definitions && (
                  <div className="definitions">
                    <strong>Definitions:</strong>
                    <ul>
                      {synset.definitions.map((def: any, i: number) => (
                        <li key={i}>{def.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Loading States with Progress

```typescript
function WordNetWithProgress() {
  const { wordnet, isLoading, error, progress } = useWordNet();

  if (isLoading) {
    return (
      <div className="loading-container">
        <h2>Loading WordNet Database</h2>
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
        <p>{Math.round(progress * 100)}% complete</p>
        <p>Downloading and processing WordNet data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Loading Failed</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="ready-container">
      <h2>WordNet Ready!</h2>
      <p>The database has been loaded successfully.</p>
      {/* Your search components here */}
    </div>
  );
}
```

## 🧪 **Testing Patterns**

### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useWordNet } from 'wn-ts-web/react';

// Mock the hook
jest.mock('wn-ts-web/react', () => ({
  useWordNet: () => ({
    loading: false,
    error: null,
    queryWords: jest.fn().mockResolvedValue([
      { id: 'word-1', lemma: 'computer', pos: 'n' }
    ]),
    loadPackageData: jest.fn().mockResolvedValue(undefined)
  })
}));

test('renders search component', async () => {
  render(<WordNetSearch />);
  
  const input = screen.getByPlaceholderText('Enter a word...');
  const button = screen.getByText('Search');
  
  fireEvent.change(input, { target: { value: 'computer' } });
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('computer')).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
import { createWordNetInstance } from 'wn-ts-web';

test('loads and queries data', async () => {
  const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');
  
  await dataLoader.downloadAndLoad('oewn:2024');
  
  const words = await wordnet.words('computer');
  expect(words).toHaveLength(1);
  expect(words[0].lemma).toBe('computer');
});
```

## 🔧 **Performance Optimization**

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const WordNetSearch = lazy(() => import('./WordNetSearch'));

function App() {
  return (
    <Suspense fallback={<div>Loading search component...</div>}>
      <WordNetSearch />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo } from 'react';

const WordNetResults = memo(({ results }: { results: any[] }) => {
  const processedResults = useMemo(() => {
    return results.map(result => ({
      ...result,
      displayText: `${result.lemma} (${result.pos})`
    }));
  }, [results]);

  return (
    <ul>
      {processedResults.map((result, index) => (
        <li key={index}>{result.displayText}</li>
      ))}
    </ul>
  );
});
```

## 🌐 **Browser Compatibility**

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: The library gracefully falls back to in-memory storage when OPFS is not available

## 📚 **Best Practices**

1. **Always handle loading states** - Users need feedback during initialization
2. **Implement proper error boundaries** - React error boundaries for component-level error handling
3. **Use OPFS when available** - Better performance and persistence
4. **Cache search results** - Improve user experience for repeated searches
5. **Provide fallbacks** - Graceful degradation when features aren't supported
6. **Test across browsers** - Ensure compatibility with your target browsers
7. **Use worker-first patterns** - Never bypass the worker for heavy operations
8. **Handle worker readiness** - Always check if worker is ready before operations

---

**This usage guide provides comprehensive patterns and examples for building robust WordNet applications in the browser.**
