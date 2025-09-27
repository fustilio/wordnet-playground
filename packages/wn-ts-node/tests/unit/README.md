# Unit Tests

This directory contains unit tests for the `wn-ts-node` package. Unit tests are fast, isolated tests that verify individual components and functions without external dependencies.

## Test Files

- `config.test.ts` - Configuration tests
- `module-functions.test.ts` - Module function tests
- `validation.test.ts` - Data validation tests
- `lemmatizer-normalizer.test.ts` - Lemmatizer and normalizer tests
- `enhanced-wordnet.test.ts` - Enhanced WordNet functionality tests
- `kysely-wordnet.test.ts` - Kysely database integration tests
- `wordnet.test.ts` - Core WordNet tests
- `batch-insert.test.ts` - Batch insertion tests
- `data-management.test.ts` - Data management tests
- `setup.ts` - Test setup configuration
- `test-data/` - Test data files
- `utils/` - Test utility functions

## Running Unit Tests

```bash
# Run all unit tests
pnpm test tests/unit

# Run specific test file
pnpm test tests/unit/wordnet.test.ts
```

## Test Characteristics

- **Fast**: No external dependencies or I/O operations
- **Isolated**: Each test is independent and can run in parallel
- **Mocked**: Uses mock implementations of external dependencies
- **Focused**: Tests individual functions, methods, or small components
