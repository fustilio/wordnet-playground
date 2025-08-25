# XML Introspector Test Suite

This directory contains comprehensive tests for the XML Introspector package using Vitest.

## Test Coverage

The test suite covers all the main tasks and functionality:

### **Task A: Generate XSD from XML** ✅
- Tests XSD generation from simple XML structures
- Tests XSD generation from complex XML with attributes and nested elements
- Validates generated XSD syntax and content

### **Task B: Generate XML from XSD** ✅
- Tests XML generation from XSD schemas
- Tests different generation options (maxElements, realistic data)
- Validates generated XML structure

### **Task C: XML → XAST → XML Roundtrip** ✅
- Tests XML parsing to XAST (XML Abstract Syntax Tree)
- Tests XAST conversion back to XML
- Validates attribute preservation and structure integrity

### **Task D: Transform Big XML to Small XML** ✅
- Tests sampling strategies (balanced, random, first)
- Tests structure preservation
- Tests element limits and constraints

### **Task E: Transform Small XML to Big XML** ✅
- Tests pattern identification and rule generation
- Tests XML expansion based on discovered patterns
- Tests constraint preservation

## Running Tests

### Prerequisites
```bash
pnpm install
```

### Run All Tests
```bash
pnpm test
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Run Specific Test Files
```bash
# Run only the main functionality tests
pnpm vitest run test/xml-introspector.test.ts

# Run only CLI tests
pnpm vitest run test/cli.test.ts

# Run only example tests
pnpm vitest run test/example.test.ts

# Run only integration tests
pnpm vitest run test/integration.test.ts
```

### Run Tests with UI
```bash
pnpm test:ui
```

## Test Structure

### `xml-introspector.test.ts`
Main test suite covering all core functionality:
- XML structure analysis
- XSD generation and parsing
- XAST roundtrip functionality
- XML transformation (big ↔ small)
- Sampling strategies
- XML validation
- Edge cases and error handling

### `cli.test.ts`
Tests for command-line interface functionality:
- Command processing simulation
- CLI options and parameters
- Error handling and edge cases
- Large file processing

### `example.test.ts`
Simple examples demonstrating basic usage:
- End-to-end functionality tests
- WordNet LMF structure handling
- Basic workflow demonstrations

### `integration.test.ts`
Integration tests for end-to-end workflows:
- XSD generation and validation
- Complete XML → XSD → Small XML workflows
- Cross-component integration testing

### `xsd-parser.test.ts`
Tests for XSD parsing and XAST generation:
- XSD structure parsing
- Unified XAST creation
- Recursive schema handling
- XSD validation using xmllint-wasm

### `schema-consistency.test.ts`
Tests for schema consistency and validation:
- XSD schema consistency across different XML files
- WordNet LMF structure validation
- Performance and scalability testing

### `big-to-small-workflow.test.ts`
Tests for the big XML to small XML transformation workflow:
- Large XML processing
- XSD generation from large files
- Small XML generation with constraints

### `wordnet-real-data.test.ts`
Tests using real WordNet data:
- WordNet LMF version compatibility
- Real XML file processing
- Schema comparison with official WordNet schemas

### `faker-generator.test.ts`
Tests for realistic data generation:
- Faker-based XML generation
- Realistic content creation
- Custom generator configuration

### `debug-xsd-parser.test.ts`
Debug tests for XSD parsing:
- Troubleshooting XSD parsing issues
- Debug output validation

## Test Configuration

### `vitest.config.ts`
- Node.js environment
- Coverage reporting (text, JSON, HTML)
- Test timeouts (30s for large XML processing)
- Path aliases and module resolution

## Test Data

Tests create temporary XML files for testing:
- Simple XML structures
- WordNet LMF-like XML
- Large XML files (1000+ elements)
- Malformed XML for error testing

## Coverage Goals

- **Line Coverage**: >90%
- **Function Coverage**: >95%
- **Branch Coverage**: >85%

## Performance Testing

Tests include performance validation:
- Large file processing (1000+ elements)
- Memory usage validation
- Processing time benchmarks

## Error Handling Tests

Tests validate error handling:
- Non-existent files
- Malformed XML
- Invalid XSD schemas
- Memory constraints

## Integration Testing

Tests validate integration with:
- `xmllint-wasm` for XSD validation (replaces libxmljs)
- File system operations
- Stream processing
- XAST manipulation

## Running Tests in CI/CD

```bash
# Install dependencies
pnpm install

# Run tests with coverage
pnpm test:coverage

# Check coverage thresholds
pnpm test:coverage --reporter=text --coverage.threshold.lines=90
```

## Debugging Tests

### Verbose Output
```bash
pnpm test --reporter=verbose
```

### Debug Mode
```bash
pnpm test --reporter=verbose --no-coverage
```

### Single Test
```bash
pnpm vitest run test/example.test.ts --reporter=verbose
```

## Test Maintenance

### Adding New Tests
1. Create test file in `test/` directory
2. Follow naming convention: `*.test.ts`
3. Import necessary modules and types
4. Add comprehensive test coverage
5. Update this README if needed

### Updating Tests
1. Ensure tests reflect current API
2. Update test data if XML structures change
3. Validate error handling scenarios
4. Check performance benchmarks

### Test Dependencies
- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage reporting
- `@vitest/ui` - Test UI interface
- `xmllint-wasm` - XSD validation (cross-platform)
- Node.js built-in modules (`fs`, `path`)

## Troubleshooting

### Common Issues

**Tests failing with file system errors:**
- Ensure test directory has write permissions
- Check for conflicting temporary files
- Verify Node.js version compatibility

**Memory issues with large XML tests:**
- Increase Node.js memory limit: `node --max-old-space-size=4096`
- Reduce test file sizes if needed
- Check system memory availability

**XSD validation failures:**
- Verify `xmllint-wasm` installation
- Check XML/XSD syntax in test data
- Validate schema compatibility

### Performance Issues

**Slow test execution:**
- Use `pnpm test:watch` for development
- Run specific test files instead of full suite
- Check system resources and Node.js performance

**Memory leaks:**
- Ensure proper cleanup in `afterEach` hooks
- Monitor memory usage during large file tests
- Use Node.js memory profiling if needed

## Recent Changes

### Test Consolidation (Latest)
- **Removed**: `another.test.ts` and `manual.test.ts` (consolidated into other test files)
- **Added**: `integration.test.ts` for end-to-end workflow testing
- **Updated**: `xsd-parser.test.ts` to include XSD validation functionality
- **Dependency**: Replaced `libxmljs` with `xmllint-wasm` for cross-platform compatibility

### Benefits of New Organization
- **Cleaner structure**: Related tests grouped logically
- **Better maintainability**: No duplicate test logic
- **Cross-platform support**: xmllint-wasm works on all platforms
- **Improved coverage**: Integration tests cover real-world scenarios
