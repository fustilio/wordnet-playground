# wn-ts-web

Browser-compatible WordNet implementation with SQLite WASM and microkernel architecture.

## Features

- **Microkernel Architecture** - Plugin-based design with comprehensive relations, similarity, and translation plugins
- **Comprehensive Relations** - Complete support for all 70+ WordNet relation types
- **SQLite WASM** - High-performance database operations in the browser
- **OPFS Support** - Persistent storage using Origin Private File System
- **Worker-First** - Designed to run in Web Workers for optimal performance
- **React Integration** - Custom hooks and context providers
- **TypeScript** - Full type safety and IntelliSense

## Installation

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

## Usage

### React Hooks (Recommended)
```typescript
import { useWordNet, useWordNetKernel } from 'wn-ts-web';

// Worker-based hook
const { queryWords, loading, error } = useWordNet();

// Kernel-based hook  
const { words, synsets, getHypernyms } = useWordNetKernel();
```

### Direct API
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wordnet = new WebWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
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