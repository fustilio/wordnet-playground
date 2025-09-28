# End-to-End Tests

This directory contains end-to-end tests for the `wn-ts-core` package. E2E tests verify the complete functionality of the system with real data and external dependencies.

## Test Files

- `plugins/relations/` - Relations plugin end-to-end tests
  - `real-data.test.ts` - Real WordNet data tests (currently skipped)

E2E tests are also implemented in the platform-specific packages (`wn-ts-node` and `wn-ts-web`) where they can test against real databases and data.

## Future E2E Tests

When E2E tests are added to the core package, they should:

- Test complete workflows with real data
- Validate performance with large datasets
- Test error handling and edge cases
- Verify cross-platform compatibility

## Running E2E Tests

```bash
# Run all E2E tests
pnpm test tests/e2e

# Run specific E2E test
pnpm test tests/e2e/specific-test.e2e.test.ts
```

## Test Characteristics

- **Real Data**: Uses actual WordNet data and databases
- **Complete Workflows**: Tests entire user journeys
- **Performance**: Validates performance with real-world data sizes
- **External Dependencies**: May require database setup and data loading
