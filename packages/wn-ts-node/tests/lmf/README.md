# LMF Test Suite

This directory contains a streamlined and comprehensive test suite for the LMF (Lexical Markup Framework) functionality.

## Test Structure

### Core Tests
- **`lmf-core.test.ts`** - Essential LMF functionality, basic parsing, validation, and error handling
- **`lmf-versions.test.ts`** - LMF version support and version-specific features
- **`lmf-performance.test.ts`** - Performance characteristics, memory usage, and scalability
- **`lmf-streaming.test.ts`** - Streaming parser specific functionality

### Configuration
- **`test-config.ts`** - Centralized test configuration and helper functions
- **`README.md`** - This documentation file

## Test Categories

### 1. Core Functionality (`lmf-core.test.ts`)
- File validation (`isLMF`)
- Basic parsing and data integrity
- Error handling for malformed XML
- Progress reporting
- Debug mode functionality

### 2. Version Support (`lmf-versions.test.ts`)
- Supported LMF versions (1.0, 1.1, 1.2, 1.3, 1.4)
- Unsupported version rejection
- Version-specific features
- Metadata handling (Dublin Core, confidence scores)

### 3. Performance (`lmf-performance.test.ts`)
- Large file handling (1000+ entries)
- Memory efficiency tests
- Streaming parser performance
- Concurrent processing
- Edge case performance (many small entries, complex structures)

### 4. Streaming Parser (`lmf-streaming.test.ts`)
- Streaming parser specific functionality
- Memory-efficient parsing
- Progress callbacks
- Error handling
- Interface compliance

## Test Configuration

The test suite uses a centralized configuration system:

```typescript
export const LMF_TEST_CONFIG: LMFTestConfig = {
  tempDirPrefix: 'wn-ts-lmf-test',
  performanceThresholds: {
    smallFile: 1000,    // 1 second
    mediumFile: 5000,   // 5 seconds
    largeFile: 10000,   // 10 seconds
    veryLargeFile: 30000 // 30 seconds
  },
  testDataSizes: {
    small: 50,
    medium: 200,
    large: 1000,
    veryLarge: 5000
  },
  supportedVersions: ['1.0', '1.1', '1.2', '1.3', '1.4'],
  unsupportedVersions: ['0.9', '2.0', '2.1']
};
```

## Helper Functions

The test configuration provides several helper functions for generating test data:

- `generateTestLMF(entries, version)` - Generate basic test LMF XML
- `generateComplexTestLMF(entries, version)` - Generate complex nested structures
- `generateMinimalTestLMF(version)` - Generate minimal valid LMF
- `generateMultiLexiconTestLMF(lexiconCount, entriesPerLexicon, version)` - Generate multi-lexicon LMF

## Running Tests

### Run All LMF Tests
```bash
pnpm vitest run tests/lmf/
```

### Run Specific Test Categories
```bash
# Core functionality
pnpm vitest run tests/lmf/lmf-core.test.ts

# Version support
pnpm vitest run tests/lmf/lmf-versions.test.ts

# Performance tests
pnpm vitest run tests/lmf/lmf-performance.test.ts

# Streaming parser tests
pnpm vitest run tests/lmf/lmf-streaming.test.ts
```

### Run Specific Tests
```bash
# Run a specific test by name
pnpm vitest run tests/lmf/lmf-core.test.ts -t "should parse minimal valid LMF file"

# Run performance tests only
pnpm vitest run tests/lmf/lmf-performance.test.ts -t "should handle large files efficiently"
```

## Test Data Management

The test suite uses temporary directories for test data and automatically cleans up after each test. Test data is generated dynamically to ensure consistency and avoid committing large test files.

## Performance Benchmarks

The performance tests include benchmarks for:
- Small files (< 100 entries): < 1 second
- Medium files (100-1000 entries): < 5 seconds
- Large files (1000+ entries): < 10 seconds
- Very large files (5000+ entries): < 30 seconds

## Coverage

The test suite provides comprehensive coverage of:
- ✅ All supported LMF versions
- ✅ All major LMF elements and structures
- ✅ Error handling and edge cases
- ✅ Performance characteristics
- ✅ Memory efficiency
- ✅ Streaming parser functionality
- ✅ Progress reporting
- ✅ Debug mode
- ✅ Concurrent processing

## Maintenance

When adding new tests:
1. Use the centralized configuration from `test-config.ts`
2. Follow the established test structure and naming conventions
3. Use helper functions for generating test data
4. Ensure proper cleanup in `afterEach` hooks
5. Add appropriate performance thresholds for new performance tests
