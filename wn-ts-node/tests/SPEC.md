# `wn-ts` Testing Strategy and Guidelines

## 1. Overview

This document outlines the testing strategy for the `wn-ts` library. The goal is to ensure code quality, correctness, and stability through a multi-layered testing approach. We use `vitest` as our testing framework.

All tests are located in the `tests/` directory and are organized into two main categories:
- **Functional/Unit Tests**: Focused on individual modules and functions.
- **End-to-End (E2E) Tests**: Focused on testing the entire application flow with real data.

## 2. Test Philosophy and Strategy

Our testing strategy is designed to provide confidence in the library's correctness while maintaining a fast and efficient development cycle. We follow a layered approach:

- **Unit Tests**: These are the foundation. They test the smallest units of code (e.g., a single function or utility) in complete isolation. They should be fast, have no external dependencies (like network or filesystem), and use mocks extensively. Example: `download.test.ts` mocking `fetch`.

- **Functional/Integration Tests**: These tests verify that individual modules work correctly and integrate with their immediate dependencies (like the database). They often use a controlled, small dataset (`mini-lmf-1.0.xml`) to ensure predictable results. They bridge the gap between unit tests and E2E tests. Example: `module-functions.test.ts`.

- **End-to-End (E2E) Tests**: These are the highest-level tests. They simulate a full user workflow, from downloading data to performing complex queries. They use real data sources and involve network and filesystem I/O, making them slower but essential for validating the system as a whole. Example: `basic.e2e.test.ts`.

By balancing these layers, we aim for:
- **High Coverage**: Ensuring critical paths are tested.
- **Fast Feedback**: Developers get quick results from unit and functional tests during development.
- **Reliability**: E2E tests catch integration issues before releases.

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
  - `e2e/`: Contains end-to-end tests.
  - `setup.ts`: Global setup file for tests (e.g., creating temp directories).
  - `SPEC.md`: This document.
  - `*.test.ts`: Unit and integration test files for different modules.

## 5. Functional / Unit Tests

These tests verify the functionality of individual components in isolation. They use mock data and mock objects to ensure that tests are fast and reliable.

### Existing Functional Tests:

- **`config.test.ts`**: Tests `ConfigManager` for handling settings, project definitions, default directories, derived paths (database, downloads), and error handling.
- **`data-management.test.ts`**: Verifies data operations like `add`, `remove`, `download`, and `exportData`. It tests database interactions, the `force` option, and progress callbacks.
- **`download.test.ts`**: Unit tests for the `downloadFile` utility, mocking `fetch` to test success, network errors (e.g., 404), timeouts, and edge cases.
- **`lmf-parser.test.ts`**: Tests the `loadLMF` streaming parser by parsing a sample XML file and verifying the output structure.
- **`module-functions.test.ts`**: Tests high-level API functions (`words`, `senses`, `synsets`) against a temporary database populated from a small, standard test file (`mini-lmf-1.0.xml`).
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

## 6. End-to-End (E2E) Tests

E2E tests simulate real-world usage of the library. They are designed to catch issues that may arise from the interaction between different components. These tests are located in the `tests/e2e/` directory.

### Existing E2E Tests:

- **`basic.e2e.test.ts`**: A comprehensive test suite that:
  - Downloads real WordNet data (CILI and OEWN).
  - Adds the data to a database.
  - Queries for words and synsets.
  - Verifies data integrity and consistency.
  - Tests concurrent queries and error handling.

- **`multilingual.e2e.test.ts`**: Focuses on multilingual capabilities:
  - Downloads multiple language WordNets (e.g., English, French, Spanish).
  - Tests language-specific and cross-lingual queries.
  - Verifies Interlingual Index (ILI) functionality.
  - Tests multilingual error handling and performance.

### Strategy for E2E Tests:

- **Real Data**: E2E tests should use real, downloadable project data to ensure compatibility.
- **Long-running**: These tests are expected to be long-running due to network and file I/O. They are often run in separate CI/CD pipeline stages.
- **Comprehensive**: They should cover common user workflows from start to finish (download -> add -> query).
- **Cleanup**: E2E tests must clean up after themselves, removing downloaded files and temporary databases. The `beforeAll` and `afterAll` hooks are used for this.

## 7. Guidelines for Writing New Tests

When adding new features or fixing bugs, please include corresponding tests.

- **Choose the Right Type**:
  - For new utility functions or isolated logic, add a **unit test**.
  - For changes to a module's public API, update its **functional test** file.
  - For features that span multiple modules or involve real data interaction, consider adding or extending an **E2E test**.

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

## 8. Comparison with wn-cli Test Strategies

For a detailed comparison with CLI testing, see [wn-cli/tests/SPEC.md](../../wn-cli/tests/SPEC.md).

### Key Similarities
- Both wn-ts and wn-cli use temp directories and per-test/per-suite isolation for all tests.
- Both set config.dataDirectory to a temp dir for each test.
- Both use real data for E2E tests and mock data for unit/integration tests.

### Key Differences
- wn-ts tests run in a single process, so in-memory config changes are always respected.
- wn-cli tests (especially E2E) may spawn subprocesses or simulate CLI invocations, so config must be written to disk and read by the CLI process.
- If the CLI process does not read the correct config or data directory, it will not see the test data, leading to failures like "No lexicons are installed."

### Root Cause of CLI/Library Test Divergence
- Library tests pass because all state is in-memory and controlled.
- CLI tests can fail if the CLI process does not use the same temp data directory as the test runner, due to process isolation.

See the wn-cli SPEC.md for more details and recommendations.
