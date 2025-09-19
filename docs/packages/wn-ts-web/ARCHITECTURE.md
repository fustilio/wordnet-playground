# wn-ts-web Architecture

## Microkernel Architecture

The library uses a modern **microkernel architecture** with a plugin system:

```
WebWordNetKernel
├── WebWordNetCore (implements WordNetCore)
│   ├── WebWordnet (database operations)
│   └── WebKyselyDatabase (SQLite WASM integration)
├── Plugin System
│   ├── Relations Plugin (hypernyms, hyponyms, etc.)
│   ├── Similarity Plugin (path, Wu-Palmer, etc.)
│   └── Translation Plugin (cross-lingual operations)
└── Schema Management (built-in)
```

### Plugin System Features

- **Type-Safe**: Full TypeScript support with compile-time checking
- **Composable**: Plugins can be combined in any order
- **Extensible**: Easy to add new functionality via plugins
- **Zero Runtime Overhead**: Type-safe plugin system with no performance impact
- **React Integration**: Custom hooks and context providers for easy React integration

## Resource Types and Lexicon Introspection

The library distinguishes between two main types of resources and provides comprehensive introspection capabilities:

### Lexicons vs. ILIs

#### Lexicons (Language-Specific Resources)
- **Purpose**: Contain actual words, synsets, and definitions in specific languages
- **Examples**: `oewn:2024` (English), `omw-fr:1.4` (French), `omw-th:1.4` (Thai)
- **Structure**: Words, synsets, senses, definitions, relations
- **Use Case**: Direct language queries, word lookups, semantic analysis

#### ILIs (Interlingual Indexes)
- **Purpose**: Provide cross-lingual mapping between synsets across languages
- **Examples**: `cili:1.0` (Collaborative Interlingual Index)
- **Structure**: ILI identifiers, cross-lingual mappings, concept bridges
- **Use Case**: Bilingual queries, cross-language concept mapping, multilingual applications

### Enhanced Introspection and Analysis

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

### Resource Categorization

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

The hook automatically manages worker communication, event handling, and state synchronization.

## Web Worker Architecture

For stability and responsiveness, run `wn-ts-web` inside a Web Worker. SQLite/OPFS access and heavy operations should not block the main UI thread.

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
