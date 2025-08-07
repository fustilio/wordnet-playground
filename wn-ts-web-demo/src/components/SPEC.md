# `components` Directory Specification

## 1. Overview

This directory contains all React components used in the demo application. Components are organized by their function and scope to promote reusability and a clear separation of concerns.

## 2. Implementation Status

- [x] Main demo views (`demos/`)
- [x] Reusable UI elements (`shared/`)
- [x] Status display panels (`widgets/`)
- [x] Developer-facing tools (`developer-tools/`)
- [x] Data visualization components (`visualizations/`)
- [x] High-level feature components (e.g., `SearchSection`, `DataManager`)

## 3. Directory Structure

-   `demos/`: Contains the primary components for each of the main tabs in the UI (Basic, Advanced, Developer).
-   `developer-tools/`: Components that are primarily for developers, such as the `DebugConsole`.
-   `shared/`: Reusable, generic components like `Card` and `Tabs` that are used across the application.
-   `visualizations/`: Complex components for displaying data graphically, like `WordRelationshipGraph` and `SynsetHierarchyTree`.
-   `widgets/`: Informational components that display real-time status, such as `StatusWidget`, `StatisticsWidget`, and `OPFSWidget`.
-   **Root Components**: Standalone, feature-specific components like `SearchSection.tsx`, `DataManager.tsx`, `ProjectDownload.tsx`, etc., are kept in the root of `components/`.
