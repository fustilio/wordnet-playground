# WordNet TypeScript

A TypeScript port of the Python [wn library](https://github.com/goodmami/wn) for accessing WordNet data. This project provides a modern, type-safe way to work with WordNet in JavaScript/TypeScript environments.

## What is WordNet?

WordNet is a large lexical database of English. Nouns, verbs, adjectives and adverbs are grouped into sets of cognitive synonyms (synsets), each expressing a distinct concept. WordNet is widely used in natural language processing and computational linguistics.

## What does this project provide?

### 📦 `wn-ts` - Core Library
The main TypeScript library that provides full API parity with the Python wn library.

```bash
npm install wn-ts
```

```typescript
import { Wordnet, download } from 'wn-ts';

// Download WordNet data
await download('oewn:2024');

// Create WordNet instance
const wn = new Wordnet('oewn');

// Look up words
const synsets = await wn.synsets('run', 'v');
console.log(synsets[0]?.definitions[0]?.text);
// Output: "move fast by using one's feet, with one foot off the ground at any given time"
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

# Run tests
pnpm test
```

### For Users
```bash
# Install the core library
npm install wn-ts

# Install the CLI (optional)
npm install -g wn-cli
```

## Key Features

### 🎯 **Full API Parity**
- Complete compatibility with the Python wn library
- Same function names, parameters, and return values
- Easy migration from Python to TypeScript

### 🔍 **Rich Query Capabilities**
- Word lookup and sense disambiguation
- Synset exploration and relationship traversal
- Synonym, antonym, and hypernym discovery
- Information content calculations

### 📊 **Data Management**
- Download and manage multiple WordNet versions
- Export data in JSON, XML, and CSV formats
- Built-in statistics and quality metrics
- Browser-optimized data generation

### 🛡️ **Type Safety**
- Full TypeScript support with comprehensive types
- IntelliSense and autocomplete in your IDE
- Compile-time error checking

### ⚡ **Performance**
- Optimized for speed and memory efficiency
- Batch operations for large datasets
- Efficient database queries and caching

## Project Structure

```
wordnet/
├── wn-ts/          # Core TypeScript library
├── wn-cli/         # Command line interface
├── wn-pybridge/    # Python bridge (development tool)
├── benchmark/      # Performance benchmarking
├── demo/           # Example use cases
└── wn-test-data/   # Shared test data
```

## Documentation

- **[wn-ts Documentation](./wn-ts/README.md)** - Core library documentation
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

**This project aims to bring the power of WordNet to the JavaScript/TypeScript ecosystem with the same ease of use and feature completeness as the original Python library.**

