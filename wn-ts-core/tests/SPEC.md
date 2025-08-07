# `wn-ts-core` Testing Strategy and Guidelines

## 1. Overview

This document outlines the testing strategy for the `wn-ts-core` library. The goal is to ensure code quality, correctness, and stability through a multi-layered testing approach. We use `vitest` as our testing framework.

All tests are located in the `tests/` directory and focus on **core functionality only** - database-agnostic algorithms, parsers, and utilities. Database-specific and E2E tests are located in `wn-ts-node`.

## 2. Test Philosophy and Strategy

Our testing strategy is designed to provide confidence in the library's correctness while maintaining a fast and efficient development cycle. We follow a layered approach:

- **Unit Tests**: These are the foundation. They test the smallest units of code (e.g., a single function or utility) in complete isolation. They should be fast, have no external dependencies (like network or filesystem), and use mocks extensively. Example: `download.test.ts` mocking `fetch`.

- **Functional/Integration Tests**: These tests verify that individual modules work correctly and integrate with their immediate dependencies. They often use a controlled, small dataset (`mini-lmf-1.0.xml`) to ensure predictable results. Example: `module-functions.test.ts`.

By balancing these layers, we aim for:
- **High Coverage**: Ensuring critical paths are tested.
- **Fast Feedback**: Developers get quick results from unit and functional tests during development.
- **Reliability**: Tests catch issues before releases.

## 3. How to Run Tests

You can run the entire test suite or target specific files.

- **Run all tests**:
  ```bash
  pnpm autotest
  ```
- **Run a specific test file**:
  ```bash
  pnpm vitest run tests/config.test.ts
  ```
- **Run tests in watch mode**:
  ```bash
  pnpm vitest
  ```

## 4. Directory Structure

- `tests/`: Root directory for all tests.
  - `setup.ts`: Global setup file for tests (e.g., creating temp directories).
  - `SPEC.md`: This document.
  - `*.test.ts`: Unit and integration test files for different modules.

## 5. Functional / Unit Tests

These tests verify the functionality of individual components in isolation. They use mock data and mock objects to ensure that tests are fast and reliable.

### Existing Functional Tests:

- **`abstract-database-interfaces.test.ts`**: Tests the abstract database client and query builder interfaces.
- **`config.test.ts`**: Tests `ConfigManager` for handling settings, project definitions, default directories, derived paths (downloads), and error handling.
- **`data-management.test.ts`**: Verifies database-agnostic data operations like `download` and `loadLexicalResource`. It tests the `force` option and progress callbacks.
- **`db-interface.test.ts`**: Tests the database interface abstractions and placeholder implementations.
- **`download.test.ts`**: Unit tests for the `downloadFile` utility, mocking `fetch` to test success, network errors (e.g., 404), timeouts, and edge cases.
- **`module-functions.test.ts`**: Tests high-level API functions (`words`, `senses`, `synsets`) in database-agnostic mode, returning empty arrays when no database is available.
- **`morphy.test.ts`**: Tests the `Morphy` class for morphological analysis, covering both standalone rule-based analysis and validation against a `Wordnet` instance.
- **`parsers.test.ts`**: Verifies the parser registration system, ensuring all LMF parsers can be retrieved and can successfully parse a sample file.
- **`similarity.test.ts`**: Verifies semantic similarity algorithms (`path`, `wup`, `lch`) using mock `Synset` data to test path-based and information-content-based metrics.
- **`synset-utils.test.ts`**: Tests `Synset` utility functions like `hypernyms`, `shortestPath`, `maxDepth`, and `lowestCommonHypernyms` using a mock graph.
- **`taxonomy.test.ts`**: Tests functions for navigating the WordNet taxonomy (`roots`, `leaves`, `hypernymPaths`) using mock data to simulate the synset graph.
- **`validate.test.ts`**: Tests data validation logic for `Word`, `Sense`, and `Synset` objects, ensuring `WnError` is thrown for invalid or incomplete structures.
- **`wordnet.test.ts`**: Tests the main `Wordnet` class, its constructor options, and its method behaviors against an empty database to check for graceful failures.

### Strategy for Functional Tests:

- **Isolation**: Each test file should focus on a single module.
- **Mocking**: Use `vi.mock` to mock dependencies like `fetch` or the database to avoid external service reliance.
- **Test Data**: Use small, focused test data. The `wn-test-data` directory is used for this purpose, and `tests/setup.ts` handles creating temporary data directories for each test run.
- **Database Agnostic**: All tests should work without a real database. Use placeholder implementations and mock data.

## 6. Core vs Node Test Separation

### Core Tests (this package):
- **Algorithm tests**: similarity, taxonomy, morphy, synset-utils
- **Parser tests**: lmf-parser, parsers
- **Configuration tests**: config (core ConfigManager)
- **Utility tests**: download, validate
- **Database interface tests**: db-interface
- **Module function tests**: module-functions (database-agnostic versions)
- **Data management tests**: data-management (database-agnostic operations)

### Node Tests (wn-ts-node package):
- **Database-specific tests**: Real database operations, SQL queries
- **Node-specific configuration**: NodeConfigManager with database paths
- **E2E tests**: Full workflows with real data
- **Integration tests**: Database + parser + algorithm integration
- **Node-specific data management**: add, remove, exportData operations

## 7. Guidelines for Writing New Tests

When adding new features or fixing bugs, please include corresponding tests.

- **Choose the Right Type**:
  - For new utility functions or isolated logic, add a **unit test**.
  - For changes to a module's public API, update its **functional test** file.
  - For database-specific features, add tests to `wn-ts-node`.

- **Follow Existing Conventions**:
  - Use `describe`, `it`, `expect` from `vitest`.
  - Structure tests with `describe` blocks for different features or scenarios.
  - The global `tests/setup.ts` file provides `beforeEach` and `afterEach` hooks that create and clean up a temporary data directory for each test. This ensures test isolation.

- **Be Asynchronous**: Most library functions are `async`. Ensure your tests use `async/await` correctly and handle promises properly.

- **Data and Mocks**:
  - When testing functions that interact with the database, use the pre-configured test setup. For data-heavy operations, use the `mini-lmf-1.0.xml` file from `wn-test-data` as a small, consistent data source.
  - For network operations (e.g., `download`), mock the `fetch` API using `vi.mock` to avoid actual network calls, making tests faster and more reliable.

- **Test Edge Cases**: Be thorough. Consider testing:
  - Empty inputs (empty strings, empty arrays).
  - Invalid inputs (e.g., incorrect IDs, wrong data types, `null`, `undefined`).
  - Error conditions (network failures, file not found, database errors).
  - Race conditions or concurrent operations where applicable.

## 8. Comparison with wn-ts-node Test Strategies

For a detailed comparison with node testing, see [wn-ts-node/tests/SPEC.md](../../wn-ts-node/tests/SPEC.md).

### Key Differences
- **Core tests** are database-agnostic and focus on algorithms and utilities
- **Node tests** are database-specific and include E2E testing
- **Core tests** use mocks extensively to avoid external dependencies
- **Node tests** use real database operations and network calls
- **Core tests** are fast and isolated
- **Node tests** are slower but more comprehensive

### Test Organization
- **Core**: Algorithm correctness, parser functionality, utility operations
- **Node**: Database integration, real-world workflows, performance testing
