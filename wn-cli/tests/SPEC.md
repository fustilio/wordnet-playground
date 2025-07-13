# `wn-cli` Testing Strategy and Guidelines

## 1. Overview

This document outlines the testing strategy for the `wn-cli` application. The goal is to ensure the CLI is reliable, performant, and provides a good user experience. We use `vitest` as our testing framework, along with `ink-testing-library` for TUI components.

## 2. Test Philosophy and Strategy

`wn-cli` uses a multi-layered testing strategy to cover different aspects of the application, from individual command logic to the full interactive TUI experience.

- **Unit/Component Tests**: Test individual utilities and UI components in isolation.
- **Integration Tests**: Verify that CLI commands work as expected. These tests use a helper function to execute command logic in-process and capture output, interacting with a temporary file system and a test database provided by `wn-ts`.
- **End-to-End (E2E) Tests**: Simulate real user workflows by running the compiled CLI. These tests perform actual data downloads and can take a significant amount of time.
- **Performance Tests**: Measure the speed and memory usage of critical commands.
- **Snapshot Tests**: Ensure the TUI rendering remains consistent across changes.

## 3. How to Run Tests

You can run the entire test suite or target specific files.

- **Run all tests**:
  ```bash
  pnpm autotest
  ```
- **Run a specific test file**:
  ```bash
  pnpm vitest run tests/commands/stats.test.ts
  ```
- **Run tests in watch mode**:
  ```bash
  pnpm vitest
  ```

## 4. Directory Structure

- `tests/`
  - `commands/`: Integration tests for each CLI command.
  - `e2e/`: End-to-end tests simulating user journeys.
  - `performance/`: Performance benchmarks.
  - `utils/`: Unit tests for utility functions.
  - `app.test.tsx`: Component test for the main App.
  - `layout-system.integration.test.tsx`: Integration test for the responsive layout.
  - `menu.test.tsx`: Component test for the TUI menu.
  - `tui-snapshot.test.tsx`: Snapshot tests for TUI components.
  - `SPEC.md`: This file.

## 5. Test Categories in Detail

### Component & Unit Tests
These tests ensure that individual pieces of the application work correctly in isolation.
- **TUI Components** (`app.test.tsx`, `menu.test.tsx`): Use `ink-testing-library` to render React components to a virtual terminal, allowing assertions on the output.
- **Utilities** (`utils/lexicon-helpers.test.ts`): Standard unit tests for helper functions.

### Integration Tests
These are the most common type of tests for the CLI. They test the logic of individual commands.
- **Location**: `tests/commands/*.test.ts`
- **Method**: They use the `runCommand` helper from `tests/commands/test-helper.ts`. This helper executes the command's action handler within the test process, mocking `process.argv` and capturing stdout/stderr.
- **Environment**: Each test runs in a sandboxed temporary directory, ensuring that config files and `wn-ts` data do not interfere between tests. This is handled by the setup file.

### End-to-End (E2E) Tests
E2E tests provide the highest level of confidence by simulating a real user's interaction with the final compiled application.
- **Location**: `tests/e2e/commands/*.e2e.test.ts`
- **Method**: They also use the `runCommand` helper, but are designed to test longer user workflows that involve network access (e.g., downloading data) and interactions between multiple commands.
- **Warning**: These tests are slow and data-intensive. They are typically run less frequently, such as in a dedicated CI job.

### Performance Tests
Performance tests ensure that commands execute quickly and within acceptable memory limits.
- **Location**: `tests/performance/*.perf.test.ts`
- **Method**: They run a command multiple times and measure the average execution time and memory heap usage.

## 6. Guidelines for Writing New Tests
- **For new commands**: Add a new integration test file in `tests/commands/`. Cover all options and arguments.
- **For new UI components**: Add a component test using `ink-testing-library` to verify it renders correctly.
- **For bug fixes**: Add a test that reproduces the bug and verifies the fix.
- **Use the Sandbox**: Leverage the `test-helper.ts` setup, which provides an isolated environment for each test. This is crucial for command tests.
- **Mock Selectively**: For command integration tests, the goal is to test the command's logic, not the underlying `wn-ts` library (which has its own tests). The `test-helper` sandbox provides a real `wn-ts` instance with a temporary database.
