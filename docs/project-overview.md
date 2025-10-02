---
title: Project Overview
description: A production-ready TypeScript ecosystem for working with WordNet data
---

# WordNet TypeScript Ecosystem

A production-ready TypeScript ecosystem for working with WordNet data, built on a **microkernel architecture** with plugin system, cross-lingual support, and optimized database operations.

## 🎯 **Current Status (v0.6.3)**

**✅ Production Ready**: The ecosystem is stable and well-tested with comprehensive functionality:

- **Core Library**: v0.5.2 - Microkernel architecture with plugin system
- **Web Package**: v0.7.2 - Browser implementation with React integration
- **Node Package**: v0.7.2 - Node.js implementation with SQLite
- **CLI Package**: v0.6.3 - Command-line interface and TUI

**📊 Test Coverage**:
- Unit Tests: 90%+ coverage across all packages
- Integration Tests: 80%+ coverage of module interactions
- End-to-End Tests: 70%+ coverage of user workflows
- Browser Tests: Full cross-browser compatibility testing

## 🏗️ **Architecture Overview**

The ecosystem uses a microkernel design that separates core functionality from environment-specific implementations:

- **wn-ts-core**: Foundation library with microkernel and plugin system
- **wn-ts-node**: Node.js implementation with SQLite integration
- **wn-ts-web**: Browser implementation with built-in React components (future: may split to `wn-ts-web-react`)
- **wn-ts-web-demo**: Interactive demo showcasing capabilities

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run browser tests
pnpm test:browser

# Run all demo examples
pnpm demo:all-use-cases

# Run benchmarks
pnpm benchmark
```

## 🏗️ **Microkernel Architecture**

The ecosystem uses a microkernel design with a plugin system:

### **Core Components**

- **`WordNetCore`**: Interface defining core database and WordNet methods
- **`WordNetKernel`**: Central component managing plugins and schema
- **Plugins**: Type-safe, composable, and optional functionalities
  - **Relations Plugin**: WordNet relations (hypernym, hyponym, etc.)
  - **Similarity Plugin**: Semantic similarity metrics
  - **Translation Plugin**: Cross-lingual mapping and translation

### **Architecture Map**

```
WordNetCore (interface)
├── NodeWordNetCore (Node.js implementation)
│   ├── words()
│   ├── synsets()
│   └── query()
└── WordNetKernel (composition)
    ├── relations plugin    ← Modular
    ├── similarity plugin   ← Modular
    ├── translation plugin  ← Modular
    └── schema management   ← Core
```

## 📦 **Project Structure**

The project is organized into three main directories:

### **📦 Packages** (`packages/`)
Core libraries and utilities:
```
packages/
├── wn-ts-core/           # Foundation library with microkernel and plugin system
├── wn-ts-node/           # Node.js implementation with SQLite integration
├── wn-ts-web/            # Browser implementation with built-in React components (future: may split to wn-ts-web-react)
├── wn-cli/               # Command-line interface and TUI
├── wn-data-loader/       # Data loading and processing utilities
├── wn-test-data/         # Test data and sample files
└── utils/                # Shared utilities and logging
```

### **🎭 Examples** (`examples/`)
Demo applications and usage examples:
```
examples/
├── wn-ts-web-demo/       # Interactive web demo with React
└── wn-ts-node-demo/      # Node.js examples and use cases
```

### **🔬 Development** (`development/`)
Development tools, benchmarks, and experimental features:
```
development/
├── benchmark/            # Performance testing and library comparisons
├── sqlite-opfs-demo/     # SQLite OPFS browser demo
└── wn-pybridge/          # Python bridge for cross-language testing
```

## 🏗️ **Architecture Layers**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ wn-ts-web-  │  │   wn-cli    │  │  Custom     │              │
│  │    demo     │  │             │  │  Apps       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ wn-ts-node  │  │ wn-ts-web   │  │ Future:     │              │
│  │ (Node.js)   │  │ (Browser)   │  │ wn-ts-deno  │              │
│  │ ✅ Kernel   │  │ ✅ Kernel    │  │ 📋 Planned  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Layer                                 │
│                    ┌─────────────┐                              │
│                    │ wn-ts-core  │                              │
│                    │ (Microkernel)│                              │
│                    │ ✅ Plugins   │                            │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 **Core Components**

### **WordNetCore Interface**
```typescript
export interface WordNetCore {
  // Database operations
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  
  // Base WordNet methods
  words(query?: WordQuery): Promise<Word[]>;
  word(wordId: string): Promise<Word>;
  synsets(query?: SynsetQuery): Promise<Synset[]>;
  synset(synsetId: string): Promise<Synset>;
  senses(query?: SenseQuery): Promise<Sense[]>;
  sense(senseId: string): Promise<Sense>;
  
