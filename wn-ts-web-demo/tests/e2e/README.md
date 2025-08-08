# Vitest E2E Tests

This directory contains browser-based end-to-end tests using Vitest and `vitest-browser-react` for the WordNet TypeScript Demo application.

## Test Files

### Core Application Tests
- `BasicAppLoad.test.tsx` - Basic application loading and UI element verification
- `RealDataE2E.test.tsx` - Comprehensive E2E testing with real WordNet data
- `RealDataTest.test.tsx` - Real data loading and validation tests

### Feature-Specific Tests
- `SearchFunctionalityTest.test.tsx` - Search functionality and query processing
- `StatisticsCheck.test.tsx` - Database statistics and data validation

## Test Categories

### Application Loading Tests
- Verify the application loads correctly
- Check that all UI elements are present
- Validate system status and initialization

### Data Loading Tests
- Test real WordNet data loading
- Validate database statistics
- Check OPFS storage functionality
- Verify package loading and management

### Search Functionality Tests
- Test word lookup functionality
- Validate search results
- Check query processing

### Statistics and Validation Tests
- Verify database statistics accuracy
- Check data integrity
- Validate system state

## Running Tests

### Run all E2E tests
```bash
pnpm test:e2e
```

### Run specific test
```bash
pnpm test:quick  # Runs BasicAppLoad.test.tsx
pnpm test:real-data  # Runs RealDataE2E.test.tsx
pnpm test:focus  # Runs specific test with focus
```

### Run with browser
```bash
pnpm test:browser
```

## Test Configuration

Tests use `vitest-browser-react` for browser-based testing, which provides:
- Real browser environment
- React component rendering
- DOM interaction capabilities
- Screenshot capture on failure

## Notes

- Tests run in a real browser environment for accurate E2E testing
- Long timeouts are used for data loading operations
- Tests include detailed logging for debugging
- Screenshots are captured on test failures in `__screenshots__/`
