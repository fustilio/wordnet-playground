# wn-ts-web

## 0.7.2

### Patch Changes

- reduce code duplication

## 0.7.1

### Patch Changes

- fix build errors and reorganize exports

## 0.7.0

### Minor Changes

- refactor queries and add relations

## 0.6.4

### Breaking Changes

- **Externalized Dependencies**: `fast-xml-parser` and `sax` are now externalized dependencies that must be installed separately in consuming projects
- **Updated Installation**: Installation now requires `npm install wn-ts-web @sqlite.org/sqlite-wasm fast-xml-parser sax`

### Patch Changes

- Fixed dependency resolution issues by externalizing XML parsing dependencies
- Updated build configuration to properly handle peer dependencies
- Improved bundle size by not bundling external dependencies

## 0.6.3

### Patch Changes

- update build configs

## 0.6.2

### Patch Changes

- update exported files

## 0.6.1

### Patch Changes

- update dependencies

## 0.6.0

### Minor Changes

- add minimal working functionality
