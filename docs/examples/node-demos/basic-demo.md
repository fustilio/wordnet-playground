# Basic Node.js Demo

A simple Node.js application demonstrating basic WordNet functionality on the server side.

## 🎯 **Overview**

This demo showcases fundamental WordNet operations in a Node.js environment. Perfect for understanding server-side WordNet usage and building CLI tools or backend services.

## 🚀 **Features**

- **Word Search** - Find words by form or lemma
- **Synset Exploration** - Browse concept groupings
- **Database Operations** - SQLite database management
- **CLI Interface** - Command-line interaction
- **TypeScript** - Full type safety and IntelliSense

## 📁 **Location**

**Source**: `examples/node/wn-ts-node-demo/`  
**Documentation**: This file

## 🛠️ **Setup & Running**

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm
- SQLite3 (for database operations)

### **Installation**
```bash
# Navigate to the demo
cd examples/node/wn-ts-node-demo

# Install dependencies
pnpm install

# Run all examples
pnpm run all-use-cases
```

### **Run Specific Examples**
```bash
# Basic word search
pnpm run basic:word-search

# Database statistics
pnpm run basic:database-stats

# Multilingual definitions
pnpm run basic:multilingual-definitions

# Word sense disambiguation
pnpm run basic:word-sense-disambiguation
```

## 🎯 **Key Concepts Demonstrated**

### **1. Basic WordNet Setup**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db'
});

await wordnet.initialize();
```

### **2. Word Search**
```typescript
const searchWords = async (term: string) => {
  const words = await wordnet.words({ form: term });
  console.log('Found words:', words);
  return words;
};
```

### **3. Synset Queries**
```typescript
const getSynsets = async (wordId: string) => {
  const synsets = await wordnet.synsets({ wordId });
  console.log('Found synsets:', synsets);
  return synsets;
};
```

### **4. Database Statistics**
```typescript
const getDatabaseStats = async () => {
  const stats = await wordnet.getStatistics();
  console.log('Database Statistics:', stats);
  return stats;
};
```

## 📚 **Code Structure**

```
src/
├── examples/
│   ├── basic/                    # Basic examples
│   │   ├── database-statistics.js
│   │   ├── multilingual-definitions.js
│   │   ├── python-style-wordnet.js
│   │   └── word-sense-disambiguation.js
│   ├── advanced/                 # Advanced examples
│   │   ├── database-statistics.js
│   │   ├── kitchen-sink-demo.js
│   │   ├── lexical-database-exploration.js
│   │   ├── live-demo.js
│   │   ├── multilingual-linking.js
│   │   └── word-sense-disambiguation.js
│   └── shared/                   # Shared utilities
│       └── helpers.js
└── run-all-use-cases.js         # Main runner
```

## 🎨 **Example Categories**

### **Basic Examples**
- **Database Statistics** - Get comprehensive database information
- **Multilingual Definitions** - Cross-language definition lookup
- **Python-style WordNet** - Python wn library compatibility
- **Word Sense Disambiguation** - Context-based word sense resolution

### **Advanced Examples**
- **Kitchen Sink Demo** - Comprehensive feature demonstration
- **Lexical Database Exploration** - Deep database analysis
- **Live Demo** - Interactive demonstration
- **Multilingual Linking** - Cross-language relationship mapping

## 🔧 **Configuration**

### **WordNet Configuration**
```typescript
const config = {
  lexicon: 'oewn:2024',
  filename: 'wordnet.db',
  enablePlugins: true,
  plugins: ['relations', 'similarity', 'translation']
};
```

### **Database Configuration**
```typescript
const dbConfig = {
  filename: 'wordnet.db',
  createIfNotExists: true,
  enableWAL: true,
  enableForeignKeys: true
};
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all tests
pnpm test

# Run specific test category
pnpm test:basic
pnpm test:advanced

# Run with coverage
pnpm test:coverage
```

### **Test Structure**
- **Unit Tests**: Individual function testing
- **Integration Tests**: Database interaction testing
- **E2E Tests**: Complete workflow testing

## 🚀 **Deployment**

### **Build Configuration**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### **Package Configuration**
```json
{
  "bin": {
    "wn-demo": "./dist/run-all-use-cases.js"
  },
  "scripts": {
    "start": "node dist/run-all-use-cases.js",
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

## 📖 **Learning Outcomes**

After working with this demo, you'll understand:

1. **Server-side Setup** - How to initialize WordNet in Node.js
2. **Database Management** - How to work with SQLite databases
3. **CLI Development** - How to build command-line tools
4. **Performance Considerations** - How to optimize for server environments
5. **Error Handling** - How to handle errors in server applications

## 🔗 **Next Steps**

- **Advanced Features**: Try the [Advanced Node Demo](./advanced-demo.md)
- **CLI Development**: Explore [CLI Documentation](../../packages/wn-cli/README.md)
- **Performance**: Learn about [Performance Optimization](../integration-examples/performance.md)

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Database Connection Error**
```typescript
// Ensure database file exists and is accessible
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
  offset: 0 
});
```

#### **TypeScript Errors**
```typescript
// Ensure proper type imports
import type { Word, Synset, Sense } from 'wn-ts-node';

// Use proper type annotations
const words: Word[] = await wordnet.words({ form: 'test' });
```

## 📄 **License**

This demo is part of the WordNet TypeScript ecosystem and is licensed under the MIT License.

---

**Ready for more advanced features? Check out the [Advanced Node Demo](./advanced-demo.md)! 🚀**
