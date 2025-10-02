---
title: Node.js API Reference
description: Complete API reference for the WordNet TypeScript Node.js platform
---

# Node.js API Reference

Complete API reference for the WordNet TypeScript Node.js platform, including core functionality, plugins, and CLI integration.

## Quick Start

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

async function main() {
  const wordnet = new NodeWordNetKernel('oewn:2024', {
    filename: 'wordnet.db'
  });
  
  await wordnet.initialize();
  
  // Search for words
  const words = await wordnet.words({ form: 'computer' });
  console.log('Found words:', words);
  
  await wordnet.close();
}

main().catch(console.error);
```

## Core Classes

### **`NodeWordNetKernel`**

Main class for Node.js WordNet operations.

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel(lexiconId: string, options?: NodeWordNetOptions);
```

### **`NodeWordNetCore`**

Core implementation for Node.js.

```typescript
import { NodeWordNetCore } from 'wn-ts-node';

const core = new NodeWordNetCore(lexiconId: string, options?: NodeWordNetOptions);
```

## Configuration

### **NodeWordNetOptions**

```typescript
interface NodeWordNetOptions {
  filename?: string;              // Database filename (default: 'wordnet.db')
  createIfNotExists?: boolean;    // Create database if not exists (default: true)
  enableWAL?: boolean;            // Enable WAL mode (default: true)
  enableForeignKeys?: boolean;    // Enable foreign keys (default: true)
  maxConnections?: number;        // Max connections (default: 10)
  connectionTimeout?: number;     // Connection timeout (default: 30000)
  pool?: ConnectionPoolOptions;   // Connection pool options
}
```

### **Connection Pool Options**

```typescript
interface ConnectionPoolOptions {
  min: number;                    // Minimum connections
  max: number;                    // Maximum connections
  acquireTimeoutMillis: number;   // Acquire timeout
  createTimeoutMillis: number;    // Create timeout
  destroyTimeoutMillis: number;   // Destroy timeout
  idleTimeoutMillis: number;      // Idle timeout
  reapIntervalMillis: number;     // Reap interval
  createRetryIntervalMillis: number; // Create retry interval
}
```

## Core Methods

### **Word Operations**

```typescript
// Search for words
const words = await wordnet.words({ form: 'computer' });

// Search with filters
const words = await wordnet.words({ 
  form: 'run', 
  pos: 'v',
  language: 'en',
  limit: 10,
  offset: 0
});

// Get specific word
const word = await wordnet.getWord(wordId);
```

### **Synset Operations**

```typescript
// Get synsets for a word
const synsets = await wordnet.synsets({ wordId: wordId });

// Get synsets with filters
const synsets = await wordnet.synsets({ 
  wordId: wordId,
  pos: 'n',
  language: 'en'
});

// Get specific synset
const synset = await wordnet.getSynset(synsetId);
```

### **Sense Operations**

```typescript
// Get senses for a word
const senses = await wordnet.senses({ wordId: wordId });

// Get senses for a synset
const senses = await wordnet.senses({ synsetId: synsetId });

// Get specific sense
const sense = await wordnet.getSense(senseId);
```

## Plugin System

### **Relations Plugin**

```typescript
import { relations } from 'wn-ts-core/plugins';

const wordnetWithRelations = wordnet.use(relations);

// Get hypernyms (more general concepts)
const hypernyms = await wordnetWithRelations.getHypernyms(synsetId);

// Get hyponyms (more specific concepts)
const hyponyms = await wordnetWithRelations.getHyponyms(synsetId);

// Get meronyms (part-of relationships)
const meronyms = await wordnetWithRelations.getMeronyms(synsetId);

// Get holonyms (contains relationships)
const holonyms = await wordnetWithRelations.getHolonyms(synsetId);
```

### **Similarity Plugin**

```typescript
import { similarity } from 'wn-ts-core/plugins';

const wordnetWithSimilarity = wordnet.use(similarity);

// Path similarity
const pathSim = await wordnetWithSimilarity.getPathSimilarity(synset1, synset2);

// Wu-Palmer similarity
const wupSim = await wordnetWithSimilarity.getWuPalmerSimilarity(synset1, synset2);

// Leacock-Chodorow similarity
const lchSim = await wordnetWithSimilarity.getLeacockChodorowSimilarity(synset1, synset2);

// Jaccard similarity
const jaccardSim = await wordnetWithSimilarity.getJaccardSimilarity(synset1, synset2);
```

### **Translation Plugin**

