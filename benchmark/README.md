# WordNet Library Benchmark

A comprehensive benchmark comparing different WordNet libraries for Node.js/TypeScript, focusing on performance, feature parity, and API consistency.

## 🎯 Overview

This benchmark evaluates 6 WordNet libraries to help developers choose the right library for their needs:

- **wn-ts** - Modern TypeScript implementation with full API parity and clean API design
- **wn-pybridge** - Python wn library bridge via Pythonia
- **natural** - Natural language processing library with WordNet support
- **WordsWordNet** - Lightweight WordNet wrapper
- **node-wordnet** - Node.js WordNet interface
- **wordpos** - Part-of-speech tagger with WordNet integration

## 🎯 Clean API Design

**Important**: The benchmark now uses clean API approaches for all libraries:

- **wn-ts**: Uses Wordnet instance methods and module functions (no direct database access)
- **wn-pybridge**: Uses clean API without direct database access
- **All libraries**: Tested through their public APIs only

This ensures the benchmark reflects real-world usage patterns and maintainable code practices.

## 📊 Performance Results

### Word Lookup Performance (Average Response Time)

| Library | Run | Computer | Happy | Average |
|---------|-----|----------|-------|---------|
| **WordsWordNet** | 7.13ms | 4.43ms | 4.27ms | **5.28ms** |
| **natural** | 543.04ms | 189.21ms | 193.53ms | **308.93ms** |
| **node-wordnet** | 160.32ms | 164.69ms | 148.25ms | **157.75ms** |
| **wn-ts** | 595.04ms | 593.02ms | 554.32ms | **580.79ms** |
| **wn-pybridge** | ~500ms | ~500ms | ~500ms | **~500ms** |
| **wordpos** | 445.89ms | 1392.58ms | 1391.44ms | **1076.64ms** |

### Key Performance Insights

- **WordsWordNet** is the fastest by far (5.28ms average)
- **natural** shows good performance for common words but slower for complex queries
- **node-wordnet** provides consistent performance across all word types
- **wn-ts** shows moderate performance with excellent feature support
- **wordpos** has the highest variance in performance

## 🔍 Feature Parity Analysis

### Core Functionality Support

| Feature | wn-ts | wn-pybridge | natural | WordsWordNet | node-wordnet | wordpos |
|---------|-------|-------------|---------|--------------|--------------|---------|
| **Synset Lookup** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Word Lookup** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sense Lookup** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **POS Filtering** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Error Handling** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Clean API** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Advanced Features

| Feature | wn-ts | wn-pybridge | natural | WordsWordNet | node-wordnet | wordpos |
|---------|-------|-------------|---------|--------------|--------------|---------|
| **Examples Support** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Definitions** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Relations** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Morphological Analysis** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Information Content** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Statistics & Analysis** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🎯 Detailed Findings

### ✅ **Top Performers**

1. **WordsWordNet** - Best for speed-critical applications
   - Fastest performance (5.28ms average)
   - Simple API
   - Limited feature set but excellent for basic lookups

2. **wn-ts** - Best for feature-rich applications
   - Full API parity with Python wn library
   - Sense lookup support (only 2 libraries support this)
   - Comprehensive feature set including statistics and analysis
   - Clean API design without direct database access
   - Good performance for complex queries

3. **wn-pybridge** - Best for Python compatibility
   - Direct bridge to Python wn library
   - Full feature parity
   - Consistent performance
   - Clean API design

### ⚠️ **Performance Considerations**

- **natural**: Good for simple lookups, slower for complex queries
- **node-wordnet**: Consistent performance, good for production use
- **wordpos**: High performance variance, best for POS tagging workflows

### 🔧 **API Consistency**

All libraries handle edge cases gracefully:
- ✅ Empty string inputs
- ✅ Non-existent words
- ✅ Invalid POS tags
- ✅ Error recovery
- ✅ Clean API usage (no direct database access)

## 📈 Cross-Library Comparison Results

### Test Word: "run" (noun)
- **wn-ts**: 16 synsets
- **natural**: 57 synsets (includes all POS)
- **wn-pybridge**: 16 synsets
- **WordsWordNet**: 2 synsets
- **node-wordnet**: 16 synsets
- **wordpos**: 57 synsets (includes all POS)

### Test Word: "computer" (noun)
- **All libraries**: 2 synsets (consistent results)

### Test Word: "information" (noun)
- **All libraries**: 5 synsets (consistent results)

## 🚀 Recommendations

### For Speed-Critical Applications
**Choose: WordsWordNet**
- Fastest performance
- Simple API
- Good for basic word lookups

### For Feature-Rich Applications
**Choose: wn-ts**
- Full feature set including statistics and analysis
- Sense lookup support
- Modern TypeScript implementation
- Clean API design without direct database access
- Good performance for complex queries

### For Python Compatibility
**Choose: wn-pybridge**
- Direct Python wn library bridge
- Full feature parity
- Consistent performance
- Clean API design

