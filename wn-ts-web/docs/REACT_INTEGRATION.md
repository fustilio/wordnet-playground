# React Integration Guide for `wn-ts-web`

This guide provides comprehensive patterns and examples for integrating `wn-ts-web` into React applications, including OPFS optimization and state management.

## Table of Contents

1. [Basic React Hook Pattern](#basic-react-hook-pattern)
2. [React Component Examples](#react-component-examples)
3. [OPFS Integration in React](#opfs-integration-in-react)
4. [Server Configuration for OPFS](#server-configuration-for-opfs)
5. [Advanced React Patterns](#advanced-react-patterns)
6. [Error Handling and Loading States](#error-handling-and-loading-states)

---

## Basic React Hook Pattern

Create a custom hook to manage WordNet state:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { createWordNetInstance } from 'wn-ts-web';

interface WordNetState {
  wordnet: any | null;
  dataLoader: any | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export function useWordNet(lexiconId = 'oewn:2024') {
  const [state, setState] = useState<WordNetState>({
    wordnet: null,
    dataLoader: null,
    isLoading: false,
    error: null,
    progress: 0
  });

  const initializeWordNet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { wordnet, dataLoader } = await createWordNetInstance(lexiconId);
      
      setState(prev => ({ 
        ...prev, 
        wordnet, 
        dataLoader, 
        isLoading: false 
      }));
      
      // Load data with progress tracking
      await dataLoader.downloadAndLoad(lexiconId, {
        onProgress: (progress: number) => {
          setState(prev => ({ ...prev, progress }));
        }
      });
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, [lexiconId]);

  const searchWord = useCallback(async (word: string, pos?: string) => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    
    const synsets = await state.wordnet.synsets(word, pos);
    return synsets;
  }, [state.wordnet]);

  useEffect(() => {
    initializeWordNet();
  }, [initializeWordNet]);

  return {
    ...state,
    searchWord,
    initializeWordNet
  };
}
```

## React Component Examples

### Basic Search Component

```typescript
import React, { useState } from 'react';
import { useWordNet } from './useWordNet';

export function WordNetSearch() {
  const { wordnet, isLoading, error, progress, searchWord } = useWordNet();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const synsets = await searchWord(searchTerm);
      setResults(synsets);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2>Loading WordNet...</h2>
        <progress value={progress} max={1}>
          {Math.round(progress * 100)}%
        </progress>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>WordNet Search</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter a word..."
      />
      <button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>
      
      {results.length > 0 && (
        <div>
          <h3>Results for "{searchTerm}":</h3>
          <ul>
            {results.map((synset, index) => (
              <li key={index}>
                <strong>ID:</strong> {synset.id} | 
                <strong>POS:</strong> {synset.pos}
                {synset.definitions && (
                  <div>
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

### Advanced Search with Multiple Query Types

```typescript
import React, { useState } from 'react';
import { useWordNet } from './useWordNet';

interface SearchResult {
  type: 'synsets' | 'senses' | 'words';
  data: any[];
}

export function AdvancedWordNetSearch() {
  const { wordnet, isLoading, error, searchWord } = useWordNet();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'synsets' | 'senses' | 'words'>('synsets');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim() || !wordnet) return;
    
    setIsSearching(true);
    try {
      let data;
      switch (searchType) {
        case 'synsets':
          data = await wordnet.synsets(searchTerm);
          break;
        case 'senses':
          data = await wordnet.senses(searchTerm);
          break;
        case 'words':
          data = await wordnet.words(searchTerm);
          break;
      }
      
      setResults({ type: searchType, data });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return <div>Loading WordNet...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Advanced WordNet Search</h2>
      
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a word..."
        />
        
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value as any)}
        >
          <option value="synsets">Synsets</option>
          <option value="senses">Senses</option>
          <option value="words">Words</option>
        </select>
        
        <button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {results && (
        <div>
          <h3>{searchType.charAt(0).toUpperCase() + searchType.slice(1)} for "{searchTerm}":</h3>
          <p>Found {results.data.length} results</p>
          <ul>
            {results.data.slice(0, 10).map((item, index) => (
              <li key={index}>
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## OPFS Integration in React

For optimal performance with OPFS, create a dedicated hook:

```typescript
import { useState, useEffect } from 'react';
import { createWordNetInstance } from 'wn-ts-web';

export function useWordNetWithOPFS() {
  const [isOPFSSupported, setIsOPFSSupported] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [wordnet, setWordnet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const initializeWithOPFS = async (lexiconId = 'oewn:2024') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { wordnet: wn, dataLoader } = await createWordNetInstance(lexiconId);
      
      // Load data - will automatically use OPFS if available
      await dataLoader.downloadAndLoad(lexiconId, {
        onProgress: (progress) => {
          console.log(`Loading progress: ${(progress * 100).toFixed(2)}%`);
        }
      });
      
      setWordnet(wn);
      return wn;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to initialize WordNet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOPFSSupported,
    storageInfo,
    wordnet,
    isLoading,
    error,
    initializeWithOPFS
  };
}
```

### OPFS Status Component

```typescript
import React from 'react';
import { useWordNetWithOPFS } from './useWordNetWithOPFS';

export function OPFSStatus() {
  const { isOPFSSupported, storageInfo, isLoading, error } = useWordNetWithOPFS();

  return (
    <div>
      <h3>Storage Status</h3>
      
      <div>
        <strong>OPFS Support:</strong> {isOPFSSupported ? '✅ Supported' : '❌ Not Supported'}
      </div>
      
      {storageInfo && (
        <div>
          <h4>Storage Information:</h4>
          <ul>
            <li><strong>Used:</strong> {storageInfo.usage ? `${(storageInfo.usage / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</li>
            <li><strong>Quota:</strong> {storageInfo.quota ? `${(storageInfo.quota / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</li>
            <li><strong>Available:</strong> {storageInfo.quota && storageInfo.usage ? `${((storageInfo.quota - storageInfo.usage) / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</li>
          </ul>
        </div>
      )}
      
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## Server Configuration for OPFS

To enable OPFS in your React application, your development server must include the required headers.

### Vite Configuration

Add this to your `vite.config.ts`:

```typescript
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

### Create React App

For Create React App, you'll need to eject or use a custom development server. Alternatively, use a proxy:

```typescript
// setupProxy.js
module.exports = function(app) {
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });
};
```

### Production Server Configuration

#### Nginx

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

#### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/your/react/app
    
    <Directory /path/to/your/react/app>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # OPFS headers
        Header always set Cross-Origin-Opener-Policy "same-origin"
        Header always set Cross-Origin-Embedder-Policy "require-corp"
    </Directory>
</VirtualHost>
```

## Advanced React Patterns

### Context Provider Pattern

For applications that need WordNet functionality across multiple components:

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useWordNet } from './useWordNet';

interface WordNetContextType {
  wordnet: any | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  searchWord: (word: string, pos?: string) => Promise<any>;
}

const WordNetContext = createContext<WordNetContextType | null>(null);

export function WordNetProvider({ children, lexiconId = 'oewn:2024' }: { 
  children: ReactNode; 
  lexiconId?: string; 
}) {
  const wordNetState = useWordNet(lexiconId);
  
  return (
    <WordNetContext.Provider value={wordNetState}>
      {children}
    </WordNetContext.Provider>
  );
}

export function useWordNetContext() {
  const context = useContext(WordNetContext);
  if (!context) {
    throw new Error('useWordNetContext must be used within a WordNetProvider');
  }
  return context;
}
```

### Usage with Context

```typescript
import React from 'react';
import { WordNetProvider, useWordNetContext } from './WordNetContext';

function SearchComponent() {
  const { searchWord, isLoading, error } = useWordNetContext();
  // ... component logic
}

function App() {
  return (
    <WordNetProvider lexiconId="oewn:2024">
      <SearchComponent />
      {/* Other components can also use useWordNetContext() */}
    </WordNetProvider>
  );
}
```

### Custom Hook with Caching

```typescript
import { useState, useCallback, useRef } from 'react';
import { useWordNet } from './useWordNet';

export function useWordNetWithCache() {
  const { wordnet, isLoading, error, searchWord } = useWordNet();
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
    const results = await searchWord(word, pos);
    
    // Cache results
    setCache(prev => new Map(prev.set(cacheKey, results)));
    setSearchHistory(prev => [cacheKey, ...prev.slice(0, 9)]);
    
    return results;
  }, [wordnet, searchWord, cache]);

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

## Error Handling and Loading States

### Comprehensive Error Handling

```typescript
import React, { useState } from 'react';
import { useWordNet } from './useWordNet';

export function RobustWordNetSearch() {
  const { wordnet, isLoading, error, searchWord } = useWordNet();
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
      const synsets = await searchWord(searchTerm);
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
import React from 'react';
import { useWordNet } from './useWordNet';

export function WordNetWithProgress() {
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

## Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: The library gracefully falls back to in-memory storage when OPFS is not available

## Best Practices

1. **Always handle loading states** - Users need feedback during initialization
2. **Implement proper error boundaries** - React error boundaries for component-level error handling
3. **Use OPFS when available** - Better performance and persistence
4. **Cache search results** - Improve user experience for repeated searches
5. **Provide fallbacks** - Graceful degradation when features aren't supported
6. **Test across browsers** - Ensure compatibility with your target browsers


