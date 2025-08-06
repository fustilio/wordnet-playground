# Browser Tests

This directory contains tests that require a real browser environment to run. They are automatically skipped when running tests in Node.js.

## Test Suites

The test files in this directory cover functionality specific to the browser:

-   `opfs-manager.test.ts`: Tests the Origin Private File System (OPFS) manager for persistent data storage.
-   `sqlite-wasm-browser.test.ts`: Verifies the integration with `@sqlite.org/sqlite-wasm` in a browser context.
-   `browser-integration.test.ts`: General integration tests for various browser APIs like `localStorage` and `indexedDB`.

## Running Browser Tests

You can run these tests using the following command, which will launch a headless Chromium browser via Playwright.

```bash
pnpm vitest run --browser
```

For interactive development, use watch mode:

```bash
pnpm vitest watch --browser
```
