# wn-ts-core Tests

This directory contains all tests for the `wn-ts-core` package, organized into three categories:

## Test Organization

### 📁 `unit/`
Fast, isolated tests that verify individual components without external dependencies.
- Basic functionality tests
- Interface compliance tests
- Utility function tests
- Plugin system tests

### 📁 `integration/`
Tests that verify component interactions and cross-platform compatibility.
- Platform integration tests
- Cross-platform behavioral tests
- Test framework validation

### 📁 `e2e/`
End-to-end tests with real data (currently empty - E2E tests are in platform packages).

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test categories
pnpm test tests/unit
pnpm test tests/integration
pnpm test tests/e2e

# Run specific test file
pnpm test tests/unit/wordnet-core.test.ts
```

## Test Strategy

- **Unit Tests**: Fast, isolated, mocked dependencies
- **Integration Tests**: Component interaction, cross-platform validation
- **E2E Tests**: Real data, complete workflows (in platform packages)

## Dependencies

- **Vitest**: Test runner and assertion library
- **Mock Implementations**: For isolated unit testing
- **Cross-Platform Framework**: For integration testing
