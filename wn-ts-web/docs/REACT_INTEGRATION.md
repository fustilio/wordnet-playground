# React Integration Guide for `wn-ts-web`

This guide provides comprehensive patterns and examples for integrating `wn-ts-web` into React applications, including OPFS optimization and state management.

> Note: Run `wn-ts-web` inside a Web Worker. This keeps SQLite/OPFS and heavy operations off the UI thread. You can use plain Workers or libraries like Comlink to simplify messaging.

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

### Comlink-based worker (concise example)

Main thread:

```ts
import { wrap } from 'comlink';

const worker = new Worker(new URL('./wordnet.worker.ts', import.meta.url), { type: 'module' });
const api = wrap<any>(worker);

await api.initialize('oewn:2024');
const results = await api.synsets('joy', 'n');
```

Worker (`wordnet.worker.ts`):

```ts
import { expose } from 'comlink';
import { createWordNetInstance } from 'wn-ts-web';

let wordnet: any;
let dataLoader: any;

async function initialize(lexiconId = 'oewn:2024') {
  const res = await createWordNetInstance(lexiconId);
  wordnet = res.wordnet;
  dataLoader = res.dataLoader;
}

async function synsets(lemma: string, pos?: string) {
  return wordnet.synsets(lemma, pos);
}

expose({ initialize, synsets });
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

### Lexicon Introspection and Resource Analysis

The library provides comprehensive introspection capabilities for understanding resource types and capabilities:

```typescript
import React, { useState, useEffect } from 'react';
import { useWordNet } from 'wn-ts-web/react';

interface LexiconIntrospection {
  id: string;
  label: string;
  language: string;
  version: string;
  type: 'lexicon' | 'ili';
  wordCount: number;
  synsetCount: number;
  senseCount: number;
  iliCount?: number;
  hasILIMappings: boolean;
  crossLingualLinks?: number;
}

interface CrossLingualAnalysis {
  supportedLanguages: string[];
  primaryLanguage: string;
  totalILIMappings: number;
  conceptCoverage: {
    total: number;
    fullyMapped: number;
    partiallyMapped: number;
    unmapped: number;
  };
}

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
  const [loading, setLoading] = useState(false);

  const handleIntrospectLexicon = async (lexiconId: string) => {
    try {
      setLoading(true);
      const info = await introspectLexicon(lexiconId);
      setLexiconInfo(info);
      console.log(`${lexiconId} introspection:`, info);
    } catch (error) {
      console.error('Introspection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntrospectAll = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Lexicon Introspection</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button 
            onClick={() => handleIntrospectLexicon('oewn:2024')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Introspect OEWN
          </button>
          <button 
            onClick={() => handleIntrospectLexicon('cili:1.0')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Introspect CILI
          </button>
          <button 
            onClick={handleIntrospectAll}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Introspect All Resources
          </button>
        </div>

        {loading && <div className="text-gray-600">Loading introspection data...</div>}

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
              <div><span className="font-medium">Version:</span> {lexiconInfo.version}</div>
              <div><span className="font-medium">Words:</span> {lexiconInfo.wordCount.toLocaleString()}</div>
              <div><span className="font-medium">Synsets:</span> {lexiconInfo.synsetCount.toLocaleString()}</div>
              <div><span className="font-medium">Senses:</span> {lexiconInfo.senseCount.toLocaleString()}</div>
              {lexiconInfo.type === 'ili' && (
                <div><span className="font-medium">ILI Count:</span> {lexiconInfo.iliCount?.toLocaleString()}</div>
              )}
              <div><span className="font-medium">Has ILI Mappings:</span> {lexiconInfo.hasILIMappings ? '✅ Yes' : '❌ No'}</div>
              {lexiconInfo.crossLingualLinks && (
                <div><span className="font-medium">Cross-lingual Links:</span> {lexiconInfo.crossLingualLinks.toLocaleString()}</div>
              )}
            </div>
          </div>
        )}

        {allResources.length > 0 && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">All Resources ({allResources.length})</h4>
            <div className="space-y-2">
              {allResources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{resource.id}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      resource.type === 'lexicon' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {resource.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {resource.language} • {resource.wordCount.toLocaleString()} words
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {crossLingualAnalysis && (
          <div className="border border-gray-200 p-4 rounded-lg bg-blue-50">
            <h4 className="font-medium text-gray-900 mb-3">Cross-Lingual Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Supported Languages:</span>
                <div className="mt-1">
                  {crossLingualAnalysis.supportedLanguages.map(lang => (
                    <span key={lang} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1 mb-1">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div><span className="font-medium">Primary Language:</span> {crossLingualAnalysis.primaryLanguage}</div>
              <div><span className="font-medium">Total ILI Mappings:</span> {crossLingualAnalysis.totalILIMappings.toLocaleString()}</div>
              <div><span className="font-medium">Fully Mapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.fullyMapped.toLocaleString()}</div>
              <div><span className="font-medium">Partially Mapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.partiallyMapped.toLocaleString()}</div>
              <div><span className="font-medium">Unmapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.unmapped.toLocaleString()}</div>
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

// Usage in other components
function LexiconCard({ lexiconId }: { lexiconId: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{lexiconId}</h3>
        <ResourceTypeIndicator lexiconId={lexiconId} />
      </div>
      {/* Rest of component */}
    </div>
  );
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


