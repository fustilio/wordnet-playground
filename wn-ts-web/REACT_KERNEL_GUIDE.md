# React Kernel Architecture Guide

## Overview

The React components in `wn-ts-web` now support the new kernel architecture, providing a modern, type-safe, and plugin-based approach to WordNet operations in React applications.

## Key Features

- **Kernel-based**: Uses the new microkernel architecture with plugins
- **Type-safe**: Full TypeScript support with compile-time checking
- **Plugin system**: Access to relations, similarity, and translation plugins
- **React hooks**: Easy-to-use hooks for React components
- **Context providers**: Global state management for WordNet operations
- **Cross-lingual**: Built-in support for cross-lingual operations

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { 
  WordNetKernelProvider, 
  useWordNetKernelContext 
} from 'wn-ts-web';

const MyComponent: React.FC = () => {
  const {
    wordnet,
    loading,
    error,
    initialized,
    initialize,
    getHypernyms,
    getPathSimilarity,
    getTranslations
  } = useWordNetKernelContext();

  useEffect(() => {
    if (!initialized) {
      initialize('oewn:2024');
    }
  }, [initialized, initialize]);

  const handleSearch = async () => {
    if (!initialized) return;
    
    const words = await words({ form: 'computer' });
    const synsets = await synsets({ wordId: words[0].id });
    const hypernyms = await getHypernyms(synsets[0].id);
    const similarity = await getPathSimilarity(synsets[0].id, hypernyms[0].id);
    const translations = await getTranslations(synsets[0].id);
    
    console.log({ words, synsets, hypernyms, similarity, translations });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WordNetKernelProvider lexicon="oewn:2024">
      <MyComponent />
    </WordNetKernelProvider>
  );
};
```

### Using the Hook Directly

```tsx
import React from 'react';
import { useWordNetKernel } from 'wn-ts-web';

const MyComponent: React.FC = () => {
  const {
    wordnet,
    loading,
    error,
    initialized,
    initialize,
    getHypernyms,
    getPathSimilarity,
    getTranslations
  } = useWordNetKernel({
    lexicon: 'oewn:2024',
    options: { /* custom options */ }
  });

  // ... rest of component
};
```

## API Reference

### `useWordNetKernel(config?)`

A React hook that provides access to the WordNet kernel functionality.

**Parameters:**
- `config.lexicon` (optional): Lexicon to use (default: 'oewn:2024')
- `config.options` (optional): Additional options for the kernel

**Returns:**
- `wordnet`: The WebWordNetKernel instance
- `loading`: Boolean indicating if operations are in progress
- `error`: Error message if any
- `initialized`: Boolean indicating if the kernel is initialized
- `initialize()`: Function to initialize the kernel
- `close()`: Function to close the kernel
- Plus all plugin methods (see below)

### `WordNetKernelProvider`

A React context provider that makes WordNet kernel functionality available to child components.

**Props:**
- `children`: React children
- `lexicon` (optional): Lexicon to use
- `options` (optional): Additional options

### `useWordNetKernelContext()`

A React hook to access WordNet kernel functionality from within a `WordNetKernelProvider`.

**Returns:** Same as `useWordNetKernel()`

## Plugin Methods

### Relations Plugin

```tsx
const {
  getHypernyms,
  getHyponyms,
  getMeronyms,
  getHolonyms,
  getEntailments,
  getSimilarTos,
  getRelationsByType,
  getAllRelations
} = useWordNetKernelContext();

// Get hypernyms (more general concepts)
const hypernyms = await getHypernyms(synsetId);

// Get hyponyms (more specific concepts)
const hyponyms = await getHyponyms(synsetId);

// Get all relations
const allRelations = await getAllRelations(synsetId);
```

### Similarity Plugin

```tsx
const {
  getPathSimilarity,
  getWuPalmerSimilarity,
  getLeacockChodorowSimilarity,
  getJaccardSimilarity,
  getBestSimilarity,
  findMostSimilar
} = useWordNetKernelContext();

// Calculate path similarity
const similarity = await getPathSimilarity(synset1, synset2);

// Find most similar synsets
const similar = await findMostSimilar(synsetId, 10);
```

### Translation Plugin

```tsx
const {
  getTranslations,
  getTranslationsByWord,
  getAvailableLanguages,
  getSynsetsByIli,
  getTranslationConfidence,
  getTranslationSuggestions
} = useWordNetKernelContext();

// Get translations for a synset
const translations = await getTranslations(synsetId, 'fr');

// Get translations by word
const wordTranslations = await getTranslationsByWord('computer', 'en', 'fr');

// Get available languages
const languages = await getAvailableLanguages(synsetId);
```

## Basic WordNet Operations

```tsx
const {
  words,
  word,
  synsets,
  synset,
  senses,
  sense,
  ili,
  ilis,
  synsetsByILI
} = useWordNetKernelContext();

// Search for words
const wordResults = await words({ form: 'computer' });

// Get specific word
const wordData = await word(wordId);

// Get synsets
const synsetResults = await synsets({ wordId: wordId });

// Get specific synset
const synsetData = await synset(synsetId);
```

## Plugin Management

```tsx
const {
  getPlugins,
  has,
  schemaManager
} = useWordNetKernelContext();

// Get available plugins
const plugins = getPlugins(); // ['relations', 'similarity', 'translation']

// Check if plugin is available
const hasRelations = has('relations'); // true

// Access schema manager
const schema = schemaManager;
```

## Error Handling

```tsx
const { error, loading } = useWordNetKernelContext();

if (error) {
  return <div>Error: {error}</div>;
}

if (loading) {
  return <div>Loading...</div>;
}
```

## Type Safety

All methods are fully typed with TypeScript:

```tsx
// TypeScript knows the exact return types
const hypernyms: Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}> = await getHypernyms(synsetId);

// Compile-time checking ensures correct usage
const similarity: number = await getPathSimilarity(synset1, synset2);
```

## Examples

See the `examples/ReactKernelExample.tsx` file for a complete working example that demonstrates:

- Plugin system usage
- Relations, similarity, and translation operations
- Error handling and loading states
- Type-safe operations
- Real-time UI updates

## Migration from Old Architecture

**Old way (deprecated):**
```tsx
import { useWordNet } from 'wn-ts-web';

const { queryWords, querySynsets } = useWordNet();
```

**New way (recommended):**
```tsx
import { useWordNetKernel } from 'wn-ts-web';

const { 
  words, 
  synsets, 
  getHypernyms, 
  getPathSimilarity 
} = useWordNetKernel();
```

## Benefits

1. **Type Safety**: Compile-time error checking
2. **Plugin System**: Extensible and modular
3. **Better Performance**: Optimized for specific use cases
4. **Cross-lingual**: Built-in translation support
5. **Modern Architecture**: Clean separation of concerns
6. **React Integration**: Designed specifically for React applications

---

For more details, see the main [Kernel Architecture Guide](../../KERNEL_ARCHITECTURE.md) and the [React example](../../examples/ReactKernelExample.tsx).


