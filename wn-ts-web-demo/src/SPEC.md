# `src` Directory Specification

## 1. Overview

This directory contains the core source code for the `wn-ts-web-demo` application. It is structured to separate concerns such as components, hooks, and utilities, facilitating maintainability and scalability.

## 2. Implementation Status

- [x] Application Entry Point (`main.tsx`)
- [x] Root Component (`App.tsx`)
- [x] Component Architecture
- [x] State Management with Hooks
- [x] Utility Functions
- [x] Type Definitions

## 3. Directory Structure

-   `components/`: Contains all React components, organized into subdirectories by feature (demos, widgets, shared, etc.).
-   `hooks/`: Houses custom React hooks for managing application state, such as `useWordNet`, `useOPFS`, and `useSearch`.
-   `utils/`: Provides shared utility functions, such as CORS proxy handling and project list management.
-   `types/`: Defines custom TypeScript types and interfaces used throughout the application.
-   `App.tsx`: The main application layout component, which orchestrates the different parts of the UI.
-   `main.tsx`: The entry point of the React application.
-   `index.css`: Global styles and Tailwind CSS configuration.
