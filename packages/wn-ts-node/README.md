# wn-ts-node

Node.js implementation of the WordNet TypeScript ecosystem with SQLite integration and microkernel architecture.

## Features

- **Microkernel Architecture** - Plugin-based design with relations, similarity, and translation plugins
- **Native SQLite** - High-performance database operations with native SQLite3
- **Performance** - Optimized for server-side processing and large datasets
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Cross-Lingual** - Multi-language support with ILI-based translation
- **CLI Tools** - Built-in command-line interface for data management
- **Data Export** - Export WordNet data in multiple formats (JSON, XML, CSV)

## Installation

```bash
npm install wn-ts-node
```

## Usage

### Basic Usage
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

### Module Functions
```typescript
import { words, synsets, download, add } from 'wn-ts-node';

// Query functions
const wordList = await words('computer');
const synsetList = await synsets('computer');

// Data management
await download('oewn:2024');
await add('oewn:2024');
```

### Plugin Usage
```typescript
const hypernyms = await wordnet.getHypernyms(synsetId);
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const translations = await wordnet.getTranslations(synsetId, 'fr');
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