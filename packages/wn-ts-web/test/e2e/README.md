# End-to-End Tests for WordNet Orchestration

This directory contains comprehensive end-to-end tests for the new WordNet orchestration architecture in `wn-ts-web`.

## Overview

The e2e tests validate the complete workflow of the orchestration system in a **real browser environment**, including:

- **WordNetOrchestrator**: High-level lexicon management and cross-lexicon operations
- **WordNetWorkerClient**: Worker communication and state tracking
- **Integration scenarios**: Complete workflows from initialization to cleanup
- **Error handling**: Graceful failure handling and recovery
- **Resource management**: Proper cleanup and memory management
- **WordNet Usage Patterns**: Complete implementation of WordNet documentation examples

## Key Features

### Real Browser Environment
- **Actual browser**: Tests run in real Chromium browser via Playwright
- **Real SQLite WASM**: Uses actual `@sqlite.org/sqlite-wasm` package
- **Real Web Workers**: Tests actual worker communication, not mocks
- **Real Comlink**: Tests actual RPC communication between main thread and workers

### Comprehensive Testing
- **Database operations**: Real SQLite database creation and queries
- **Network requests**: Actual HTTP requests for lexicon data
- **Browser APIs**: Real browser environment with all standard APIs
- **Performance**: Tests actual performance characteristics, not simulated

### WordNet Documentation Compliance
- **Basic Usage Patterns**: Implements all examples from [WordNet Basic Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/basic.html)
- **Interlingual Queries**: Implements all examples from [WordNet Interlingual Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html)
- **API Parity**: Ensures our implementation matches the official WordNet Python library functionality

## Test Files

### 1. `wordnet.e2e.test.ts` - Basic WordNet Usage Patterns
Tests the core WordNet functionality matching the documentation examples:

**Primary Queries:**
- `wn.words('pencil')` → `[Word('ewn-pencil-n'), Word('ewn-pencil-v')]`
- `wn.words('pencil', pos='v')` → `[Word('ewn-pencil-v')]`
- `wn.words()` → All words in database
- `wn.words(pos='v')` → All verbs
- `wn.word('ewn-pencil-n')` → Specific word by ID

**Secondary Queries:**
- `w.pos` → Part of speech
- `w.forms()` → Word forms (e.g., irregular inflections)
- `w.lemma()` → Canonical form
- `w.senses()` → All senses for a word
- `w.synsets()` → All synsets for a word

**Synset Operations:**
- `ss.senses()` → Senses in the synset
- `ss.words()` → Words in the synset
- `ss.lemmas()` → Lemmas in the synset
- `ss.definition()` → Synset definition
- `ss.hypernyms()` → Hypernym relationships

### 2. `interlingual.e2e.test.ts` - Interlingual Query Patterns
Tests interlingual functionality matching the documentation examples:

**Interlingual Index (ILI) Operations:**
- `synset.ili` → Get ILI for cross-lingual concept mapping
- `wn.synsets(ili='i77784')` → Find equivalent concepts across languages
- Cross-lexicon synset queries via ILI

**Cross-Lexicon Operations:**
- `wn.words('chat', lexicon='ewn:2020')` → Filter by specific lexicon
- `wn.words('chat', lang='fr')` → Filter by language
- Lexicon dependency handling and expand lexicon functionality

**Advanced Interlingual Features:**
- Complex cross-lingual query patterns
- Lexicon-specific filtering
- Language-specific queries
- Performance and scalability testing

### 3. `worker-client.e2e.test.ts` - Worker Interface Patterns
Tests the WordNet functionality through the worker client interface:

**Basic Query Patterns via Worker:**
- Word queries: `client.queryWords('pencil')`
- POS filtering: `client.queryWords('pencil', 'v')`
- Synset queries: `client.querySynsets('scepter')`
- Sense queries: `client.querySenses('plow', 'n')`

**Secondary Query Patterns via Worker:**
- Word exploration: `client.getWord(sense.word)`
- Sense exploration: `client.getSynset(sense.synset)`
- Synset exploration: `client.getSensesForSynset(synset.id)`

**Interlingual Patterns via Worker:**
- ILI-based queries: `client.querySynsetsByILI(ili)`
- Cross-lexicon queries with filtering
- Language-specific queries

### 4. `orchestrator.e2e.test.ts`
Tests the `WordNetOrchestrator` class functionality:
- Initialization with real SQLite WASM
- Lexicon lifecycle management with actual data
- Cross-lexicon query operations
- Event system and state tracking
- Resource cleanup

### 5. `setup.ts`
Browser environment setup and configuration for e2e tests.

## WordNet Documentation Compliance

### Basic Guide Implementation
Our e2e tests implement all the examples from the [WordNet Basic Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/basic.html):

