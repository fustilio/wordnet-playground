# WordNet TypeScript Ecosystem

A comprehensive TypeScript implementation of WordNet with multiple deployment targets, real data integration, and modern tooling.

## 🌟 **Project Overview**

This monorepo contains a complete WordNet implementation with multiple deployment strategies:

- **`wn-ts-core`**: Core WordNet types, interfaces, and data structures
- **`wn-ts-node`**: Node.js implementation using better-sqlite3
- **`wn-ts-web`**: Browser implementation using @sqlite.org/sqlite-wasm
- **`wn-ts-web-demo`**: Interactive web demo with real data loading
- **`wn-cli`**: Command-line interface with TUI
- **`wn-pybridge`**: Python bridge for interoperability

## 🏗️ **Architecture**

### **Core Principles**
- **Type Safety**: Full TypeScript implementation with strict typing
- **Modular Design**: Each package has a specific responsibility
- **Modern Tooling**: Vite, Vitest, ESLint, and modern development practices
- **Cross-Platform**: Works in Node.js, browsers, and CLI environments
- **Real Data Support**: Full integration with actual WordNet data sources
- **Explicit Client Passing**: Clean dependency injection pattern

### **Package Responsibilities**

| Package | Responsibility | Technology | Status |
|---------|---------------|------------|--------|
| `wn-ts-core` | Core types, interfaces, data structures | TypeScript | ✅ Complete |
| `wn-ts-node` | Node.js implementation | better-sqlite3 | ✅ Complete |
| `wn-ts-web` | Browser implementation | @sqlite.org/sqlite-wasm | ✅ Complete |
| `wn-ts-web-demo` | Interactive web demo | React + Vite | ✅ Complete |
| `wn-cli` | Command-line interface | React Ink | ✅ Complete |
| `wn-pybridge` | Python interoperability | Pythonia | ✅ Complete |

### **Architecture Benefits**
1. **Platform Optimization**: Each package is optimized for its target environment
2. **Bundle Size**: Browser users only get the code they need
3. **Type Safety**: Shared interfaces ensure consistency across implementations
4. **Maintainability**: Clear separation of concerns
5. **Future-Proof**: Easy to add new implementations (e.g., Deno, Bun)
6. **Testability**: Explicit client passing makes testing easier
7. **Decoupling**: No internal client instantiation in module functions
8. **Real Data Integration**: Full support for actual WordNet repositories

## 🚀 **Quick Start**

### **Installation**
```bash
git clone <repository>
cd wordnet
pnpm install
```

### **Development**
```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Start development servers
pnpm dev
```

### **Web Demo**
```bash
cd wn-ts-web-demo
pnpm dev
```

Visit `http://localhost:5173` to see the interactive WordNet demo.

## 📦 **Package Details**

### **wn-ts-core**
Core WordNet types and interfaces used by all other packages.

```typescript
import type { Word, Synset, Sense } from 'wn-ts-core';
import { words, synsets } from 'wn-ts-core';

// Explicit client passing pattern
const wordnetClient = new Wordnet('oewn:2024');
const results = await words(wordnetClient, 'run', 'v');
```

### **wn-ts-node**
Node.js implementation with better-sqlite3 for high performance.

```typescript
import { Wordnet } from 'wn-ts-node';

const wordnet = new Wordnet('oewn:2024');
const words = await wordnet.words('computer');
```

### **wn-ts-web**
Browser implementation using @sqlite.org/sqlite-wasm for modern web optimization.

```typescript
import { createWordNetInstance } from 'wn-ts-web';

const { wordnet, dataLoader } = await createWordNetInstance();
await dataLoader.downloadAndLoad('oewn:2024');
```

### **wn-ts-web-demo**
Interactive web demo showcasing real WordNet data loading and querying.

Features:
- Real data download from WordNet repositories
- Interactive search and exploration
- OPFS (Origin Private File System) for persistent storage
- Progress tracking and cache management
- Advanced visualizations (WordRelationshipGraph, SynsetHierarchyTree)
- Developer tools (DebugConsole, Performance Monitoring)

## 🔄 **Migration Path**

### For Existing `wn-ts` Users

The current `wn-ts` package will continue to work as-is, but users are encouraged to migrate:

```typescript
// Old way (still works)
import { Wordnet } from 'wn-ts';

// New way (recommended)
import { Wordnet } from 'wn-ts-node'; // For Node.js
import { createWordNetInstance } from 'wn-ts-web'; // For browsers

// Use convenience methods (recommended)
const wn = new Wordnet('oewn:2024');
const synsets = await wn.synsets('run', 'v');

// Or use explicit client passing (advanced)
import { synsets } from 'wn-ts-core';
const synsetResults = await synsets(wn, 'run', 'v');
```

### For New Projects

Choose the appropriate package based on your target environment:

```typescript
// Node.js applications
import { Wordnet } from 'wn-ts-node';

// Browser applications
import { createWordNetInstance } from 'wn-ts-web';

// Shared types and interfaces
import type { Word, Synset, DatabaseInterface } from 'wn-ts-core';

// Module functions with explicit client passing
import { words, synsets } from 'wn-ts-core';
const wordnetClient = new Wordnet('oewn:2024');
const results = await words(wordnetClient, 'run', 'v');
```

## 🧪 **Testing & Quality**

### **Test Infrastructure**
- **Unit Tests**: 190+ tests across all packages
- **E2E Tests**: Real data integration testing
- **Performance Benchmarks**: Comprehensive library comparisons
- **Browser Tests**: Full browser environment testing
- **Cross-Project Integration**: API consistency across all packages

### **Real Data Testing**
The project includes comprehensive E2E testing with real WordNet data:
- Open English WordNet (OEWN) integration
- CILI (Collaborative Interlingual Index) support
- Multi-language data handling
- Database schema validation
- Performance monitoring

### **Test Categories**
- **Cross-Project Integration Tests**: API consistency across packages
- **Advanced Multilingual Tests**: Multi-language scenarios with CILI
- **Performance Benchmark Tests**: Node.js vs browser performance
- **Sanity Check Tests**: System health monitoring
- **Real Data Tests**: Actual WordNet data integration

## 📊 **Performance**

### **Benchmark Results**
Comprehensive comparison of WordNet libraries:

| Library | Performance | Features | Best For |
|---------|-------------|----------|----------|
| **WordsWordNet** | 5.28ms avg | Basic | Speed-critical applications |
| **node-wordnet** | 158ms avg | Standard | Production applications |
| **natural** | 309ms avg | NLP-focused | Natural language processing |
| **wn-ts** | 581ms avg | Full feature set | Feature-rich applications |
| **wn-pybridge** | ~500ms avg | Python parity | Python compatibility |
| **wordpos** | 1077ms avg | POS-focused | POS tagging workflows |

## 🔧 **Development**

### **Key Features**
- **Real Data Integration**: Works with actual WordNet repositories
- **Multi-Language Support**: English, Spanish, and more
- **Database Optimization**: Proper indexing and schema design
- **Error Handling**: Robust fallback mechanisms
- **Data Management**: Export/import capabilities
- **Advanced Visualizations**: Interactive graphs and hierarchies
- **Developer Tools**: Debug console and performance monitoring

## 📚 **Documentation**

- **[CHANGELOG.md](./CHANGELOG.md)**: Version history and changes

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with modern TypeScript, featuring real WordNet data integration, comprehensive testing, and advanced visualizations.**

