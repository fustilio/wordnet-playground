---
title: Web Applications
description: Build WordNet-powered web applications with React integration
---

# Web Applications

Build powerful web applications with the WordNet TypeScript ecosystem's web platform.

## Quick Start

### Installation

```bash
# React applications (recommended)
npm install wn-react wn-ts-web @sqlite.org/sqlite-wasm

# Direct usage (no React)
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

### Basic Usage (React - Recommended)

```typescript
import { useWordNet } from 'wn-react';

function MyApp() {
  const { search, loading, error } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const handleSearch = async (term: string) => {
    const results = await search(term);
    console.log('Found synsets:', results);
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

### Direct Usage (No React)

```typescript
import { createWebWordnet } from 'wn-ts-web';

// Auto-initializes on first use
const wn = createWebWordnet('oewn:2024');

// Simple search
const results = await wn.search('computer');

// Advanced operations
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);
```

## Architecture

The web platform uses a worker-first architecture:

- **Web Workers**: Heavy operations run in background threads
- **React Hooks**: Easy integration with React components
- **OPFS Storage**: Persistent browser storage
- **SQLite WASM**: Full database functionality in the browser

## Features

### React Integration
- `useWordNet()` hook for easy component integration (v1.0.0)
- `useWordNetContext()` hook for advanced usage
- Context providers for global state management
- Type-safe props and return values

### Web Workers
- Non-blocking operations
- Automatic fallback to main thread
- Queue management for early requests

### Storage Options
- **OPFS**: High-performance persistent storage
- **Memory**: Fast in-memory storage
- **Automatic Fallback**: Graceful degradation

### Cross-Lingual Support
- Multi-language lexicons
- ILI-based translation
- Language detection and switching

## Configuration

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

## API Reference

### Hooks

- `useWordNet()` - **Recommended** - Main hook for WordNet operations (v1.0.0)
- `useWordNetContext()` - Advanced hook with full API access
- `useWordNetKernelContext()` - Kernel-level access for power users

### Core Methods

- `search()` - Simple search that returns synsets (NEW in v1.0.0)
- `words()` - Search for words
- `synsets()` - Get concept groupings
- `senses()` - Get word-synset relationships
- `getHypernyms()` - Find broader concepts
- `getTranslations()` - Cross-lingual operations

## Examples

- **[Basic Demo](/examples/web/)** - Simple word search
- **[Advanced Demo](/examples/web/)** - Full feature showcase
- **[Translation Demo](/examples/translation/)** - Cross-lingual features

## Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

## Further Reading

- **[Web Usage Guide](/guides/web-usage)** - Detailed usage patterns
- **[API Reference](/api/web/)** - Complete API documentation
- **[Examples](/examples/web/)** - Working code samples

---

**Ready to build your web app? Check out the [Examples](/examples/web/) to see it in action!**