### For Natural Language Processing
**Choose: natural**
- Good integration with NLP workflows
- Balanced performance
- Mature library

## 🧪 Test Coverage

The benchmark includes comprehensive testing:

- **Performance Tests**: Word lookup timing across all libraries
- **Feature Parity Tests**: Core functionality comparison
- **API Consistency Tests**: Error handling and edge cases
- **Cross-Library Comparison**: Result consistency analysis
- **Robustness Tests**: Error handling and recovery
- **Clean API Tests**: Verification of proper API usage

## 🔄 CI Integration

The benchmark is fully integrated with the workspace CI pipeline:

```bash
# Run all benchmark tests as part of CI
pnpm ci:benchmark

# Run individual benchmark components
pnpm benchmark:func    # Functional tests
pnpm benchmark:parity  # Feature parity tests
pnpm benchmark:perf    # Performance tests
```

## 📋 Library Details

### wn-ts
- **Status**: Modern TypeScript implementation
- **Features**: Full API parity with Python wn library, clean API design
- **Performance**: Moderate (580ms average)
- **Best For**: Feature-rich applications requiring sense lookup and analysis
- **Clean API**: ✅ Uses Wordnet instance methods and module functions

### wn-pybridge
- **Status**: Python wn library bridge
- **Features**: Complete Python wn functionality, clean API design
- **Performance**: Consistent (~500ms average)
- **Best For**: Python compatibility and full feature set
- **Clean API**: ✅ Uses clean API without direct database access

### natural
- **Status**: Mature NLP library
- **Features**: WordNet integration with NLP tools
- **Performance**: Good for simple queries (309ms average)
- **Best For**: Natural language processing workflows
- **Clean API**: ✅ Uses public API only

### WordsWordNet
- **Status**: Lightweight wrapper
- **Features**: Basic WordNet functionality
- **Performance**: Fastest (5.28ms average)
- **Best For**: Speed-critical applications
- **Clean API**: ✅ Uses public API only

### node-wordnet
- **Status**: Node.js WordNet interface
- **Features**: Standard WordNet API
- **Performance**: Consistent (158ms average)
- **Best For**: Production applications requiring reliability
- **Clean API**: ✅ Uses public API only

### wordpos
- **Status**: POS tagger with WordNet
- **Features**: Part-of-speech tagging integration
- **Performance**: Variable (1077ms average)
- **Best For**: POS tagging workflows
- **Clean API**: ✅ Uses public API only

## 🔧 Setup and Usage

### Quick Start
```bash
# Install dependencies
pnpm install

# Run all benchmarks (recommended)
pnpm test:all

# Run specific test suites
pnpm test:func    # Feature parity tests
pnpm test:perf    # Performance benchmarks
pnpm test:parity  # Feature parity only
```

### Available Scripts
```bash
# Benchmark scripts
pnpm test:func      # Functional tests
pnpm test:perf      # Performance tests
pnpm test:parity    # Feature parity tests
pnpm test:all       # All tests

# CI integration
pnpm ci:benchmark   # Run as part of CI pipeline
```

### Test Structure
```
tests/
├── feature-parity.test.ts      # Core functionality comparison
├── performance-benchmark.test.ts # Performance timing tests
├── multilingual-benchmark.test.ts # Cross-language testing
└── shared-test-utils.ts        # Common test utilities
```

## 📊 Benchmark Methodology

### Performance Testing
- **Test Words**: "run", "computer", "happy" (representing different complexity levels)
- **Measurements**: Average response time across multiple runs
- **Environment**: Consistent Node.js environment
- **Methodology**: Clean API usage only (no direct database access)

### Feature Parity Testing
- **Core Features**: Word lookup, synset lookup, sense lookup
- **Advanced Features**: Examples, definitions, relations
- **Error Handling**: Edge cases and error recovery
- **API Consistency**: Cross-library result comparison

### Clean API Verification
- **wn-ts**: Uses Wordnet instance methods and module functions
- **wn-pybridge**: Uses clean API without direct database access
- **All libraries**: Tested through public APIs only

## 🎯 Key Insights

### Performance vs Features
- **Speed-focused**: WordsWordNet (5.28ms) for basic lookups
- **Feature-focused**: wn-ts with full API parity and analysis capabilities
- **Balance**: natural and node-wordnet for production use

### Clean API Benefits
- **Maintainability**: No direct database access reduces coupling
- **Testability**: Easier to test and mock
- **Portability**: Better for different environments
- **Documentation**: Clearer API boundaries

### Future Considerations
- **Browser Compatibility**: wn-ts designed for browser environments
- **Type Safety**: wn-ts provides full TypeScript support
- **Extensibility**: wn-ts supports custom analysis and statistics

---

**Remember**: All benchmarks use clean API approaches, reflecting real-world usage patterns and maintainable code practices. 