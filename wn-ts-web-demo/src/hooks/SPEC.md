# `hooks` Directory Specification

## 1. Overview

This directory contains custom React hooks that encapsulate and manage the application's business logic and state. By centralizing logic in hooks, we keep components clean and promote reusability.

## 2. Implementation Status

- [x] `useWordNet`: Manages the core WordNet instance, data loading, and queries.
- [x] `useOPFS`: Handles interactions with the Origin Private File System (OPFS) for persistent storage.
- [x] `useSearch`: Manages search state and functionality.
- [x] `useStatistics`: Fetches and manages database statistics.
- [x] `useBackup`: Implements backup and restore logic.
- [x] `useExport`: Manages data export functionality.
- [x] `index.ts`: Exports all hooks for easy importing.

## 3. Hook Responsibilities

-   **`useWordNet.ts`**: The primary hook for interacting with the `wn-ts-web` library. It initializes the WordNet instance, manages data loading (from network or demo data), and exposes query functions.
-   **`useOPFS.ts`**: Encapsulates all logic for checking OPFS support, getting storage information, and performing file operations (import, export, save, delete).
-   **`useSearch.ts`**: Manages the state for the search input, active search tab, and search results.
-   **`useStatistics.ts`**: A simple hook to fetch and provide database statistics from the `wordnet` instance.
-   **`useBackup.ts`**: Provides a comprehensive interface for creating, managing, and restoring database backups within OPFS.
-   **`useExport.ts`**: Manages the logic for exporting data into various formats (JSON, XML, CSV, SQL).
