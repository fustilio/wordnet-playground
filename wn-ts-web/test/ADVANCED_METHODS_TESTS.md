# Advanced WordNet Methods Tests

This directory contains comprehensive tests for the newly implemented advanced WordNet methods.

## 🧪 Test Files

### 1. `web-wordnet-advanced-methods.test.ts`
Tests for the core WebWordnet class advanced methods:

**Translation Methods:**
- `getTranslations()` - Cross-lingual translation via ILI mappings
- Tests ILI-based translation between English and French
- Verifies proper handling of synsets without ILI mappings

**Relationship Methods:**
- `getRelatedSynsets()` - Find related synsets via relations table
- `getRelatedSenses()` - Find related senses via relations table
- Tests both general and relation-type-specific queries

**Hierarchy Methods:**
- `getSynsetDepth()` - Calculate depth in WordNet hierarchy
- `getShortestPath()` - Find shortest path between synsets using BFS
- `getPathSimilarity()` - Calculate path-based similarity

**Error Handling:**
- Tests for uninitialized WordNet instances
- Database error handling
- Edge cases (empty database, circular relations)

### 2. `worker-client-advanced-methods.test.ts`
Tests for the WordNetWorkerClient advanced methods:

**Core Translation Methods:**
- `getWordsBySynsetAndLanguage()` - Get words by synset and language
- `getDefinitionsBySynsetId()` - Get definitions with proper type transformation
- `getSynsetById()` - Get synset with SynsetQueryResult transformation

**Type Safety:**
- Verifies proper TypeScript type transformations
- Tests DefinitionInfo structure with synsetId
- Tests SynsetQueryResult structure with words, definitions, relations

**Error Handling:**
- Worker not available scenarios
- Worker error responses
- Performance testing

### 3. `cross-lingual-advanced-methods.test.ts`
Integration tests for cross-lingual functionality:

**Cross-lingual Translation:**
- English → French translation via ILI mappings
- French → English translation via ILI mappings
- Handling of words without ILI mappings

**Cross-lingual Definitions:**
- Definitions in different languages
- Synset information structure validation

**Cross-lingual Word Lookup:**
- Words by synset and language
- Non-existent language handling

**Performance & Consistency:**
- Cross-lingual query performance
- Data consistency across languages

### 4. `lmf-parser-language-fix.test.ts`
Tests for the LMF parser language filter fixes:

**Multi-language Parsing:**
- French words and synsets parsing
- Mixed English and French content
- ILI mapping preservation across languages

**Regression Tests:**
- English-only parsing still works
- Backward compatibility maintained

## 🚀 Running the Tests

### Run All Advanced Methods Tests
```bash
cd wn-ts-web
node test/run-advanced-methods-tests.js
```

### Run Individual Test Files
```bash
# WebWordnet advanced methods
pnpm with-memory-limit vitest --config=vitest.browser.config.ts --run test/browser/web-wordnet-advanced-methods.test.ts

# Worker client advanced methods
pnpm with-memory-limit vitest --config=vitest.browser.config.ts --run test/browser/worker-client-advanced-methods.test.ts

# Cross-lingual integration tests
pnpm with-memory-limit vitest --config=vitest.browser.config.ts --run test/browser/cross-lingual-advanced-methods.test.ts

# LMF parser language fix tests
pnpm with-memory-limit vitest --config=vitest.browser.config.ts --run test/browser/lmf-parser-language-fix.test.ts
```

### Run All Browser Tests (including advanced methods)
```bash
pnpm test:browser
```

### Run with Coverage
```bash
pnpm test:coverage
```

### Run Specific Test Patterns
```bash
# Run all advanced methods tests
pnpm with-memory-limit vitest --config=vitest.browser.config.ts --run test/browser/*advanced-methods*.test.ts

# Run LMF parser tests
pnpm test:lmf
```

## 📋 Test Requirements

### Prerequisites
- SQLite WASM module available
- WordNet data packages loaded (oewn:2024, omw-fr:1.4)
- Browser environment (tests are skipped in Node.js)

### Test Data Setup
Each test file sets up its own test data:
- Lexicons (English and French)
- Words with proper language tags
- Synsets with ILI mappings
- Senses linking words to synsets
- Definitions in multiple languages
- Relations for hierarchy testing

## 🎯 Test Coverage

### Methods Tested
✅ **Core Translation Methods:**
- `getWordsBySynsetAndLanguage()`
- `getDefinitionsBySynsetId()`
- `getSynsetById()`

✅ **Relationship Methods:**
- `getTranslations()`
- `getRelatedSynsets()`
- `getRelatedSenses()`

✅ **Hierarchy Methods:**
- `getShortestPath()`
- `getSynsetDepth()`
- `getPathSimilarity()`

✅ **LMF Parser Fixes:**
- Multi-language word parsing
- Multi-language synset parsing
- ILI mapping preservation

### Test Scenarios
- ✅ Happy path scenarios
- ✅ Error handling
- ✅ Edge cases
- ✅ Type safety
- ✅ Performance
- ✅ Cross-lingual integration
- ✅ Data consistency

## 🔧 Test Configuration

### Browser Tests
- Uses `@sqlite.org/sqlite-wasm` for database operations
- Skips in Node.js environment
- Requires real WordNet data for integration tests

### Mock Data
- Creates test lexicons, words, synsets, senses, definitions
- Sets up relations for hierarchy testing
- Uses realistic ILI mappings for cross-lingual tests

### Error Simulation
- Tests uninitialized WordNet instances
- Simulates database errors
- Tests missing data scenarios

## 📊 Expected Results

When all tests pass, you should see:
- ✅ All core translation methods working
- ✅ Cross-lingual translation via ILI mappings
- ✅ Relationship queries functioning
- ✅ Hierarchy navigation working
- ✅ Path similarity calculations
- ✅ Proper type transformations
- ✅ Error handling working correctly

## 🐛 Troubleshooting

### Common Issues
1. **SQLite WASM not loading**: Ensure browser environment
2. **Data not loaded**: Check package loading in integration tests
3. **Type errors**: Verify type transformations in worker client
4. **Timeout errors**: Increase timeout for cross-lingual tests

### Debug Mode
Run tests with debug logging:
```bash
DEBUG=* npx vitest run test/browser/web-wordnet-advanced-methods.test.ts
```

## 📈 Performance Benchmarks

The tests include performance checks:
- Cross-lingual queries should complete within 10 seconds
- Individual method calls should complete within 5 seconds
- Database operations should be efficient

## 🔄 Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies beyond SQLite WASM
- Deterministic test data
- Clear pass/fail criteria
- Comprehensive error reporting
