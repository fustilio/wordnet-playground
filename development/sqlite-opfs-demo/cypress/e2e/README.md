# Cypress Tests

End-to-end tests for the SQLite OPFS demo.

## Test Structure

### Demo Tests
- `wordnet-demo/app.cy.ts` – App smoke, seed + persistence checks, and Kitchen Sink flow

## Running Tests

### Run all tests
```bash
npx cypress run
```

### Run specific test files
```bash
npx cypress run --spec "cypress/e2e/wordnet-demo/app.cy.ts"
```

### Open Cypress Test Runner
```bash
npx cypress open
```

## Test Categories

### What is covered
- **App**: UI and SQL execution basics
- **Persistence**: Seed + flush results in non-zero OPFS db size
- **Kitchen Sink**: init/open/seed/flush/exec/list/close

## Development

When adding new tests:
1. Add new specs under `wordnet-demo/`
2. Use descriptive test names and organize logically
3. Follow naming conventions: `*.cy.ts`

## Notes

- Tests use TypeScript