  // Interlingual queries
  ili(iliId: string): Promise<ILI>;
  ilis(status?: string): Promise<ILI[]>;
  synsetsByILI(iliId: string): Promise<Synset[]>;
}
```

### **WordNetKernel Class**
```typescript
export class WordNetKernel<TPlugins extends readonly Plugin[]> {
  constructor(core: WordNetCore, kyselyDb?: KyselyDatabase) {
    this.core = core;
    this.kyselyDb = kyselyDb;
  }
  
  // Delegate to core
  async words(query?: WordQuery): Promise<Word[]> {
    return this.core.words(query);
  }
  
  // Plugin system
  use<TNewPlugin extends Plugin>(plugin: TNewPlugin): WordNetWithPlugins<[...TPlugins, TNewPlugin]> {
    // Add plugin methods
  }
}
```

## 🚀 **Usage Examples**

### **Node.js**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db'
});

await wordnet.initialize();

// Basic operations
const words = await wordnet.words({ form: 'computer' });
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Plugin operations
const hypernyms = await wordnet.getHypernyms(synsets[0].id);
const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
const translations = await wordnet.getTranslations(synsets[0].id);

await wordnet.close();
```

### **Web/Browser**
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wordnet = new WebWordNetKernel('oewn:2024');

await wordnet.initialize();

// Same API as Node.js
const words = await wordnet.words({ form: 'computer' });
const hypernyms = await wordnet.getHypernyms(synsets[0].id);

await wordnet.close();
```

## 🔌 **Plugin System**

### **Available Plugins**

1. **Relations Plugin**: WordNet relationship queries
   - `getHypernyms()`, `getHyponyms()`, `getMeronyms()`, etc.
   - `getRelationsByType()`, `getAllRelations()`

2. **Similarity Plugin**: Semantic similarity calculations
   - `getPathSimilarity()`, `getWuPalmerSimilarity()`
   - `getLeacockChodorowSimilarity()`, `getJaccardSimilarity()`
   - `getBestSimilarity()`, `findMostSimilar()`

3. **Translation Plugin**: Cross-lingual operations
   - `getTranslations()`, `getTranslationsByWord()`
   - `getAvailableLanguages()`, `getSynsetsByIli()`
   - `getTranslationConfidence()`, `getTranslationSuggestions()`

### **Type Safety**
```typescript
// TypeScript knows the exact return types
const hypernyms: Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}> = await wordnet.getHypernyms(synsetId);

// Compile-time checking ensures correct usage
const similarity: number = await wordnet.getPathSimilarity(synset1, synset2);
```

### **Custom Plugins**
```typescript
import type { Plugin, WordNetCore } from 'wn-ts-core';

const customPlugin: Plugin<WordNetCore, 'custom'> = {
  name: 'custom',
  methods: {
    customMethod: async (core, param: string) => {
      // Your custom implementation
      return core.query('SELECT * FROM words WHERE form = ?', [param]);
    }
  }
};

// Use with createWordNet
const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation, customPlugin]
});
```

## 📚 **Lexicon Formats & Data Structure**

### **Supported Lexicon Formats**

The ecosystem supports multiple WordNet lexicon formats for maximum compatibility:

- **LMF XML (Lexical Markup Framework)**: Primary format with versions 1.0-1.4
- **JSON-LD (Lemon Vocabulary)**: JSON format with Linked Data semantics  
- **OntoLex RDF**: RDF/OWL representation of WordNet
- **Custom TSV/CSV**: Tabular formats for bulk operations

### **LMF XML Structure**

LMF XML follows the official WordNet-LMF schema with these key elements:

```xml
<LexicalResource>
  <Lexicon id="en-1.0" language="en" version="1.0">
    <LexicalEntry id="word-1" partOfSpeech="n">
      <Lemma writtenForm="example"/>
      <Sense id="sense-1" synset="synset-1"/>
    </LexicalEntry>
    <Synset id="synset-1" ili="i12345" partOfSpeech="n">
      <Definition>An example definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>
