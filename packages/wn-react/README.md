# wn-react

React hooks and components for the WordNet TypeScript ecosystem with simplified APIs and auto-initialization.

## Features

- **Simplified Hooks** - Easy-to-use React hooks for WordNet operations
- **Auto-Initialization** - Works out of the box, no setup required
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Plugin Support** - Optional plugins for advanced functionality
- **Better Errors** - User-friendly error messages with solutions
- **Performance** - Optimized for React applications

## Installation

```bash
npm install wn-react wn-ts-web @sqlite.org/sqlite-wasm
```

## Usage

### Basic Usage (Recommended)

```typescript
import { useWordNet } from 'wn-react';

function MyComponent() {
  const { search, loading, error } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const handleSearch = async (term: string) => {
    const results = await search(term);
    console.log(results);
  };
  
  if (loading) return <div>Loading WordNet...</div>;
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

### Advanced Usage

```typescript
import { useWordNetContext } from 'wn-react';

function MyComponent() {
  const {
    // Core methods
    search,
    words,
    synsets,
    senses,
    
    // Plugin methods (if enabled)
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getTranslations,
    
    // State
    loading,
    error,
    initialized,
    
    // Advanced (if needed)
    lexicons,
    getStatistics
  } = useWordNetContext();
  
  // Use the methods
}
```

### With Providers

```typescript
import { WordNetProvider } from 'wn-react';

function App() {
  return (
    <WordNetProvider 
      lexicon="oewn:2024"
      options={{
        enableWorkers: true,
        storage: 'opfs'
      }}
    >
      <MyComponent />
    </WordNetProvider>
  );
}
```

## API Reference

### Hooks

#### useWordNet(options?)

**Main hook** for React applications.

```typescript
const {
  // Core methods
  search,
  words,
  synsets,
  senses,
  
  // Plugin methods (if enabled)
  getHypernyms,
  getHyponyms,
  getPathSimilarity,
  getTranslations,
  
  // State
  loading,
  error,
  initialized
} = useWordNet({ 
  lexicon: 'oewn:2024',
  autoInitialize: true 
});
```

#### useWordNetContext()

**Advanced hook** for complex applications with full API access.

```typescript
const {
  // All methods from useWordNet() plus:
  query: { words, synsets, senses },
  plugins: { getHypernyms, getHyponyms, ... },
  packages: { load, unload, refresh },
  admin: { introspect, validate, analyze },
  state: { loadedPackages, statistics, workerReady }
} = useWordNetContext();
```

### Providers

#### WordNetProvider

Context provider for WordNet functionality.

```typescript
interface WordNetProviderProps {
  children: React.ReactNode;
  lexicon?: string | string[];
  options?: {
    enableWorkers?: boolean;
    storage?: 'opfs' | 'indexeddb' | 'memory';
    cacheSize?: number;
  };
}
```

## Examples

### Simple Search Component

```typescript
import { useWordNet } from 'wn-react';
import { useState } from 'react';

function SearchComponent() {
  const { search, loading, error } = useWordNet();
  const [results, setResults] = useState([]);
  const [term, setTerm] = useState('');

  const handleSearch = async () => {
    const synsets = await search(term);
    setResults(synsets);
  };

  return (
    <div>
      <input 
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Enter a word..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {error && <div>Error: {error}</div>}
      
      {results.map(synset => (
        <div key={synset.id}>
          <h3>{synset.id}</h3>
          <p>{synset.definitions[0]?.text}</p>
        </div>
      ))}
    </div>
  );
}
```

### Word Relationships Component

```typescript
import { useWordNet } from 'wn-react';
import { useState, useEffect } from 'react';

function RelationshipsComponent({ synsetId }: { synsetId: string }) {
  const { getHypernyms, getHyponyms, loading } = useWordNet();
  const [hypernyms, setHypernyms] = useState([]);
  const [hyponyms, setHyponyms] = useState([]);

  useEffect(() => {
    const loadRelations = async () => {
      const [hypernymsData, hyponymsData] = await Promise.all([
        getHypernyms(synsetId),
        getHyponyms(synsetId)
      ]);
      setHypernyms(hypernymsData);
      setHyponyms(hyponymsData);
    };
    
    loadRelations();
  }, [synsetId, getHypernyms, getHyponyms]);

  if (loading) return <div>Loading relationships...</div>;

  return (
    <div>
      <h3>Hypernyms (broader concepts)</h3>
      <ul>
        {hypernyms.map(rel => (
          <li key={rel.id}>{rel.lemma}</li>
        ))}
      </ul>
      
      <h3>Hyponyms (narrower concepts)</h3>
      <ul>
        {hyponyms.map(rel => (
          <li key={rel.id}>{rel.lemma}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Migration from v0.7.x

If you're upgrading from v0.7.x, see the [Migration Guide](../../docs/getting-started/migration-guide-v1.md).

### Key Changes

- **Package**: `wn-ts-web/react` → `wn-react`
- **Hook**: `useWordNetContext()` → `useWordNet()`
- **Method**: `querySynsets()` → `search()`
- **Initialization**: Manual → Auto-initialization

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Further Reading

- [API Reference](../../docs/api/api-reference.md)
- [Web Platform Guide](../../docs/platforms/web/)
- [Examples](../../examples/web/)
- [Migration Guide](../../docs/getting-started/migration-guide-v1.md)

---

**Ready to build your React app? Check out the [Examples](../../examples/web/) to see it in action!**

