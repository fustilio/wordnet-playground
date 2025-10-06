# wn-ts-node Tests

This directory contains all tests for the `wn-ts-node` package, organized into three categories:

## Test Organization

### 📁 `unit/`
Fast, isolated tests that verify individual components without external dependencies.
- Configuration tests
- Module function tests
- Data validation tests
- Lemmatizer/normalizer tests
- Core WordNet functionality tests

### 📁 `integration/`
Tests that verify component interactions and data processing workflows.
- Data loading integration tests
- LMF (Lexical Markup Framework) processing tests
- Platform integration tests
- Cross-component interaction tests

### 📁 `e2e/`
End-to-end tests with real data and complete workflows.
- Query performance tests
- Database operations tests
- Lexicon management tests
- Benchmark tests

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test categories
pnpm test tests/unit
pnpm test tests/integration
pnpm test tests/e2e

# Run specific test file
pnpm test tests/unit/wordnet.test.ts

# Run benchmarks
pnpm test tests/e2e/query/basic-queries.bench.ts
```

## Test Strategy

- **Unit Tests**: Fast, isolated, mocked dependencies
- **Integration Tests**: Component interaction, data processing workflows
- **E2E Tests**: Real data, complete workflows, performance testing

## Dependencies

- **Vitest**: Test runner and assertion library
- **Real SQLite Database**: For E2E tests
- **LMF Data**: For integration tests
- **Performance Tools**: For benchmarking
