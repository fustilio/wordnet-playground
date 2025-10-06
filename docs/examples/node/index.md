---
title: Node.js Examples
description: Server-side applications demonstrating WordNet functionality
---

# Node.js Examples

Server-side applications showcasing the WordNet TypeScript ecosystem's Node.js platform capabilities.

## Available Examples

### **[Basic Demo](./basic-demo/)**
Simple server-side WordNet operations and CLI tools.

**Features:**
- Word search and lookup
- Database statistics
- Multilingual definitions
- Python-style WordNet interface

**Perfect for:** Learning server-side usage, building CLI tools

## Quick Start

### **Run All Examples**

```bash
cd examples/node/wn-ts-node-demo
pnpm install
pnpm test
```

### **Run Specific Examples**

```bash
# Python-style API
pnpm example:python-style

# Word sense disambiguation (basic)
pnpm example:word-sense-disambiguation

# Database statistics (basic)
pnpm example:database-statistics

# Multilingual definitions
pnpm example:multilingual-definitions

# Advanced examples
pnpm example:multilingual-linking
pnpm example:lexical-exploration
pnpm kitchen-sink
```

## Example Architecture

The examples demonstrate:

- **Node.js Integration**: Using `NodeWordNetKernel`
- **SQLite Database**: Local data storage
- **CLI Interface**: Command-line tools
- **Error Handling**: Robust error management
- **Performance**: Optimized server operations

## Learning Path

1. **Start with Basic Demo** - Understand server-side concepts
2. **Explore CLI Tools** - Learn command-line usage
3. **Read the Code** - Understand implementation patterns
4. **Build Your Own** - Apply what you've learned

## Configuration

### **Database Setup (New Simplified API)**

```typescript
import { createWordnet } from 'wn-ts-node';

// 🎯 Default persistent storage (recommended)
const wordnet = createWordnet('oewn:2024');

// 🧠 In-memory database (perfect for testing)
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// 📁 Custom database location
const wordnet = createWordnet('oewn:2024', { 
  filename: '/path/to/my/wordnet.db' 
});

// 🔄 With automatic backups
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }
});
```

### **Database Modes**

| Mode | Description | Use Case |
|------|-------------|----------|
| `'persistent'` | Store in file system (default) | Production, development |
| `'memory'` | In-memory only | Testing, temporary data |
| `'temp'` | Temporary file (deleted on exit) | One-time processing |

### **Legacy API (Still Supported)**

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db',
  createIfNotExists: true,
  enableWAL: true,
  enableForeignKeys: true
});
```

### **Plugin Configuration**

```typescript
import { relations, similarity, translation } from 'wn-ts-core/plugins';

const wordnetWithPlugins = createWordnet('oewn:2024')
  .use(relations)
  .use(similarity)
  .use(translation);
```

## Code Examples

### **Basic Word Search (New API)**

```typescript
import { createWordnet } from 'wn-ts-node';

async function searchWords(term: string) {
  const wordnet = createWordnet('oewn:2024');
  await wordnet.initialize();
  
  const words = await wordnet.words({ form: term });
  console.log('Found words:', words);
  
  await wordnet.close();
}
```

### **Basic Word Search (Legacy API)**

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

async function searchWords(term: string) {
  const wordnet = new NodeWordNetKernel('oewn:2024');
  await wordnet.initialize();
  
  const words = await wordnet.words({ form: term });
  console.log('Found words:', words);
  
  await wordnet.close();
}
```

### **Database Statistics**

```typescript
import { createWordnet } from 'wn-ts-node';

async function getStats() {
  const wordnet = createWordnet('oewn:2024');
  await wordnet.initialize();
  
  const stats = await wordnet.getStatistics();
  console.log('Database Statistics:', stats);
  
  await wordnet.close();
}
```

### **Advanced Features**

```typescript
import { createWordnet } from 'wn-ts-node';
import { relations, similarity, translation } from 'wn-ts-core/plugins';

async function advancedFeatures() {
  const wordnet = createWordnet('oewn:2024')
    .use(relations)
    .use(similarity)
    .use(translation);
  
  await wordnet.initialize();
  
  // Get hypernyms
  const hypernyms = await wordnet.getHypernyms(synsetId);
  
  // Get similarity
  const sim = await wordnet.getPathSimilarity(synset1, synset2);
  
  // Get translations
  const translations = await wordnet.getTranslations(synsetId, 'fr');
  
  await wordnet.close();
}
```

## Use Cases

### **REST API Server**

```typescript
import express from 'express';
import { createWordnet } from 'wn-ts-node';

const app = express();
const wordnet = createWordnet('oewn:2024');
await wordnet.initialize();

app.get('/api/words/:term', async (req, res) => {
  const words = await wordnet.words({ form: req.params.term });
  res.json(words);
});

app.listen(3000);
```

### **CLI Tool**

```typescript
import { Command } from 'commander';
import { createWordnet } from 'wn-ts-node';

const program = new Command();
const wordnet = createWordnet('oewn:2024');

program
  .command('search <term>')
  .action(async (term) => {
    await wordnet.initialize();
    const words = await wordnet.words({ form: term });
    console.log(words);
    await wordnet.close();
  });

program.parse();
```

## Next Steps

- **[Platform Guide](/platforms/node/)** - Learn about the Node.js platform
- **[API Reference](/api/node/)** - Complete API documentation
- **[CLI Package](/packages/wn-cli/tui/)** - Command-line interface

---

**Ready to build server-side applications? Check out the [Basic Demo](./basic-demo/) to get started! 🚀**
