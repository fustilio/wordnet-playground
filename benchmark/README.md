# WordNet Library Benchmark

A comprehensive benchmark comparing different WordNet libraries for Node.js/TypeScript, focusing on performance, feature parity, and API consistency.

## 🎯 Overview

This benchmark evaluates 6 WordNet libraries to help developers choose the right library for their needs:

- **wn-ts** - Modern TypeScript implementation with full API parity
- **wn-pybridge** - Python wn library bridge via Pythonia
- **natural** - Natural language processing library with WordNet support
- **WordsWordNet** - Lightweight WordNet wrapper
- **node-wordnet** - Node.js WordNet interface
- **wordpos** - Part-of-speech tagger with WordNet integration

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

### Advanced Features

| Feature | wn-ts | wn-pybridge | natural | WordsWordNet | node-wordnet | wordpos |
|---------|-------|-------------|---------|--------------|--------------|---------|
| **Examples Support** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Definitions** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Relations** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Morphological Analysis** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Information Content** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🎯 Detailed Findings

### ✅ **Top Performers**

1. **WordsWordNet** - Best for speed-critical applications
   - Fastest performance (5.28ms average)
   - Simple API
   - Limited feature set but excellent for basic lookups

2. **wn-ts** - Best for feature-rich applications
   - Full API parity with Python wn library
   - Sense lookup support (only 2 libraries support this)
   - Comprehensive feature set
   - Good performance for complex queries

3. **wn-pybridge** - Best for Python compatibility
   - Direct bridge to Python wn library
   - Full feature parity
   - Consistent performance

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
- Full feature set
- Sense lookup support
- Modern TypeScript implementation
- Good performance for complex queries

### For Python Compatibility
**Choose: wn-pybridge**
- Direct Python wn library bridge
- Full feature parity
- Consistent performance

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

## 📋 Library Details

### wn-ts
- **Status**: Modern TypeScript implementation
- **Features**: Full API parity with Python wn library
- **Performance**: Moderate (580ms average)
- **Best For**: Feature-rich applications requiring sense lookup

### wn-pybridge
- **Status**: Python wn library bridge
- **Features**: Complete Python wn functionality
- **Performance**: Consistent (~500ms average)
- **Best For**: Python compatibility and full feature set

### natural
- **Status**: Mature NLP library
- **Features**: WordNet integration with NLP tools
- **Performance**: Good for simple queries (309ms average)
- **Best For**: Natural language processing workflows

### WordsWordNet
- **Status**: Lightweight wrapper
- **Features**: Basic WordNet functionality
- **Performance**: Fastest (5.28ms average)
- **Best For**: Speed-critical applications

### node-wordnet
- **Status**: Node.js WordNet interface
- **Features**: Standard WordNet API
- **Performance**: Consistent (158ms average)
- **Best For**: Production applications requiring reliability

### wordpos
- **Status**: POS tagger with WordNet
- **Features**: Part-of-speech tagging integration
- **Performance**: Variable (1077ms average)
- **Best For**: POS tagging workflows

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

| Script | Description | Use Case |
|--------|-------------|----------|
| `pnpm test:all` | Run all tests and benchmarks | Complete analysis |
| `pnpm test:func` | Feature parity and API consistency | Library comparison |
| `pnpm test:perf` | Performance benchmarks only | Speed analysis |
| `pnpm test:parity` | Feature parity tests only | Functionality comparison |
| `pnpm test:bench` | LMF parser benchmarks | XML parsing performance |
| `pnpm test:watch` | Watch mode for development | Interactive testing |
| `pnpm test:coverage` | Run with coverage report | Code quality analysis |
| `pnpm benchmark:report` | Generate benchmark report | Documentation |
| `pnpm benchmark:quick` | Quick performance check | Fast validation |
| `pnpm benchmark:full` | Complete benchmark suite | Comprehensive analysis |

### Development Workflow
```bash
# Install and setup
pnpm install

# Run quick performance check
pnpm benchmark:quick

# Run comprehensive analysis
pnpm benchmark:full

# Generate report
pnpm benchmark:report

# Watch mode for development
pnpm test:watch
```

### Test Categories

**Performance Tests** (`test:perf`):
- Word lookup timing across all libraries
- Response time measurements
- Performance rankings

**Feature Parity Tests** (`test:func`):
- Core functionality comparison
- API consistency validation
- Error handling verification
- Cross-library result comparison

**LMF Parser Tests** (`test:bench`):
- XML parsing performance
- Memory usage analysis
- Parser efficiency comparison

## 📊 Test Results Summary

- **✅ All Tests Passing**: 11/11 tests passed
- **Performance**: Measured across 6 libraries
- **Feature Parity**: Comprehensive comparison
- **Error Handling**: All libraries handle edge cases properly
- **API Consistency**: Standardized testing framework

## 🎯 Key Metrics

### Performance Rankings
1. **WordsWordNet**: 5.28ms average (fastest)
2. **node-wordnet**: 157.75ms average (consistent)
3. **natural**: 308.93ms average (NLP-focused)
4. **wn-ts**: 580.79ms average (feature-rich)
5. **wn-pybridge**: ~500ms average (Python bridge)
6. **wordpos**: 1076.64ms average (variable)

### Feature Support
- **Sense Lookup**: Only wn-ts and wn-pybridge
- **Advanced Features**: wn-ts and wn-pybridge lead
- **Error Handling**: All libraries pass
- **API Consistency**: All libraries validated

## 🤝 Contributing

Contributions are welcome! Please see the contributing guidelines for details on:
- Adding new libraries
- Improving benchmarks
- Enhancing test coverage
- Performance optimizations

### Adding New Libraries
1. Create library implementation in `lib/wordnet-libraries/`
2. Extend `WordNetLibraryBase` class
3. Add to test suites in `tests/`
4. Update performance tables in README

### Improving Benchmarks
1. Add new test scenarios in `tests/`
2. Enhance performance metrics
3. Update feature parity analysis
4. Document new findings

---

*Last updated: December 2024*
*Test results from latest benchmark run*
*Package version: 1.0.0* 