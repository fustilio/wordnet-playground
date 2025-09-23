# Integration Tests

This folder contains integration tests that verify how multiple components work together in the wn-ts-web package using **real databases and real data**.

## Test Categories

### Database Integration
- **database-statistics.integration.test.ts** - Tests real database statistics calculation with actual data loading and querying
- **query-operations.integration.test.ts** - Tests comprehensive query operations against a real database with real WordNet data

### Data Loading Integration
- **data-loader-packages.integration.test.ts** - Tests the complete data loading pipeline from package download to database insertion using real packages

### Browser-Specific Tests
- **opfs-manager.test.ts** - Tests the Origin Private File System (OPFS) manager for persistent data storage
- **sqlite-wasm-browser.test.ts** - Verifies the integration with `@sqlite.org/sqlite-wasm` in a browser context

## Test Characteristics

These tests:
- Use **real SQLite WASM databases** (not mocked)
- Load **real WordNet data** from actual packages
- Test **end-to-end functionality** across multiple components
- Require **browser environment** (skipped in Node.js)
- Verify **actual database operations** and data integrity
- Test **real performance** characteristics

## Running Integration Tests

To run these tests specifically:

```bash
# Run all integration tests
pnpm test integration/

# Run a specific integration test
pnpm test integration/database-statistics.integration.test.ts

# Run browser tests with Playwright
pnpm vitest run --browser

# Interactive development with browser tests
pnpm vitest watch --browser
```

## Dependencies

Integration tests require:
- **Real SQLite WASM module** (not mocked)
- **Actual WordNet data packages** (downloaded from URLs)
- **Browser environment** (OPFS support for persistence)
- **Real file system operations** (for data loading and storage)

## Note

These tests are moved from `browser/e2e/` because they represent true integration testing with real databases, not just end-to-end browser testing. They test the integration between components using real data and real database operations.
