# WordNet TypeScript Architecture

## 🏗️ **Microkernel Architecture**

The WordNet TypeScript ecosystem uses a microkernel architecture with a plugin system:

- **Plugin System**: Extensible, composable, and type-safe plugins
- **Type Safety**: Full TypeScript support with compile-time type checking
- **Cross-Platform**: Works in Node.js, browsers, and other JavaScript environments
- **Modularity**: Core functionality separated from environment-specific implementations

## 🎯 **Architecture Design**

### **Microkernel Architecture**
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

## 📦 **Package Structure**

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

### **Factory Function**
```typescript
export function createWordNet<TPlugins extends readonly Plugin[]>(config: { 
  core: WordNetCore;
  kyselyDb?: KyselyDatabase;
  plugins?: TPlugins;
}): WordNetWithPlugins<TPlugins> {
  const kernel = new WordNetKernel(config.core, config.kyselyDb);
  config.plugins?.forEach(plugin => kernel.use(plugin));
  return kernel as any;
}
```

## 🚀 **Quick Start**

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

## 🏗️ **Implementation Details**

### **Database Layer**

#### **Node.js (better-sqlite3)**
```typescript
import Database from 'better-sqlite3';

class NodeDatabase implements DatabaseInterface {
  private db: Database.Database;
  
  async initialize(): Promise<void> {
    this.db = new Database('wordnet.db');
    // Create tables, indexes, etc.
  }
  
  async words(form: string): Promise<Word[]> {
    const stmt = this.db.prepare('SELECT * FROM words WHERE form = ?');
    return stmt.all(form);
  }
}
```

#### **Browser (@sqlite.org/sqlite-wasm)**
```typescript
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

class WebDatabase implements DatabaseInterface {
  private db: any;
  
  async initialize(): Promise<void> {
    const sqlite3 = await sqlite3InitModule();
    this.db = new sqlite3.Database();
    // Create tables, indexes, etc.
  }
  
  async words(form: string): Promise<Word[]> {
    const stmt = this.db.prepare('SELECT * FROM words WHERE form = ?');
    return stmt.all(form);
  }
}
```

## 📊 **Current Status**

### **✅ Completed Packages**

#### **wn-ts-core** - Environment-Agnostic Core
- **Status**: ✅ Complete
- **Features**:
  - `WordNetCore` interface
  - `WordNetKernel` class with plugin system
  - Plugin system (relations, similarity, translation)
  - Schema management
  - Type-safe plugin architecture

#### **wn-ts-node** - Node.js Implementation
- **Status**: ✅ Complete
- **Features**:
  - `NodeWordNetCore` implementation
  - `NodeWordNetKernel` with full plugin support
  - better-sqlite3 integration
  - File system operations

#### **wn-ts-web** - Browser Implementation
- **Status**: ✅ Complete
- **Features**:
  - `WebWordNetCore` implementation
  - `WebWordNetKernel` with full plugin support
  - SQLite WASM integration
  - OPFS (Origin Private File System) support
  - React integration with hooks

#### **wn-ts-web-demo** - Demo Application
- **Status**: ✅ Complete
- **Features**:
  - React-based demo using new kernel architecture
  - Interactive WordNet exploration
  - Real data loading and display
  - Plugin system demonstration

## 🚀 **Performance Characteristics**

### **Node.js Environment**
- **Database**: better-sqlite3 (synchronous, high performance)
- **Storage**: Direct file system access
- **Memory**: Full access to system memory
- **Concurrency**: Event loop with worker threads

### **Browser Environment**
- **Database**: SQLite WASM (asynchronous, UI-friendly)
- **Storage**: OPFS for persistence, IndexedDB fallback
- **Memory**: Limited by browser constraints
- **Concurrency**: Non-blocking async operations

## 🚀 **Usage Examples**

### **Modern Approach**
```typescript
import { createWordNet, WordNetCore } from 'wn-ts-core/wordnet-kernel';
import { relations, similarity } from 'wn-ts-core/plugins';

class MyWordnetCore implements WordNetCore {
  async words(query?: WordQuery): Promise<Word[]> {
    // Implementation
  }
  // ... other required methods
}

const wordnet = createWordNet({
  core: new MyWordnetCore(),
  plugins: [relations, similarity] as const
});

const hypernyms = await wordnet.getHypernyms(synset.id);
```

## 🎯 **Benefits of New Architecture**

1. **Modularity**: Only load plugins you need
2. **Type Safety**: Full TypeScript support with compile-time checking
3. **Performance**: Better tree-shaking and smaller bundles
4. **Extensibility**: Easy to add new functionality via plugins
5. **Testing**: Easier to test individual components
6. **Schema Management**: Built-in database schema handling
7. **Future-Proof**: Architecture designed for growth

## 📚 **Documentation Structure**

```
docs/
├── architecture/          # Architecture decisions and patterns
├── api/                  # API documentation
├── examples/             # Usage examples
└── performance/          # Performance benchmarks
```

## 🎯 **Next Steps**

1. **Performance Optimization**: Benchmark and optimize for each environment
2. **Documentation**: Complete API documentation and examples
3. **Plugin Marketplace**: Expand plugin ecosystem
4. **Advanced Features**: Machine learning integrations, advanced caching

---

**This architecture document is the single source of truth for the WordNet TypeScript ecosystem.**
