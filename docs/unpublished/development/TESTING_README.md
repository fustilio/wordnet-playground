# Testing Guide

This repository uses a comprehensive testing strategy with **Vitest** for unit tests and **Cypress** for end-to-end (e2e) tests, orchestrated by **Turbo** for efficient parallel execution.

## Testing Strategy

- **Vitest**: Fast, headless unit testing for all packages
- **Cypress**: Browser-based e2e testing for web applications
- **Turbo**: Orchestrates test execution across the monorepo

## Quick Start

### Run All Tests
```bash
# Run all unit tests across the repository
pnpm test

# Run all tests (unit + e2e) across the repository
pnpm test:all

# Run only e2e tests
pnpm test:e2e
```

### Run Tests for Specific Projects

#### Web Examples
```bash
# Basic Demo
cd examples/web/web-basic-demo
pnpm test:all  # Unit tests + Cypress e2e tests

# Showcase Demo
cd examples/web/web-showcase
pnpm test:all  # Unit tests + Cypress e2e tests

# Developer Demo
cd examples/web/web-developer-demo
pnpm test:all  # Unit tests + Cypress e2e tests
```

#### Node.js Demo
```bash
cd examples/node/wn-ts-node-demo
pnpm test:all  # Unit tests + Node.js e2e tests
```

## Test Commands

### Unit Tests (Vitest)
```bash
# Run unit tests once
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run unit tests with UI
pnpm test:ui
```

### E2E Tests

#### Web Applications (Cypress)
```bash
# Run Cypress tests headlessly
pnpm test:e2e

# Open Cypress Test Runner
pnpm cypress

# Run specific Cypress tests
pnpm cypress:run
```

#### Node.js Applications
```bash
# Run all Node.js e2e tests
pnpm test:e2e

# Run specific test suites
pnpm test:e2e:basic
pnpm test:e2e:advanced
pnpm test:e2e:live
pnpm test:e2e:performance
```

## Project Structure

### Web Examples
Each web example has:
- `vitest.config.ts` - Vitest configuration
- `cypress.config.ts` - Cypress configuration
- `cypress/` - Cypress test files and support
- `test:all` script - Runs both unit and e2e tests

### Node.js Demo
- `vitest.config.ts` - Vitest configuration
- `test/e2e/` - Custom Node.js e2e test runner
- `test:all` script - Runs both unit and e2e tests

## Configuration

### Turbo Configuration (`turbo.json`)
- Defines pipeline for parallel test execution
- Caches test results for faster subsequent runs
- Handles dependencies between build and test tasks

### Cypress Configuration
- TypeScript support with custom command definitions
- Follows Cypress Real World App best practices
- Includes retry logic and proper timeouts
- Custom tasks for logging and progress tracking

### Vitest Configuration
- Node.js environment for server-side code
- JSDOM environment for React components
- Coverage reporting with v8 provider
- Parallel execution with thread pool

## Best Practices

### Writing Tests
1. **Unit Tests**: Test individual functions and components in isolation
2. **E2E Tests**: Test complete user workflows and integrations
3. **Use appropriate tools**: Vitest for fast unit tests, Cypress for browser interactions

### Test Organization
- Unit tests: `*.test.ts` or `*.spec.ts` files
- E2E tests: `cypress/e2e/**/*.cy.ts` files
- Support files: `cypress/support/` directory

### Performance
- Turbo caches test results for faster CI/CD
- Vitest runs tests in parallel by default
- Cypress tests run sequentially but with retry logic

## CI/CD Integration

The repository includes comprehensive CI scripts:
```bash
# Full CI pipeline
pnpm ci:full

# Individual CI steps
pnpm ci:build    # Build all packages
pnpm ci:test     # Run all tests
pnpm ci:demo     # Run demo applications
pnpm ci:benchmark # Run performance benchmarks
```

## Troubleshooting

### Common Issues

1. **Cypress tests failing**: Ensure the development server is running
2. **Vitest tests timing out**: Check test timeout configuration
3. **Turbo cache issues**: Clear cache with `turbo run build --force`

### Debug Mode
```bash
# Run tests with debug logging
LOG_LEVEL=debug pnpm test:all

# Run Cypress in headed mode
pnpm cypress:open
```

## Dependencies

All testing dependencies are managed through the catalog system in `pnpm-workspace.yaml`:
- `vitest: 3.2.4`
- `cypress: 15.4.0`
- `turbo: ^2.3.0`

This ensures consistent versions across all projects in the monorepo.
