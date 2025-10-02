---
title: Web Applications
description: Build WordNet-powered web applications with React integration
---

# Web Applications

Build powerful web applications with the WordNet TypeScript ecosystem's web platform.

## Quick Start

### Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

### Basic Usage

```typescript
import { useWordNet } from 'wn-ts-web';

function MyApp() {
  const { wordnet, loading, error, queryWords } = useWordNet();
  
  const handleSearch = async (term: string) => {
    const words = await queryWords(term);
    console.log('Found words:', words);
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

## Architecture

The web platform uses a worker-first architecture:

- **Web Workers**: Heavy operations run in background threads
- **React Hooks**: Easy integration with React components
- **OPFS Storage**: Persistent browser storage
- **SQLite WASM**: Full database functionality in the browser

## Features

### React Integration
- `useWordNet()` hook for easy component integration
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

- `useWordNet()` - Main hook for WordNet operations
- `useWordNetContext()` - Access WordNet context
- `useWordNetWithCache()` - Cached operations

### Core Methods

- `queryWords()` - Search for words
- `getSynsets()` - Get concept groupings
- `getRelations()` - Find word relationships
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
