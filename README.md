# WordNet TypeScript Ecosystem

Modern TypeScript ecosystem for WordNet data across browsers, Node.js, and CLI. Built with microkernel architecture and comprehensive plugin system.

## Quick Start

```bash
# Web applications
npm install wn-ts-web @sqlite.org/sqlite-wasm

# Node.js applications
npm install wn-ts-node

# Command line tools
npm install -g wn-cli
```

## Documentation

- **[Getting Started](./docs/getting-started/README.md)** - Quick setup and basic usage
- **[Examples](./docs/examples/README.md)** - Working examples and tutorials
- **[API Reference](./docs/api/README.md)** - Complete API documentation
- **[Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)** - System design overview

## Key Features

- **Microkernel Architecture** - Plugin-based design for extensibility
- **Cross-Platform** - Works in browsers, Node.js, and other JavaScript environments
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Cross-Lingual** - Multi-language support with ILI-based translation
- **Performance** - Optimized for both speed and memory usage
- **Extensible** - Plugin system for custom functionality

## Packages

**Core Libraries:**
- **[wn-ts-core](./packages/wn-ts-core/)** - Foundation library with microkernel architecture
- **[wn-ts-web](./packages/wn-ts-web/)** - Browser implementation with React integration
- **[wn-ts-node](./packages/wn-ts-node/)** - Node.js implementation with SQLite
- **[wn-cli](./packages/wn-cli/)** - Command-line interface and TUI

**Utilities:**
- **[wn-data-loader](./packages/wn-data-loader/)** - Data loading and processing utilities
- **[wn-test-data](./packages/wn-test-data/)** - Test data and sample files
- **[utils](./packages/utils/)** - Shared utilities and logging

## Use Cases

- **Multi-lingual Dictionaries** - Build comprehensive dictionary applications
- **Crossword Puzzles** - Use definitions and word relationships for puzzle generation
- **Word Relationship Exploration** - Analyze semantic relationships between words
- **Translation Systems** - Cross-lingual translation and concept mapping
- **Linguistic Research** - Academic research and language analysis tools
- **NLP Applications** - Natural language processing and understanding

## 🏗️ **Architecture**

The ecosystem uses a modern **microkernel architecture** with a plugin system:

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

## 🚀 **Examples**

### **Web Applications**
- **[Basic Demo](./docs/examples/web-demos/basic-demo.md)** - Simple word search and exploration
- **[Developer Demo](./docs/examples/web-demos/developer-demo.md)** - Advanced features and microkernel architecture

### **Node.js Applications**
- **[Basic Node Demo](./docs/examples/node-demos/basic-demo.md)** - Server-side WordNet usage
- **[Advanced Node Demo](./docs/examples/node-demos/advanced-demo.md)** - Complex scenarios and optimization

### **Integration Examples**
- **[Translation Examples](./docs/examples/integration-examples/translation.md)** - Cross-lingual translation workflows
- **[Plugin Development](./docs/examples/integration-examples/plugin-development.md)** - Creating custom plugins

## 🛠️ **Development**

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm
- TypeScript 5.0+

### **Setup**
```bash
# Clone the repository
git clone https://github.com/fustilio/wordnet-playground-2.git
cd wordnet-playground-2

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### **Development Workflow**
```bash
# Start development server
pnpm dev

# Run specific tests
pnpm test:web
pnpm test:node

# Build for production
pnpm build:packages
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Development Guide](./docs/development/README.md) for details on how to contribute.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 **Acknowledgments**

- **WordNet Project** - Princeton University's lexical database
- **Global WordNet Association** - Multi-lingual WordNet resources
- **Python wn Library** - Early inspiration and index.toml format
- **SQLite** - Embedded database engine
- **React** - UI library for web components

## 📚 **Background Reading**

- **[The Structure of a Wordnet](https://wn.readthedocs.io/en/latest/guides/wordnet.html)** - Understanding WordNet concepts
- **[LMF Specification](https://www.lexicalmarkupframework.org/)** - Lexical Markup Framework standard
- **[Interlingual Index](https://en.wikipedia.org/wiki/Interlingual_Index)** - Cross-lingual concept mapping

---

**Ready to explore? Start with our [Getting Started Guide](./docs/getting-started/README.md)! 🚀**

