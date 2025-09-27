# End-to-End Tests

This directory contains end-to-end tests for the `wn-ts-node` package. E2E tests verify the complete functionality of the system with real data and external dependencies.

## Test Files

- `initialization/` - Initialization and setup tests
  - `lexicon-management.e2e.test.ts` - Lexicon management E2E tests
- `query/` - Query performance and functionality tests
  - `basic-queries.bench.ts` - Basic query benchmarks
  - `basic-queries.e2e.test.ts` - Basic query E2E tests
  - `comprehensive-queries.bench.ts` - Comprehensive query benchmarks
  - `comprehensive-queries.e2e.test.ts` - Comprehensive query E2E tests
  - `definitions.e2e.test.ts` - Definition query E2E tests
  - `thesaurus.e2e.test.ts` - Thesaurus functionality E2E tests
  - `translations.e2e.test.ts` - Translation E2E tests
  - `README.md` - Query tests documentation
- `shared/` - Shared test utilities
  - `test-setup.ts` - E2E test setup configuration
- `quarantine.e2e.test.ts` - Quarantined tests that may fail
- `README.md` - E2E tests documentation

## Running E2E Tests

```bash
# Run all E2E tests
pnpm test tests/e2e

# Run specific E2E test category
pnpm test tests/e2e/query

# Run benchmarks
pnpm test tests/e2e/query/basic-queries.bench.ts
```

## Test Characteristics

- **Real Data**: Uses actual WordNet data and databases
- **Complete Workflows**: Tests entire user journeys
- **Performance**: Validates performance with real-world data sizes
- **Database Operations**: Tests against real SQLite databases
- **Benchmarks**: Includes performance benchmarking tests