```typescript
// Primary Queries
const words = await wordnet.words('pencil');           // wn.words('pencil')
const verbWords = await wordnet.words('pencil', 'v');  // wn.words('pencil', pos='v')
const allWords = await wordnet.words();                // wn.words()
const allVerbs = await wordnet.words(undefined, 'v');  // wn.words(pos='v')

// Secondary Queries
const word = words[0];
expect(word.pos).toBeDefined();                        // w.pos
expect(word.lemma).toBe('pencil');                     // w.lemma()
if (word.forms) expect(Array.isArray(word.forms));     // w.forms()

// Synset Operations
const synsets = await wordnet.synsets('hound', 'n');
const houndSynset = synsets[0];
const senses = await wordnet.senses('hound', 'n');     // ss.senses()
const words = await wordnet.words('hound', 'n');       // ss.words()
const lemmas = words.map(w => w.lemma);                // ss.lemmas()
```

### Interlingual Guide Implementation
Our e2e tests implement all the examples from the [WordNet Interlingual Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html):

```typescript
// ILI Operations
const synsets = await wordnet.synsets('apricot');
const apricotSynset = synsets[0];
// const ili = apricotSynset.ili;                      // synset.ili
// const crossLingual = await wordnet.synsets(ili=ili); // wn.synsets(ili='i77784')

// Cross-Lexicon Queries
const allWords = await wordnet.words('chat');          // wn.words('chat')
// const ewnWords = await wordnet.words('chat', undefined, { lexicon: 'ewn:2020' });
// const frWords = await wordnet.words('chat', undefined, { language: 'fr' });

// Lexicon Dependencies
const lexicons = await wordnet.lexicons();
const oewnLexicon = lexicons.find(l => l.id === 'oewn:2024');
expect(oewnLexicon?.label).toBe('Open English WordNet');
```

## Running the Tests

### Using npm/pnpm scripts (Recommended)

```bash
# Run all orchestration e2e tests
pnpm test:e2e:orchestration

# Run specific WordNet pattern tests
pnpm test:e2e:wordnet
pnpm test:e2e:interlingual
pnpm test:e2e:worker-client

# Run all e2e tests (including existing ones)
pnpm test:e2e
```

### Using vitest directly

```bash
# Run all e2e tests
npx vitest run test/e2e --config=vitest.e2e.config.ts

# Run specific test file
npx vitest run test/e2e/wordnet.e2e.test.ts --config=vitest.e2e.config.ts
npx vitest run test/e2e/interlingual.e2e.test.ts --config=vitest.e2e.config.ts

# Run in watch mode
npx vitest test/e2e --config=vitest.e2e.config.ts
```

## Test Environment

### Browser Environment
The e2e tests run in a real browser environment using:

- **Playwright**: Browser automation and testing
- **Chromium**: Modern browser with full Web API support
- **jsdom**: Browser-like environment for Node.js compatibility
- **Real network**: Actual HTTP requests and responses

### Dependencies
Tests use real dependencies, not mocks:

- **SQLite WASM**: Actual SQLite database engine
- **Comlink**: Real RPC communication library
- **Web Workers**: Actual browser worker implementation
- **Fetch API**: Real HTTP request handling

### Test Data
Tests use real data when available:

- **Actual lexicons**: Real WordNet lexicon files when accessible
- **Real network**: Actual HTTP requests to lexicon sources
- **Real database**: Actual SQLite database operations
- **Real performance**: Actual timing and memory usage

## Test Categories

### 1. WordNet Basic Usage Tests
- **Primary Queries**: Word, sense, and synset searches
- **Secondary Queries**: Exploring WordNet objects and relationships
- **Filtering**: Part-of-speech, lexicon, and language filtering
- **Object Properties**: Accessing word, sense, and synset attributes

### 2. WordNet Interlingual Tests
- **ILI Operations**: Interlingual Index functionality
- **Cross-Lexicon Queries**: Multi-lexicon operations
- **Language Filtering**: Language-specific queries
- **Lexicon Dependencies**: Expand lexicon functionality

### 3. Worker Interface Tests
- **Basic Patterns**: WordNet operations through worker client
- **Query Patterns**: All WordNet query types via worker
- **Interlingual Patterns**: Cross-lingual operations via worker
- **Interface Validation**: Worker client API compliance

### 4. Initialization and Error Handling Tests
- **Initialization**: Successful and failed initialization scenarios
- **Error Handling**: Graceful failure handling and recovery
- **Resource Management**: Clean resource disposal and cleanup
- **State Consistency**: Maintaining consistent state across operations

### 5. Integration Scenario Tests
- **Complete Workflows**: End-to-end user scenarios
- **Concurrent Operations**: Handling multiple operations simultaneously
- **State Verification**: Ensuring data consistency across operations
- **Performance Testing**: Scalability and efficiency validation

## Browser-Specific Testing

### Web Worker Support
Tests verify actual Web Worker functionality:

- **Worker creation**: Real worker instantiation
- **Message passing**: Actual postMessage/onmessage handling
- **Comlink integration**: Real RPC communication
- **Error handling**: Actual worker error scenarios

