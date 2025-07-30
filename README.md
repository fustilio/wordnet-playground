# WordNet TypeScript

A TypeScript port of the Python [wn library](https://github.com/goodmami/wn) for accessing WordNet data. This project provides a modern, type-safe way to work with WordNet in JavaScript/TypeScript environments with clear separation between core functionality and platform-specific implementations.

## What is WordNet?

WordNet is a large lexical database of English. Nouns, verbs, adjectives and adverbs are grouped into sets of cognitive synonyms (synsets), each expressing a distinct concept. WordNet is widely used in natural language processing and computational linguistics.

## What does this project provide?

### 📦 `wn-ts-core` - Core Library
The core TypeScript library providing database-agnostic functionality, algorithms, parsers, and utilities. This package contains all the core logic that can be shared across different platforms.

```bash
npm install wn-ts-core
```

```typescript
import { words, synsets, lexicons } from 'wn-ts-core';
import { BaseWordnet } from 'wn-ts-core';

// Core functions require explicit client passing
const wordnetClient = new BaseWordnet(); // From platform-specific package
const wordResults = await words(wordnetClient, 'run', 'v');
const synsetResults = await synsets(wordnetClient, 'run', 'v');
const lexiconResults = await lexicons(wordnetClient);
```

### 🖥️ `wn-ts-node` - Node.js Implementation
The Node.js-specific implementation that provides database integration using SQLite (`better-sqlite3`). This package re-exports core functionality and adds Node.js-specific features like file system access and database operations.

```bash
npm install wn-ts-node
```

```typescript
import { Wordnet, download, add } from 'wn-ts-node';

// Download WordNet data
await download('oewn:2024');

// Create WordNet instance with database integration
const wn = new Wordnet('oewn:2024');

// Use convenience methods (delegate to module functions)
const synsets = await wn.synsets('run', 'v');
console.log(synsets[0]?.definitions[0]?.text);
// Output: "move fast by using one's feet, with one foot off the ground at any given time"

// Or use module functions with explicit client passing
import { synsets } from 'wn-ts-core';
const synsetResults = await synsets(wn, 'run', 'v');
```

### 🌐 `wn-ts-web` - Browser Distribution (Coming Soon)
Browser-optimized WordNet with SQL.js support for full API compatibility in web applications.

```bash
npm install wn-ts-web
```

```typescript
// Browser usage (implementation in progress)
import { BrowserWordNet, createBrowserWordNet } from 'wn-ts-web';

const wordnet = createBrowserWordNet();
await wordnet.initialize();

// Same API as Node.js version
const synsets = await wordnet.synsets('run', 'v');
```

### 🖥️ `wn-cli` - Command Line Interface
A comprehensive CLI for WordNet data management and exploration.

```bash
npm install -g wn-cli

# Download WordNet data
wn-cli data download oewn:2024

# Query words
wn-cli query word run v

# Explore synsets
wn-cli query synset ss_2024_00000001-n

# Export data
wn-cli data export --format json --output export.json
```

## Quick Start

### For Developers
```bash
# Clone the repository
git clone https://github.com/fustilio/wordnet-playground.git
cd wordnet-playground

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (organized by package)
pnpm test
```

### For Users
```bash
# Install the core library
npm install wn-ts-core

# Install the Node.js implementation
npm install wn-ts-node

# Install the CLI (optional)
npm install -g wn-cli
```

## Key Features

### 🎯 **Clear Package Separation**
- **`wn-ts-core`**: Database-agnostic core functionality, algorithms, parsers, utilities
- **`wn-ts-node`**: Node.js-specific database integration, file system operations, E2E tests
- **`wn-ts-web`**: Browser-optimized implementation with SQL.js (coming soon)
- **`wn-cli`**: Command-line interface for data management and querying

### 🔍 **Rich Query Capabilities**
- Word lookup and sense disambiguation
- Synset exploration and relationship traversal
- Synonym, antonym, and hypernym discovery
- Information content calculations

### 📊 **Data Management**
- Download and manage multiple WordNet versions
- Export data in JSON, XML, and CSV formats
- Built-in statistics and quality metrics
- Browser-optimized data generation (planned)

### 🛡️ **Type Safety**
- Full TypeScript support with comprehensive types
- IntelliSense and autocomplete in your IDE
- Compile-time error checking

### ⚡ **Performance**
- Optimized for speed and memory efficiency
- Batch operations for large datasets
- Efficient database queries and caching

### 🔧 **Clean Architecture**
- **Explicit Client Passing**: Module functions explicitly receive `BaseWordnet` instances
- **Dependency Injection**: No internal instantiation of clients within module functions
- **Decoupled Components**: Clear separation between core logic and platform-specific implementations
- **Testable Design**: Easy to mock and test individual components

## Project Structure

```
wordnet/
├── wn-ts-core/        # Core TypeScript library (database-agnostic)
├── wn-ts-node/        # Node.js implementation (database integration)
├── wn-ts-web/         # Browser distribution with SQL.js (coming soon)
├── wn-cli/            # Command line interface
├── wn-pybridge/       # Python bridge (development tool)
├── benchmark/         # Performance benchmarking
├── demo/              # Example use cases
└── wn-test-data/      # Shared test data
```

## Testing Strategy

### `wn-ts-core` Tests
- **Core functionality**: Algorithms, parsers, utilities
- **Database-agnostic**: No database dependencies
- **Unit tests**: Focus on pure functions and logic
- **Type safety**: Comprehensive TypeScript testing

### `wn-ts-node` Tests
- **Database integration**: SQLite operations and persistence
- **Node.js specifics**: File system operations, configuration
- **E2E tests**: Real-world usage scenarios
- **Performance**: Database query optimization

### Test Organization
- **No duplicates**: Each package tests its specific responsibilities
- **Clear separation**: Core logic in `wn-ts-core`, platform specifics in `wn-ts-node`
- **Comprehensive coverage**: All functionality thoroughly tested

## Documentation

- **[wn-ts-core Documentation](./wn-ts-core/README.md)** - Core library documentation
- **[wn-ts-node Documentation](./wn-ts-node/README.md)** - Node.js implementation documentation
- **[wn-ts-web Documentation](./wn-ts-web/README.md)** - Browser implementation documentation (coming soon)
- **[wn-cli Documentation](./wn-cli/README.md)** - CLI usage and commands
- **[Benchmark Results](./benchmark/README.md)** - Performance comparisons
- **[Python Reference](https://wn.readthedocs.io/)** - Original Python library docs

## Contributing

We welcome contributions! Here are some ways you can help:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new capabilities
- **Documentation**: Improve examples and tutorials
- **Performance**: Help optimize speed and memory usage
- **Testing**: Enhance test coverage and edge case handling

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- **Original wn Library**: Created by Michael Wayne Goodman
- **WordNet Community**: For the rich linguistic resources
- **Contributors**: To the TypeScript port and benchmarking tools

---

**This project aims to bring the power of WordNet to the JavaScript/TypeScript ecosystem with the same ease of use and feature completeness as the original Python library, while providing clear separation between core functionality and platform-specific implementations.**

