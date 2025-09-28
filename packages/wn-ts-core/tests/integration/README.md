# Integration Tests

This directory contains integration tests for the `wn-ts-core` package. Integration tests verify that different components work together correctly.

## Test Files

- `platform-integration/` - Cross-platform integration tests
  - `core-behavioral-tests.ts` - Core behavioral tests that all platforms must pass
  - `framework.test.ts` - Test framework utilities tests
  - `platform-test-framework.ts` - Cross-platform test framework implementation
  - `README.md` - Platform integration documentation
- `plugins/relations/` - Relations plugin integration tests
  - `enhanced-relations.test.ts` - Enhanced relations plugin integration tests
  - `chain-traversal.test.ts` - Chain traversal functionality tests
  - `comprehensive-relation-chain.test.ts` - Comprehensive relation chain tests

## Running Integration Tests

```bash
# Run all integration tests
pnpm test tests/integration

# Run platform integration tests
pnpm test tests/integration/platform-integration
```

## Test Characteristics

- **Component Interaction**: Tests how different parts of the system work together
- **Cross-Platform**: Validates behavior consistency across different platforms
- **Framework Tests**: Tests the testing framework itself
- **Behavioral Validation**: Ensures core behaviors are consistent across implementations
