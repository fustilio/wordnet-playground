# wn-ts-core

**Core TypeScript library for the WordNet ecosystem** - Environment-agnostic foundation with microkernel architecture, plugin system, and comprehensive WordNet functionality.

## 🎯 **Overview**

`wn-ts-core` is the foundational library that provides the core types, interfaces, and utilities for the entire WordNet TypeScript ecosystem. It defines the data structures, parsing logic, database schemas, and microkernel architecture used across all `wn-ts` modules.

## ✨ **Key Features**

- **Microkernel Architecture**: Modern plugin-based design with composable functionality
- **Environment Agnostic**: Works in browsers, Node.js, and other JavaScript environments
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Plugin System**: Extensible, composable, and type-safe plugins
- **Core Modules**: Essential WordNet functionality (morphology, relations, data management)
- **LMF Parsing**: Multiple parser implementations for LMF XML files (1.0-1.4)
- **Schema Management**: Built-in database schema management and health checking
- **Cross-Lingual Support**: ILI-based translation and cross-language queries
- **Lexicon-Aware Similarity**: Proper handling of synset IDs with lexicon context
- **Performance Optimized**: Query strategies, caching, and batch operations
- **Comprehensive Testing**: Full test coverage with mock implementations

## 🏗️ **Architecture**

### **Microkernel Design**

The library uses a modern **microkernel architecture** with a plugin system:

```
WordNetCore (interface)
├── WordNetKernel (composition)
│   ├── Core Modules (essential)
│   │   ├── Morphology (lemmatization)
│   │   ├── Relations (hypernyms, hyponyms)
│   │   ├── Data Management (projects, ILI)
│   │   └── Environment (configuration)
│   ├── Plugins (optional)
│   │   ├── Similarity (path, Wu-Palmer, etc.)
│   │   └── Translation (cross-lingual)
│   └── Schema Management (built-in)
└── Concrete Implementations
    ├── wn-ts-web (browser)
    └── wn-ts-node (Node.js)
```

### **Plugin System**

The plugin system allows for modular, composable functionality:

- **Type-Safe**: Full TypeScript support with compile-time checking
- **Composable**: Plugins can be combined in any order
- **Extensible**: Easy to add new functionality via plugins
- **Optional**: Core functionality works without any plugins


## 🔧 **Core Components**

### **1. WordNetCore Interface**
The fundamental interface that all implementations must provide:

```typescript
interface WordNetCore {
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
  
  // Lexicon queries
  lexicons(): Promise<Lexicon[]>;
}
```

### **2. WordNetKernel Class**
The kernel that provides plugin management and schema management:

```typescript
class WordNetKernel<TPlugins extends readonly Plugin[]> {
  constructor(core: WordNetCore, kyselyDb?: KyselyDatabase);
  
  // Delegate to core
  async words(query?: WordQuery): Promise<Word[]>;
  async synsets(query?: SynsetQuery): Promise<Synset[]>;
  // ... other core methods
  
  // Plugin system
  use<TNewPlugin extends Plugin>(plugin: TNewPlugin): WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
  remove(name: string): WordNetWithPlugins<TPlugins>;
  has(name: string): boolean;
  
  // Schema management
  get schemaManager(): SchemaManager;
}
```

### **3. Factory Function**
Convenient factory for creating WordNet instances:

```typescript
function createWordNet<TPlugins extends readonly Plugin[]>(config: {
  core: WordNetCore;
  kyselyDb?: KyselyDatabase;
  plugins?: TPlugins;
}): WordNetWithPlugins<TPlugins>;
```

## 📦 **Module Structure**

### **Core Modules (Essential)**

These modules provide essential WordNet functionality and are **not plugins**:

#### **Morphology Module** (`src/modules/morphology/`)
- **Purpose**: Lemmatization and morphological analysis
- **Key Features**:
  - `Morphy` class for finding base forms
  - Exception handling for irregular forms
  - Part-of-speech specific rules
  - Comprehensive morphological rules for English
- **Usage**: `import { Morphy, morphy } from 'wn-ts-core'`

