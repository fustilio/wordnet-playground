# Unit Tests

This directory contains unit tests for the `wn-ts-core` package. Unit tests are fast, isolated tests that verify individual components and functions without external dependencies.

## Test Files

- `basic-functionality.test.ts` - Basic WordNet functionality tests
- `wordnet-core.test.ts` - WordNetCore interface tests
- `wordnet-kernel.test.ts` - WordNetKernel tests
- `utility-functions.test.ts` - Utility function tests
- `translation-utils.test.ts` - Translation utility tests
- `similarity-lexicon-fix.test.ts` - Similarity methods lexicon context tests
- `relations-lexicon-aware.test.ts` - Relations plugin lexicon awareness tests
- `plugins.test.ts` - Plugin system tests
- `lifecycle-tests.test.ts` - Plugin lifecycle management tests
- `plugins/relations/` - Relations plugin unit tests
  - `plugin-methods.test.ts` - Plugin methods unit tests
  - `visual-feedback.test.ts` - Visual feedback utility tests
  - `improved-search.test.ts` - Search utility tests
- `setup.ts` - Test setup configuration

## Running Unit Tests

```bash
# Run all unit tests
pnpm test tests/unit

# Run specific test file
pnpm test tests/unit/wordnet-core.test.ts
```

## Test Characteristics

- **Fast**: No external dependencies or I/O operations
- **Isolated**: Each test is independent and can run in parallel
- **Mocked**: Uses mock implementations of external dependencies
- **Focused**: Tests individual functions, methods, or small components
