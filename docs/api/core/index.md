---
title: Core API Reference
description: Complete API reference for the WordNet TypeScript core library
---

# Core API Reference

Complete API reference for the WordNet TypeScript core library, including the microkernel architecture, plugin system, and core interfaces.

## Quick Start

```typescript
import { WordNetKernel } from 'wn-ts-core';
import { WebWordNetCore } from 'wn-ts-web';
import { relations } from 'wn-ts-core/plugins';

const core = new WebWordNetCore('oewn:2024');
const wordnet = new WordNetKernel(core, [relations]);

await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
```

## Core Architecture

### **Microkernel Pattern**

The WordNet TypeScript ecosystem uses a microkernel architecture:

- **Core Interface**: `WordNetCore` - Defines the base functionality
- **Kernel Class**: `WordNetKernel` - Manages plugins and provides unified API
- **Plugin System**: Extensible functionality through plugins
- **Platform Implementations**: Environment-specific core implementations

## Core Interfaces

### **`WordNetCore`**

Base interface that all WordNet implementations must implement.

```typescript
interface WordNetCore {
  // Core WordNet operations
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
  
  // Lexicon management
  lexicons(): Promise<Lexicon[]>;
  expandedLexicons(): Promise<Lexicon[]>;
  
  // Statistics
  getStatistics(): Promise<Statistics>;
  getLexiconStatistics(lexiconId?: string): Promise<LexiconStatistics[]>;
  
  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}
```

### **`WordNetKernel`**

Main kernel class that manages plugins and provides the unified API.

```typescript
class WordNetKernel<TPlugins extends readonly Plugin[]> {
  constructor(
    core: WordNetCore,
    plugins: TPlugins = [],
    schemaManager?: SchemaManager
  );
  
  // Core methods (delegated to core)
  async words(query?: WordQuery): Promise<Word[]>;
  async synsets(query?: SynsetQuery): Promise<Synset[]>;
  async senses(query?: SenseQuery): Promise<Sense[]>;
  
  // Plugin management
  use<TNewPlugin extends Plugin>(plugin: TNewPlugin): WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
  has(pluginName: string): boolean;
  getPlugins(): string[];
  getPlugin<T>(pluginName: string): T | undefined;
  
  // Schema management
  get schemaManager(): SchemaManager;
  getSchema(): DatabaseSchema;
  validateSchema(): Promise<ValidationResult>;
}
```

## Plugin System

### **Plugin Interface**

```typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  initialize(kernel: WordNetKernel): Promise<void>;
  destroy(): Promise<void>;
}
```

### **Plugin Management**

```typescript
// Add plugin
const wordnetWithRelations = wordnet.use(relationsPlugin);

// Check if plugin is loaded
if (wordnet.has('relations')) {
  const relations = wordnet.getPlugin<RelationsPlugin>('relations');
  // Use relations plugin
}

// Get all plugin names
const pluginNames = wordnet.getPlugins();
```

## Data Types

### **Core Data Types**

```typescript
interface Word {
  id: string;
  form: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  iliId?: string;
  pos: string;
  language: string;
  definitions: Definition[];
  examples: Example[];
}

interface Sense {
  id: string;
  wordId: string;
  synsetId: string;
  confidence?: number;
}

interface ILI {
  id: string;
  definition: string;
  status: string;
}

interface Definition {
  id: string;
  text: string;
  language: string;
  source?: string;
}

interface Example {
  id: string;
  text: string;
  language: string;
  source?: string;
}
```

### **Query Types**

```typescript
interface WordQuery {
  form?: string;
  lemma?: string;
  pos?: string;
  language?: string;
  lexicon?: string;
  limit?: number;
  offset?: number;
}

interface SynsetQuery {
  wordId?: string;
  iliId?: string;
  pos?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

interface SenseQuery {
  wordId?: string;
  synsetId?: string;
  limit?: number;
  offset?: number;
}
```

## Database Schema

### **Schema Manager**

```typescript
interface SchemaManager {
  getSchema(): DatabaseSchema;
  validateSchema(): Promise<ValidationResult>;
  migrateSchema(): Promise<MigrationResult>;
  createTables(): Promise<void>;
  dropTables(): Promise<void>;
}

interface DatabaseSchema {
  version: string;
  tables: TableSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
}
```

