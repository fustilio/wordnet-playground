# End-to-End Tests for WordNet Orchestration

This directory contains comprehensive end-to-end tests for the new WordNet orchestration architecture in `wn-ts-web`.

## Overview

The e2e tests validate the complete workflow of the orchestration system in a **real browser environment**, including:

- **WordNetOrchestrator**: High-level lexicon management and cross-lexicon operations
- **WordNetWorkerClient**: Worker communication and state tracking
- **Integration scenarios**: Complete workflows from initialization to cleanup
- **Error handling**: Graceful failure handling and recovery
- **Resource management**: Proper cleanup and memory management

## Key Features

### Real Browser Environment
- **Actual browser**: Tests run in real Chromium browser via Playwright
- **Real SQLite WASM**: Uses actual `@sqlite.org/sqlite-wasm` package
- **Real Web Workers**: Tests actual worker communication, not mocks
- **Real Comlink**: Tests actual RPC communication between main thread and workers

### Comprehensive Testing
- **Database operations**: Real SQLite database creation and queries
- **Network requests**: Actual HTTP requests for lexicon data
- **Browser APIs**: Real browser environment with all standard APIs
- **Performance**: Tests actual performance characteristics, not simulated

## Test Files

### 1. `orchestrator.e2e.test.ts`
Tests the `WordNetOrchestrator` class functionality:
- Initialization with real SQLite WASM
- Lexicon lifecycle management with actual data
- Cross-lexicon query operations
- Event system and state tracking
- Resource cleanup

### 2. `worker-client.e2e.test.ts`
Tests the `WordNetWorkerClient` class functionality:
- Worker initialization and Comlink connection
- Package loading and data management
- Query operations via worker
- Event system and state synchronization
- Error handling and recovery

### 3. `setup.ts`
Browser environment setup and configuration for e2e tests.

### 4. `run-e2e-tests.ts`
A standalone test runner script that can be executed independently.

## Running the Tests

### Using npm/pnpm scripts (Recommended)

```bash
# Run all orchestration e2e tests
pnpm test:e2e:orchestration

# Run orchestrator tests only
pnpm test:e2e:orchestrator

# Run worker client tests only
pnpm test:e2e:worker-client

# Run all e2e tests (including existing ones)
pnpm test:e2e
```

### Using the test runner script

```bash
# Make the script executable
chmod +x test/e2e/run-e2e-tests.ts

# Run from project root
./test/e2e/run-e2e-tests.ts
```

### Using vitest directly

```bash
# Run all e2e tests
npx vitest run test/e2e --config=vitest.e2e.config.ts

# Run specific test file
npx vitest run test/e2e/orchestrator.e2e.test.ts --config=vitest.e2e.config.ts

# Run in watch mode
npx vitest test/e2e --config=vitest.e2e.config.ts
```

## Test Environment

### Browser Environment
The e2e tests run in a real browser environment using:

- **Playwright**: Browser automation and testing
- **Chromium**: Modern browser with full Web API support
- **jsdom**: Browser-like environment for Node.js compatibility
- **Real network**: Actual HTTP requests and responses

### Dependencies
Tests use real dependencies, not mocks:

- **SQLite WASM**: Actual SQLite database engine
- **Comlink**: Real RPC communication library
- **Web Workers**: Actual browser worker implementation
- **Fetch API**: Real HTTP request handling

### Test Data
Tests use real data when available:

- **Actual lexicons**: Real WordNet lexicon files when accessible
- **Real network**: Actual HTTP requests to lexicon sources
- **Real database**: Actual SQLite database operations
- **Real performance**: Actual timing and memory usage

## Test Categories

### 1. Initialization Tests
- Successful initialization with real SQLite WASM
- Multiple initialization calls
- Error handling during initialization
- Event emission on initialization

### 2. Lexicon Management Tests
- Lexicon loading and unloading with real data
- State tracking and updates
- Concurrent loading with queuing
- Event emission for state changes

### 3. Query Operation Tests
- Cross-lexicon word queries with real database
- Cross-lexicon synset queries
- Cross-lexicon sense queries
- Query options and filtering

### 4. Statistics and Monitoring Tests
- Lexicon statistics retrieval from real database
- Overall statistics aggregation
- State tracking accuracy
- Performance monitoring

### 5. Event System Tests
- Event subscription and unsubscription
- Multiple event listeners
- Event emission and handling
- Error event propagation