#### **Relations Module** (`src/modules/relations/`)
- **Purpose**: Synset relationship queries and taxonomy analysis
- **Key Features**:
  - Hypernym/hyponym queries
  - Shortest path calculations
  - Taxonomy depth analysis
  - Simple relation queries
  - Lexicon-aware relationship handling
- **Usage**: `import { getHypernyms, shortestPath } from 'wn-ts-core'`

#### **Data Management Module** (`src/modules/data-management/`)
- **Purpose**: WordNet project and data management
- **Key Features**:
  - Project discovery and loading
  - ILI (Interlingual Index) handling
  - Lexical resource management
  - TOML-based project configuration
- **Usage**: `import { getProjects, loadLexicalResource } from 'wn-ts-core'`

#### **Environment Module** (`src/modules/environment/`)
- **Purpose**: Configuration and environment management
- **Key Features**:
  - Configuration management
  - Environment-specific settings
  - Cross-platform compatibility
- **Usage**: `import { getConfig } from 'wn-ts-core'`

### **Plugins (Optional)**

These are true plugins that can be added/removed without breaking core functionality:

#### **Similarity Plugin** (`src/plugins/similarity/`)
- **Purpose**: Semantic similarity calculations
- **Algorithms**:
  - Path similarity
  - Wu-Palmer similarity
  - Leacock-Chodorow similarity
  - Information Content-based metrics (Resnik, Lin, Jiang-Conrath)
  - Jaccard similarity
- **Usage**: `import { similarity } from 'wn-ts-core/plugins'`

#### **Translation Plugin** (`src/plugins/translation/`)
- **Purpose**: Cross-lingual operations
- **Features**:
  - ILI-based translations
  - Multi-language synset lookup
  - Translation confidence scoring
  - Cross-lingual similarity
- **Usage**: `import { translation } from 'wn-ts-core/plugins'`

### **Parser System** (`src/parsers/`)

Multiple LMF XML parser implementations for different use cases:

- **Streaming SAX Parser**: Memory-efficient for large files
- **In-Memory SAX Parser**: Fast parsing for smaller files
- **Legacy Parser**: Original fast-xml-parser implementation
- **Native XML Parser**: Regex-based ultra-fast parsing
- **Python Parser**: Python-based parsing via pythonia

**Usage**: `import { getDefaultParser, getParser } from 'wn-ts-core/parsers'`

## 🚀 **Quick Start**

### **Installation**

```bash
pnpm add wn-ts-core
```

### **Basic Usage**

```typescript
import { createWordNet } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';

// Create a WordNet instance with plugins
const wordnet = createWordNet({
  core: myWordNetCore, // Your implementation
  plugins: [similarity, translation] as const
});

// Basic queries
const words = await wordnet.words({ form: 'computer' });
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Plugin methods
const hypernyms = await wordnet.getHypernyms(synsets[0].id);
const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
const translations = await wordnet.getTranslations(synsets[0].id, 'fr');
```

### **Using Core Modules Directly**

```typescript
import { Morphy, getHypernyms, shortestPath } from 'wn-ts-core';

// Morphological analysis
const morphy = new Morphy();
const baseForms = await morphy.analyze('running', 'v');
// Returns: { 'v': Set { 'run' } }

// Relation queries
const hypernyms = await getHypernyms(wordnet, 'synset-id');
const path = await shortestPath(wordnet, 'synset1', 'synset2');
```

### **LMF Parsing**

```typescript
import { getDefaultParser } from 'wn-ts-core/parsers';

const parser = getDefaultParser();
const result = await parser.parse(xmlContent);

console.log('Words:', result.words.length);
console.log('Synsets:', result.synsets.length);
console.log('Senses:', result.senses.length);
```

## 🔧 **Core Types & Schemas**

### **Entity Types**