```

**Critical Processing Order**: LMF XML must be processed in dependency order:
1. **Lexicons** (metadata and versioning)
2. **Words** (lexical entries with lemmas)
3. **Synsets** (concept groupings with ILI mappings)
4. **Senses** (word-synset relationships)
5. **Relations** (cross-synset connections)
6. **Definitions & Examples** (descriptive content)

## 🗄️ **Database Schema & Data Mapping**

The system uses a normalized relational database schema optimized for cross-lingual linking and efficient querying:

### **Core Tables Structure**

```typescript
interface Database {
  lexicons: LexiconTable;      // Lexicon metadata and versioning
  words: WordTable;            // Lexical entries (lemmas)
  synsets: SynsetTable;        // Synsets with ILI mappings
  senses: SenseTable;          // Word-synset relationships
  definitions: DefinitionTable; // Synset definitions
  relations: RelationTable;    // Synset-synset relationships
  examples: ExampleTable;      // Usage examples
  ilis: IliTable;              // Interlingual Index entries
  forms: FormTable;            // Alternative word forms
}
```

### **Cross-Lingual Linking Strategy**

The ILI (Interlingual Index) system enables powerful cross-language operations:

```typescript
// Find equivalent concepts across languages
const englishSynset = await wordnet.getSynset('en', 'synset-1')
const iliId = englishSynset.iliId
const frenchSynsets = await wordnet.findSynsetsByIli('fr', iliId)
const germanSynsets = await wordnet.findSynsetsByIli('de', iliId)
```

## ✅ **Data Integrity & Validation**

### **Schema Compliance**

- **XSD Validation**: All LMF XML validated against official WN-LMF schemas
- **Type Safety**: Full TypeScript typing with strict interfaces
- **Constraint Validation**: Database-level foreign key and uniqueness constraints

### **Comprehensive Validation System**

The validation pipeline ensures data quality at every stage:

1. **XML Structure**: Schema compliance and well-formedness
2. **Data Consistency**: Referential integrity and constraint validation
3. **Business Rules**: WordNet-specific validation logic
4. **Cross-Reference**: ILI mapping validation across lexicons

## 📦 **Core Modules**

### **`wn-ts-core`** - Foundation Library
- `WordNetCore` interface and `WordNetKernel` class
- Plugin system (relations, similarity, translation)
- LMF XML parser and validator
- Database schema definitions
- Shared utilities and constants

### **`wn-ts-web`** - Browser Implementation
- `WebWordNetCore` and `WebWordNetKernel` implementations
- React hooks and components
- Web Worker integration
- SQLite with OPFS storage
- Browser-optimized performance

### **`wn-ts-node`** - Node.js Implementation
- `NodeWordNetCore` and `NodeWordNetKernel` implementations
- Server-side processing
- File system operations
- Database management
- CLI tools and utilities

### **`wn-ts-web-demo`** - Interactive Examples
- Live demonstration of capabilities
- Cross-lingual exploration
- Performance benchmarking
- Development playground

## 🧪 **Testing & Quality**

### **Comprehensive Test Coverage**

- **Unit Tests**: Core functionality and edge cases
- **Integration Tests**: Module interaction and data flow
- **E2E Tests**: Complete user workflows
- **Browser Tests**: Cross-browser compatibility
- **Performance Tests**: Benchmarking and optimization

### **Test Data Management**

- **Embedded Test Files**: Self-contained test data
- **Real-World Samples**: Actual WordNet data for validation
- **Edge Case Coverage**: Duplicate IDs, malformed XML, etc.
- **Cross-Lingual Validation**: Multi-language test scenarios

## 🚀 **Performance & Optimization**

### **Key Performance Features**

- **Lazy Loading**: Lexicons loaded on-demand
- **Intelligent Caching**: Multi-level caching strategy
- **Parallel Processing**: Worker-based concurrent operations
- **Database Optimization**: Strategic indexing and query optimization
- **Memory Management**: Efficient resource handling

### **Benchmark Results**

- **XML Parsing**: < 100ms for 1MB LMF files
- **Database Operations**: < 50ms for single queries
- **Cross-Lingual Queries**: < 200ms for complex ILI lookups
- **Memory Usage**: < 2x input size for processing

## 🔧 **Development & Contributing**

### **Prerequisites**

- Node.js 18+ and pnpm
- TypeScript 5.0+
- Modern browser support (ES2020+)

### **Development Workflow**

```bash
# Setup development environment
pnpm install
pnpm build

# Run tests
pnpm test
pnpm test:browser

# Build packages
pnpm build:packages

# Run benchmarks
pnpm bench
```

### **Code Quality Standards**

- **TypeScript Strict Mode**: Full type safety enforcement
- **ESLint + Prettier**: Consistent code formatting
- **Test Coverage**: Minimum 90% unit test coverage
- **Documentation**: Comprehensive API documentation
- **Performance**: Benchmark requirements for critical paths

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](https://github.com/fustilio/wordnet-playground-2/blob/main/LICENSE) file for details.

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines and development standards in the [documentation](./development/) directory.

## 📚 **References & Resources**

- **[WordNet Project](https://wordnet.princeton.edu/)** - Original WordNet database
- **[LMF Specification](https://www.lexicalmarkupframework.org/)** - Lexical Markup Framework standard
- **[Interlingual Index](https://en.wikipedia.org/wiki/Interlingual_Index)** - Cross-lingual concept mapping
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript language reference
