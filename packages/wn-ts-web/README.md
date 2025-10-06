# wn-ts-web

Browser-compatible WordNet implementation with simplified APIs and auto-initialization.

## Features

- **Simplified API** - One clear way to use the library with `createWebWordnet()`
- **Auto-Initialization** - Works out of the box, no setup required
- **Plugin System** - Optional plugins for advanced functionality
- **SQLite WASM** - High-performance database operations in the browser
- **OPFS Support** - Persistent storage using Origin Private File System
- **Worker-First** - Designed to run in Web Workers for optimal performance
- **TypeScript** - Full type safety and IntelliSense
- **Better Errors** - User-friendly error messages with solutions

## Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

## Usage

### Direct API (Recommended)
```typescript
import { createWebWordnet } from 'wn-ts-web';

// Auto-initializes on first use
const wn = createWebWordnet('oewn:2024');

// Simple search - returns synsets
const results = await wn.search('computer');
console.log(results);

// Advanced operations
const words = await wn.words({ form: 'computer' });
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);

// Auto-closes on page unload
```

### With Plugins
```typescript
import { createWebWordnet } from 'wn-ts-web';
import { relationsPlugin, similarityPlugin } from 'wn-ts-web/plugins';

const wn = createWebWordnet('oewn:2024', {
  plugins: [relationsPlugin, similarityPlugin]
});

// Now you have access to plugin methods
const hypernyms = await wn.getHypernyms(synsetId);
const similarity = await wn.getPathSimilarity(synset1, synset2);
```

### Advanced Usage
```typescript
import { WebWordNetKernel } from 'wn-ts-web/low-level';

const wn = new WebWordNetKernel('oewn:2024', {
  storage: 'opfs',
  enableWorkers: true
});
await wn.initialize();
// ... use wn
await wn.close();
```

## Examples

### Basic Word Search
```typescript
const { queryWords } = useWordNet();
const words = await queryWords('computer');
```

### Comprehensive Relations Usage
```typescript
const { 
  getHypernyms, 
  getMeronyms, 
  getAgents, 
  getDomainTopics,
  getRelationsByCategory,
  getRelationStatsByCategory 
} = useWordNetKernel();

// Basic relations
const hypernyms = await getHypernyms('car-synset-id');
const meronyms = await getMeronyms('car-synset-id');
const agents = await getAgents('drive-synset-id');

// Domain relations
const domainTopics = await getDomainTopics('photosynthesis-synset-id');

// Query by category
const hierarchicalRelations = await getRelationsByCategory('car-synset-id', 'HIERARCHICAL');
const semanticRoles = await getRelationsByCategory('drive-synset-id', 'SEMANTIC_ROLES');

// Get relation statistics
const stats = await getRelationStatsByCategory('car-synset-id');
console.log(`Car has ${stats.HIERARCHICAL} hierarchical relations`);
```

## Browser Requirements

- Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- Web Workers support
- IndexedDB support
- OPFS support (optional, for better performance)

## Configuration

```typescript
const options = {
  enableWorkers: true,
  workerUrl: '/workers/wordnet-worker.js',
  enableOPFS: true,
  cacheSize: 1000
};
```

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Examples](../../docs/examples/README.md)
- [Getting Started](../../docs/getting-started/README.md)