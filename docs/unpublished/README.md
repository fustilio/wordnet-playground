# Unpublished Documentation

This directory contains documentation that is **not ready for public consumption** but is needed for development purposes.

## Structure

### `development/`
Contains development-specific documentation that is useful for contributors but not for end users.

#### Package-Specific Documentation
- **`wn-ts-node/`** - Node.js package development docs
  - `goals.md` - Development goals and roadmap
  - `lmf-implementation-status.md` - LMF parser implementation status
  - `lemmatizer-normalizer.md` - Lemmatizer and normalizer documentation
  - `performance-benchmarks.md` - Performance benchmarking results
  - `benchmarks.md` - Benchmarking setup and results

- **`wn-ts-core/`** - Core package development docs
  - `refactoring-summary.md` - Refactoring documentation
  - `parsers.md` - Parser implementation details
  - `schemas.md` - Schema documentation
  - `benchmarks.md` - Core package benchmarks

- **`wn-ts-web/`** - Web package development docs
  - `storage/` - Storage implementation details
  - `plugins/` - Plugin system documentation
  - `react.md` - React component documentation

#### Test Documentation
- **`tests/`** - Test-related documentation
  - `wn-ts-core-tests.md` - Core package test documentation
  - `wn-ts-node-tests.md` - Node.js package test documentation
  - `wn-ts-web-tests.md` - Web package test documentation

#### Other Development Docs
- `test-data.md` - Test data documentation
- `wn-data-loader-testing.md` - Data loader testing documentation
- `logger.md` - Logger utility documentation

## Guidelines

- **Not for public docs**: These files should not be included in the main documentation build
- **Development only**: Intended for contributors and maintainers
- **Lowercase naming**: All files follow lowercase-with-hyphens naming convention
- **Keep organized**: Maintain clear structure by package and purpose

## Moving to Published

When documentation is ready for public consumption:
1. Move the file to the appropriate location in the main `docs/` directory
2. Update any references to the file
3. Remove from this unpublished directory
4. Update this README if needed
