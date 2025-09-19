# wn-ts-web

Browser-compatible WordNet TypeScript implementation using SQLite WASM with microkernel architecture, plugin system, and comprehensive lexicon introspection.

## Status: Production Ready

This package provides a fully functional browser-based WordNet implementation using [@sqlite.org/sqlite-wasm](https://github.com/sqlite/sqlite-wasm) for optimal performance and persistence, with a modern microkernel architecture and plugin system.

## Features

- **Microkernel Architecture**: Modern plugin-based design with relations, similarity, and translation plugins
- **SQLite WASM Integration**: Fully working with local WASM files
- **OPFS Support**: Persistent storage using the Origin Private File System
- **In-Memory Fallback**: Automatic fallback when OPFS is unavailable
- **Cross-Browser Compatibility**: Works in all modern browsers
- **TypeScript Support**: Full type safety and IntelliSense
- **Framework Agnostic**: Core library works with any JavaScript framework
- **Worker-First Architecture**: Designed to run in Web Workers for optimal performance
- **React Integration**: Custom hooks and context providers for React applications

## Architecture

The library provides three levels of abstraction for different use cases:

### 1. WebWordNetKernel (Kernel API - Recommended)

For modern applications using the microkernel architecture with plugins:

```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wordnet = new WebWordNetKernel('oewn:2024');
await wordnet.initialize(sqlModule);

// Basic queries
const words = await wordnet.words({ form: 'computer' });
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Plugin methods
const hypernyms = await wordnet.getHypernyms(synsets[0].id);
const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
const translations = await wordnet.getTranslations(synsets[0].id, 'fr');

await wordnet.close();
```

### 2. WordNetOrchestrator (High-level)

For applications that need to manage multiple lexicons with cross-lexicon operations:

```typescript
import { WordNetOrchestrator } from 'wn-ts-web';

const orchestrator = new WordNetOrchestrator({
  defaultLexicon: 'oewn:2024',
  autoCheckUpdates: true
});

await orchestrator.initialize(sqlModule);
await orchestrator.loadLexicon('oewn:2024');

// Query across all lexicons efficiently
const words = await orchestrator.queryWords('run');
const synsets = await orchestrator.querySynsets('happy');
```

### 3. WordNetWorkerClient (Mid-level)

For worker-based operations and lexicon state tracking:

```typescript
import { WordNetWorkerClient } from 'wn-ts-web';

const client = new WordNetWorkerClient();
await client.initialize('/workers/wordnet.worker.js');

await client.loadPackage('oewn:2024', (progress, stage) => {
  console.log(`Loading: ${stage} - ${progress * 100}%`);
});

const words = await client.queryWords('example');
```

## React Integration

For React applications, use the custom hooks for easy integration:

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
  } = useWordNetKernel({ lexicon: 'oewn:2024' });

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const handleSearch = async () => {
    if (!initialized) return;
    
    const words = await wordnet.words({ form: 'computer' });
    const synsets = await wordnet.synsets({ wordId: words[0].id });
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
```

## Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm fast-xml-parser sax
```

### Required Dependencies

The `wn-ts-web` package requires these peer dependencies to be installed in your project:

- **`@sqlite.org/sqlite-wasm`** - SQLite WASM implementation for browser database operations
- **`fast-xml-parser`** - XML parsing library used for WordNet data processing
- **`sax`** - SAX parser (dependency of fast-xml-parser)

These dependencies are externalized in the build to keep the bundle size small and allow for better tree-shaking.

For React applications, the hooks are included but can be imported separately:

```bash
# Core library (framework-agnostic)
import { createWordNetWorker } from 'wn-ts-web';

# React hooks (if using React)
import { useWordNet } from 'wn-ts-web/react';
```

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { createWordNetInstance } from 'wn-ts-web';

async function main() {
  try {
    // 1. Create the WordNet instance
    const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');

    // 2. Load WordNet data from a source with progress tracking
    await dataLoader.downloadAndLoad('oewn:2024', {
      onProgress: (progress) => {
        console.log(`Loading: ${(progress * 100).toFixed(2)}%`);
      }
    });

    // 3. Query the data
    const synsets = await wordnet.synsets('joy', 'n');
    console.log('Synsets for "joy":', synsets);

    // Get definitions
    if (synsets.length > 0) {
      const definitions = synsets[0].definitions.map(d => d.text);
      console.log('Definitions:', definitions);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
```

### With Web Workers (Recommended)

```typescript
import { createWordNetWorker } from 'wn-ts-web';

async function main() {
  try {
    // Create worker
    const worker = createWordNetWorker(new URL('./wordnet.worker.ts', import.meta.url));
    
    // Initialize
    const initResult = await worker.initializeWordNet('oewn:2024');
    if (!initResult.success) {
      throw new Error(initResult.error);
    }

    // Load data
    await worker.loadPackage('oewn:2024', {
      onProgress: (progress) => console.log(`Loading: ${(progress * 100).toFixed(2)}%`)
    });

    // Query
    const queryResult = await worker.queryWords('joy', 'n');
    if (queryResult.success) {
      console.log('Results:', queryResult.data);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
```

## Browser Requirements

- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions).
- **Cross-Origin Isolation**: For optimal performance with `SharedArrayBuffer` (OPFS support), your server should send these headers:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```

## Testing

This package is rigorously tested in both Node.js (via `jsdom`) and real browser (via `playwright`) environments.

```bash
# Run all tests (Node.js and browser)
pnpm autotest

# Run only Node.js tests
pnpm vitest run

# Run only browser tests
pnpm vitest run --browser
```

## Documentation

For detailed information, see:
- **Architecture**: [ARCHITECTURE.md](../../docs/packages/wn-ts-web/ARCHITECTURE.md) - Microkernel architecture and plugin system
- **Features**: [FEATURES.md](../../docs/packages/wn-ts-web/FEATURES.md) - Comprehensive feature list and recent updates

## License

MIT License - see LICENSE file for details.