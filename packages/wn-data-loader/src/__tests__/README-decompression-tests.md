# Consolidated Test Suite

This directory contains a consolidated test suite for the wn-data-loader package, organized to reduce duplication and improve maintainability.

## Test Files

### 1. `unit.test.ts`
- **Purpose**: Unit tests for individual components
- **Tests**:
  - WordNetProcessor functionality
  - WordNetContentDetector detection logic
  - Data source management
  - Type validation and error handling

### 2. `decompression.test.ts`
- **Purpose**: Comprehensive decompression testing
- **Tests**:
  - Basic decompression functionality
  - File size-based testing (small, medium, large, very large)
  - OEWN simulation testing
  - Performance and timeout testing
  - Error handling and edge cases
  - Progress reporting
  - Integration pattern testing

### 3. `test-utils.ts`
- **Purpose**: Shared utilities to reduce duplication
- **Utilities**:
  - Data generation functions
  - Compression utilities
  - Test helpers and constants
  - Timing and validation helpers

## Running the Tests

### Run All Tests
```bash
cd packages/wn-data-loader
pnpm test
```

### Run Specific Test Suites
```bash
# Unit tests only
pnpm test:unit

# Decompression tests only
pnpm test:decompression

# Both test suites
pnpm test:all
```

### Run with Watch Mode
```bash
pnpm test:watch
```

## Debugging the Hanging Issue

The tests are specifically designed to help debug the hanging behavior you're experiencing:

1. **Progress Tracking**: Each test logs detailed progress information with timestamps
2. **Hanging Detection**: Tests detect when progress gets stuck at the same value
3. **Timeout Simulation**: Tests simulate hanging decompression streams
4. **Fallback Testing**: Tests verify that fallback mechanisms work
5. **Resource Analysis**: Tests check for proper resource cleanup

## Key Features

### Progress Analysis
The tests track:
- Progress values and timestamps
- Time between progress updates
- Messages during decompression
- Detection of stuck progress

### Large File Simulation
- Creates XML data similar to OEWN structure
- Compresses to target file sizes
- Tests with various file sizes (1MB, 5MB, 12MB+)
- Simulates the exact 12,912,114 byte scenario

### Timeout Testing
- Mocks hanging DecompressionStream APIs
- Tests 30-second timeout behavior
- Verifies fallback mechanisms
- Checks resource cleanup

## Expected Output

When running the OEWN simulation test, you should see output like:
```
[0.0s] 5.0% - Starting WordNet processing... (0ms since last)
[0.1s] 10.0% - Validating data source... (100ms since last)
[0.2s] 15.0% - Decompressing gzipped data... (100ms since last)
[0.3s] 15.1% - Writing compressed data to stream... (100ms since last)
[0.4s] 15.2% - Starting decompression... (100ms since last)
[0.5s] 15.3% - Decompressing data... (100ms since last)
...
[25.0s] 25.0% - Gzip decompression completed... (100ms since last)
[25.1s] 25.3% - Detecting WordNet content type... (100ms since last)
...
[30.0s] 100.0% - WordNet processing completed successfully (100ms since last)
```

## Troubleshooting

If tests fail or show hanging behavior:

1. **Check Console Output**: Look for progress logs to see where it gets stuck
2. **Check Timeouts**: Verify that timeouts are working correctly
3. **Check Fallbacks**: Ensure fallback mechanisms are triggered
4. **Check Resources**: Verify that streams are properly closed

## Browser Compatibility

These tests use the browser's native `DecompressionStream` and `CompressionStream` APIs. They should work in:
- Chrome 80+
- Firefox 65+
- Safari 16.4+
- Edge 80+

If you're testing in an environment that doesn't support these APIs, the tests will fail with appropriate error messages.
