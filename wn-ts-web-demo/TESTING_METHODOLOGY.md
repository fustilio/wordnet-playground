# Testing Methodology - wn-ts-web-demo

## Overview

This document outlines our comprehensive testing methodology for the `wn-ts-web-demo` project, including our testing philosophy, infrastructure, and test categories.

## Testing Philosophy

- **Progressive Validation**: Each feature is tested from unit to E2E level.
- **Real-world Scenarios**: Tests are designed to simulate actual user interactions and network conditions.
- **Error Tolerance**: We test for graceful handling of expected failures (e.g., CORS, network issues).
- **Performance Awareness**: Performance is monitored to prevent regressions.
- **Accessibility First**: We ensure all features are accessible.

## Testing Infrastructure

- **Framework**: Vitest with `vitest-browser-react` and Playwright for real browser testing.
- **Component Testing**: React Testing Library for user-centric component tests.
- **CI/CD**: Automated testing pipeline via GitHub Actions on every push and pull request.

## Test Organization

### File Structure
Tests are organized by their scope and purpose.
```
tests/
└── e2e/
    ├── *.test.tsx      # E2E tests for full user workflows
```

### Test Categories

#### 1. Unit & Component Tests
- **Purpose**: Test individual functions, hooks, and components in isolation.
- **Location**: Typically co-located with the source files or in a `__tests__` directory.
- **Framework**: Vitest with React Testing Library.

#### 2. E2E (End-to-End) Tests
- **Purpose**: Test complete user workflows in a real browser environment.
- **Location**: `tests/e2e/`.
- **Framework**: `vitest-browser-react` with Playwright.

## How to Run Tests

- **Run all tests**:
  ```bash
  pnpm test
  ```
- **Run tests in watch mode for development**:
  ```bash
  pnpm test:watch
  ```

## Performance Testing

- **Metrics Tracked**: Initial load time, query performance, memory usage.
- **Benchmarks**: We aim for an initial load under 3 seconds and query responses under 500ms.
- **Tools**: Custom hooks and `performance.now()` for measurement.

## Accessibility Testing

- **Compliance**: We aim for WCAG 2.1 AA compliance.
- **Tools**: Manual testing (keyboard navigation, screen readers) and automated checks with `axe-core` in the future.

## Error Handling & Resilience

We test for various error scenarios:
- **Network Failures**: CORS errors, timeouts, and connection issues.
- **Data Corruption**: Invalid or unexpected data formats.
- **User Errors**: Invalid inputs and edge cases.
The application should degrade gracefully and provide clear user feedback.