```typescript
import { translation } from 'wn-ts-core/plugins';

const wordnetWithTranslation = wordnet.use(translation);

// Get translations for a synset
const translations = await wordnetWithTranslation.getTranslations(synsetId, 'fr');

// Get translations by word
const wordTranslations = await wordnetWithTranslation.getTranslationsByWord(wordId, 'fr');

// Get available languages
const languages = await wordnetWithTranslation.getAvailableLanguages();

// Get translation confidence
const confidence = await wordnetWithTranslation.getTranslationConfidence(synsetId, 'fr');
```

## Database Operations

### **Statistics**

```typescript
// Get overall statistics
const stats = await wordnet.getStatistics();

// Get lexicon statistics
const lexiconStats = await wordnet.getLexiconStatistics('oewn:2024');

// Get database info
const dbInfo = await wordnet.getDatabaseInfo();
```

### **Data Management**

```typescript
// Load lexicon data
await wordnet.loadLexicon('oewn:2024');

// Remove lexicon
await wordnet.removeLexicon('oewn:2024');

// List loaded lexicons
const lexicons = await wordnet.getLoadedLexicons();

// Check if lexicon is loaded
const isLoaded = await wordnet.isLexiconLoaded('oewn:2024');
```

### **Query Operations**

```typescript
// Raw SQL queries
const results = await wordnet.query('SELECT * FROM words WHERE form = ?', ['computer']);

// Prepared statements
const stmt = await wordnet.prepare('SELECT * FROM words WHERE form = ?');
const results = await stmt.execute(['computer']);
await stmt.finalize();
```

## Performance Features

### **Connection Pooling**

```typescript
const wordnet = new NodeWordNetKernel('oewn:2024', {
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
});
```

### **Caching**

```typescript
// Enable query caching
const wordnet = new NodeWordNetKernel('oewn:2024', {
  enableCaching: true,
  cacheSize: 1000
});

// Clear cache
await wordnet.clearCache();
```

### **Batch Operations**

```typescript
// Batch word queries
const words = await wordnet.wordsBatch([
  { form: 'computer' },
  { form: 'program' },
  { form: 'algorithm' }
]);

// Batch synset queries
const synsets = await wordnet.synsetsBatch([
  { wordId: wordId1 },
  { wordId: wordId2 }
]);
```

## CLI Integration

### **Command Line Tools**

```typescript
import { createCLI } from 'wn-ts-node/cli';

const cli = createCLI(wordnet);

// Search command
await cli.search('computer', { pos: 'n' });

// Relations command
await cli.relations('computer', 'hypernym');

// Translation command
await cli.translate('computer', 'en', 'fr');
```

### **Interactive Mode**

```typescript
import { createInteractiveCLI } from 'wn-ts-node/cli';

const interactiveCLI = createInteractiveCLI(wordnet);
await interactiveCLI.start();
```

## Testing

### **Unit Tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeWordNetKernel } from 'wn-ts-node';

describe('NodeWordNetKernel', () => {
  let wordnet: NodeWordNetKernel;

  beforeEach(async () => {
    wordnet = new NodeWordNetKernel('oewn:2024', {
      filename: ':memory:'
    });
    await wordnet.initialize();
  });

  afterEach(async () => {
    await wordnet.close();
  });

  it('should find words', async () => {
    const words = await wordnet.words({ form: 'computer' });
    expect(words).toHaveLength(1);
    expect(words[0].form).toBe('computer');
  });
});
```

### **Integration Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { NodeWordNetKernel } from 'wn-ts-node';
import { relations } from 'wn-ts-core/plugins';

describe('Plugin Integration', () => {
  it('should work with relations plugin', async () => {
    const wordnet = new NodeWordNetKernel('oewn:2024');
    await wordnet.initialize();
    
    const wordnetWithRelations = wordnet.use(relations);
    const hypernyms = await wordnetWithRelations.getHypernyms(synsetId);
    
    expect(hypernyms).toBeDefined();
    await wordnet.close();
  });
});
```

## Type Definitions

### **Core Types**

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

interface Statistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalRelations: number;
  lexicons: LexiconStatistics[];
}
```

## Troubleshooting

### **Common Issues**

#### **Database Connection Error**
```typescript
// Check database file permissions
const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: './wordnet.db',
  createIfNotExists: true
});
```

#### **Memory Issues**
```typescript
// Use streaming for large datasets
const words = await wordnet.words({ form: 'test' }, { 
  limit: 1000,
  offset: 0,
  stream: true
});
```

## Further Reading

- **[Node.js Platform Guide](/platforms/node/)** - Complete platform documentation
- **[Examples](/examples/node/)** - Working code examples
- **[Core API](/api/core/)** - Core library API reference

---

**Ready to build your Node.js app? Check out the [Examples](/examples/node/) to see it in action! 🚀**
