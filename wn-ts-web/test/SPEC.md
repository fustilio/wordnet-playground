# Specification for `wn-ts-web` Testing

This document outlines the testing strategy, structure, and implementation considerations for the `wn-ts-web` package.

## 1. Overview

The testing approach is layered to ensure comprehensive coverage across different environments, from isolated unit tests in Node.js to full end-to-end (E2E) tests in a real browser. This ensures core logic is sound, browser-specific APIs work as expected, and the entire data loading and querying pipeline is robust.

## 2. Implementation Status

- [x] Establish a multi-layered testing structure (Node, Browser, E2E).
- [x] Configure Vitest for each testing environment.
- [x] Implement setup files for mocking and environment configuration.
- [x] Create unit and integration tests for core logic.
- [x] Create functional tests for browser-specific APIs (OPFS, SQLite WASM).
- [x] Create end-to-end tests for the full application workflow.
- [x] Implement comprehensive data validation tests.
- [x] Document specific test cases and their rationale.

## 3. Directory Structure

The `test/` directory is organized to separate tests by their execution environment:

-   `wn-ts-web/test/`: **Node.js Tests**
    -   Contains unit and integration tests that run in a Node.js environment using `jsdom` to simulate browser APIs.
    -   **Examples**: `web-wordnet.test.ts`, `wordnet-orchestrator.test.ts`, `kysely-integration-comprehensive.test.ts`.
    -   **Setup**: `test/setup.ts` is used to mock browser-native APIs.

-   `wn-ts-web/test/browser/`: **Browser Functional Tests**
    -   Contains tests that require a real browser environment but may mock network requests or use controlled data.
    -   Focuses on testing browser-specific APIs like OPFS and SQLite WASM integration.
    -   **Examples**: `opfs-manager.test.ts`, `web-wordnet.test.ts`.
    -   **Setup**: `test/browser/setup.ts` provides mocks suitable for a real browser environment.

-   `wn-ts-web/test/browser/e2e/`: **Browser End-to-End (E2E) Tests**
    -   Contains full workflow tests that simulate real-world usage.
    -   These tests download and process a complete WordNet dataset from a remote source into a live ephemeral database.
    -   **Examples**: `wordnet.e2e.test.ts`, `statistics-stress.test.ts`.
    -   **Sub-directory**: `validation/` contains comprehensive data integrity tests.
        -   `data-validation.test.ts`: Core data validation (storage, retrieval, relationships).
        -   `edge-case-validation.test.ts`: Handles duplicate IDs and other edge cases.
        -   `xml-parsing-validation.test.ts`: Validates parsing of various LMF XML formats.
    -   **Setup**: `test/browser/e2e/setup.ts` configures the environment for full E2E runs.

## 4. Vitest Configurations

The project uses multiple Vitest configuration files to manage the different testing layers.

-   `vitest.config.ts`: (Default)
    -   **Purpose**: Runs Node.js unit and integration tests.
    -   **Environment**: `jsdom`.
    -   **Scope**: Includes all files in `test/` but excludes `test/browser/`.
    -   **Setup**: Uses `test/setup.ts`.

-   `vitest.browser.config.ts`:
    -   **Purpose**: Runs browser functional tests.
    -   **Environment**: Real browser (`chromium`) via Playwright.
    -   **Scope**: Includes files in `test/browser/` but excludes `test/browser/e2e/`.
    -   **Setup**: Uses `test/browser/setup.ts`.

-   `vitest.e2e.config.ts`:
    -   **Purpose**: Runs end-to-end browser tests, including data validation.
    -   **Environment**: Real browser (`chromium`) via Playwright.
    -   **Scope**: Includes files in `test/browser/e2e/`.
    -   **Setup**: Uses `test/browser/e2e/setup.ts`.
    -   **Features**: Has extended timeouts and server proxy settings to handle real network requests.

-   `vitest.naked.config.ts`:
    -   **Purpose**: A minimal configuration for specific, isolated tests that require no complex setup.
    -   **Scope**: Used for `pako.test.ts`.

## 5. Implementation Considerations

-   **Functional Testing Focus**: Tests are designed to validate behavior and output rather than internal implementation details (e.g., avoiding `toHaveBeenCalledWith`). Stateful mocks are used to simulate real backends.
-   **Data Validation**: A dedicated suite of E2E tests in `test/browser/e2e/validation/` ensures data integrity by introspecting the database state after loading. These tests are inspired by the data patterns from the `goodmami/wn` repository to cover known edge cases.
-   **Mocking**: A `MockDataLoader` (`test/mock-data-loader.ts`) is used in validation tests to provide a large, consistent dataset, ensuring tests can run reliably without network dependencies and can fall back gracefully if real data downloads fail.
-   **Environment Separation**: The file structure and Vitest configurations ensure a clean separation between tests, preventing environment-specific API issues.
