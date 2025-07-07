# WordNet Benchmark Tests

This directory contains comprehensive tests for WordNet libraries, focusing on three main areas:

## Test Structure

### 1. **Individual Library Tests** (Standalone)
**Purpose**: Test each WordNet library in isolation to understand its specific behavior and performance
- **Files**: 
  - `wn-ts.test.ts` - Tests for wn-ts library
  - `natural.test.ts` - Tests for natural library  
  - `node-wordnet.test.ts` - Tests for node-wordnet library
  - `wordpos.test.ts` - Tests for wordpos library
  - `words-wordnet.test.ts` - Tests for @words/wordnet library
  - `wn-pybridge.test.ts` - Tests for wn-pybridge library
- **What they test**:
  - Core functionality (synset lookup, word lookup, sense lookup)
  - Edge case handling (empty strings, non-existent words, invalid POS)
  - Performance characteristics and timing
  - Data structure analysis and normalization
  - Resource management and cleanup
- **Focus**: Deep dive into each library's specific behavior and capabilities
- **Usage**: Run individual tests to debug specific library issues or understand library differences

### 2. **Feature Parity Tests** (`feature-parity.test.ts`)
**Purpose**: Test feature parity and correctness across different WordNet libraries
- **What it tests**: 
  - Core functionality (synset lookup, word lookup, sense lookup)
  - Edge case handling (empty strings, non-existent words, invalid POS)
  - API consistency and normalization
  - Cross-library result comparison
- **Focus**: Ensuring all libraries return comparable results for the same inputs
- **Libraries used**: `RELIABLE_LIBRARIES` (subset of most stable libraries)

### 3. **Performance Benchmark Tests** (`performance-benchmark.test.ts`)
**Purpose**: Measure performance and resource usage across all WordNet libraries
- **What it tests**:
  - Initialization time
  - Lookup performance (synset, word, bulk operations)
  - Memory usage
  - Parallel execution capabilities
- **Focus**: Identifying the fastest and most efficient libraries
- **Libraries used**: `ALL_LIBRARIES` (all available libraries)

## Shared Utilities (`shared-test-utils.ts`)

Common functionality used by all test suites:

### Core Utilities
- **`ProgressTracker`**: Real-time progress tracking with ETA
- **`withTimeout()`**: Prevents hanging operations
- **`log()`**: Enhanced logging with timestamps and levels
- **`initializeLibraries()`**: Parallel library initialization
- **`cleanupLibraries()`**: Parallel library cleanup

### Testing Utilities
- **`runParityTest()`**: Run the same operation across all libraries
- **`compareResults()`**: Compare results with different tolerance levels
- **`measurePerformance()`**: Measure operation performance
- **`runIterations()`**: Run multiple iterations for accurate timing

### Test Data
- **`TEST_WORDS`**: Common words for testing
- **`TEST_POS`**: Parts of speech to test
- **`TEST_CASES`**: Predefined test scenarios
- **`ALL_LIBRARIES`**: All available WordNet libraries
- **`RELIABLE_LIBRARIES`**: Subset of most stable libraries

## Usage

### Run Individual Library Tests
```bash
# Test specific library
pnpm test tests/wn-ts.test.ts
pnpm test tests/natural.test.ts
pnpm test tests/node-wordnet.test.ts
pnpm test tests/wordpos.test.ts
pnpm test tests/words-wordnet.test.ts
pnpm test tests/wn-pybridge.test.ts

# Test all individual libraries
pnpm test tests/wn-ts.test.ts tests/natural.test.ts tests/node-wordnet.test.ts tests/wordpos.test.ts tests/words-wordnet.test.ts tests/wn-pybridge.test.ts

# Run with verbose output for detailed analysis
pnpm test tests/wn-ts.test.ts --reporter=verbose
```

### Run Feature Parity Tests
```bash
# Run all feature parity tests
pnpm test tests/feature-parity.test.ts

# Run specific test suite
pnpm test tests/feature-parity.test.ts -t "Core Functionality"
```

### Run Performance Benchmarks
```bash
# Run all performance benchmarks
pnpm test tests/performance-benchmark.test.ts

# Run parallel benchmark (fastest)
pnpm test tests/performance-benchmark.test.ts -t "Parallel Performance"

# Run specific benchmark
pnpm test tests/performance-benchmark.test.ts -t "Initialization Performance"
```

### Run All Tests
```bash
# Run all tests
pnpm test tests/

# Run with verbose output
pnpm test tests/ --reporter=verbose
```

## Test Output

### Individual Library Tests
- 🔧 Initialization status and timing
- 📊 Result counts and data structure analysis
- ⏱️ Performance measurements for each operation
- 📋 Detailed data structure logging
- ✅ Edge case handling verification
- 🧹 Resource cleanup confirmation

### Feature Parity Tests
- ✅ Success indicators for each library
- ⚠️ Warnings for parity mismatches
- 📊 Result counts and comparisons
- 🔍 Detailed operation tracking

### Performance Benchmarks
- ⏱️ Timing measurements in milliseconds
- 💾 Memory usage in MB
- 📊 Progress tracking with ETA
- 🚀 Parallel execution summaries

## Configuration

### Timeouts
- **Library initialization**: 30 seconds (60 seconds for node-wordnet)
- **Individual lookups**: 15 seconds
- **Bulk operations**: 10 seconds per item
- **Cleanup operations**: 10 seconds

### Test Data
- **Common words**: 20 frequently used words
- **Parts of speech**: n, v, a, r (noun, verb, adjective, adverb)
- **Edge cases**: Empty strings, non-existent words, invalid POS

### Tolerance Levels
- **`exact`**: Strict equality comparison
- **`structure`**: Same structure and non-zero length
- **`non-empty`**: Just check for any results

## Adding New Libraries

1. Add the library to `lib/wordnet-libraries/`
2. Implement the `WordNetLibraryBase` interface
3. Create a standalone test file following the pattern of existing tests
4. Add to `ALL_LIBRARIES` in `shared-test-utils.ts`
5. Add to `RELIABLE_LIBRARIES` if it's stable enough for parity testing

## Troubleshooting

### Common Issues
- **Library initialization failures**: Check dependencies and configuration
- **Timeout errors**: Increase timeout values for slow libraries
- **Memory issues**: Libraries may need cleanup between tests
- **Parity mismatches**: Different libraries may return different data structures

### Debug Mode
Enable debug logging by setting the log level to 'debug' in the test utilities for detailed operation tracking.

### Individual Library Debugging
Use the standalone test files to:
- **Isolate issues**: Test one library at a time
- **Analyze performance**: Get detailed timing for specific operations
- **Understand data structures**: See exactly what each library returns
- **Test edge cases**: Verify how each library handles problematic inputs
- **Profile resource usage**: Monitor memory and cleanup behavior 