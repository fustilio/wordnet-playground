# WordNet Web Examples E2E Testing

This document describes the comprehensive end-to-end testing setup for all WordNet web examples, following [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app) best practices.

## Overview

We use **Cypress v15.4.0** with **TypeScript** for all e2e testing across our web examples:

- **web-basic-demo**: Simple WordNet search interface
- **web-showcase**: Multi-demo showcase with navigation
- **web-developer-demo**: Advanced developer tools and features

## Test Architecture

### Configuration Files

Each demo has its own Cypress configuration:

```
examples/web/
├── web-basic-demo/
│   ├── cypress.config.ts          # TypeScript config
│   ├── cypress.d.ts               # Type definitions
│   └── cypress/
│       ├── e2e/
│       │   └── basic-demo.cy.ts   # Main test suite
│       └── support/
│           ├── commands.ts        # Custom commands
│           ├── e2e.ts            # Support file
│           └── utils.ts          # Utility functions
├── web-showcase/
│   ├── cypress.config.ts
│   ├── cypress.d.ts
│   └── cypress/
│       ├── e2e/
│       │   └── showcase.cy.ts
│       └── support/
│           ├── commands.ts
│           ├── e2e.ts
│           └── utils.ts
└── web-developer-demo/
    ├── cypress.config.mjs         # Existing config (updated)
    └── cypress/
        ├── e2e/wordnet-demo/
        │   ├── app.cy.ts          # Existing tests
        │   └── comprehensive.cy.ts # New comprehensive tests
        └── support/
            ├── commands.ts
            └── e2e.ts
```

### TypeScript Integration

Following the Real World App pattern, we use:

1. **`cypress.d.ts`** - Global type definitions for custom commands
2. **`cypress.config.ts`** - TypeScript configuration with proper typing
3. **Custom commands** - Type-safe command definitions
4. **Utility functions** - Reusable, typed helper functions

## Running Tests

### Individual Demo Tests

```bash
# Basic Demo
cd examples/web/web-basic-demo
pnpm test:e2e

# Showcase
cd examples/web/web-showcase
pnpm test:e2e

# Developer Demo
cd examples/web/web-developer-demo
pnpm test:cypress
```

### All Web Tests

```bash
# Run all web e2e tests
cd examples/web
pnpm -r test:e2e
```

### Interactive Mode

```bash
# Open Cypress Test Runner
cd examples/web/web-basic-demo
pnpm cypress:open
```

## Test Coverage

### Basic Demo Tests (`basic-demo.cy.ts`)

- ✅ App initialization and loading
- ✅ WordNet data loading
- ✅ Word search functionality
- ✅ Results display and validation
- ✅ Error handling
- ✅ Accessibility features
- ✅ Performance testing
- ✅ Responsive design

### Showcase Tests (`showcase.cy.ts`)

- ✅ App initialization
- ✅ Demo navigation
- ✅ All demo types (Basic, Advanced, Synonym/Antonym, Word Relationships)
- ✅ Cross-demo navigation
- ✅ Responsive design
- ✅ Error handling
- ✅ Accessibility

### Developer Demo Tests

- ✅ Existing app functionality (`app.cy.ts`)
- ✅ Comprehensive feature testing (`comprehensive.cy.ts`)
- ✅ Data loading and management
- ✅ Search functionality across tabs
- ✅ Multilingual features
- ✅ Developer tools
- ✅ Performance and reliability
- ✅ Error handling and edge cases

## Best Practices Implemented

### From Cypress Real World App

1. **TypeScript Configuration**
   - Proper type definitions in `cypress.d.ts`
   - Typed custom commands
   - Type-safe utility functions

2. **Test Organization**
   - Clear test structure with `describe` blocks
   - Logical grouping of related tests
   - Comprehensive test coverage

3. **Custom Commands**
   - Reusable, typed commands
   - Clear documentation with JSDoc
   - Consistent naming conventions

4. **Error Handling**
   - Global uncaught exception handling
   - Proper timeout configurations
   - Retry mechanisms

