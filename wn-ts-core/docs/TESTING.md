# Testing Guidelines for wn-ts

This document outlines the testing best practices and guidelines for the `wn-ts` library, based on patterns established in the existing test suite.

## Table of Contents

1. [Test Types and Organization](#test-types-and-organization)
2. [Setup and Teardown Patterns](#setup-and-teardown-patterns)
3. [Test Data Management](#test-data-management)
4. [Mocking Strategies](#mocking-strategies)
5. [Error Handling and Edge Cases](#error-handling-and-edge-cases)
6. [Performance and E2E Testing](#performance-and-e2e-testing)
7. [Test Organization and Naming](#test-organization-and-naming)
8. [Type Safety and Assertions](#type-safety-and-assertions)
9. [Running Tests](#running-tests)
10. [Common Patterns](#common-patterns)

## Test Types and Organization

### Unit Tests
- **Purpose**: Test individual functions in isolation
- **Location**: `tests/*.test.ts` (e.g., `config.test.ts`, `morphy.test.ts`)
- **Characteristics**: Fast, focused, use mocks for external dependencies
- **Example**: Testing configuration management, morphological analysis

### Integration Tests
- **Purpose**: Test module interactions and database operations
- **Location**: `tests/*.test.ts` (e.g., `data-management.test.ts`, `module-functions.test.ts`)
- **Characteristics**: Use real database with test data, test complete workflows
- **Example**: Testing data import/export, word/synset queries

### End-to-End (E2E) Tests
- **Purpose**: Test complete user workflows with real data
- **Location**: `tests/e2e/*.e2e.test.ts`
- **Characteristics**: Long-running, use real downloaded data, comprehensive scenarios
- **Example**: Download → Add → Query workflows, multilingual testing

## Setup and Teardown Patterns

### Global Setup (`tests/setup.ts`)
```typescript
import { beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { config } from '../src/config';
import { db } from '../src/db/database';

let testDataDir: string;

beforeEach(() => {
  // Create isolated temp directory for each test
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  config.dataDirectory = testDataDir;
});

afterEach(async () => {
  // Ensure database is properly closed
  try {
    await db.close();
  } catch (error) {
    // Ignore errors if database is already closed
  }
  
  // Allow file handles to be released
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Clean up test directory
  if (testDataDir && existsSync(testDataDir)) {
    try {
      rmSync(testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  }
});
```

### Database Management
```typescript
beforeEach(async () => {
  config.dataDirectory = testUtils.getTestDataDir();
  await db.initialize(); // Initialize fresh database
});

afterEach(async () => {
  await db.close(); // Always close database connection
});
```

### E2E Persistent Setup
```typescript
describe('End-to-End Tests', () => {
  let e2eDataDir: string;

  beforeAll(async () => {
    // Setup persistent data directory for all e2e tests
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-e2e-'));
    config.dataDirectory = e2eDataDir;
    
    // Download and setup real data
    const ciliPath = await download('cili:1.0', { force: true });
    await add(ciliPath, { force: true });
  }, 600000); // Long timeout for real data

  afterAll(async () => {
    if (e2eDataDir && existsSync(e2eDataDir)) {
      rmSync(e2eDataDir, { recursive: true, force: true });
    }
  });
});
```

## Test Data Management

### Using Real Test Data
```typescript
// Use consistent test data file from wn-test-data
const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
expect(existsSync(xmlPath)).toBe(true);
await add(xmlPath, { force: true });
```

### Creating Minimal Test Data
```typescript
// Create minimal LMF XML for specific tests
const testLexicon = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="${lexiconId}" label="Test Browser" language="en" version="1.0">
    <LexicalEntry id="w1">
      <Lemma writtenForm="apple" partOfSpeech="n"/>
      <Sense id="s1" synset="ss1"/>
    </LexicalEntry>
    <Synset id="ss1" partOfSpeech="n">
      <Definition>a round fruit with red or green skin</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

const lexiconXmlPath = path.join(outDir, `${lexiconId}.xml`);
fs.writeFileSync(lexiconXmlPath, testLexicon);
```

### Test Data Utilities
```typescript
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wn-ts-test-'));
}

function uniqueLexiconId() {
  return `test-lexicon-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
```

## Mocking Strategies

### Logger Mocking Patterns

When testing functions that use the centralized logger, use the following patterns:

#### Pattern 1: Direct Logger Method Mocking
```typescript
it('should show debug output when debug is enabled', () => {
  // Mock the logger to capture output
  const originalDebug = logger.debug;
  const originalConfig = logger.config;
  const originalSuccess = logger.success;
  const originalData = logger.data;
  
  const logs: string[] = [];
  
  logger.debug = (message: string) => logs.push(`DEBUG: ${message}`);
  logger.config = (message: string) => logs.push(`CONFIG: ${message}`);
  logger.success = (message: string) => logs.push(`SUCCESS: ${message}`);
  logger.data = (message: string) => logs.push(`DATA: ${message}`);

  try {
    makeBrowserData({ lexiconId, outDir, chunkSize: 100, debug: true });

    // Check that debug messages were logged
    const logText = logs.join('\n');
    expect(logText).toContain('Starting browser data preparation');
    expect(logText).toContain('Output directory:');
    expect(logText).toContain('Chunk size:');
    expect(logText).toContain('Browser data prep complete');
    expect(logText).toContain('Total time:');
  } finally {
    // Restore original logger methods
    logger.debug = originalDebug;
    logger.config = originalConfig;
    logger.success = originalSuccess;
    logger.data = originalData;
  }
});
```

#### Pattern 2: Vitest Spy for Logger Methods
```typescript
it('should export JSON format', async () => {
  // Add a lexicon first using real test data
  const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
  expect(existsSync(xmlPath)).toBe(true);
  await add(xmlPath, { force: true });

  // Mock logger.info
  const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

  await exportData({ format: 'json' });

  expect(loggerSpy).toHaveBeenCalled();
  const output = loggerSpy.mock.calls[0][0];
  const data = JSON.parse(output);

  expect(data).toHaveProperty('lexicons');
  expect(data).toHaveProperty('exportDate');
  expect(data).toHaveProperty('format', 'json');
  expect(data.lexicons.length).toBeGreaterThanOrEqual(2);

  loggerSpy.mockRestore();
});
```

#### Pattern 3: Testing Logger Suppression
```typescript
it('should suppress debug output by default', () => {
  // Mock the logger to capture output
  const originalDebug = logger.debug;
  const originalConfig = logger.config;
  const originalSuccess = logger.success;
  const originalData = logger.data;
  
  const logs: string[] = [];
  
  logger.debug = (message: string) => logs.push(`DEBUG: ${message}`);
  logger.config = (message: string) => logs.push(`CONFIG: ${message}`);
  logger.success = (message: string) => logs.push(`SUCCESS: ${message}`);
  logger.data = (message: string) => logs.push(`DATA: ${message}`);

  try {
    makeBrowserData({ lexiconId, outDir, chunkSize: 100 }); // Default debug: false

    // Check that debug messages are NOT logged by default
    const logText = logs.join('\n');
    expect(logText).not.toContain('Starting browser data preparation');
    expect(logText).not.toContain('Output directory:');
    expect(logText).not.toContain('Chunk size:');
    // Note: success message won't appear in test environment due to logger level
  } finally {
    // Restore original logger methods
    logger.debug = originalDebug;
    logger.config = originalConfig;
    logger.success = originalSuccess;
    logger.data = originalData;
  }
});
```

### Console Output Mocking (CLI Tests)

For CLI tests that need to capture console output, use the `runCommand` helper:

```typescript
it('browser prep works with debug flag', async () => {
  // First ensure the lexicon exists
  await runCommand(['data', 'download', 'oewn:2024']);

  const { stdout, stderr } = await runCommand([
    'browser', 'prep', '--lexicon', 'oewn', '--debug'
  ]);

  expect(stderr).toBe('');
  expect(stdout).toContain('🚀 Starting browser data preparation');
  expect(stdout).toContain('📁 Output directory:');
  expect(stdout).toContain('📦 Chunk size:');
  expect(stdout).toContain('✅ Browser data preparation completed successfully');
});
```

### Mocking External Dependencies

```typescript
// Mock fetch utilities
vi.mock('../src/utils/fetch', () => ({
  downloadFile: vi.fn((url: string) => {
    if (url.includes('nonexistent-project') || url.includes('test-project')) {
      throw new Error('Project not found');
    }
    return Promise.resolve();
  }),
}));

// Mock global fetch
global.fetch = vi.fn();

it('should download a file successfully', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-length': '100' }),
    body: new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const data = encoder.encode('test content');
        controller.enqueue(data);
        controller.close();
      }
    })
  };

  (global.fetch as any).mockResolvedValue(mockResponse);
  
  // Test implementation
});
```

### Network Operations
```typescript
// Mock fetch for network operations
vi.mock('../src/utils/fetch', () => ({
  downloadFile: vi.fn((url: string) => {
    if (url.includes('nonexistent-project')) {
      throw new Error('Project not found');
    }
    return Promise.resolve();
  }),
}));
```

### Console Output Capture
```typescript
// Capture console output for testing
const originalLog = console.log;
const logs: string[] = [];
console.log = (...args: any[]) => {
  logs.push(args.join(' '));
};

try {
  // Test code here
  expect(logs.join('\n')).toContain('expected output');
} finally {
  console.log = originalLog;
}
```

### Progress Callback Testing
```typescript
it('should call progress callback', async () => {
  const progressCallback = vi.fn();
  await add(xmlPath, { progress: progressCallback, force: true });
  expect(progressCallback).toHaveBeenCalledWith(1.0);
});
```

## Error Handling and Edge Cases

### Testing Error Conditions
```typescript
it('should throw ProjectError for non-existent project', async () => {
  await expect(download('nonexistent-project')).rejects.toThrow(ProjectError);
});

it('should handle invalid file paths gracefully', async () => {
  await expect(add('/nonexistent/file.xml')).rejects.toThrow();
});
```

### Testing Edge Cases
```typescript
it('should handle empty inputs', async () => {
  const results = await words('');
  expect(results).toEqual([]);
});

it('should handle non-existent words gracefully', async () => {
  const results = await words('thiswordprobablydoesnotexist');
  expect(results).toBeInstanceOf(Array);
  expect(results.length).toBe(0);
});

it('should handle null/undefined gracefully', async () => {
  const results = await words('thiswordprobablydoesnotexist');
  expect(results).toBeInstanceOf(Array);
  expect(results.length).toBe(0);
});
```

### Database Error Handling
```typescript
it('should handle database errors gracefully', async () => {
  // Test database connection failures
  await expect(db.initialize()).rejects.toThrow();
});
```

## Performance and E2E Testing

### Progress Logging for Long Operations
```typescript
class ProgressLogger {
  private startTime: number;
  private stage: string;
  private lastLoggedPercent: number;
  
  constructor(stage: string) {
    this.stage = stage;
    this.startTime = Date.now();
    this.lastLoggedPercent = -1;
    logger.info(`\n[${this.stage}] Starting...`);
  }
  
  update(progress: number) {
    const percent = Math.floor(progress * 100);
    // Only log every 5% to reduce verbosity
    if (percent >= this.lastLoggedPercent + 5) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      process.stdout.write(`\r[${this.stage}] ${percent}% complete (${elapsed}s)`);
      this.lastLoggedPercent = percent;
    }
  }
  
  finish() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    process.stdout.write(`\r[${this.stage}] 100% complete (${elapsed}s)\n`);
  }
}
```

### Timeout Management
```typescript
it('should handle large result sets', async () => {
  // Test with large datasets
}, 60000); // 1 minute timeout for performance tests

describe('SLOW E2E: Download and add real OEWN data', () => {
  // Long-running E2E tests
}, 300000); // 5 minute timeout
```

### Concurrent Testing
```typescript
it('should handle multiple concurrent queries', async () => {
  const queries = [
    words('information'),
    words('computer'),
    synsets('information')
  ];
  
  const results = await Promise.all(queries);
  expect(results).toHaveLength(3);
  results.forEach((result, index) => {
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

## Test Organization and Naming

### Nested Describe Blocks
```typescript
describe('Data Management', () => {
  describe('download', () => {
    it('should throw ProjectError for non-existent project', async () => {
      // test implementation
    });
    
    it('should handle force option', async () => {
      // test implementation
    });
  });
  
  describe('add', () => {
    it('should add basic lexicon to database', async () => {
      // test implementation
    });
    
    it('should handle force option', async () => {
      // test implementation
    });
  });
});
```

### Clear Test Names
```typescript
it('should return empty array for non-existent word', async () => {
  // test implementation
});

it('should handle part of speech filtering', async () => {
  // test implementation
});

it('should handle lexicon filtering', async () => {
  // test implementation
});
```

### Test Documentation
```typescript
/**
 * Tests the browser data generation functionality
 * - Creates chunked JSON files for web consumption
 * - Handles progress tracking
 * - Supports dry-run mode
 */
describe('browser-data', () => {
  // test implementations
});
```

## Type Safety and Assertions

### Type-Safe Database Queries
```typescript
const lexicons = (await db.all('SELECT * FROM lexicons WHERE id IN (?, ?)', [
  'test-en',
  'test-es',
])) as { id: string; label: string; language: string; version: string }[];

expect(lexicons).toHaveLength(2);
expect(lexicons.find(l => l.id === 'test-en')?.label).toBe('Testing English WordNet');
```

### Comprehensive Assertions
```typescript
// Test structure and content
expect(result).toBeInstanceOf(Array);
expect(result.length).toBeGreaterThan(0);
expect(result.some(w => w.lemma === 'information')).toBe(true);
expect(result.every(w => w.partOfSpeech === 'n')).toBe(true);
expect(result.every(w => w.lexicon === 'test-en')).toBe(true);
```

### Debug Information
```typescript
// Debug: Check what lexicons are in the database
const lexicons = db.all('SELECT * FROM lexicons') as any[];
console.log('Available lexicons in DB:', lexicons.map(l => l.id));

// Debug: Check specific table content
const words = db.all('SELECT DISTINCT lexicon FROM words') as any[];
console.log('Lexicon IDs in words table:', words.map(w => w.lexicon));
```

## Running Tests

### Basic Commands
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest run tests/config.test.ts

# Run tests in watch mode
pnpm vitest

# Run tests with coverage
pnpm test:coverage
```

### Test Categories
```bash
# Run only unit tests
pnpm vitest run tests/*.test.ts

# Run only E2E tests
pnpm vitest run tests/e2e/*.e2e.test.ts

# Run specific test pattern
pnpm vitest run --reporter=verbose tests/data-management.test.ts
```

### Debugging Tests
```bash
# Run with debug output
pnpm vitest run --reporter=verbose tests/browser-data.test.ts

# Run with console output
pnpm vitest run --reporter=basic tests/browser-data.test.ts
```

## Common Patterns

### Database Verification
```typescript
it('should add basic lexicon to database', async () => {
  await add(xmlPath, { force: true });
  
  await db.initialize();
  const lexicons = (await db.all('SELECT * FROM lexicons WHERE id IN (?, ?)', [
    'test-en',
    'test-es',
  ])) as { id: string; label: string; language: string; version: string }[];
  
  expect(lexicons).toHaveLength(2);
  expect(lexicons.find(l => l.id === 'test-en')?.label).toBe('Testing English WordNet');
  await db.close();
});
```

### File System Operations
```typescript
it('should create expected files', async () => {
  makeBrowserData({ lexiconId, outDir, chunkSize: 100 });
  
  const metadataJson = path.join(outDir, 'metadata.json');
  const chunksJson = path.join(outDir, 'chunks.json');
  const words0Json = path.join(outDir, 'words-0.json');
  
  expect(fs.existsSync(metadataJson)).toBe(true);
  expect(fs.existsSync(chunksJson)).toBe(true);
  expect(fs.existsSync(words0Json)).toBe(true);
});
```

### Configuration Testing
```typescript
it('should handle configuration changes', () => {
  const testDir = join(__dirname, 'test-data');
  config.dataDirectory = testDir;
  expect(config.dataDirectory).toBe(testDir);
  expect(config.databasePath).toBe(join(testDir, 'wn.db'));
});
```

### Error Testing
```typescript
it('should throw appropriate errors', () => {
  expect(() => {
    config.dataDirectory = '/nonexistent/path';
  }).toThrow(ConfigurationError);
});
```

### Browser Data Testing Patterns

When testing browser data generation functionality, follow these specific patterns:

#### File System Testing
```typescript
it('creates chunked browser data files', () => {
  makeBrowserData({ lexiconId, outDir, chunkSize: 100 });
  
  // Check metadata file
  const metadataJson = path.join(outDir, 'metadata.json');
  expect(fs.existsSync(metadataJson)).toBe(true);
  const metadata = JSON.parse(fs.readFileSync(metadataJson, 'utf8'));
  expect(metadata).toHaveProperty('lexiconId');
  expect(metadata).toHaveProperty('totalWords');
  expect(metadata).toHaveProperty('totalSynsets');
  expect(metadata).toHaveProperty('chunkSize');
  
  // Check chunks index
  const chunksJson = path.join(outDir, 'chunks.json');
  expect(fs.existsSync(chunksJson)).toBe(true);
  const chunks = JSON.parse(fs.readFileSync(chunksJson, 'utf8'));
  expect(chunks).toHaveProperty('totalWordChunks');
  expect(chunks).toHaveProperty('totalSynsetChunks');
  expect(chunks).toHaveProperty('wordChunks');
  expect(chunks).toHaveProperty('synsetChunks');
  
  // Check actual chunk files
  const words0Json = path.join(outDir, 'words0.json');
  const synsets0Json = path.join(outDir, 'synsets0.json');
  expect(fs.existsSync(words0Json)).toBe(true);
  expect(fs.existsSync(synsets0Json)).toBe(true);
  
  // Verify chunk content structure
  const wordsChunk = JSON.parse(fs.readFileSync(words0Json, 'utf8'));
  const synsetsChunk = JSON.parse(fs.readFileSync(synsets0Json, 'utf8'));
  expect(Array.isArray(wordsChunk)).toBe(true);
  expect(Array.isArray(synsetsChunk)).toBe(true);
});
```

#### Dry Run Testing
```typescript
it('does not write files in dryRun mode', () => {
  makeBrowserData({ lexiconId, outDir, chunkSize: 100, dryRun: true });
  
  // Should not create any files
  const metadataJson = path.join(outDir, 'metadata.json');
  const chunksJson = path.join(outDir, 'chunks.json');
  const words0Json = path.join(outDir, 'words0.json');
  const synsets0Json = path.join(outDir, 'synsets0.json');
  
  expect(fs.existsSync(metadataJson)).toBe(false);
  expect(fs.existsSync(chunksJson)).toBe(false);
  expect(fs.existsSync(words0Json)).toBe(false);
  expect(fs.existsSync(synsets0Json)).toBe(false);
});
```

#### Custom Chunk Size Testing
```typescript
it('works with custom chunk size', () => {
  makeBrowserData({ lexiconId, outDir, chunkSize: 1 });
  
  // With chunk size 1, we should have multiple chunk files
  const chunksJson = path.join(outDir, 'chunks.json');
  const chunks = JSON.parse(fs.readFileSync(chunksJson, 'utf8'));
  expect(chunks.totalWordChunks).toBeGreaterThan(1);
  expect(chunks.totalSynsetChunks).toBeGreaterThan(1);
});
```

#### Error Handling Testing
```typescript
it('handles non-existent lexicon gracefully', () => {
  expect(() => {
    makeBrowserData({ lexiconId: 'non-existent', outDir });
  }).toThrow();
});

it('handles invalid output directory', () => {
  expect(() => {
    makeBrowserData({ lexiconId, outDir: 'C:\\nonexistent\\path\\with\\invalid\\characters\\*' });
  }).toThrow();
});
```

#### File System Operations Testing
```typescript
it('creates output directory if it does not exist', () => {
  const nestedDir = path.join(outDir, 'nested', 'deep');
  const nestedOutDir = path.join(nestedDir, 'output');
  
  makeBrowserData({ lexiconId, outDir: nestedOutDir, chunkSize: 100 });
  
  expect(fs.existsSync(nestedOutDir)).toBe(true);
  expect(fs.existsSync(path.join(nestedOutDir, 'metadata.json'))).toBe(true);
});

it('overwrites existing files', () => {
  // Create initial files
  makeBrowserData({ lexiconId, outDir, chunkSize: 100 });
  const initialMetadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
  
  // Create files again
  makeBrowserData({ lexiconId, outDir, chunkSize: 50 });
  const updatedMetadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
  
  // Should have different chunk sizes
  expect(initialMetadata).not.toEqual(updatedMetadata);
});
```

## Best Practices Summary

1. **Isolation**: Each test should be independent and not affect others
2. **Cleanup**: Always clean up resources (database connections, temp files)
3. **Real Data**: Use real test data for integration tests, mocks for unit tests
4. **Comprehensive**: Test happy path, error cases, and edge cases
5. **Performance**: Use timeouts for long-running tests
6. **Documentation**: Write clear test names and descriptions
7. **Type Safety**: Use proper TypeScript types in assertions
8. **Debugging**: Include debug output for complex test scenarios
9. **Organization**: Group related tests in describe blocks
10. **Maintenance**: Keep tests simple and focused on single concerns

## Troubleshooting

### Common Issues

1. **Database not initialized**: Ensure `db.initialize()` is called in `beforeEach`
2. **File cleanup failures**: Add delays before cleanup to allow file handles to release
3. **Test data not found**: Verify test data paths and file existence
4. **Timeout errors**: Increase timeout for E2E tests or optimize test data size
5. **Mock not working**: Ensure mocks are defined before imports

### Debug Commands
```bash
# Run with detailed output
pnpm vitest run --reporter=verbose

# Run specific failing test
pnpm vitest run tests/browser-data.test.ts --reporter=verbose

# Check test data
ls -la wn-test-data/data/
```
