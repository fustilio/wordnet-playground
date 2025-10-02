# Testing Strategy & Standards

## **Overview**

This document establishes the comprehensive testing strategy and standards that all `wn-ts` modules must follow. Our testing approach ensures code quality, reliability, and maintainability across the entire WordNet TypeScript ecosystem.

## **Microkernel Architecture Testing**

The WordNet TypeScript ecosystem uses a microkernel architecture with plugin system:

### **Core Component Testing**
- **`WordNetCore` Interface**: Test all implementations against the interface contract
- **`WordNetKernel` Class**: Test plugin management, schema handling, and delegation
- **Plugin System**: Test individual plugins and their integration with the kernel

### **Plugin Testing Requirements**
- **Relations Plugin**: Test all WordNet relations (hypernym, hyponym, etc.)
- **Similarity Plugin**: Test semantic similarity metrics and algorithms
- **Translation Plugin**: Test cross-lingual mapping and translation features

## **Testing Pyramid**

### **Test Distribution**

```
                    /\
                   /  \     E2E Tests (10%)
                  /____\    
                 /      \   Integration Tests (20%)
                /________\  
               /          \ Unit Tests (70%)
              /____________\
```

**Rule**: Maintain the 70/20/10 ratio for optimal testing efficiency.

### **Test Coverage Requirements**

- **Unit Tests**: 90%+ line coverage, 95%+ branch coverage
- **Integration Tests**: 80%+ coverage of integration points
- **E2E Tests**: 70%+ coverage of user workflows
- **Performance Tests**: Required for all data processing modules

## **Unit Testing Standards**

### **Test Structure**

**Rule**: Follow the AAA (Arrange-Act-Assert) pattern consistently.

```typescript
describe('LmfParser.parse()', () => {
  it('should parse valid LMF XML successfully', async () => {
    // Arrange
    const parser = new LmfParser();
    const validXML = '<LexicalResource>...</LexicalResource>';
    
    // Act
    const result = await parser.parse(validXML);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.lexicons).toHaveLength(1);
    expect(result.words).toHaveLength(5);
  });
});
```

### **Test Naming Conventions**

**Rule**: Use descriptive test names that explain the scenario and expected outcome.

```typescript
// ✅ Good: Clear scenario and expectation
it('should return empty result when parsing empty XML', async () => {});
it('should throw ParseError when XML is malformed', async () => {});
it('should preserve whitespace in definition text', async () => {});

// ❌ Bad: Vague or unclear
it('should work', async () => {});
it('should handle edge case', async () => {});
it('should parse correctly', async () => {});
```

### **Test Data Management**

**Rule**: Use dedicated test data files and factories for consistent testing.

```typescript
// Test data factory
class TestDataFactory {
  static createValidLMF(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="sense1" synset="synset1"/>
    </LexicalEntry>
    <Synset id="synset1" pos="n">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
  }
  
  static createInvalidLMF(): string {
    return '<LexicalResource><InvalidTag></InvalidTag></LexicalResource>';
  }
}

// Usage in tests
it('should parse valid LMF XML', async () => {
  const validXML = TestDataFactory.createValidLMF();
  const result = await parser.parse(validXML);
  expect(result.lexicons).toHaveLength(1);
});
```

## **Integration Testing Standards**

### **Database Integration Tests**

**Rule**: Test database operations with real database instances.

```typescript
describe('Database Integration', () => {
  let db: Database;
  
  beforeEach(async () => {
    // Use in-memory database for testing
    db = new Database(':memory:');
    await db.initialize();
  });
  
  afterEach(async () => {
    await db.close();
  });
  
  it('should store and retrieve lexicon data', async () => {
    // Arrange
    const lexicon: Lexicon = {
      id: 'test-lexicon',
      language: 'en',
      version: '1.0'
    };
    
    // Act
    await db.lexicons.insert(lexicon);
    const retrieved = await db.lexicons.findById('test-lexicon');
    
    // Assert
    expect(retrieved).toEqual(lexicon);
  });
});
```

### **API Integration Tests**

**Rule**: Test API endpoints with real HTTP requests.

```typescript
describe('API Integration', () => {
  let app: Express;
  let server: Server;
  
  beforeAll(async () => {
    app = createApp();
    server = app.listen(0); // Random port
  });
  
  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });
  
  it('should return lexicon data via GET /api/lexicons', async () => {
    // Arrange
    const response = await request(app)
      .get('/api/lexicons')
      .expect(200);
    
    // Assert
    expect(response.body).toHaveProperty('lexicons');
    expect(Array.isArray(response.body.lexicons)).toBe(true);
  });
});
```

## **End-to-End Testing Standards**

### **Browser E2E Tests**

**Rule**: Test complete user workflows in real browser environments.