### SQLite WASM Integration
Tests verify real database operations:

- **Database creation**: Actual SQLite database files
- **Table creation**: Real schema setup
- **Data insertion**: Actual data loading
- **Query execution**: Real SQL queries

### Browser APIs
Tests verify browser environment compatibility:

- **Fetch API**: Real HTTP requests
- **ArrayBuffer**: Binary data handling
- **Event system**: Real DOM events
- **Memory management**: Actual browser memory usage

## Debugging Tests

### Running Individual Tests

```bash
# Run a specific test by name
npx vitest run test/e2e/wordnet.e2e.test.ts -t "should find words by lemma"

# Run tests matching a pattern
npx vitest run test/e2e --grep "Primary Queries"
npx vitest run test/e2e --grep "Interlingual"
```

### Verbose Output

```bash
# Enable verbose logging
npx vitest run test/e2e --reporter=verbose

# Show console output
npx vitest run test/e2e --reporter=verbose --stdout
```

### Debug Mode

```bash
# Run tests in debug mode
npx vitest run test/e2e --reporter=verbose --debug

# Run with browser visible (non-headless)
npx vitest run test/e2e --browser.headless=false
```

## Test Configuration

The e2e tests use the `vitest.e2e.config.ts` configuration file, which provides:

- **Browser environment**: Real Chromium browser via Playwright
- **Extended timeouts**: 5 minutes for complex operations
- **Memory allocation**: Adequate memory for large datasets
- **Network proxy**: Configured proxies for external services
- **Setup files**: Browser environment configuration

## Adding New Tests

### Test Structure

Follow the existing pattern for WordNet e2e tests:

```typescript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup test environment with real dependencies
  });

  afterEach(async () => {
    // Cleanup test resources
  });

  it('should implement WordNet documentation example', async () => {
    // Test implementation matching documentation
    // >>> wn.words('example')
    // [Word('ewn-example-n')]
    
    const words = await wordnet.words('example');
    expect(words.length).toBeGreaterThan(0);
    expect(words[0].lemma).toBe('example');
  });
});
```

### Testing Guidelines

1. **Match Documentation**: Implement exact examples from WordNet documentation
2. **Use Real Dependencies**: Test actual functionality, not mocks
3. **Test Browser APIs**: Verify real browser behavior
4. **Handle Network**: Account for real HTTP requests and responses
5. **Test Performance**: Measure actual timing and memory usage
6. **Clean Up Resources**: Ensure proper cleanup of database and worker resources

### Test Naming

Use descriptive test names that explain the expected behavior:

```typescript
it('should find words by lemma - equivalent to wn.words("pencil")', async () => {
  // Test implementation
});

it('should filter by part of speech - equivalent to wn.words("pencil", pos="v")', async () => {
  // Test implementation
});
```

## Troubleshooting

### Common Issues

1. **Browser not available**: Ensure Playwright is installed and configured
2. **SQLite WASM loading**: Check network access to SQLite WASM files
3. **Worker creation**: Verify Web Worker support in test environment
4. **Network errors**: Check proxy configuration and external service availability
5. **WordNet data loading**: Verify lexicon data accessibility

### Debug Commands

```bash
# Check Playwright installation
npx playwright --version

# Install Playwright browsers
npx playwright install chromium

# Run tests with visible browser
pnpm test:e2e:wordnet --browser.headless=false

# Check vitest configuration
npx vitest --config=vitest.e2e.config.ts --help
```

## Performance Considerations

- **Real browser**: Tests run in actual browser with real performance characteristics
- **Network latency**: Account for real HTTP request times
- **Database operations**: Real SQLite performance, not simulated
- **Memory usage**: Actual browser memory consumption
- **WordNet data size**: Large lexicon files require adequate timeouts

## Continuous Integration

These e2e tests are designed to run in CI/CD environments:

- **Browser automation**: Playwright supports headless mode for CI
- **Real dependencies**: Tests verify actual functionality, not mocks
- **Network testing**: Real HTTP requests and responses
- **Database testing**: Real SQLite operations
- **Documentation compliance**: Ensures API parity with official WordNet library

## Next Steps

After running the e2e tests:

1. **Review results**: Check for any test failures or warnings
2. **Verify compliance**: Ensure all WordNet documentation examples pass
3. **Fix issues**: Address any problems identified by the tests
4. **Add coverage**: Consider adding tests for uncovered scenarios
5. **Performance**: Monitor actual test execution time and optimize if needed
6. **Integration**: Ensure tests work with the broader test suite
7. **Documentation**: Update API documentation to match test coverage

## WordNet Documentation References

- [Basic Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/basic.html) - Core WordNet functionality
- [Interlingual Guide](https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html) - Cross-lingual operations
- [Working with Lexicons](https://llmtext.com/wn.readthedocs.io/en/latest/guides/lexicons.html) - Lexicon management
- [API Reference](https://llmtext.com/wn.readthedocs.io/en/latest/api.html) - Complete API documentation
