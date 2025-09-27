# Cross-Platform Test Suite

This directory contains the cross-platform test framework for validating that both `wn-ts-node` and `wn-ts-web` correctly implement the core WordNet interfaces and maintain behavioral consistency across platforms.

## Architecture

### Core (`wn-ts-core`)
- **Shared interfaces**: `WordNetCore`, `KyselyDatabase`, `WordNetWithPlugins`
- **Shared test framework**: `platform-test-framework.ts`
- **Core behavioral tests**: `core-behavioral-tests.ts` - defines expected behavior that ALL platforms must satisfy
- **Cross-platform test runner**: `cross-platform-test-runner.ts` - orchestrates testing across platforms

### Platform-Specific (`wn-ts-node` & `wn-ts-web`)
- **Platform test runners**: Implement the test framework for their specific environment
- **Platform-specific tests**: Additional tests that validate platform-specific functionality
- **Test data loading**: Platform-specific ways to load test data into their databases

## Test Categories

### 1. Core Behavioral Tests
These tests define the fundamental behavior that all platforms must implement:

- **Core Functionality**: Basic WordNet operations (getWord, getSynset, getSenses, etc.)
- **Plugin System**: Plugin registration and method availability
- **Performance**: Query performance and memory usage
- **Error Handling**: Graceful handling of invalid inputs
- **Data Consistency**: Referential integrity and data validation

### 2. Platform-Specific Tests

#### Web Platform (`wn-ts-web`)
- Browser environment detection
- SQLite WASM limitations and constraints
- Async operation handling
- Memory management within browser constraints

#### Node Platform (`wn-ts-node`)
- Node.js environment detection
- Large dataset handling with native SQLite
- File system operations
- Batch operations and memory efficiency

## Usage

### Running Tests

#### From Core Package
```bash
# Run core behavioral tests only
cd packages/wn-ts-core
pnpm test:platform:core

# Run cross-platform test runner (CLI)
pnpm test:platform help
```

#### From Web Package
```bash
# Run web platform tests
cd packages/wn-ts-web
pnpm test:platform

# Run with verbose output
pnpm test:platform:core
```

#### From Node Package
```bash
# Run node platform tests
cd packages/wn-ts-node
pnpm test:platform

# Run with verbose output
pnpm test:platform:core
```

### Test Framework API

#### Creating Platform Tests
```typescript
import { PlatformTest, PlatformTestContext, PlatformTestUtils } from './platform-test-framework.js';

const myTest: PlatformTest = {
  name: 'should do something',
  description: 'Test description',
  run: async (context: PlatformTestContext) => {
    // Test implementation
    PlatformTestUtils.assertTrue(condition, 'Error message');
  },
  timeout: 30000
};
```

#### Platform Test Context
```typescript
interface PlatformTestContext {
  wordnet: WordNetWithPlugins<any>;  // Full WordNet instance with plugins
  kyselyDb: KyselyDatabase;          // Database wrapper
  core: WordNetCore;                 // Core WordNet interface
  testData: TestData;                // Standardized test data
}
```

#### Test Utilities
```typescript
// Assertions
PlatformTestUtils.assertEqual(actual, expected, message);
PlatformTestUtils.assertTrue(value, message);
PlatformTestUtils.assertFalse(value, message);
PlatformTestUtils.assertLength(array, expectedLength, message);

// Async assertions
await PlatformTestUtils.assertRejects(promise, expectedError, message);

// Performance measurement
const { result, duration } = await PlatformTestUtils.measureTime(async () => {
  return await someOperation();
});
```

## Test Data

The framework provides standardized test data through `TestDataFactory.createBasicTestData()`:

- **Lexicons**: Test lexicon with metadata
- **Words**: Sample words with different parts of speech
- **Synsets**: Word groups with relationships
- **Senses**: Word-synset mappings
- **Definitions**: Synset definitions
- **Relations**: Semantic relationships between synsets

## Platform Configuration

Each platform must implement a `PlatformTestConfig`:

```typescript
const platformConfig: PlatformTestConfig = {
  platform: 'web' | 'node',
  name: 'Platform Name',
  description: 'Platform description',
  setup: async () => {
    // Initialize platform-specific resources
    // Return PlatformTestContext
  },
  teardown: async (context) => {
    // Cleanup platform-specific resources
  }
};
```

## Benefits

1. **Consistency**: Ensures both platforms behave identically for core functionality
2. **Regression Prevention**: Catches platform-specific regressions early
3. **Documentation**: Tests serve as living documentation of expected behavior
4. **Confidence**: Validates that platform-specific optimizations don't break core functionality
5. **Maintainability**: Centralized test logic reduces duplication

## Adding New Tests

### Core Behavioral Tests
Add to `core-behavioral-tests.ts` if the test should apply to ALL platforms.

### Platform-Specific Tests
Add to the respective platform's test runner file:
- `packages/wn-ts-web/tests/platform-integration/web-test-runner.ts`
- `packages/wn-ts-node/tests/platform-integration/node-test-runner.ts`

### Test Categories
- **Functionality**: Core WordNet operations
- **Performance**: Speed and memory usage
- **Error Handling**: Invalid input handling
- **Data Integrity**: Consistency and validation
- **Platform Features**: Platform-specific capabilities

## Continuous Integration

The cross-platform tests should be run in CI to ensure:
1. Both platforms pass all core behavioral tests
2. Platform-specific features work correctly
3. Performance remains within acceptable bounds
4. No regressions are introduced

## Troubleshooting

### Common Issues

1. **Test Data Not Loading**: Ensure platform-specific data loading is implemented correctly
2. **Database Connection Issues**: Check platform-specific database initialization
3. **Plugin Method Missing**: Verify plugins are properly registered in the test setup
4. **Memory Issues**: Check platform-specific memory management and cleanup

### Debug Mode

Run tests with debug logging:
```bash
# Web platform
cd packages/wn-ts-web
pnpm with-debug-logs test:platform

# Node platform  
cd packages/wn-ts-node
pnpm with-debug-logs test:platform
```