```typescript
describe('Browser E2E', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  it('should load and display lexicon data', async () => {
    // Navigate to page
    await page.goto('http://localhost:3000');
    
    // Wait for data to load
    await page.waitForSelector('.lexicon-list');
    
    // Verify data is displayed
    const lexiconCount = await page.$$eval('.lexicon-item', items => items.length);
    expect(lexiconCount).toBeGreaterThan(0);
  });
});
```

### **CLI E2E Tests**

**Rule**: Test command-line interfaces with real file operations.

```typescript
describe('CLI E2E', () => {
  const tempDir = path.join(os.tmpdir(), 'wn-cli-test');
  
  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  it('should parse LMF file and output results', async () => {
    // Arrange
    const testFile = path.join(tempDir, 'test.xml');
    await fs.writeFile(testFile, TestDataFactory.createValidLMF());
    
    // Act
    const { stdout, stderr, exitCode } = await execa('wn-cli', ['parse', testFile]);
    
    // Assert
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Successfully parsed');
    expect(stderr).toBe('');
  });
});
```

## **Performance Testing Standards**

### **Load Testing**

**Rule**: Test performance under realistic load conditions.

```typescript
describe('Performance Tests', () => {
  it('should parse 1MB LMF file in under 100ms', async () => {
    // Arrange
    const largeXML = generateLargeLMF(1024 * 1024); // 1MB
    const parser = new LmfParser();
    
    // Act
    const startTime = performance.now();
    const result = await parser.parse(largeXML);
    const endTime = performance.now();
    
    // Assert
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100);
    expect(result.words.length).toBeGreaterThan(1000);
  });
  
  it('should handle concurrent parsing requests', async () => {
    // Arrange
    const parser = new LmfParser();
    const xmlFiles = Array(10).fill(TestDataFactory.createValidLMF());
    
    // Act
    const startTime = performance.now();
    const results = await Promise.all(xmlFiles.map(xml => parser.parse(xml)));
    const endTime = performance.now();
    
    // Assert
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(500); // 10 files in under 500ms
    expect(results).toHaveLength(10);
  });
});
```

### **Memory Testing**

**Rule**: Monitor memory usage during operations.

```typescript
it('should not exceed memory limits during large file processing', async () => {
  // Arrange
  const initialMemory = process.memoryUsage().heapUsed;
  const largeXML = generateLargeLMF(10 * 1024 * 1024); // 10MB
  
  // Act
  const result = await parser.parse(largeXML);
  const finalMemory = process.memoryUsage().heapUsed;
  
  // Assert
  const memoryIncrease = finalMemory - initialMemory;
  const maxAllowedIncrease = 50 * 1024 * 1024; // 50MB
  
  expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
  expect(result.words.length).toBeGreaterThan(10000);
});
```

## 🔒 **Security Testing Standards**

### **Input Validation Testing**

**Rule**: Test all input validation and sanitization.

```typescript
describe('Security Tests', () => {
  it('should reject XML with XXE attacks', async () => {
    // Arrange
    const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma writtenForm="&xxe;" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
    
    // Act & Assert
    await expect(parser.parse(maliciousXML))
      .rejects
      .toThrow('External entity references are not allowed');
  });
  
  it('should reject extremely large XML files', async () => {
    // Arrange
    const hugeXML = generateLargeLMF(100 * 1024 * 1024); // 100MB
    
    // Act & Assert
    await expect(parser.parse(hugeXML))
      .rejects
      .toThrow('File size exceeds maximum allowed limit');
  });
});
```

## **Test Organization Standards**

### **File Structure**

**Rule**: Organize tests to mirror source code structure.

```
src/
├── parsers/
│   ├── lmf/
│   │   ├── lmf-parser.ts
│   │   └── lmf-parser.test.ts
│   └── json/
│       ├── json-parser.ts
│       └── json-parser.test.ts
└── database/
    ├── sqlite/
    │   ├── sqlite-database.ts
    │   └── sqlite-database.test.ts
    └── postgresql/
        ├── postgresql-database.ts
        └── postgresql-database.test.ts
```

### **Test Categories**

**Rule**: Use consistent describe blocks for test organization.

```typescript
describe('LmfParser', () => {
  describe('parse()', () => {
    describe('with valid input', () => {
      // Tests for valid scenarios
    });
    
    describe('with invalid input', () => {
      // Tests for error cases
    });
    
    describe('with edge cases', () => {
      // Tests for boundary conditions
    });
  });
  
  describe('validate()', () => {
    // Validation tests
  });
  
  describe('convert()', () => {
    // Conversion tests
  });
});
```

## **Test Execution Standards**

### **Test Scripts**

