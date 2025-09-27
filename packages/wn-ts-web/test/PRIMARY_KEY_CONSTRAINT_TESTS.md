# PRIMARY KEY Constraint and Package ID Duplication Tests

This directory contains comprehensive tests that target the specific issues identified during the debugging session:

## Issues Targeted

### 1. PRIMARY KEY Constraint Error
- **Problem**: Database insertion failing with `SQLITE_CONSTRAINT_PRIMARYKEY` error
- **Root Cause**: Conflicting lexicon entries not being properly cleared before reinsertion
- **Solution**: Enhanced conflict resolution with comprehensive deletion logic

### 2. Package ID Duplication Bug
- **Problem**: Frontend creating malformed package IDs like `"oewn:2024:2024"`
- **Root Cause**: Version being appended twice in package ID construction
- **Solution**: Improved sanitization and deduplication logic

### 3. Database Conflict Resolution
- **Problem**: Orchestrator not properly clearing existing data before loading new data
- **Root Cause**: Insufficient conflict detection and deletion logic
- **Solution**: Comprehensive deletion with pattern matching and case-insensitive cleanup

## Test Files

### Integration Tests
- **`test/integration/primary-key-constraint-fix.integration.test.ts`**
  - Tests the complete data loading workflow with conflict resolution
  - Simulates the exact scenario that was failing in production
  - Validates that PRIMARY KEY constraints are handled correctly
  - Tests batch insert optimization and timeout handling

### End-to-End Tests
- **`test/e2e/package-id-duplication.e2e.test.ts`**
  - Tests package ID handling in the orchestrator
  - Validates that lexicon statistics maintain correct IDs
  - Tests concurrent operations and state consistency
  - Ensures no malformed package IDs are created

### Unit Tests
- **`test/unit/useWordNet-package-id-duplication.test.tsx`**
  - Tests the React hook's state management
  - Validates package ID sanitization and deduplication
  - Tests multiple renders and state updates
  - Ensures frontend state consistency

## Running the Tests

### Run All Tests
```bash
# From the wn-ts-web directory - runs all three test suites
pnpm test:primary-key
```

### Run Individual Test Suites
```bash
# Integration test (PRIMARY KEY constraint resolution)
pnpm test:primary-key:integration

# E2E test (package ID duplication prevention)
pnpm test:primary-key:e2e

# Unit test (React hook state management)
pnpm test:primary-key:unit
```

### Run Individual Tests (Advanced)
```bash
# Integration test with specific config
pnpm vitest --config vitest.integration.config.ts run test/integration/primary-key-constraint-fix.integration.test.ts

# E2E test with specific config
pnpm vitest --config vitest.e2e.config.ts run test/e2e/package-id-duplication.e2e.test.ts

# Unit test
pnpm vitest run test/unit/useWordNet-package-id-duplication.test.tsx
```

## Test Scenarios

### PRIMARY KEY Constraint Tests
1. **Basic Conflict Resolution**: Load lexicon, then reload the same lexicon
2. **Case Variations**: Test deletion of lexicons with different cases
3. **Batch Insert Optimization**: Verify timeouts are handled correctly
4. **Data Integrity**: Ensure data remains consistent after conflict resolution

### Package ID Duplication Tests
1. **Sanitization**: Test `sanitizeLexiconId` with various inputs
2. **State Management**: Test frontend state updates don't create duplicates
3. **Concurrent Operations**: Test multiple simultaneous status requests
4. **Consistency**: Verify package IDs remain consistent across operations

### Database Conflict Resolution Tests
1. **Comprehensive Deletion**: Test deletion of conflicting lexicons
2. **Pattern Matching**: Test case-insensitive and whitespace-tolerant deletion
3. **Foreign Key Handling**: Test proper deletion order respecting constraints
4. **Verification**: Test that deletion actually removes conflicting data

## Expected Outcomes

### ✅ Success Criteria
- All tests pass without PRIMARY KEY constraint errors
- No malformed package IDs like `"oewn:2024:2024"` are created
- Database conflict resolution works correctly
- Frontend state management maintains consistent package IDs
- Batch inserts complete within reasonable time limits

### ❌ Failure Indicators
- PRIMARY KEY constraint errors during lexicon insertion
- Malformed package IDs in frontend state
- Database conflicts not being resolved
- Timeout errors during batch inserts
- Inconsistent package IDs across operations

## Debugging Information

### Logs to Watch For
- `📍 Verification: 0 lexicons remain with IDs:` - Confirms successful deletion
- `📍 Pattern check: 0 lexicons match pattern %oewn%:` - Confirms pattern matching works
- `Invalid package ID format: "oewn:2024:2024"` - Indicates duplication bug
- `Batch insert timeout after 120 seconds` - Indicates performance issues

### Common Issues
1. **SQLite WASM not available**: Tests will skip in Node.js environment
2. **Network timeouts**: May affect e2e tests that download real data
3. **Browser compatibility**: Some tests require modern browser features

## Maintenance

### Adding New Tests
1. Follow the existing test patterns
2. Use descriptive test names that explain the scenario
3. Include both positive and negative test cases
4. Add appropriate error handling and cleanup

### Updating Tests
1. Update tests when the underlying logic changes
2. Ensure tests still cover the original issues
3. Add new test cases for any new edge cases discovered
4. Keep test data realistic and representative

## Related Files

### Core Implementation
- `src/data-loader.ts` - Enhanced conflict resolution logic
- `src/workers/wordnet-orchestrator.ts` - Orchestrator conflict detection
- `src/react/hooks/useWordNet.ts` - Frontend state management
- `src/utils/package-id.ts` - Package ID utilities

### Test Infrastructure
- `test/setup.ts` - Test environment setup
- `test/integration/setup.ts` - Integration test setup
- `test/e2e/setup.ts` - E2E test setup
- `vitest.config.ts` - Test configuration
