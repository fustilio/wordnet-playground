# wn-ts-web

Browser-compatible WordNet TypeScript implementation using SQLite WASM.

## Status: ✅ PRODUCTION READY

This package provides a fully functional browser-based WordNet implementation using [@sqlite.org/sqlite-wasm](https://github.com/sqlite/sqlite-wasm) for optimal performance and persistence.

## Features

- ✅ **SQLite WASM Integration**: Fully working with local WASM files.
- ✅ **Kysely Query Engine**: Type-safe SQL query building for enhanced reliability and developer experience.
- ✅ **OPFS Support**: Persistent storage using the Origin Private File System.
- ✅ **In-Memory Fallback**: Automatic fallback when OPFS is unavailable.
- ✅ **Cross-Browser Compatibility**: Works in all modern browsers.
- ✅ **TypeScript Support**: Full type safety and IntelliSense.
- ✅ **Performance Optimized**: Fast queries and efficient memory usage.

## Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

## Quick Start

```typescript
import { createWordNetInstance } from 'wn-ts-web';

// Initialize WordNet with SQLite WASM
const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');

// Load WordNet data from a source
await dataLoader.downloadAndLoad('oewn:2024');

// Query words
const words = await wordnet.words('happy', 'a');
console.log('Words for "happy":', words);

// Get synsets
const synsets = await wordnet.synsets('joy', 'n');
console.log('Synsets for "joy":', synsets);
```

## API Reference

The primary entry point is `createWordNetInstance`, which sets up the WordNet instance, database, and data loader.

```typescript
import { createWordNetInstance } from 'wn-ts-web';

// Create the WordNet instance
const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');

// Load data into the browser's database
await dataLoader.downloadAndLoad('oewn:2024');

// Query for a word
const words = await wordnet.words('happy', 'a');
console.log('Words for "happy":', words);

// Get synsets
const synsets = await wordnet.synsets('joy', 'n');
console.log('Synsets for "joy":', synsets);
```

## Browser Requirements

- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions).
- **Cross-Origin Isolation**: For optimal performance with `SharedArrayBuffer` (OPFS support), your server should send these headers:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```

## Performance

- **Fast Initialization**: The WASM module loads and initializes quickly.
- **Efficient Queries**: Kysely provides an optimized query engine.
- **Persistent Storage**: Leverages the Origin Private File System (OPFS) for fast, persistent data storage in the browser, with a fallback to an in-memory database.

## Testing

This package is rigorously tested in both Node.js (via `jsdom`) and real browser (via `playwright`) environments.

```bash
# Run all tests (Node.js and browser)
pnpm test

# Run only Node.js tests
pnpm vitest run

# Run only browser tests
pnpm vitest run --browser
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
