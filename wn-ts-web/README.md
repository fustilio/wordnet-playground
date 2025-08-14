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
- ✅ **Framework Agnostic**: Core library works with any JavaScript framework.
- ✅ **Worker-First Architecture**: Designed to run in Web Workers for optimal performance.

## Run in a Web Worker (assumed)

For stability and responsiveness, run `wn-ts-web` inside a Web Worker. SQLite/OPFS access and heavy operations should not block the main UI thread. The examples below show a minimal Worker-based setup.

- **OPFS note**: For persistent storage, enable cross-origin isolation. See headers in Browser Requirements.

### Minimal setup

Main thread (`main.ts`):

```ts
import { createWordNetWorker } from 'wn-ts-web';

const worker = createWordNetWorker(new URL('./wordnet.worker.ts', import.meta.url));

// Initialize WordNet
const result = await worker.initializeWordNet('oewn:2024');
if (result.success) {
  console.log('WordNet initialized with', result.data?.lexiconStats?.length, 'lexicons');
}

// Query for synsets
const queryResult = await worker.queryWords('joy', 'n');
if (queryResult.success) {
  console.log('Synsets for "joy":', queryResult.data);
}
```

Worker (`wordnet.worker.ts`):

```ts
import { worker } from 'wn-ts-web';

// The worker is automatically exposed via Comlink
// No additional setup needed
```

### React Integration

For React applications, use the separate React hooks:

```tsx
import { useWordNet } from 'wn-ts-web/react';

function WordNetApp() {
  const { 
    isReady, 
    isLoading, 
    queryWords, 
    loadPackageData 
  } = useWordNet({
    workerUrl: new URL('./wordnet.worker.ts', import.meta.url)
  });

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => loadPackageData('oewn:2024')}>
        Load WordNet Data
      </button>
    </div>
  );
}
```

## Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

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

## API Reference

The primary entry point is `createWordNetInstance`, which sets up the WordNet instance, database, and data loader. For a complete API reference and advanced usage examples, please see the [Usage Guide](./docs/USAGE.md).

### Core Exports

- **`createWordNetInstance(lexiconId?)`**: Creates WordNet instance and data loader
- **`WebWordnet`**: Main WordNet class for queries
- **`DataLoader`**: Handles data downloading and loading
- **`createWordNetWorker(workerUrl)`**: Creates a worker with Comlink integration

### React Exports (separate)

- **`useWordNet(options)`**: Main React hook for WordNet operations
- **`usePackageStatus(packageId, worker)`**: Hook for checking package status
- **`useCacheInfo(worker)`**: Hook for cache information

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
- **Worker-First**: Designed to run in Web Workers for optimal UI responsiveness.

## Build Configuration

This package provides multiple build configurations for different use cases:

### Production Build (Default)
```bash
pnpm build
```
- **Minified**: Code is compressed and optimized for production
- **No source maps**: Smaller bundle size
- **Optimized**: Best performance for end users

### Development Build
```bash
pnpm build:dev
```
- **Unminified**: Readable code for debugging
- **Source maps**: Full debugging support
- **Larger bundle**: Better for development and troubleshooting

### Build Configuration Files
- `vite.base.config.ts` - Base configuration shared by all builds
- `vite.config.ts` - Production build configuration (extends base)
- `vite.dev.config.ts` - Development build configuration (extends base)

The configuration uses Vite's `mergeConfig` to extend the base configuration, eliminating duplication and making maintenance easier.

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