### **Table Schemas**

```typescript
interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  foreignKeys: ForeignKeySchema[];
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  unique?: boolean;
}
```

## Configuration

### **Core Configuration**

```typescript
interface CoreConfig {
  enablePlugins?: boolean;
  enableSchemaValidation?: boolean;
  enableCaching?: boolean;
  cacheSize?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

### **Plugin Configuration**

```typescript
interface PluginConfig {
  [pluginName: string]: {
    enabled: boolean;
    options: Record<string, any>;
  };
}
```

## Usage Examples

### **Basic Usage**

```typescript
import { WordNetKernel } from 'wn-ts-core';
import { WebWordNetCore } from 'wn-ts-web';

const core = new WebWordNetCore('oewn:2024');
const wordnet = new WordNetKernel(core);

await wordnet.initialize();

// Search for words
const words = await wordnet.words({ form: 'computer' });

// Get synsets
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Get senses
const senses = await wordnet.senses({ wordId: words[0].id });

await wordnet.close();
```

### **With Plugins**

```typescript
import { WordNetKernel } from 'wn-ts-core';
import { WebWordNetCore } from 'wn-ts-web';
import { relations, similarity, translation } from 'wn-ts-core/plugins';

const core = new WebWordNetCore('oewn:2024');
const wordnet = new WordNetKernel(core, [relations, similarity, translation]);

await wordnet.initialize();

// Use plugin methods
const hypernyms = await wordnet.getHypernyms(synsetId);
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const translations = await wordnet.getTranslations(synsetId, 'fr');

await wordnet.close();
```

### **Custom Plugin**

```typescript
class CustomPlugin implements Plugin {
  name = 'custom';
  version = '1.0.0';
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Initialize plugin
  }
  
  async destroy(): Promise<void> {
    // Cleanup plugin
  }
  
  async customMethod(): Promise<any> {
    // Custom functionality
  }
}

const wordnet = new WordNetKernel(core, [new CustomPlugin()]);
```

## Testing

### **Unit Tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { MockWordNetCore } from './mocks';

describe('WordNetKernel', () => {
  let wordnet: WordNetKernel;
  let mockCore: MockWordNetCore;

  beforeEach(async () => {
    mockCore = new MockWordNetCore();
    wordnet = new WordNetKernel(mockCore);
    await wordnet.initialize();
  });

  afterEach(async () => {
    await wordnet.close();
  });

  it('should delegate words to core', async () => {
    const words = await wordnet.words({ form: 'test' });
    expect(mockCore.words).toHaveBeenCalledWith({ form: 'test' });
  });
});
```

### **Plugin Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { relations } from 'wn-ts-core/plugins';

describe('Relations Plugin', () => {
  it('should add relations methods', async () => {
    const wordnet = new WordNetKernel(mockCore, [relations]);
    await wordnet.initialize();
    
    expect(wordnet.has('relations')).toBe(true);
    expect(typeof wordnet.getHypernyms).toBe('function');
  });
});
```

## Type Definitions

### **Core Types**

```typescript
type PartOfSpeech = 'n' | 'v' | 'a' | 'r';

type WordNetWithPlugins<TPlugins extends readonly Plugin[]> = 
  WordNetKernel<TPlugins> & 
  UnionToIntersection<PluginMethods<TPlugins[number]>>;

type PluginMethods<T> = T extends Plugin ? T : never;
```

## Troubleshooting

### **Common Issues**

#### **Plugin Not Found**
```typescript
// Check if plugin is loaded
if (!wordnet.has('relations')) {
  throw new Error('Relations plugin not loaded');
}
```

#### **Core Not Initialized**
```typescript
// Ensure core is initialized
if (!wordnet.core.initialized) {
  await wordnet.initialize();
}
```

## Further Reading

- **[Plugin System](/api/plugins/)** - Complete plugin API reference
- **[Platform APIs](/api/)** - Platform-specific implementations
- **[Architecture Guide](/architecture/)** - System architecture details

---

**Ready to build with the core library? Check out the [Plugin System](/api/plugins/) to extend functionality! 🚀**
