# wn-ts-core

Core TypeScript library for the WordNet ecosystem with microkernel architecture and comprehensive plugin system.

## Features

- **Microkernel Architecture** - Modern plugin-based design with composable functionality
- **Environment Agnostic** - Works in browsers, Node.js, and other JavaScript environments
- **TypeScript First** - Full TypeScript support with comprehensive type definitions
- **Plugin System** - Extensible, composable, and type-safe plugins
- **Core Modules** - Essential WordNet functionality (morphology, relations, data management)
- **LMF Parsing** - Multiple parser implementations for LMF XML files (1.0-1.4)
- **Schema Management** - Built-in database schema management and health checking
- **Cross-Lingual Support** - ILI-based translation and cross-language queries

## Installation

```bash
npm install wn-ts-core
```

## Usage

### Core Types
```typescript
import type { Word, Synset, Sense, WordNetCore } from 'wn-ts-core';

interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  language: string;
  lexicon: string;
}
```

### Kernel Architecture
```typescript
import { createWordNet, relations, similarity, translation } from 'wn-ts-core';

const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation]
});

// Use plugin methods
const hypernyms = await wordnet.getHypernyms(synsetId);
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const translations = await wordnet.getTranslations(synsetId);
```

### Plugin Development
```typescript
import { Plugin } from 'wn-ts-core';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Initialize plugin
  }
  
  async destroy(): Promise<void> {
    // Clean up resources
  }
}
```

## Core Modules

- **Morphology** - Lemmatization and word form analysis
- **Relations** - WordNet relationship queries (hypernyms, hyponyms, etc.)
- **Data Management** - Project and ILI management
- **Environment** - Configuration and environment detection

## Plugins

- **Relations Plugin** - WordNet relationship queries
- **Similarity Plugin** - Semantic similarity calculations
- **Translation Plugin** - Cross-lingual operations

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Plugin Development](../../docs/api/PLUGIN_API.md)
- [Architecture Guide](../../docs/architecture/SYSTEM_ARCHITECTURE.md)