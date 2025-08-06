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

async function main() {
  try {
    // Initialize WordNet with SQLite WASM
    const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');

    // Load WordNet data from a source with progress tracking
    await dataLoader.downloadAndLoad('oewn:2024', {
      onProgress: (progress) => {
        // progress is a number from 0 to 1
        console.log(`Loading: ${(progress * 100).toFixed(2)}%`);
      }
    });

    // Query for synsets
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

## API Reference

The primary entry point is `createWordNetInstance`, which sets up the WordNet instance, database, and data loader. For a complete API reference and advanced usage examples, please see the [Usage Guide](./docs/USAGE.md).

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
pnpm autotest

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
