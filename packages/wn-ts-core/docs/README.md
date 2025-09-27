# wn-ts-core Documentation

## 🎯 **Overview**

`wn-ts-core` is the foundational library that provides the core types, interfaces, and utilities for the entire WordNet TypeScript ecosystem. It defines the data structures, parsing logic, database schemas, and microkernel architecture used across all `wn-ts` modules.

## 🏗️ **Microkernel Architecture**

The library uses a microkernel architecture with a plugin system:

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

## 📚 **Core Types & Interfaces**

### **WordNet Entity Types**

The core types define the fundamental structure of WordNet data:

```typescript
// Core entity interfaces with consistent ID naming
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

### **Key Naming Conventions**

**Rule**: Always use the `Id` suffix for properties that reference IDs of other entities.

**✅ Correct Examples:**
- `wordId: string` - References Word.id
- `synsetId: string` - References Synset.id
- `lexiconId: string` - References Lexicon.id
- `memberIds: string[]` - References Word.id[]
- `senseIds: string[]` - References Sense.id[]

**❌ Incorrect Examples:**
- `word: string` - Should be wordId
- `synset: string` - Should be synsetId
- `members: string[]` - Should be memberIds
- `senses: string[]` - Should be senseIds

## 🗄️ **Database Schema**

### **Core Tables**

The database schema is designed for optimal cross-lingual operations:

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

### **Schema Builder**

The `SchemaBuilder` class provides static methods to create all database tables and indexes:

```typescript
import { SchemaBuilder } from 'wn-ts-core/shared'

// Create all tables with proper foreign key dependencies
const schema = SchemaBuilder.createAllTables()

// Create specific table
const sensesTable = SchemaBuilder.createSensesTable()
```

## 🔧 **Core Components**

### **WordNetCore Interface**

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

### **WordNetKernel Class**

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

## 📦 **Module Structure**

### **Core Modules (Essential)**

These modules provide essential WordNet functionality and are **not plugins**:

#### **Morphology Module** (`src/modules/morphology/`)
- **Purpose**: Lemmatization and morphological analysis
- **Key Features**:
  - `Morphy` class for finding base forms
  - Exception handling for irregular forms
  - Part-of-speech specific rules
- **Usage**: `import { Morphy, morphy } from 'wn-ts-core'`

#### **Relations Module** (`src/modules/relations/`)
- **Purpose**: Synset relationship queries and taxonomy analysis
- **Key Features**:
  - Hypernym/hyponym queries
  - Shortest path calculations
  - Taxonomy depth analysis
  - Simple relation queries
- **Usage**: `import { getHypernyms, shortestPath } from 'wn-ts-core'`

#### **Data Management Module** (`src/modules/data-management/`)
- **Purpose**: WordNet project and data management
- **Key Features**:
  - Project discovery and loading
  - ILI (Interlingual Index) handling
  - Lexical resource management
- **Usage**: `import { getProjects, loadLexicalResource } from 'wn-ts-core'`

#### **Environment Module** (`src/modules/environment/`)
- **Purpose**: Configuration and environment management
- **Key Features**:
  - Configuration management
  - Environment-specific settings
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
- **Usage**: `import { similarity } from 'wn-ts-core/plugins'`

#### **Translation Plugin** (`src/plugins/translation/`)
- **Purpose**: Cross-lingual operations
- **Features**:
  - ILI-based translations
  - Multi-language synset lookup
  - Translation confidence scoring
- **Usage**: `import { translation } from 'wn-ts-core/plugins'`

### **Shared Components**

#### **Base Query Service** (`src/shared/`)
- **Purpose**: Kysely-based query implementations
- **Features**:
  - Strategy-based query optimization
  - Batch operations
  - Database utilities
  - Translation helpers
- **Usage**: `import { BaseKyselyQueryService } from 'wn-ts-core/shared'`

#### **LMF Parsers** (`src/parsers/`)
- **Purpose**: LMF XML parsing implementations
- **Parsers**:
  - Streaming SAX parser (recommended)
  - Native XML parser
  - Optimized SAX parser
  - Legacy parser
- **Usage**: `import { getDefaultParser } from 'wn-ts-core/parsers'`

## 🔍 **LMF XML Parser**

### **Parser Features**

- **Schema Validation**: XSD validation against official WN-LMF schemas
- **Deduplication**: Configurable handling of duplicate IDs
- **Error Handling**: Comprehensive error reporting with specific error types
- **Performance**: Optimized for large XML files

### **Parsing Options**

```typescript
interface LmfParseOptions {
  mergeStrategy?: 'keep-first' | 'keep-last' | 'error';
  validateSchema?: boolean;
  strictMode?: boolean;
  progressCallback?: ProgressCallback;
}
```

### **Usage Example**

```typescript
import { getDefaultParser } from 'wn-ts-core/parsers'

const parser = getDefaultParser()
const result = await parser.parse(xmlContent)
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

## 📖 **Examples**

Practical examples and usage patterns are available in the [examples directory](./examples/):

- **[Kysely Typing Example](./examples/kysely-typing-example.md)** - Type-safe database queries with the relations plugin
- **[Similarity Methods](./examples/similarity-lexicon-examples.md)** - Lexicon-aware similarity calculations and cross-lingual comparisons
- **[Test Data Generation](./examples/test-data-generation.md)** - Generating realistic test data from WordNet sources

## 📖 **Related Documentation**

- **[Main Project README](../../../README.md)** - Project overview and lexicon format details
- **[Architecture Guide](../../../docs/architecture/ARCHITECTURE_OVERVIEW.md)** - Complete system architecture
- **[Development Conventions](../../../docs/standards/DEVELOPMENT_CONVENTIONS.md)** - Coding standards and patterns
- **[Database Schema Standards](../../../docs/standards/DATABASE_SCHEMA_STANDARDS.md)** - Database design and optimization
- **[Testing Strategy](../../../docs/packages/wn-ts-core/TESTING_STRATEGY.md)** - Testing approach and coverage requirements

---

**Note**: This is the foundational library for the entire `wn-ts` ecosystem. All other modules depend on the types, interfaces, and utilities defined here.
