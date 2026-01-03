# wn-cli

## 0.6.1

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.8.1

## 0.6.0

### Minor Changes

- 1fc3eab: Foundation improvements and quality enhancements for 0.8.0 release

  ## Major Improvements

  ### Build System
  - Fixed benchmark package build errors
  - Resolved turbo cache warnings for type-checking-only packages
  - Added package-specific turbo configurations
  - Fixed vite worker URL warning

  ### Package Exports
  - Added `/parsers` export to wn-ts-core for better modularity
  - Improved TypeScript module resolution in monorepo

  ### Documentation
  - Comprehensive package analysis with gaps and roadmap
  - Added CONTRIBUTING.md with detailed guidelines
  - Added SECURITY.md with vulnerability reporting process
  - Enhanced package READMEs (wn-test-data)

  ### Developer Experience
  - Improved error messages and type safety
  - Better monorepo development workflow
  - Cleaner build output without warnings

  ## Technical Changes

  ### wn-ts-core
  - Added `/parsers` subpath export in package.json
  - Added turbo.json for type-check-only builds

  ### wn-ts-web
  - Added vite-ignore comment for worker URL resolution

  ### wn-data-loader
  - Added turbo.json for type-check-only builds

  ### Benchmark Package
  - Fixed WnBridge API calls to use query objects
  - Fixed parser registry imports
  - Relaxed TypeScript strict mode for development package

  ## Breaking Changes

  None - This is a minor release with backwards compatibility maintained.

  ## Migration Guide

  No migration required. All changes are backwards compatible.

### Patch Changes

- Updated dependencies [1fc3eab]
- Updated dependencies [1fc3eab]
- Updated dependencies [1fc3eab]
  - wn-ts-core@0.6.0
  - wn-ts-node@0.8.0

## 0.5.7

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.7.2

## 0.5.6

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.7.1

## 0.5.5

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.7.0

## 0.5.4

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.6.3

## 0.5.3

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.6.2

## 0.5.2

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.6.1

## 0.5.1

### Patch Changes

- Updated dependencies
  - wn-ts-node@0.6.0
