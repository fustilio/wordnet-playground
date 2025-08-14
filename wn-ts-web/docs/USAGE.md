# Usage Guide for `wn-ts-web`

This guide provides a comprehensive overview of how to install, configure, and use the `wn-ts-web` library in your browser-based projects.

## Table of Contents

1.  [Installation](#installation)
2.  [Quick Start](#quick-start)
3.  [Worker Thread (assumed)](#worker-thread-assumed)
4.  [React Integration](#react-integration)
5.  [Core Concepts](#core-concepts)
6.  [API Reference](#api-reference)
    -   [Initialization](#initialization)
    -   [Data Loading](#data-loading)
    -   [Querying Data](#querying-data)
    -   [Statistics & Data Quality](#statistics--data-quality)
7.  [Advanced Usage](#advanced-usage)
    -   [Cross-Origin Isolation for OPFS](#cross-origin-isolation-for-opfs)
    -   [Loading a Custom Database](#loading-a-custom-database)
    -   [Error Handling](#error-handling)
8.  [Browser Environment](#browser-environment)

---

## Installation

First, add `wn-ts-web` and its required peer dependency, `@sqlite.org/sqlite-wasm`, to your project.

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

## Quick Start

The fastest way to get started is to use the `createWordNetInstance` factory function. This function sets up the WordNet instance, the database connection, and the data loader for you.

Here's a complete example:

```typescript
import { createWordNetInstance } from 'wn-ts-web';

async function main() {
  try {
    // 1. Create the WordNet instance
    const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');
    console.log('WordNet instance created.');

    // 2. Load the WordNet database
    // This downloads the data and loads it into the browser's storage (OPFS or in-memory).
    await dataLoader.downloadAndLoad('oewn:2024', {
      onProgress: (progress) => {
        // progress is a number from 0 to 1
        console.log(`Loading: ${(progress * 100).toFixed(2)}%`);
      }
    });
    console.log('WordNet data loaded.');

    // 3. Query the data
    const synsets = await wordnet.synsets('joy', 'n');
    console.log('Synsets for "joy":', synsets);
    
    const definitions = synsets[0].definitions.map(d => d.text);
    console.log('Definitions:', definitions);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
```

## Worker Thread (assumed)

Run `wn-ts-web` inside a Web Worker. SQLite/OPFS access and heavy operations should not block the UI thread. Below is a minimal setup.

- Enable cross-origin isolation headers for OPFS persistence (see [Cross-Origin Isolation for OPFS](#cross-origin-isolation-for-opfs)).

Minimal main thread (`main.ts`):

```ts
const worker = new Worker(new URL('./wordnet.worker.ts', import.meta.url), { type: 'module' });

worker.postMessage({ type: 'init', lexiconId: 'oewn:2024' });

worker.onmessage = (ev) => {
  const { type, payload } = ev.data || {};
  if (type === 'ready') {
    worker.postMessage({ type: 'query', payload: { lemma: 'joy', pos: 'n' } });
  } else if (type === 'query:result') {
    console.log('Synsets:', payload);
  }
};
```

Minimal worker (`wordnet.worker.ts`):

```ts
import { createWordNetInstance } from 'wn-ts-web';

let wordnet: any;
let dataLoader: any;

self.onmessage = async (ev: MessageEvent) => {
  const { type, payload } = (ev.data || {}) as any;

  if (type === 'init') {
    const { wordnet: wn, dataLoader: dl } = await createWordNetInstance(payload?.lexiconId ?? 'oewn:2024');
    wordnet = wn;
    dataLoader = dl;
    self.postMessage({ type: 'ready' });
  }

  if (type === 'query') {
    const { lemma, pos } = payload || {};
    const synsets = await wordnet.synsets(lemma, pos);
    self.postMessage({ type: 'query:result', payload: synsets });
  }
};
```

## React Integration

For React-specific integration patterns, hooks, and component examples, see the dedicated [React Integration Guide](./REACT_INTEGRATION.md).

The guide includes:
- Custom React hooks for WordNet state management
- Component examples with loading states and error handling
- OPFS integration patterns for optimal performance
- Server configuration for OPFS support
- Advanced patterns like context providers and caching
- Comprehensive error handling and loading states

## Core Concepts

The library is built around three main components:

-   **`WebWordnet`**: The main class for querying WordNet data. It provides methods like `.words()`, `.senses()`, and `.synsets()`.
-   **`DataLoader`**: Manages fetching WordNet data from remote sources and loading it into the browser's database.
-   **`WebDatabase`**: A low-level wrapper around `@sqlite.org/sqlite-wasm` that handles the database connection.

The `createWordNetInstance` factory function is the recommended way to create and wire up these components.

## API Reference

### Initialization

#### `createWordNetInstance(lexicon?, options?)`

This is the main entry point for the library. It initializes the SQLite WASM module and returns a `WebWordnet` instance and a `DataLoader`.

-   `lexicon` (optional): The default lexicon ID string (e.g., `'oewn:2024'`).
-   `options` (optional): Configuration options for `WebWordnet`.

**Returns**: A promise that resolves to `{ wordnet: WebWordnet, dataLoader: DataLoader }`.

```typescript
const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024', {
  searchAllForms: true, // Example option
  debug: true
});
```

### Data Loading

The `DataLoader` instance is used to populate the browser database.

#### `dataLoader.downloadAndLoad(projectId, options?)`

Downloads a pre-packaged WordNet database from the official index and loads it.

-   `projectId`: The ID of the project to download (e.g., `'oewn:2024'`).
-   `options.onProgress`: A callback function that receives a number from 0 to 1.

```typescript
await dataLoader.downloadAndLoad('oewn:2024', {
  onProgress: (progress) => {
    console.log(`Download progress: ${(progress * 100).toFixed(2)}%`);
  }
});
```

#### `dataLoader.loadDbFromBuffer(buffer, projectId)`

Loads an existing WordNet database from an `ArrayBuffer` (e.g., one bundled with your application).

-   `buffer`: An `ArrayBuffer` containing the SQLite database.
-   `projectId`: The lexicon ID associated with the database (e.g., `'oewn:2024'`).

This is useful for shipping a demo or default database with your app.

```typescript
import { createDemoData } from 'wn-ts-web/demo-utils';

// createDemoData() returns a Uint8Array, which is a view on an ArrayBuffer
const demoDbBuffer = createDemoData().buffer;

await dataLoader.loadDbFromBuffer(demoDbBuffer, 'oewn:2024');
```

### Querying Data

The `WebWordnet` instance provides methods for querying the loaded data. All methods return promises.

#### `wordnet.words(lemma, pos?)`

Finds words matching a given lemma and optional part of speech.

-   `lemma`: The word form to search for.
-   `pos` (optional): The part of speech (`'n'`, `'v'`, `'a'`, `'r'`).

```typescript
const words = await wordnet.words('happy', 'a');
// Returns: an array of Word objects
```

#### `wordnet.senses(lemma, pos?)`

Finds senses (the link between a word and a concept) for a given lemma.

```typescript
const senses = await wordnet.senses('run', 'v');
// Returns: an array of Sense objects
```

#### `wordnet.synsets(lemma, pos?)`

Finds synsets (sets of synonyms representing a concept) for a given lemma.

```typescript
const synsets = await wordnet.synsets('computer', 'n');
// Returns: an array of Synset objects
```

#### `wordnet.lexicons()`

Lists all lexicons currently loaded in the database.

```typescript
const lexicons = await wordnet.lexicons();
// Returns: an array of Lexicon objects
```

### Statistics & Data Quality

#### `wordnet.getStatistics()`

Returns statistics about the loaded database, such as total word, sense, and synset counts.

```typescript
const stats = await wordnet.getStatistics();
console.log(`Total words: ${stats.totalWords}`);
```

#### `wordnet.getDataQualityMetrics()`

Returns metrics about the quality and completeness of the data.

```typescript
const metrics = await wordnet.getDataQualityMetrics();
console.log(`ILI Coverage: ${metrics.iliCoveragePercentage}%`);
```

## Advanced Usage

### Cross-Origin Isolation for OPFS

For the best performance and data persistence, `wn-ts-web` uses the Origin Private File System (OPFS). To enable OPFS, your web server must serve the page with the following HTTP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these headers, the library will automatically fall back to an in-memory database, and the data will need to be downloaded again on each page load.

### Loading a Custom Database

If you have a custom WordNet database file, you can load it directly into the library.

```typescript
async function loadCustomDatabase(url) {
  // 1. Fetch your database file
  const response = await fetch(url);
  const dbBuffer = await response.arrayBuffer();

  // 2. Create the WordNet instance
  const { dataLoader } = await createWordNetInstance();

  // 3. Load the database from the buffer
  await dataLoader.loadDbFromBuffer(dbBuffer, 'my-custom-lexicon:1.0');
}
```

### Error Handling

It's important to wrap API calls in `try...catch` blocks to handle potential network errors, data parsing issues, or database problems.

```typescript
try {
  await dataLoader.downloadAndLoad('non-existent-project:1.0');
} catch (error) {
  console.error('Failed to load WordNet data:', error.message);
  // You could display a message to the user here
}
```

## Browser Environment

`wn-ts-web` is designed exclusively for the browser and leverages modern web APIs:

-   **SQLite WASM**: The SQLite database engine is compiled to WebAssembly, allowing it to run efficiently in the browser.
-   **OPFS**: The Origin Private File System is used for persistent storage, which is much faster than IndexedDB for this use case.
-   **In-Memory Fallback**: If OPFS is not available (e.g., due to missing headers or an older browser), the database runs entirely in memory.
-   **Web Workers**: This library is intended to run inside a dedicated Web Worker that you manage in your app.

### Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: The library gracefully falls back to in-memory storage when OPFS is not available