### 6. Resource Management Tests
- Clean resource disposal
- Memory leak prevention
- Graceful error handling
- Multiple cleanup calls

### 7. Integration Scenario Tests
- Complete workflow validation
- Concurrent operation handling
- State consistency verification
- End-to-end user scenarios

## Browser-Specific Testing

### Web Worker Support
Tests verify actual Web Worker functionality:

- **Worker creation**: Real worker instantiation
- **Message passing**: Actual postMessage/onmessage handling
- **Comlink integration**: Real RPC communication
- **Error handling**: Actual worker error scenarios

### SQLite WASM Integration
Tests verify real database operations:

- **Database creation**: Actual SQLite database files
- **Table creation**: Real schema setup
- **Data insertion**: Actual data loading
- **Query execution**: Real SQL queries

### Browser APIs
Tests verify browser environment compatibility:

- **Fetch API**: Real HTTP requests
- **ArrayBuffer**: Binary data handling
- **Event system**: Real DOM events
- **Memory management**: Actual browser memory usage

## Debugging Tests

### Running Individual Tests

```bash
# Run a specific test by name
npx vitest run test/e2e/orchestrator.e2e.test.ts -t "should initialize successfully"

# Run tests matching a pattern
npx vitest run test/e2e --grep "Initialization"
```

### Verbose Output

```bash
# Enable verbose logging
npx vitest run test/e2e --reporter=verbose

# Show console output
npx vitest run test/e2e --reporter=verbose --stdout
```

### Debug Mode

```bash
# Run tests in debug mode
npx vitest run test/e2e --reporter=verbose --debug

# Run with browser visible (non-headless)
npx vitest run test/e2e --browser.headless=false
```

## Test Configuration

The e2e tests use the `vitest.e2e.config.ts` configuration file, which provides:

- **Browser environment**: Real Chromium browser via Playwright
- **Extended timeouts**: 5 minutes for complex operations
- **Memory allocation**: Adequate memory for large datasets
- **Network proxy**: Configured proxies for external services
- **Setup files**: Browser environment configuration

## Adding New Tests

### Test Structure

Follow the existing pattern for browser e2e tests:

```typescript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup test environment with real dependencies
  });

  afterEach(async () => {
    // Cleanup test resources
  });

  it('should perform expected behavior', async () => {
    // Test implementation using real APIs
    expect(result).toBe(expected);
  });
});
```

### Testing Guidelines

1. **Use real dependencies**: Test actual functionality, not mocks
2. **Test browser APIs**: Verify real browser behavior
3. **Handle network**: Account for real HTTP requests and responses
4. **Test performance**: Measure actual timing and memory usage
5. **Clean up resources**: Ensure proper cleanup of database and worker resources

### Test Naming

Use descriptive test names that explain the expected behavior:

```typescript
it('should initialize successfully with real SQLite WASM', async () => {
  // Test implementation
});

it('should handle real lexicon data loading', async () => {
  // Test implementation
});
```

## Troubleshooting

### Common Issues

1. **Browser not available**: Ensure Playwright is installed and configured
2. **SQLite WASM loading**: Check network access to SQLite WASM files
3. **Worker creation**: Verify Web Worker support in test environment
4. **Network errors**: Check proxy configuration and external service availability

### Debug Commands

```bash
# Check Playwright installation
npx playwright --version

# Install Playwright browsers
npx playwright install chromium

# Run tests with visible browser
pnpm test:e2e:orchestrator --browser.headless=false

# Check vitest configuration
npx vitest --config=vitest.e2e.config.ts --help
```

## Performance Considerations

- **Real browser**: Tests run in actual browser with real performance characteristics
- **Network latency**: Account for real HTTP request times
- **Database operations**: Real SQLite performance, not simulated
- **Memory usage**: Actual browser memory consumption

## Continuous Integration

These e2e tests are designed to run in CI/CD environments:

- **Browser automation**: Playwright supports headless mode for CI
- **Real dependencies**: Tests verify actual functionality, not mocks
- **Network testing**: Real HTTP requests and responses
- **Database testing**: Real SQLite operations

## Next Steps

After running the e2e tests:

1. **Review results**: Check for any test failures or warnings
2. **Fix issues**: Address any problems identified by the tests
3. **Add coverage**: Consider adding tests for uncovered scenarios
4. **Performance**: Monitor actual test execution time and optimize if needed
5. **Integration**: Ensure tests work with the broader test suite
