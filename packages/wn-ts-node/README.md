# wn-ts-node

Node.js implementation of the WordNet TypeScript ecosystem with simplified APIs and auto-initialization.

## Features

- **Simplified API** - One clear way to use the library with `createWordnet()`
- **Auto-Initialization** - Works out of the box, no setup required
- **Plugin System** - Optional plugins for advanced functionality
- **Native SQLite** - High-performance database operations with native SQLite3
- **Performance** - Optimized for server-side processing and large datasets
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Cross-Lingual** - Multi-language support with ILI-based translation
- **Better Errors** - User-friendly error messages with solutions

## Installation

```bash
npm install wn-ts-node
```

## Usage

### Basic Usage (Recommended)
```typescript
import { createWordnet } from 'wn-ts-node';

// Auto-initializes on first use
const wn = createWordnet('oewn:2024');

// Simple search - returns synsets
const results = await wn.search('computer');
console.log(results);

// Advanced operations
const words = await wn.words({ form: 'computer' });
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);

// Auto-closes on process exit
```

### With Plugins
```typescript
import { createWordnet } from 'wn-ts-node';
import { relationsPlugin, similarityPlugin } from 'wn-ts-node/plugins';

const wn = createWordnet('oewn:2024', {
  plugins: [relationsPlugin, similarityPlugin]
});

// Now you have access to plugin methods
const hypernyms = await wn.getHypernyms(synsetId);
const similarity = await wn.getPathSimilarity(synset1, synset2);
```

### Advanced Usage
```typescript
import { NodeWordNetKernel } from 'wn-ts-node/low-level';

const wn = new NodeWordNetKernel('oewn:2024', {
  filename: 'custom.db',
  enableWAL: true
});
await wn.initialize();
// ... use wn
await wn.close();
```

## Configuration

```typescript
const options = {
  filename: 'wordnet.db',
  enableWAL: true,
  enableForeignKeys: true,
  maxConnections: 10
};
```

## CLI Usage

```bash
# Search
wn-cli search "computer" --lexicon oewn:2024

# Relationships
wn-cli relations "computer" --type hypernym

# Data management
wn-cli data download oewn:2024
wn-cli data export --format json
```

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Examples](../../docs/examples/README.md)
- [Getting Started](../../docs/getting-started/README.md)