---
title: Web API Reference
description: Complete API reference for the WordNet TypeScript web platform
---

# Web API Reference

Complete API reference for the WordNet TypeScript web platform, including React hooks, components, and core functionality.

## Quick Start

```typescript
import { useWordNet } from 'wn-ts-web';

function MyApp() {
  const { wordnet, loading, error, queryWords } = useWordNet();
  
  const handleSearch = async (term: string) => {
    const words = await queryWords(term);
    console.log('Found words:', words);
  };
  
  return (
    <div>
      <button onClick={() => handleSearch('computer')}>
        Search for "computer"
      </button>
    </div>
  );
}
```

## Core Hooks

### **`useWordNet()`**

Main hook for WordNet operations in React components.

```typescript
const {
  wordnet,           // WordNet instance
  loading,           // Loading state
  error,             // Error state
  queryWords,        // Search for words
  getSynsets,        // Get synsets
  getRelations,      // Get word relationships
  getTranslations,   // Cross-lingual operations
  loadPackageData,   // Load lexicon data
  clearCache,        // Clear cache
  getStatistics      // Get database statistics
} = useWordNet();
```

### **`useWordNetKernel()`**

Advanced hook with full kernel functionality.

```typescript
const {
  words,             // Core word operations
  synsets,           // Core synset operations
  senses,            // Core sense operations
  getHypernyms,      // Relations plugin
  getHyponyms,       // Relations plugin
  getPathSimilarity, // Similarity plugin
  getTranslations,   // Translation plugin
  getAvailableLanguages // Translation plugin
} = useWordNetKernel();
```

### **`useWordNetContext()`**

Access WordNet context in child components.

```typescript
const { wordnet, loading, error } = useWordNetContext();
```

## Components

### **`WordNetProvider`**

Context provider for WordNet functionality.

```typescript
import { WordNetProvider } from 'wn-ts-web';

function App() {
  return (
    <WordNetProvider 
      lexiconId="oewn:2024"
      options={{
        enableWorkers: true,
        storage: 'opfs',
        cacheSize: 1000
      }}
    >
      <MyApp />
    </WordNetProvider>
  );
}
```

## Configuration

### **WebWordNetOptions**

```typescript
interface WebWordNetOptions {
  enableWorkers?: boolean;        // Enable Web Workers (default: true)
  fallbackToMainThread?: boolean; // Fallback to main thread (default: true)
  storage?: 'memory' | 'opfs';   // Storage type (default: 'opfs')
  cacheStrategy?: 'memory' | 'persistent'; // Cache strategy
  workerUrl?: string;             // Custom worker URL
  cacheSize?: number;             // Cache size limit
  enableOPFS?: boolean;           // Enable OPFS (default: true)
}
```

## Core Methods

### **Word Search**

```typescript
// Search for words by form
const words = await queryWords('computer');

// Search with filters
const words = await queryWords('run', { pos: 'v' });

// Search with options
const words = await queryWords('test', { 
  pos: 'n', 
  limit: 10,
  offset: 0 
});
```

### **Synset Operations**

```typescript
// Get synsets for a word
const synsets = await getSynsets(wordId);

// Get synsets with filters
const synsets = await getSynsets(wordId, { 
  pos: 'n',
  limit: 5 
});
```

### **Relationship Queries**

```typescript
// Get hypernyms (more general concepts)
const hypernyms = await getRelations(synsetId, 'hypernym');

// Get hyponyms (more specific concepts)
const hyponyms = await getRelations(synsetId, 'hyponym');

// Get all relations
const allRelations = await getRelations(synsetId, 'all');
```

### **Cross-Lingual Operations**

```typescript
// Get translations
const translations = await getTranslations(synsetId, 'fr');

// Get available languages
const languages = await getAvailableLanguages();

// Get translation confidence
const confidence = await getTranslationConfidence(synsetId, 'fr');
```

## Advanced Features

### **Similarity Calculations**

```typescript
// Path similarity
const similarity = await getPathSimilarity(synset1, synset2);

// Wu-Palmer similarity
const wupSimilarity = await getWuPalmerSimilarity(synset1, synset2);

// Leacock-Chodorow similarity
const lchSimilarity = await getLeacockChodorowSimilarity(synset1, synset2);
```

### **Data Management**

```typescript
// Load lexicon data
await loadPackageData('oewn:2024');

// Clear cache
await clearCache();

// Get statistics
const stats = await getStatistics();
```

## State Management

### **Loading States**

```typescript
const { loading, error } = useWordNet();

if (loading) {
  return <div>Loading WordNet...</div>;
}

if (error) {
  return <div>Error: {error.message}</div>;
}
```

### **Error Handling**

```typescript
const { error } = useWordNet();

useEffect(() => {
  if (error) {
    console.error('WordNet error:', error);
    // Handle error appropriately
  }
}, [error]);
```

## Performance Optimization

### **Caching**

```typescript
const { wordnet } = useWordNet();

// Enable caching
const cachedWords = await wordnet.words({ form: 'computer' }, { 
  useCache: true 
});
```

### **Web Workers**

```typescript
// Workers are enabled by default
const { wordnet } = useWordNet({
  enableWorkers: true,
  workerUrl: '/workers/wordnet-worker.js'
});
```

## Testing

### **Mock WordNet for Testing**

```typescript
import { renderHook } from '@testing-library/react';
import { useWordNet } from 'wn-ts-web';

// Mock WordNet context
const mockWordNet = {
  queryWords: jest.fn(),
  getSynsets: jest.fn(),
  // ... other methods
};

const wrapper = ({ children }) => (
  <WordNetProvider value={mockWordNet}>
    {children}
  </WordNetProvider>
);

const { result } = renderHook(() => useWordNet(), { wrapper });
```

## Type Definitions

### **Core Types**

```typescript
interface Word {
  id: string;
  form: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  iliId?: string;
  pos: string;
  language: string;
  definitions: Definition[];
  examples: Example[];
}

interface Sense {
  id: string;
  wordId: string;
  synsetId: string;
  confidence?: number;
}
```

## Troubleshooting

### **Common Issues**

#### **Web Workers Not Available**
```typescript
// Check if workers are supported
if (typeof Worker === 'undefined') {
  console.warn('Web Workers not supported, falling back to main thread');
}
```

#### **OPFS Not Available**
```typescript
// Check OPFS support
if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
  console.warn('OPFS not supported, using memory storage');
}
```

## Further Reading

- **[Web Platform Guide](/platforms/web/)** - Complete platform documentation
- **[Examples](/examples/web/)** - Working code examples
- **[Core API](/api/core/)** - Core library API reference

---

**Ready to build your web app? Check out the [Examples](/examples/web/) to see it in action! 🚀**
