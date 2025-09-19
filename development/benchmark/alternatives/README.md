# WordNet Alternatives Overview

This directory contains information about alternative WordNet implementations that are included in our benchmarking suite.

## Libraries Included

### 1. [morungos/wordnet](morungos-wordnet/README.md)
- **Focus**: Fast database access
- **Strengths**: Optimized lookups, memory-efficient
- **Best for**: Applications requiring fast WordNet access

### 2. [NaturalNode/natural](natural/README.md)
- **Focus**: Comprehensive NLP toolkit
- **Strengths**: Full NLP ecosystem, mature implementation
- **Best for**: Applications needing multiple NLP features

### 3. [moos/wordpos](wordpos/README.md)
- **Focus**: Part-of-speech utilities
- **Strengths**: Fast POS extraction, browser support
- **Best for**: Text analysis and POS tagging

### 4. [words/wordnet](words-wordnet/README.md)
- **Focus**: Modern JavaScript API
- **Strengths**: Clean interface, promise-based
- **Best for**: Modern JavaScript applications

### 5. [goodmami/wn (Python)](python-wn/README.md)
- **Focus**: Reference Python implementation
- **Strengths**: Complete API, mature codebase
- **Best for**: Python applications, reference implementation

## Benchmark Categories

### Cross-Implementation Comparison
- **File**: `bench/cross/alternatives-comparison.bench.ts`
- **Purpose**: Compare all libraries on common operations
- **Tests**: Synset lookup, word lookup, relationship traversal

### Improved Cross-Implementation Comparison
- **File**: `bench/cross/improved-alternatives-comparison.bench.ts`
- **Purpose**: Enhanced comparison with proper initialization and Python wn
- **Tests**: All operations with error handling and memory analysis

### WordPOS Specialized
- **File**: `bench/cross/wordpos-specialized.bench.ts`
- **Purpose**: Test wordpos-specific features
- **Tests**: POS extraction, text processing, random word generation

## Performance Characteristics

| Library | Speed | Memory | Features | Browser Support |
|---------|-------|--------|----------|-----------------|
| wn-ts | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| morungos/wordnet | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| natural | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| wordpos | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| words/wordnet | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| python-wn | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

## Usage Recommendations

### For Fast Lookups
- **Primary**: wn-ts, morungos/wordnet
- **Secondary**: wordpos, words/wordnet

### For Text Processing
- **Primary**: wordpos, natural
- **Secondary**: wn-ts

### For Full NLP Pipeline
- **Primary**: natural
- **Secondary**: wn-ts

### For Modern JavaScript
- **Primary**: words/wordnet, wn-ts
- **Secondary**: wordpos

### For Browser Applications
- **Primary**: wordpos, words/wordnet, wn-ts
- **Secondary**: morungos/wordnet

## Running Benchmarks

```bash
# Run all alternative comparisons
pnpm test:bench cross

# Run specific benchmark
pnpm vitest bench bench/cross/alternatives-comparison.bench.ts

# Run improved benchmark with Python wn
pnpm vitest bench bench/cross/improved-alternatives-comparison.bench.ts

# Run wordpos specialized tests
pnpm vitest bench bench/cross/wordpos-specialized.bench.ts
```

## Contributing

To add a new alternative library:

1. Create a new directory in `alternatives/`
2. Add a comprehensive README.md
3. Update package.json dependencies
4. Create benchmark tests in `bench/cross/`
5. Update this overview README

## Notes

- All benchmarks use the same test data for fair comparison
- Memory usage is measured for each operation
- Performance metrics include operations per second
- Browser compatibility is noted where relevant 