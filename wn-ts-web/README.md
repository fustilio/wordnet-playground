# wn-ts-web

Browser-compatible WordNet TypeScript implementation using SQLite WASM with advanced orchestration capabilities and comprehensive lexicon introspection.

## Status: ✅ **PRODUCTION READY** with Enhanced Lexicon Introspection

This package provides a fully functional browser-based WordNet implementation using [@sqlite.org/sqlite-wasm](https://github.com/sqlite/sqlite-wasm) for optimal performance and persistence, now with enhanced orchestration for managing multiple lexicons and **real-time lexicon introspection**.

## 🎯 **Recent Major Updates**

### **Enhanced Lexicon Introspection System** ✅ COMPLETED
- **Real Data Integration**: Replaced all placeholder values with actual database statistics
- **Sense Count**: Now shows real counts (e.g., 212,478 for OEWN 2024) instead of hardcoded 0
- **Part of Speech Distribution**: New `getPartOfSpeechDistribution()` method with real POS counts
- **Worker API Enhancement**: Extended worker interface with missing analytics methods
- **Error Handling**: Graceful fallbacks when detailed data isn't available

### **Lexicon ID Format Mismatch Resolution** ✅ COMPLETED
- **Problem**: Demo was using package IDs (e.g., `oewn:2024`) but worker stored base IDs (e.g., `oewn`)
- **Solution**: Implemented fallback logic in `introspectLexicon()` to handle both formats
- **Impact**: Lexicon introspection now works seamlessly with both ID formats

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
- ✅ **Multi-Lexicon Orchestration**: Advanced management of multiple lexicons with state tracking.
- ✅ **Cross-Lexicon Queries**: Efficient queries across multiple lexicons in a single database.
- ✅ **Lexicon Lifecycle Management**: Automatic update detection and redownload management.
- ✅ **Resource Type Introspection**: Automatic detection and analysis of lexicons vs. ILIs.
- ✅ **Cross-Lingual Analysis**: Comprehensive analysis of multilingual capabilities and mapping coverage.
- ✅ **Enhanced Lexicon Introspection**: Real-time statistics, sense counts, and data quality metrics.

## Architecture

The library now provides three levels of abstraction for different use cases:

### 1. WordNetOrchestrator (High-level)
For applications that need to manage multiple lexicons with cross-lexicon operations:

```typescript
import { WordNetOrchestrator } from 'wn-ts-web';

const orchestrator = new WordNetOrchestrator({
  defaultLexicon: 'oewn:2024',
  autoCheckUpdates: true
});

await orchestrator.initialize(sqlModule);
await orchestrator.loadLexicon('oewn:2024');
await orchestrator.loadLexicon('wn31:3.1');

// Query across all lexicons efficiently
const words = await orchestrator.queryWords('run');
const synsets = await orchestrator.querySynsets('happy');

// Enhanced lexicon introspection
const lexiconInfo = await orchestrator.introspectLexicon('oewn:2024');
console.log('Sense count:', lexiconInfo.senseCount); // Real data: 212,478
console.log('ILI coverage:', lexiconInfo.iliCoverage); // Calculated percentage
```

### 2. WordNetWorkerClient (Mid-level)
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

### 3. WebWordnet (Low-level)
For direct lexicon operations (existing API):

```typescript
import { WebWordnet } from 'wn-ts-web';

const wordnet = new WebWordnet('oewn:2024');
await wordnet.initialize(sqlModule);
const words = await wordnet.words('example');
```

For detailed architecture information, see:
- [ORCHESTRATION_ARCHITECTURE.md](./docs/ORCHESTRATION_ARCHITECTURE.md) - High-level orchestration patterns
- [WORKER_ARCHITECTURE.md](./docs/WORKER_ARCHITECTURE.md) - Worker-first architecture and React integration

## Resource Types and Lexicon Introspection

The library distinguishes between two main types of resources and provides comprehensive introspection capabilities:

### **Lexicons vs. ILIs**

#### **Lexicons (Language-Specific Resources)**
- **Purpose**: Contain actual words, synsets, and definitions in specific languages
- **Examples**: `oewn:2024` (English), `omw-fr:1.4` (French), `omw-th:1.4` (Thai)
- **Structure**: Words, synsets, senses, definitions, relations
- **Use Case**: Direct language queries, word lookups, semantic analysis

#### **ILIs (Interlingual Indexes)**
- **Purpose**: Provide cross-lingual mapping between synsets across languages
- **Examples**: `cili:1.0` (Collaborative Interlingual Index)
- **Structure**: ILI identifiers, cross-lingual mappings, concept bridges
- **Use Case**: Bilingual queries, cross-language concept mapping, multilingual applications

### **Enhanced Introspection and Analysis**

```typescript
import { WordNetOrchestrator } from 'wn-ts-web';

const orchestrator = new WordNetOrchestrator();
await orchestrator.initialize(sqlModule);

// Load resources
await orchestrator.loadLexicon('oewn:2024');
await orchestrator.loadLexicon('cili:1.0');
await orchestrator.loadLexicon('omw-fr:1.4');

// Enhanced lexicon introspection with real data
const oewnInfo = await orchestrator.introspectLexicon('oewn:2024');
console.log('OEWN type:', oewnInfo.type); // 'lexicon'
console.log('Word count:', oewnInfo.wordCount); // 161,705
console.log('Sense count:', oewnInfo.senseCount); // 212,478 (real data!)
console.log('ILI coverage:', oewnInfo.iliCoverage); // Calculated percentage

const ciliInfo = await orchestrator.introspectLexicon('cili:1.0');
console.log('CILI type:', ciliInfo.type); // 'ili'
console.log('ILI count:', ciliInfo.iliCount);

// Analyze cross-lingual capabilities
const crossLingualAnalysis = await orchestrator.analyzeCrossLingualCapabilities();
console.log('Supported languages:', crossLingualAnalysis.supportedLanguages);
console.log('Concept coverage:', crossLingualAnalysis.conceptCoverage);

// Get overview of all resources
const allResources = await orchestrator.introspectAllResources();
const lexicons = allResources.filter(r => r.type === 'lexicon');
const ilis = allResources.filter(r => r.type === 'ili');
```

### **Resource Categorization**

```typescript
// Automatic resource type detection
const resourceType = await orchestrator.detectResourceType('cili:1.0');
// Returns: { type: 'ili', hasCrossLingualMappings: true, supportedLanguages: ['en', 'fr', 'th'] }

// Resource categorization
const categorizedResources = await orchestrator.categorizeResources();
// Returns: { lexicons: [...], ilis: [...], mixed: [...] }
```

This enhanced introspection system helps applications:
- **Understand resource capabilities** before using them
- **Get real-time statistics** instead of placeholder values
- **Optimize queries** based on resource types
- **Provide better user feedback** about available features
- **Implement intelligent fallbacks** when resources are unavailable

## React Integration

For React applications, use the `useWordNet` hook which provides a worker-first architecture:

```tsx
import { useWordNet } from 'wn-ts-web/react';

function WordNetComponent() {
  const { 
    loading, 
    workerReady,
    loadPackageData, 
    queryWords, 
    statistics,
    introspectLexicon 
  } = useWordNet();

  const handleLoad = async () => {
    if (workerReady) {
      await loadPackageData('oewn:2024');
    } else {
      console.log('Worker not ready yet');
    }
  };

  const handleIntrospect = async () => {
    try {
      const info = await introspectLexicon('oewn:2024');
      console.log('Lexicon info:', info);
      console.log('Real sense count:', info.senseCount); // No more placeholder 0!
    } catch (error) {
      console.error('Introspection failed:', error);
    }
  };

  return (
    <div>
      {loading ? 'Loading...' : 'Ready'}
      <button onClick={handleLoad}>Load Package</button>
      <button onClick={handleIntrospect}>Introspect Lexicon</button>
    </div>
  );
}
```

The hook automatically manages worker communication, event handling, and state synchronization. See [WORKER_ARCHITECTURE.md](./docs/WORKER_ARCHITECTURE.md) for detailed usage patterns.

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
    loadPackageData,
    introspectLexicon 
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
    // 1. Create the WordNet instance
    const { wordnet, dataLoader } = await createWordNetInstance('oewn:2024');

    // 2. Load WordNet data from a source with progress tracking
    await dataLoader.downloadAndLoad('oewn:2024', {
      onProgress: (progress) => {
        // progress is a number from 0 to 1
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
- **Real-Time Statistics**: Enhanced lexicon introspection provides actual database statistics instead of estimates.

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