5. **Performance Testing**
   - Timeout configurations
   - Performance measurements
   - Load time validations

6. **Accessibility Testing**
   - Keyboard navigation
   - ARIA attributes
   - Screen reader compatibility

### Configuration Features

```typescript
// Following Real World App patterns
export default defineConfig({
  e2e: {
    // TypeScript support
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    
    // Best practices
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
  },
});
```

## Custom Commands

### Basic Demo Commands

```typescript
cy.visitApp()                    // Visit the app
cy.waitForWordNetReady()         // Wait for WordNet to load
cy.searchWord('water')           // Search for a word
cy.shouldShowResults()           // Validate results display
cy.shouldShowNoResults()         // Validate no results state
```

### Showcase Commands

```typescript
cy.visitShowcase()               // Visit the showcase
cy.navigateToDemo('basic-search') // Navigate to specific demo
cy.searchWord('water')           // Search in current demo
cy.shouldShowResults()           // Validate results
cy.shouldShowNoResults()         // Validate no results
```

## Utility Functions

### Common Utilities

```typescript
import { selectors, testData, timeouts } from './utils';

// Selectors
selectors.searchInput
selectors.searchButton
selectors.synsetTable

// Test data
testData.commonWords
testData.invalidWords

// Timeouts
timeouts.short
timeouts.medium
timeouts.long
timeouts.veryLong
```

### Helper Functions

```typescript
waitForWordNetReady()            // Wait for WordNet ready state
performSearch(word)              // Perform word search
validateResults()                // Validate search results
validateNoResults()              // Validate no results state
validateAccessibility()          // Check accessibility features
testResponsiveDesign()           // Test responsive behavior
measurePerformance()             // Measure operation performance
```

## CI Integration

### GitHub Actions

```yaml
# Example CI configuration
- name: Run E2E Tests
  run: |
    cd examples/web/web-basic-demo
    pnpm test:e2e
    
    cd ../web-showcase
    pnpm test:e2e
    
    cd ../web-developer-demo
    pnpm test:cypress
```

### Test Reports

- Screenshots on failure
- Video recordings (disabled for performance)
- Detailed error reporting
- Performance metrics

## Debugging

### Common Issues

1. **WordNet Loading Timeouts**
   - Increase `pageLoadTimeout` for slow connections
   - Check network connectivity
   - Verify WordNet data availability

2. **Test Flakiness**
   - Use retry mechanisms
   - Add proper waits
   - Check for race conditions

3. **TypeScript Errors**
   - Ensure `cypress.d.ts` is properly configured
   - Check import statements
   - Verify type definitions

### Debug Commands

```bash
# Run with debug logging
LOG_LEVEL=debug pnpm test:e2e

# Run specific test file
pnpm cypress:run --spec "cypress/e2e/basic-demo.cy.ts"

# Run in headed mode
pnpm cypress:run --headed
```

## Performance Considerations

### Optimizations

- Disabled video recording for faster execution
- Proper timeout configurations
- Efficient selectors
- Minimal test data

### Monitoring

- Test execution times
- Memory usage
- Network requests
- Browser performance

## Future Enhancements

### Planned Features

1. **Visual Testing**
   - Screenshot comparisons
   - Visual regression testing

2. **API Testing**
   - WordNet API validation
   - Network request mocking

3. **Cross-Browser Testing**
   - Chrome, Firefox, Safari
   - Mobile browser testing

4. **Performance Testing**
   - Load testing
   - Stress testing
   - Memory leak detection

## Contributing

### Adding New Tests

1. Follow the existing test structure
2. Use TypeScript for all new tests
3. Add proper type definitions
4. Include comprehensive test coverage
5. Update documentation

### Test Guidelines

- Use descriptive test names
- Group related tests in `describe` blocks
- Use `beforeEach` for setup
- Clean up after tests
- Follow accessibility best practices

## Resources

- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
- [Cypress TypeScript Documentation](https://docs.cypress.io/guides/tooling/typescript-support)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Accessibility Testing with Cypress](https://docs.cypress.io/guides/tooling/accessibility-testing)
