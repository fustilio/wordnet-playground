# `wn-ts` Testing Strategy and Guidelines

> **📚 Related Documentation:**
> - [Global WordNet Schemas](./GLOBAL_WORDNET_SCHEMAS.md) - Official schema reference
> - [Advanced Use Cases](./ROADMAP.md) - Superpower operations and examples
> - [Development Conventions](../../standards/DEVELOPMENT_CONVENTIONS.md) - Coding standards and patterns
> - [Database Schema Standards](../../standards/DATABASE_SCHEMA_STANDARDS.md) - Database design and optimization

## 1. Overview

This document outlines the testing strategy for the `wn-ts` library. The goal is to ensure code quality, correctness, and stability through a multi-layered testing approach. We use `vitest` as our testing framework.

Tests are organized into two main categories:
- **Core Tests (`wn-ts-core`)**: Focused on database-agnostic algorithms, parsers, and utilities.
- **Platform-Specific Tests (`wn-ts-node`, `wn-ts-web`)**: Focused on database integration and platform-specific features.

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
  pnpm vitest run wn-ts-core/tests/config.test.ts
  ```
- **Run tests in watch mode**:
  ```bash
  pnpm vitest
  ```

## 4. Test Suites

### `wn-ts-core` Test Suite
- **`abstract-database-interfaces.test.ts`**: Tests the abstract database client and query builder interfaces.
- **`config.test.ts`**: Tests `ConfigManager` for handling settings, project definitions, and error handling.
- **`data-management.test.ts`**: Verifies database-agnostic data operations like `download` and `loadLexicalResource`.
- **`db-interface.test.ts`**: Tests the database interface abstractions and placeholder implementations.
- **`download.test.ts`**: Unit tests for the `downloadFile` utility, mocking `fetch`.
- **`module-functions.test.ts`**: Tests high-level API functions in database-agnostic mode.
- **`morphy.test.ts`**: Tests the `Morphy` class for morphological analysis.
- **`parsers.test.ts`**: Verifies the parser registration system.
- **`similarity.test.ts`**: Verifies semantic similarity algorithms (`path`, `wup`, `lch`).
- **`synset-utils.test.ts`**: Tests `Synset` utility functions like `hypernyms`, `shortestPath`, `maxDepth`.
- **`taxonomy.test.ts`**: Tests functions for navigating the WordNet taxonomy (`roots`, `leaves`, `hypernymPaths`).
- **`validate.test.ts`**: Tests data validation logic for `Word`, `Sense`, and `Synset` objects.
- **`wordnet.test.ts`**: Tests the `BaseWordnet` class contracts.

### `wn-ts-node` Test Suite
- **`batch-insert.test.ts`**: Tests the `batchInsert` utility for inserting large amounts of data.
- **`config.test.ts`**: Tests Node.js-specific `ConfigManager`.
- **`data-management.test.ts`**: Verifies data operations like `add`, `remove`, and `exportData`.
- **`module-functions.test.ts`**: Tests high-level API functions against a temporary database.
- **`taxonomy.test.ts`**: Tests taxonomy functions against a real database.
- **`wordnet.test.ts`**: Tests the main `Wordnet` class against an empty database.
- **`e2e/`**: Contains end-to-end tests that download and query real data.

## 5. Setup and Teardown Patterns

### Global Setup (`tests/setup.ts`)
The global setup file ensures that each test runs in an isolated temporary directory, preventing interference between tests.

```typescript
beforeEach(() => {
  // Create isolated temp directory for each test
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  config.dataDirectory = testDataDir;
});

afterEach(async () => {
  // Clean up test directory
  if (testDataDir && existsSync(testDataDir)) {
    rmSync(testDataDir, { recursive: true, force: true });
  }
});
```

### Database Management
For tests requiring a database, each test initializes a fresh database and closes the connection afterward to ensure isolation.

```typescript
beforeEach(async () => {
  await db.initialize(); // Initialize fresh database
});

afterEach(async () => {
  await db.close(); // Always close database connection
});
```

## 6. Common Testing Patterns

### Mocking Strategies
We use `vi.spyOn` to mock modules like the logger or `fetch` to test interactions without actual side effects.

```typescript
it('should call the logger on export', async () => {
  const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  await exportData({ format: 'json' });
  expect(loggerSpy).toHaveBeenCalled();
  loggerSpy.mockRestore();
});
```

### Error Handling
We verify that functions throw the correct custom error types (`ProjectError`, `DatabaseError`) under failure conditions.

```typescript
it('should throw ProjectError for non-existent project', async () => {
  await expect(download('nonexistent-project')).rejects.toThrow(ProjectError);
});
```

### Progress Callbacks
For long-running operations, we test that progress callbacks are invoked correctly.

```typescript
it('should call progress callback during add', async () => {
  const progressCallback = vi.fn();
  await add(xmlPath, { progress: progressCallback, force: true });
  expect(progressCallback).toHaveBeenCalledWith(1.0);
});
```
