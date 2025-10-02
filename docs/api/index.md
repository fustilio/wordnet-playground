---
title: API Reference
description: Complete API documentation for the WordNet TypeScript ecosystem
---

# API Reference

Complete API documentation for all packages in the WordNet TypeScript ecosystem.

## 📦 Packages

### Core Package (`wn-ts-core`)
The foundation library with microkernel architecture and plugin system.

- **[Core API](/api/core/)** - Core library documentation
- **[Database Schema](/standards/DATABASE_SCHEMA_STANDARDS)** - Schema definitions

### Web Package (`wn-ts-web`)
Browser implementation with React integration and Web Worker support.

- **[Web API](/api/web/)** - Web package documentation
- **[Web Platform Guide](/platforms/web/)** - Web-specific platform details

### Node Package (`wn-ts-node`)
Node.js implementation with SQLite integration and server-side processing.

- **[Node API](/api/node/)** - Node package documentation
- **[Node Platform Guide](/platforms/node/)** - Complete platform guide
- **[Plugin System](/api/plugins/)** - Plugin system documentation
- **[Translation Plugin](/api/plugins/translation)** - Translation helpers

### CLI Package (`wn-cli`)
Command-line interface and Terminal UI for WordNet operations.

- **[CLI Package](/packages/wn-cli/tui/)** - CLI package documentation

## 🔌 Plugin System

### Relations Plugin
WordNet relationship queries and navigation.

```typescript
// Get hypernyms (more general concepts)
const hypernyms = await wordnet.getHypernyms(synsetId);

// Get hyponyms (more specific concepts)
const hyponyms = await wordnet.getHyponyms(synsetId);

// Get meronyms (part-of relationships)
const meronyms = await wordnet.getMeronyms(synsetId);

// Get all relations
const allRelations = await wordnet.getAllRelations(synsetId);
```

### Similarity Plugin
Semantic similarity calculations and metrics.

```typescript
// Path similarity
const pathSim = await wordnet.getPathSimilarity(synset1, synset2);

// Wu-Palmer similarity
const wuPalmerSim = await wordnet.getWuPalmerSimilarity(synset1, synset2);

// Leacock-Chodorow similarity
const lcSim = await wordnet.getLeacockChodorowSimilarity(synset1, synset2);

// Jaccard similarity
const jaccardSim = await wordnet.getJaccardSimilarity(synset1, synset2);
```

### Translation Plugin
Cross-lingual translation and mapping.

```typescript
// Get translations for a synset
const translations = await wordnet.getTranslations(synsetId, 'fr');

// Get translations by word
const wordTranslations = await wordnet.getTranslationsByWord(wordId, 'fr');

// Get available languages
const languages = await wordnet.getAvailableLanguages();

// Get translation confidence
const confidence = await wordnet.getTranslationConfidence(synsetId, 'fr');
```

## 🏗️ Core Interfaces

### WordNetCore Interface
The base interface that all implementations must follow.

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
}
```

### WordNetKernel Class
The main kernel class that manages plugins and provides the unified API.

```typescript
class WordNetKernel<TPlugins extends readonly Plugin[]> {
  constructor(core: WordNetCore, kyselyDb?: KyselyDatabase);
  
  // Core methods (delegated to core)
  async words(query?: WordQuery): Promise<Word[]>;
  async synsets(query?: SynsetQuery): Promise<Synset[]>;
  // ... other core methods
  
  // Plugin system
  use<TNewPlugin extends Plugin>(plugin: TNewPlugin): WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
  has(pluginName: string): boolean;
  getPlugins(): string[];
}
```

## 📊 Data Types

### Core Data Types

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
```

### Query Types

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

## 🔧 Configuration

### Node.js Configuration
```typescript
interface NodeWordNetConfig {
  filename?: string;
  createIfNotExists?: boolean;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}
```

### Web Configuration
```typescript
interface WebWordNetConfig {
  enableWorkers?: boolean;
  fallbackToMainThread?: boolean;
  storage?: 'memory' | 'opfs';
  cacheStrategy?: 'memory' | 'persistent';
  workerUrl?: string;
}
```

## 🚀 Usage Examples

### Basic Word Search
```typescript
// Find words by form
const words = await wordnet.words({ form: 'computer' });

// Find words by lemma and part of speech
const nouns = await wordnet.words({ lemma: 'run', pos: 'n' });

// Find words in specific language
const frenchWords = await wordnet.words({ language: 'fr' });
```

### Synset Operations
```typescript
// Get synsets for a word
const synsets = await wordnet.synsets({ wordId: wordId });

// Get synsets by ILI
const iliSynsets = await wordnet.synsetsByILI('i12345');

// Get synsets with definitions
const synsetsWithDefs = await wordnet.synsets({ wordId: wordId });
const definitions = synsetsWithDefs[0].definitions;
```

### Cross-Lingual Translation
```typescript
// Translate a synset to French
const translations = await wordnet.getTranslations(synsetId, 'fr');

// Get translation confidence
const confidence = await wordnet.getTranslationConfidence(synsetId, 'fr');

// Get available languages
const languages = await wordnet.getAvailableLanguages();
```

## 📚 Further Reading

- **[Unified API](/api/unified-api)** - Complete unified API documentation
- **[Examples](/examples/)** - Working code examples

---

**Need more specific information? Check out the individual package documentation or explore our [Examples](/examples/) for working code! 🚀**
