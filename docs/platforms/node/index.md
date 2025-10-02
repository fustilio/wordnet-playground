---
title: Node.js Applications
description: Build server-side WordNet applications with Node.js
---

# Node.js Applications

Build powerful server-side applications with the WordNet TypeScript ecosystem's Node.js platform.

## Quick Start

### Installation

```bash
npm install wn-ts-node better-sqlite3
```

### Basic Usage

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
  
  // Get synsets
  const synsets = await wordnet.synsets({ wordId: words[0].id });
  console.log('Found synsets:', synsets);
  
  await wordnet.close();
}

main().catch(console.error);
```

## Architecture

The Node.js platform provides:

- **SQLite Integration**: Direct database access
- **File System**: Local data management
- **High Performance**: Optimized for server environments
- **CLI Tools**: Command-line utilities

## Features

### **Database Management**
- SQLite with better-sqlite3
- Automatic schema creation
- Connection pooling
- Transaction support

### **Data Loading**
- LMF XML parsing
- Batch data processing
- Progress tracking
- Error handling

### **Plugin System**
- Relations plugin for word relationships
- Similarity plugin for semantic similarity
- Translation plugin for cross-lingual operations

### **CLI Integration**
- Command-line tools
- Interactive TUI
- Batch processing
- Scripting support

## Configuration

```typescript
const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db',
  createIfNotExists: true,
  enableWAL: true,
  enableForeignKeys: true,
  maxConnections: 10,
  connectionTimeout: 30000
});
```

## API Reference

### **Core Methods**

- `words()` - Search for words
- `synsets()` - Get concept groupings
- `senses()` - Get word-synset relationships
- `getStatistics()` - Database statistics

### **Plugin Methods**

- `getHypernyms()` - More general concepts
- `getHyponyms()` - More specific concepts
- `getPathSimilarity()` - Semantic similarity
- `getTranslations()` - Cross-lingual operations

## Examples

- **[Basic Demo](/examples/node/)** - Simple server application
- **[API Server](/examples/node/)** - REST API implementation
- **[Data Processing](/examples/node/)** - Batch data operations

## Performance

- **Query Speed**: 50,000+ Hz for simple queries
- **Memory Usage**: ~100MB for full OEWN dataset
- **Load Time**: < 2 seconds for initialization

## Further Reading

- **[Node.js API Reference](/api/node/)** - Complete API documentation
- **[Examples](/examples/node/)** - Working code samples
- **[Performance Guide](/development/PERFORMANCE.md)** - Optimization tips

---

**Ready to build your Node.js app? Check out the [Examples](/examples/node/) to get started!**
