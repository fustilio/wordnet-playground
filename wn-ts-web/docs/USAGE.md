# Usage Guide for `wn-ts-web`

This guide provides a comprehensive overview of how to install, configure, and use the `wn-ts-web` library in your browser-based projects.

## Table of Contents

1.  [Installation](#installation)
2.  [Quick Start](#quick-start)
3.  [Core Concepts](#core-concepts)
4.  [API Reference](#api-reference)
    -   [Initialization](#initialization)
    -   [Data Loading](#data-loading)
    -   [Querying Data](#querying-data)
    -   [Statistics & Data Quality](#statistics--data-quality)
5.  [Advanced Usage](#advanced-usage)
    -   [Cross-Origin Isolation for OPFS](#cross-origin-isolation-for-opfs)
    -   [Loading a Custom Database](#loading-a-custom-database)
    -   [Error Handling](#error-handling)
6.  [Browser Environment](#browser-environment)

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
        console.log(`Loading: ${(progress.percentage * 100).toFixed(2)}%`);
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
-   `options.onProgress`: A callback function to track download progress.

```typescript
await dataLoader.downloadAndLoad('oewn:2024', {
  onProgress: (progress) => {
    console.log(`Downloaded ${progress.bytesDownloaded} of ${progress.totalBytes} bytes.`);
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
-   **Web Workers**: The library is designed to work efficiently with web workers, though direct worker management is handled internally.
