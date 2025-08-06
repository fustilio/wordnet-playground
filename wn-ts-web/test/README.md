# Testing `wn-ts-web`

This package is tested in two primary environments to ensure robust functionality:

1.  **Node.js Environment**: Unit and integration tests are run in a Node.js environment using `jsdom` to simulate browser APIs. These tests focus on core logic, factory functions, and the Kysely query service integration.
2.  **Browser Environment**: End-to-end and browser-specific API tests are run in a real browser (Chromium) using Vitest's browser mode (`@vitest/browser`) and Playwright. These tests verify OPFS functionality, SQLite WASM integration, and other browser-native features.

## Test Structure

-   `test/`: Contains tests that can run in the Node.js (`jsdom`) environment.
-   `test/browser/`: Contains tests that require a real browser environment.
-   `test/e2e/`: Contains end-to-end tests that run against a real, ephemeral database in a browser.

## Running Tests

The following commands are available to run the test suites.

### Run All Tests
This command executes both Node.js and browser test suites.

```bash
pnpm test
```

### Run Node.js Tests Only
This command runs the unit and integration tests in the `jsdom` environment.

```bash
pnpm vitest run
```

### Run Browser Tests Only
This command runs the browser-specific and end-to-end tests in a headless Chromium instance.

```bash
pnpm vitest run --browser
```

### Run Tests in Watch Mode
For interactive development, you can run tests in watch mode.

```bash
# Watch Node.js tests
pnpm vitest watch

# Watch browser tests
pnpm vitest watch --browser
```
