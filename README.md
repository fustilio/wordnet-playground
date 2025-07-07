# WordNet TypeScript Development

This repository contains the development of **wn-ts**, a TypeScript port of the Python [wn library](https://github.com/goodmami/wn) for accessing WordNet data, along with comprehensive benchmarking and testing infrastructure.

## 🎯 Primary Goal

**Develop a TypeScript port of the Python wn library** with the long-term goal of creating a fully browser-based implementation. The end motivation is to mirror the Python wn library in JavaScript/TypeScript.

- Full API parity with the Python reference implementation
- TypeScript-first design with modern features
- Comprehensive performance benchmarking
- Browser-compatible architecture
- Clean API without direct database access
- Unified CLI for data management and querying

## 📦 Projects

### 📁 `/wn-ts` - TypeScript WordNet Port (Main Project) 📦 **NPM PUBLISHED**
The primary TypeScript implementation providing full API parity with the Python wn library.

**Status**: ✅ **95% Complete** - Core functionality implemented, unified CLI completed.
**NPM**: `npm install wn-ts`

**Key Features:**
- ✅ **Unified CLI**: Command-line interface with database management
- ✅ **Core API Parity**: Full parity with Python wn library
- ✅ **Examples System**: Complete examples support for synsets and senses
- ✅ **Project Management**: TOML-based project index
- ✅ **Information Content**: Complete IC calculations with hypernym traversal
- ✅ **Export Formats**: JSON, XML, and CSV export
- ✅ **Clean API**: No direct database access - all functionality through Wordnet instance methods
- ✅ **Statistics & Analysis**: Built-in database statistics and quality metrics

**📖 [Read wn-ts Documentation →](./wn-ts/README.md)**

### 📁 `/wn-pybridge` - Python Bridge Implementation 🔧 **DEVELOPMENT TOOL**
A TypeScript interface to the Python wn library via [pythonia](https://github.com/extremeheat/JSPyBridge). This serves as:
- **Feature Parity Reference**: Simulates what wn-ts should be by providing direct access to Python wn
- **Development Tool**: Helps during benchmarking to check feature parity between implementations
- **Performance Benchmark**: Compare bridge vs native TypeScript performance

**📖 [Read wn-pybridge Documentation →](./wn-pybridge/README.md)**

### 📁 `/benchmark` - Performance Benchmarking Suite ✅ **COMPLETED** 🔧 **DEVELOPMENT TOOL**
A comprehensive benchmarking subproject that measures and compares performance across different WordNet implementations.

**📖 [Read Benchmark Documentation →](./benchmark/README.md)**

### 📁 `/demo` - Live Demo Application 🔧 **DEVELOPMENT TOOL**
A Node.js demo application showcasing the `wn-ts` library in action with real WordNet data.

**📖 [Read Demo Documentation →](./demo/README.md)**

### 📁 `/wn-test-data` - Shared Test Data Directory 🔧 **DEVELOPMENT TOOL**
Shared test data files used by both `wn-ts` and `wn-pybridge` projects to ensure consistency and comprehensive testing.

## 🚀 Quick Start

### Using wn-ts (NPM Package)
```bash
# Install the published package
npm install wn-ts

# Basic usage
import { Wordnet, download, add } from 'wn-ts';

(async () => {
  await download('oewn:2024');
  const wn = new Wordnet('oewn');
  const synsets = await wn.synsets('run', 'v');
  console.log(synsets[0]?.definitions[0]?.text);
})();
```

### Command-Line Interface
```bash
# Install globally for CLI access
npm install -g wn-ts

# Download and add WordNet data
wn-ts download oewn:2024
wn-ts add oewn-2024-english-wordnet-2024.xml.gz

# Query the database
wn-ts query run v

# Show database status
wn-ts db status

# Unlock locked databases
wn-ts db unlock

# Export data
wn-ts export --format json --output export.json
```

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-repo/wordnet.git
cd wordnet

# Install dependencies
pnpm install

# Build wn-ts
cd wn-ts
pnpm build
```

## 🔧 Development & CI

### Workspace Setup
This repository uses pnpm workspaces for managing the multi-package structure:

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Run benchmarks
pnpm test:bench
```

### Comprehensive CI Pipeline
The repository includes a complete CI pipeline that runs all tests, demos, and benchmarks:

```bash
# Run the complete CI pipeline
pnpm ci:full

# Run individual CI steps
pnpm ci:build    # Build wn-ts library
pnpm ci:test     # Run all tests (including e2e)
pnpm ci:demo     # Run all demo use cases
pnpm ci:benchmark # Run all benchmark tests
```

### Individual Scripts
```bash
# wn-ts specific
pnpm test         # Run wn-ts tests
pnpm test:e2e     # Run e2e tests
pnpm test:coverage # Run tests with coverage

# Demo specific
pnpm demo:all-use-cases  # Run all demo use cases
pnpm demo:kitchen-sink   # Run kitchen sink demo

# Benchmark specific
pnpm benchmark:func      # Run functional tests
pnpm benchmark:parity    # Run parity tests
pnpm benchmark:perf      # Run performance tests
```

## 📊 Benchmark Results

The repository includes comprehensive benchmarking tools that provide actionable insights:

### Cross-Library Performance Comparison ✅ **COMPLETED**
```bash
cd benchmark
pnpm test:func
```

This comprehensive benchmark compares 6 major WordNet libraries:

| Library | Performance | Features | Best For |
|---------|-------------|----------|----------|
| **WordsWordNet** | 5.28ms avg | Basic | Speed-critical applications |
| **node-wordnet** | 158ms avg | Standard | Production applications |
| **natural** | 309ms avg | NLP-focused | Natural language processing |
| **wn-ts** | 581ms avg | Full feature set | Feature-rich applications |
| **wn-pybridge** | ~500ms avg | Python parity | Python compatibility |
| **wordpos** | 1077ms avg | POS-focused | POS tagging workflows |

**📖 [Read Full Benchmark Results →](./benchmark/README.md)**

## 🎯 Current Development Focus

### Strategic Approach Decision ✅ **COMPLETED**
We've completed comprehensive testing of different WordNet implementations and made strategic decisions:

**Key Findings:**
- **Native TypeScript Approach**: wn-ts provides excellent performance and full feature parity
- **Python Bridge**: wn-pybridge offers direct Python compatibility with good performance
- **Feature Completeness**: Both approaches achieve high feature parity
- **Performance**: Native TypeScript outperforms bridge in most cases
- **Strategic Decision**: Continue with native TypeScript development for optimal performance
- **Clean API**: All components now use clean APIs without direct database access
- **Unified CLI**: Comprehensive command-line interface with database management

### Library Recommendations ✅ **COMPLETED**

Based on comprehensive benchmarking:

**For Speed-Critical Applications:**
- **Choose: WordsWordNet** - Fastest performance (5.28ms average)
- **Best for**: Basic word lookups where speed is paramount

**For Feature-Rich Applications:**
- **Choose: wn-ts** - Full API parity with Python wn library
- **Best for**: Applications requiring sense lookup and advanced features

**For Python Compatibility:**
- **Choose: wn-pybridge** - Direct bridge to Python wn library
- **Best for**: Projects requiring Python wn compatibility

## 📚 Documentation

- **TypeScript Port**: [wn-ts README](./wn-ts/README.md)
- **Python Bridge**: [wn-pybridge README](./wn-pybridge/README.md)
- **Benchmark Results**: [Benchmark README](./benchmark/README.md)
- **Demo Application**: [Demo README](./demo/README.md)
- **CLI Documentation**: [wn-ts CLI Guide](./wn-ts/docs/USAGE-CLI.md)
- **Python Reference**: [wn.readthedocs.io](https://wn.readthedocs.io/)

## 🎯 Roadmap

### TypeScript Port (wn-ts) ✅ **MAJOR PROGRESS**
- ✅ **Strategic Approach Decision**: Chosen native TypeScript implementation
- ✅ **Performance Optimization**: Optimized implementation with good performance
- ✅ **Feature Completion**: 95% feature parity achieved
- ✅ **Benchmark Integration**: Proper exports and integration completed
- ✅ **Clean API**: Removed direct database access, all components use clean APIs
- ✅ **Comprehensive CI**: Complete CI pipeline with tests, demos, and benchmarks
- ✅ **Unified CLI**: Command-line interface with database management
- [ ] **Advanced CLI**: Interactive mode and batch processing
- [ ] **Browser Compatibility**: Enhanced browser support for web applications
- [ ] **Production Readiness**: Enhanced error handling, logging, monitoring

### Benchmark Suite ✅ **COMPLETED**
- ✅ **Cross-Library Comparison**: Comprehensive testing of all alternatives
- ✅ **Performance Analysis**: Detailed performance metrics and rankings
- ✅ **Feature Parity Testing**: Complete functionality comparison
- ✅ **API Consistency**: Error handling and edge case validation
- ✅ **Results Documentation**: Comprehensive README with actionable insights

## 🤝 Contributing

We welcome contributions to the TypeScript port and benchmarking suite:

1. **Performance Analysis**: Help optimize performance further
2. **Feature Implementation**: Help complete remaining features
3. **Documentation**: Improve examples and tutorials
4. **Testing**: Enhance test coverage and edge case handling
5. **CLI Enhancement**: Help improve the command-line interface

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Original wn Library**: Created by Michael Wayne Goodman
- **WordNet Community**: For the rich linguistic resources
- **Contributors**: To the TypeScript port and benchmarking tools
- **Alternative Libraries**: For providing different approaches to WordNet access

---

**This repository focuses on developing a TypeScript port of the Python wn library, with comprehensive benchmarking to ensure optimal performance across different use cases and data sizes. The long-term goal is to create a fully browser-based implementation that mirrors the Python wn library in JavaScript/TypeScript. Only `wn-ts` is published to npm; other components are development and testing infrastructure.**

