# Dictionary Tests

This directory contains test suites for the dictionary generation and query functionality.

## Test Suites

### `dictionary.test.ts`
Tests for dictionary file structure, metadata, and basic functionality.

### `dog-query.test.ts`
Tests specifically for the "dog" query to verify the improved scoring algorithm:
- Verifies that "dog" (the animal) is included in results
- Ensures "dog" (animal) is prioritized over "hot dog" (food)
- Validates synset structure

**Note:** These tests will fail until dictionaries are regenerated with the improved scoring algorithm.

### `dictionary-generation.test.ts`
Performance tests for dictionary generation:
- Verifies generation completes within reasonable time bounds
- Ensures progress indicators are shown during generation
- Validates output structure

**Note:** These tests are slow (5-15 minutes) and generate test dictionaries. They're excluded from regular test runs by default.

## Running Tests

### Run all tests (excluding slow tests)
```bash
pnpm test
```

This runs:
- ✅ Dictionary structure tests (fast)
- ⏭️ Dog query tests (skipped by default - requires regenerated dictionaries)
- ⏭️ Generation performance tests (skipped by default - slow, 5-15 minutes)

### Run dog query tests (requires regenerated dictionaries)
```bash
# First regenerate dictionaries with new algorithm
pnpm generate-dict:force

# Then run tests (remove .skip from tests first)
pnpm test tests/dog-query.test.ts
```

### Run performance tests (slow - 5-15 minutes)
```bash
# Remove .skip from the describe block in dictionary-generation.test.ts first
pnpm test tests/dictionary-generation.test.ts
```

### Run tests in watch mode
```bash
pnpm test:watch
```

## Expected Test Results

### Before Regeneration (Old Algorithm)
- ❌ `dog-query.test.ts` - Will fail (missing "dog" animal synset)
- ✅ `dictionary.test.ts` - Should pass
- ⏱️ `dictionary-generation.test.ts` - Will test generation performance

### After Regeneration (New Algorithm)
- ✅ `dog-query.test.ts` - Should pass (includes "dog" animal synset)
- ✅ `dictionary.test.ts` - Should pass
- ⏱️ `dictionary-generation.test.ts` - Should pass within time bounds

## Performance Expectations

- **Small dictionary (500 synsets)**: < 10 minutes
- **English-Thai dictionary (1000 synsets)**: < 15 minutes
- **Progress indicators**: Should appear every few seconds during generation

## Troubleshooting

### Tests fail with "dictionary not found"
Run dictionary generation first:
```bash
pnpm generate-dict:force
```

### Performance tests timeout
The new scoring algorithm processes many synsets to build frequency data. This is expected but takes time. If tests consistently timeout:
1. Check system resources (CPU, memory)
2. Verify WordNet database is properly initialized
3. Consider increasing timeout in `vitest.config.ts`

### No progress indicators
If generation appears hung, check:
1. Console output for `[Generator]` messages
2. System resources (CPU usage should be > 0%)
3. Database connection status
