# Cypress Tests

This directory contains Cypress end-to-end tests for the WordNet TypeScript Demo application.

## Test Structure

### Example Tests (Learning Resources)
- `1-getting-started/` - Basic Cypress examples and tutorials
- `2-advanced-examples/` - Advanced Cypress patterns and techniques

These example tests are valuable learning resources that demonstrate:
- Basic Cypress commands and assertions
- Advanced testing patterns
- Best practices for E2E testing
- Various Cypress APIs and features

### WordNet Demo Tests
- `wordnet-demo/` - Application-specific tests for the WordNet demo

These tests focus on the actual application functionality:
- `app.cy.ts` - Basic application functionality and UI elements
- `data-loading.cy.ts` - Data loading and management features

## Running Tests

### Run all tests
```bash
npx cypress run
```

### Run specific test categories
```bash
# Run only WordNet demo tests
npx cypress run --spec "cypress/e2e/wordnet-demo/**/*.cy.ts"

# Run example tests
npx cypress run --spec "cypress/e2e/1-getting-started/**/*.cy.ts"
npx cypress run --spec "cypress/e2e/2-advanced-examples/**/*.cy.ts"
```

### Open Cypress Test Runner
```bash
npx cypress open
```

## Test Categories

### Example Tests (Learning)
- **Getting Started**: Basic Cypress tutorials and examples
- **Advanced Examples**: Complex patterns, custom commands, and advanced features

### WordNet Demo Tests (Application)
- **App Tests**: Core application functionality, UI elements, and user interactions
- **Data Loading Tests**: Database operations, package loading, and data management

## Development

When adding new tests:
1. For application-specific tests, add them to `wordnet-demo/`
2. For learning or reference tests, consider adding them to the example directories
3. Follow the existing naming conventions: `*.cy.ts` for test files
4. Use descriptive test names and organize tests logically

## Notes

- The example tests are kept for learning purposes and reference
- Application tests focus on the actual WordNet demo functionality
- All tests use TypeScript for better type safety and developer experience