**Rule**: Provide consistent test execution commands across all modules.

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:performance": "vitest run --config vitest.performance.config.ts"
  }
}
```

### **Test Configuration**

**Rule**: Use consistent test configuration across all modules.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 95,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  }
});
```

## **Test Reporting Standards**

### **Coverage Reports**

**Rule**: Generate comprehensive coverage reports for all test runs.

```typescript
// Coverage configuration
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  }
});
```

### **Test Results**

**Rule**: Provide clear, actionable test results.

```bash
# Example test output
✓ LmfParser.parse() with valid input should parse basic LMF XML (45ms)
✓ LmfParser.parse() with valid input should handle multiple lexicons (23ms)
✓ LmfParser.parse() with invalid input should reject malformed XML (12ms)
✓ LmfParser.parse() with edge cases should handle empty definitions (8ms)

Test Files  4 passed (4)
Tests       4 passed (4)
Start at    10:30:15
Duration    1.23s (transform 234ms, setup 12ms, collect 45ms, tests 1.23s)
```

## 🔄 **Duplicate Handling Test Configuration**

### **Understanding Duplicate Handling**

**Rule**: When testing LMF parser behavior with duplicate IDs, configure duplicate handling options appropriately.

The LMF parser includes built-in duplicate handling that can affect test results. For tests that expect duplicates to be preserved, you must configure the parser to disable deduplication.

### **Test Configuration Examples**

```typescript
// ✅ Correct: Configure parser to preserve duplicates for testing
it('should handle duplicate synset IDs (E101-2.xml)', async () => {
  const xmlContent = readFileSync(join(TEST_DATA_DIR, 'E101-2.xml'), 'utf-8');
  const testParser = new LmfParser('', { 
    debug: false, 
    validate: true, 
    mergeStrategy: 'none',
    duplicateHandling: {
      strategy: 'keep-first',
      uniqueKeys: {
        words: ['id', 'lemma'],
        synsets: [], // Empty array means no deduplication for synsets
        senses: ['id', 'wordId-synsetId']
      },
      logDuplicates: false,
      trackStatistics: false
    }
  });
  const result = await testParser.parse(xmlContent);
  
  // Now the test expects 2 synsets with duplicate IDs
  expect(result.synsets).toHaveLength(2);
});

// ❌ Wrong: Using default configuration that deduplicates
it('should handle duplicate synset IDs', async () => {
  const parser = new LmfParser('', { debug: false, validate: true });
  const result = await parser.parse(xmlContent);
  
  // This will fail because default config deduplicates by ID
  expect(result.synsets).toHaveLength(2); // Fails: gets 1
});
```

### **Duplicate Handling Strategies**

- **`keep-first`**: Keep the first occurrence, skip subsequent duplicates
- **`keep-last`**: Keep the last occurrence, replace previous duplicates
- **`merge`**: Merge duplicate entries based on configurable fields
- **`skip`**: Skip all duplicates, keep only unique entries
- **`error`**: Throw an error when duplicates are found

### **Unique Key Configuration**

- **Empty arrays**: Disable deduplication for that entity type
- **`['id']`**: Deduplicate based on ID only
- **`['id', 'lemma']`**: Deduplicate based on ID and lemma combination
- **`['lemma', 'pos']`**: Deduplicate based on lemma and part-of-speech

## **Common Testing Anti-Patterns to Avoid**

1. **Testing implementation details**
   ```typescript
   // ❌ Wrong: Testing private methods
   expect(parser['validateXML']).toHaveBeenCalled();
   
   // ✅ Correct: Testing public behavior
   expect(result).toBeDefined();
   ```

2. **Over-mocking**
   ```typescript
   // ❌ Wrong: Mocking everything
   const mockParser = jest.fn().mockReturnValue({});
   
   // ✅ Correct: Mock only external dependencies
   const mockDatabase = jest.fn().mockReturnValue({});
   ```

3. **Testing multiple behaviors in one test**
   ```typescript
   // ❌ Wrong: Multiple assertions for different behaviors
   it('should parse and validate XML', async () => {
     const result = await parser.parse(xml);
     expect(result.lexicons).toHaveLength(1);
     expect(result.words).toHaveLength(5);
     expect(result.synsets).toHaveLength(1);
     expect(result.senses).toHaveLength(5);
   });
   
   // ✅ Correct: Focused test
   it('should parse XML and return correct lexicon count', async () => {
     const result = await parser.parse(xml);
     expect(result.lexicons).toHaveLength(1);
   });
   ```

## **Related Documentation**

- [Development Conventions](./development-conventions.md)
- [Database Schema Standards](./database-schema-standards.md)
- [Performance Guidelines](./performance.md)

---

**Remember**: Comprehensive testing is not optional—it's essential for maintaining code quality and reliability across the `wn-ts` ecosystem. Follow these standards to ensure your modules meet our quality requirements.
