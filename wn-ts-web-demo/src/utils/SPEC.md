# `utils` Directory Specification

## 1. Overview

This directory contains utility modules that provide helper functions and shared logic used across the application. These utilities are not tied to specific components or hooks.

## 2. Implementation Status

- [x] CORS Proxy utilities
- [x] WordNet Project List utilities
- [x] Proxy Test utilities

## 3. File Responsibilities

-   `cors-proxy.ts`: Contains functions to handle Cross-Origin Resource Sharing (CORS) issues during local development by proxying requests. It provides `toProxyUrl` to rewrite URLs and `testProxyConnectivity` for diagnostics.
-   `project-list.ts`: Provides functions to fetch, filter, and search the list of available WordNet projects from the official index. This populates the data loading UI.
-   `proxy-test.ts`: Contains functions to run comprehensive tests against the CORS proxy configuration to ensure external data sources are accessible.
