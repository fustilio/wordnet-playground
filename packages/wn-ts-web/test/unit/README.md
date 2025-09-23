# Unit Tests

This folder contains unit tests that test individual components in isolation within the wn-ts-web package.

## Test Categories

### Core Component Tests
- **project.test.ts** - Tests the Project class for parsing project IDs, versions, and metadata
- **definition-parsing.test.ts** - Tests LMF parser's definition parsing functionality with various XML structures
- **optimization-verification.test.ts** - Verifies that optimized query strategies are available in the query service

### Database Component Tests
- **database-introspection.test.ts** - Tests database introspection methods for understanding data structure and cross-lingual mapping
- **kysely-integration-comprehensive.test.ts** - Tests Kysely query service integration with mocked SQLite WASM
- **opfs-persistence.test.ts** - Tests OPFS persistence functionality with mocked SQLite modules

### Data Processing Tests
- **ili-data-loading.test.ts** - Tests ILI data loading pipeline with mocked database services
- **lmf-parser-comprehensive.test.ts** - Tests LMF parser with real test data files (no database)

### Kernel and Hook Tests
- **wordnet-kernel-lexicon-aware.test.ts** - Tests WebWordNetKernel with mocked database
- **useWordNetKernel-lexicon-aware.test.tsx** - Tests the React hook for lexicon-aware WordNet functionality

## Test Characteristics

These tests typically:
- Test **individual components** in isolation
- Use **extensive mocking** to avoid external dependencies
- Don't require **real database setup**
- Focus on **specific functionality** or edge cases
- Run **quickly and independently**
- May use **real test data files** but with mocked database operations

## Running Unit Tests

To run these tests specifically:

```bash
# Run all unit tests
pnpm test unit/

# Run a specific unit test
pnpm test unit/project.test.ts
```

## Mock Strategy

Unit tests use mocks for:
- **SQLite WASM modules** (comprehensive mocking)
- **Database connections** and query execution
- **External API calls** and network requests
- **File system operations** (except for test data files)
- **React components and hooks**
- **WebWordnet initialization** and database setup

## Note

Some tests (like `lmf-parser-comprehensive.test.ts` and `ili-data-loading.test.ts`) were moved from the integration folder because they test individual components with mocked dependencies rather than true integration between multiple components with real databases.
