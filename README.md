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

**Status**: ✅ **95% Complete** - Core functionality implemented.
**NPM**: `npm install wn-ts`

**Key Features:**
- ✅ **Core API Parity**: Full parity with Python wn library
- ✅ **Examples System**: Complete examples support for synsets and senses
- ✅ **Project Management**: TOML-based project index
- ✅ **Information Content**: Complete IC calculations with hypernym traversal
- ✅ **Export Formats**: JSON, XML, and CSV export
- ✅ **Clean API**: No direct database access - all functionality through Wordnet instance methods
- ✅ **Statistics & Analysis**: Built-in database statistics and quality metrics

> **Note:** The CLI is now maintained in the separate [`wn-cli`](./wn-cli/) package. For all command-line functionality, please use `wn-cli`.

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

### 📁 `/demo` - Executable Use Cases 🔧 **DEVELOPMENT TOOL**
A collection of executable use cases that demonstrate `wn-ts` features, validate its functionality, and guide its development.

**📖 [Read Use Case Documentation →](./demo/README.md)**

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
npm install -g wn-cli

# Download and add WordNet data
wn-cli data download oewn:2024
wn-cli data add oewn-2024-english-wordnet-2024.xml.gz

# Query the database
wn-cli query word run v

# Show database status
wn-cli db status

# Unlock locked databases
wn-cli db unlock

# Export data
wn-cli data export --format json --output export.json
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
- **CLI Documentation**: [wn-cli README](./wn-cli/README.md)
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

## 🌐 Node-to-Browser Strategy: Lessons from wordpos/wordpos-web and the Path for wn-ts

A key long-term goal of this repository is to enable **full browser-based WordNet access** with the same API and feature set as the Node.js implementation. To achieve this, we are drawing on the successful dual-environment strategy pioneered by the `wordpos` and `wordpos-web` projects. Here’s how this approach works and how it will inform the future of `wn-ts` and `wn-ts-web`:

### How wordpos Achieves Node & Browser Support
- **Single Codebase, Dual Entry Points:** The `wordpos` library maintains a single codebase with separate entry points for Node.js and browser environments. The main module (`src/wordpos.js`) conditionally loads either the Node or browser implementation based on the environment.
- **Browser Data Preparation:** For the browser, WordNet index and data files are preprocessed into JSON/JS modules using a build script. These are then loaded dynamically in the browser using ES6 dynamic imports, avoiding direct filesystem access.
- **API Parity:** Both environments expose the same API, so code written for Node.js can run in the browser with minimal changes.
- **Distribution:** The `wordpos-web` project provides a static web demo and distribution, bundling the browser build and the required data files for easy deployment.

### Planned Strategy for wn-ts and wn-ts-web
- **Unified TypeScript Codebase:** `wn-ts` will maintain a single codebase, with environment-specific entry points for Node.js and browser (e.g., using the `browser` field in `package.json`).
- **Browser Data Bundling:** We will develop a build process to convert WordNet data into browser-usable formats (e.g., JSON or JS modules), similar to `wordpos`. These will be loaded dynamically or via static imports in the browser.
- **API Consistency:** The browser and Node.js builds will expose the same API, ensuring seamless portability of code and tests.
- **Web Demo & Distribution:** The `wn-ts-web` project will serve as a static web demo and distribution, bundling the browser build and data files, and providing example HTML/JS usage.
- **Testing & Parity:** We will maintain a comprehensive test suite to ensure feature parity and correctness across both environments.

### Why This Matters
- **Broader Reach:** Enables WordNet-powered applications to run anywhere JavaScript runs, including browsers, Node.js, and serverless platforms.
- **Performance & Usability:** By pre-processing data and optimizing for browser delivery, we can achieve fast, interactive WordNet experiences on the web.
- **Modern Web Standards:** This approach leverages ES modules, modern bundlers, and static hosting for maximum compatibility and performance.

**Next Steps:**
- Implement the browser build pipeline for `wn-ts`.
- Develop the `wn-ts-web` demo and static distribution.
- Ensure all core APIs are available and tested in both environments.

For more details, see the [wordpos README](./wordpos/README.md) and [wordpos-web](./wordpos-web/README.md) for a working example of this strategy.