```typescript
interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  forms: Form[];
  pronunciations: Pronunciation[];
  tags: Tag[];
  counts: Count[];
  frames?: SyntacticBehaviour[];
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  ili?: string;
  pos: PartOfSpeech;
  definitions: Definition[];
  examples: Example[];
  relations: Relation[];
  iliDefinitions?: Definition[];
  language: string;
  lexicon: string;
  members: string[];
  senses: string[];
}

interface Sense {
  id: string;
  word: string;
  synset: string;
  examples: Example[];
  counts: Count[];
  tags: Tag[];
  relations?: Relation[];
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}
```

### **Database Schema**

```typescript
interface Database {
  lexicons: LexiconTable;      // Lexicon metadata
  words: WordTable;            // Lexical entries
  synsets: SynsetTable;        // Concept groupings
  senses: SenseTable;          // Word-synset relationships
  definitions: DefinitionTable; // Synset definitions
  relations: RelationTable;    // Cross-synset relationships
  examples: ExampleTable;      // Usage examples
  ilis: IliTable;              // Interlingual Index
  forms: FormTable;            // Alternative word forms
}
```

## 🚀 **Usage Examples**

### **Morphological Analysis**

```typescript
import { Morphy, morphy } from 'wn-ts-core';

// Create Morphy instance
const morphyInstance = new Morphy();

// Find base forms
const baseForms = await morphy('running', 'v');
// Returns: { 'v': Set { 'run' } }

const allForms = await morphy('running');
// Returns: { 'v': Set { 'run' }, 'n': Set { 'run' } }
```

### **Relation Queries**

```typescript
import { getHypernyms, shortestPath } from 'wn-ts-core';

// Get hypernyms
const hypernyms = await getHypernyms(wordnet, 'synset-id');

// Find shortest path
const path = await shortestPath(wordnet, 'synset1', 'synset2');
```

### **LMF Parsing**

```typescript
import { getDefaultParser } from 'wn-ts-core/parsers';

const parser = getDefaultParser();
const result = await parser.parse(xmlContent);

console.log('Words:', result.words.length);
console.log('Synsets:', result.synsets.length);
console.log('Senses:', result.senses.length);
```

## 🔌 **Plugin System**

### **Creating Custom Plugins**

```typescript
import type { Plugin, WordNetCore } from 'wn-ts-core';

const customPlugin: Plugin = {
  name: 'analytics',
  methods: {
    getWordFrequency: async (core: WordNetCore, wordId: string) => {
      const result = await core.query(
        'SELECT COUNT(*) as frequency FROM senses WHERE word_id = ?',
        [wordId]
      );
      return result[0]?.frequency || 0;
    },
    
    getSynsetComplexity: async (core: WordNetCore, synsetId: string) => {
      const senses = await core.getSenses(synsetId);
      return senses.length;
    }
  }
};

// Use the plugin
const wordnet = createWordNet({
  core: myCore,
  plugins: [customPlugin]
});

// Access plugin methods
const frequency = await wordnet.getWordFrequency('word-id');
const complexity = await wordnet.getSynsetComplexity('synset-id');
```

### **Plugin Collections**

```typescript
import { allPlugins, similarityPlugins, translationPlugins } from 'wn-ts-core/plugins';

// Use all available plugins
const wordnet = createWordNet({
  core: myCore,
  plugins: allPlugins
});

// Use only similarity plugins
const wordnet = createWordNet({
  core: myCore,
  plugins: similarityPlugins
});
```

## 🗄️ **Database Integration**

### **Schema Management**

```typescript
import { SchemaBuilder } from 'wn-ts-core/shared';

// Create all tables
const schema = SchemaBuilder.createAllTables();

// Create specific table
const wordsTable = SchemaBuilder.createWordsTable();
```

### **Query Strategies**

```typescript
import { BaseKyselyQueryService } from 'wn-ts-core/shared';

class MyQueryService extends BaseKyselyQueryService {
  constructor(db: Kysely<Database>) {
    super(db, { strategy: 'optimized' });
  }
  
  // Override methods for custom behavior
  async getWords(query: WordQuery): Promise<Word[]> {
    return this.executeQuery('words', query, {
      includeDefinitions: true,
      includeExamples: false
    });
  }
}
```

## 🧪 **Testing Support**

### **Test Utilities**

```typescript
import { createTestLexicon, createTestWord } from 'wn-ts-core/test';

const testLexicon = createTestLexicon('en', '1.0.0');
const testWord = createTestWord('test-word', testLexicon.id);
```

### **Mock Implementations**

```typescript
import type { WordNetCore } from 'wn-ts-core';

class MockWordNetCore implements WordNetCore {
  async words(query?: WordQuery): Promise<Word[]> {
    return []; // Mock implementation
  }
  // ... implement other methods
}
```

## 📊 **Performance Features**

### **Query Optimization**
- Strategy-based query execution
- Lazy loading for large datasets
- Intelligent caching
- Batch operations

### **Parser Performance**
- Streaming parsers for large files
- Memory-efficient processing
- Parallel parsing support
- Progress callbacks

### **Memory Management**
- Efficient resource handling
- Garbage collection optimization
- Memory usage monitoring

## 🔧 **Configuration**

### **Environment Configuration**

```typescript
import { getConfig } from 'wn-ts-core';

const config = getConfig({
  logLevel: 'info',
  cacheSize: 1000,
  maxConnections: 10
});
```

### **Parser Configuration**

```typescript
import { getParser } from 'wn-ts-core/parsers';

const parser = getParser('streaming-sax', {
  mergeStrategy: 'keep-last',
  validateSchema: true,
  progressCallback: (progress) => console.log(progress)
});
```

## 📚 **API Reference**

### **Core Exports**

```typescript
// Main kernel
export { WordNetKernel, createWordNet, WordNetCore };

// Core modules
export { Morphy, morphy } from './modules/morphology';
export { getHypernyms, shortestPath } from './modules/relations';
export { getProjects, loadLexicalResource } from './modules/data-management';

// Plugins
export { similarity, translation } from './plugins';

// Shared components
export { BaseKyselyQueryService, SchemaBuilder } from './shared';

// Parsers
export { getDefaultParser, getParser } from './parsers';

// Types
export type { Word, Synset, Sense, Lexicon, ILI, Plugin };
```

### **Type Definitions**

All types are fully documented with JSDoc comments and include:
- Property descriptions
- Usage examples
- Validation rules
- Relationships between types

## 🚀 **Getting Started**

### **Installation**

```bash
pnpm add wn-ts-core
```

### **Basic Setup**

```typescript
import { createWordNet } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';

// Create WordNet instance
const wordnet = createWordNet({
  core: myWordNetCore, // Your implementation
  plugins: [similarity, translation]
});

// Use it
const words = await wordnet.words({ form: 'computer' });
```

## 🔗 **Integration with Other Packages**

### **wn-ts-web (Browser)**
```typescript
import { WebWordNetCore } from 'wn-ts-web';
import { createWordNet } from 'wn-ts-core';

const wordnet = createWordNet({
  core: new WebWordNetCore('oewn:2024'),
  plugins: [similarity, translation]
});
```

### **wn-ts-node (Node.js)**
```typescript
import { NodeWordNetCore } from 'wn-ts-node';
import { createWordNet } from 'wn-ts-core';

const wordnet = createWordNet({
  core: new NodeWordNetCore('oewn:2024', { filename: 'wordnet.db' }),
  plugins: [similarity, translation]
});
```

## 📖 **Related Documentation**

- **[Main Project README](../README.md)** - Project overview and lexicon format details
- **[Architecture Guide](../ARCHITECTURE.md)** - Complete system architecture
- **[Development Conventions](../docs/DEVELOPMENT_CONVENTIONS.md)** - Coding standards and patterns
- **[Database Schema Standards](../docs/DATABASE_SCHEMA_STANDARDS.md)** - Database design and optimization
- **[Testing Strategy](../docs/TESTING_STRATEGY.md)** - Testing approach and coverage requirements

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add comprehensive tests
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Note**: This is the foundational library for the entire `wn-ts` ecosystem. All other modules depend on the types, interfaces, and utilities defined here.
