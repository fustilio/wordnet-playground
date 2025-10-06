# Storage Adapter Migration Guide

This guide explains how to use the new storage adapter pattern in the WebDatabase class.

## Overview

The WebDatabase class now uses a storage adapter pattern that provides:
- **Hot-swappable storage backends** (OPFS, IndexedDB, Memory)
- **Better error handling** with automatic fallbacks
- **Cleaner separation of concerns**
- **Easier testing** with mockable adapters
- **Future extensibility** for new storage types

## Usage

### Basic Usage

```typescript
import { WebDatabase } from './client/submodules/web-database.js';
// or
import { WebDatabase } from './storage/index.js';
```

### Constructor Options

```typescript
// Auto-detect best storage (recommended)
const database = new WebDatabase();

// Or specify preferred storage
const database = new WebDatabase({
  preferredAdapter: 'opfs',
  adapterConfig: {
    maxRetries: 5,
    retryDelay: 1000,
    verbose: true
  }
});
```

### Hot-Swapping Storage

Switch storage at runtime:
```typescript
// Switch from OPFS to IndexedDB
await database.switchAdapter('indexeddb');

// Switch to memory storage
await database.switchAdapter('memory');
```

### Enhanced Storage Information

```typescript
const storageInfo = database.getStorageInfo();
console.log(`Storage: ${storageInfo.type} (persistent: ${storageInfo.persistent})`);
console.log(`Path: ${storageInfo.path}`);
console.log(`Available: ${storageInfo.available}`);
```

### Adapter-Specific Operations

Access the current adapter:
```typescript
const adapter = database.getCurrentAdapter();
if (adapter?.getName() === 'OPFS') {
  // OPFS-specific operations
}
```

## Configuration Options

### WebDatabaseConfig

```typescript
interface WebDatabaseConfig {
  preferredAdapter?: 'opfs' | 'memory' | 'indexeddb' | 'auto';
  adapterConfig?: StorageAdapterConfig;
  verbose?: boolean;
}
```

### StorageAdapterConfig

```typescript
interface StorageAdapterConfig {
  maxRetries?: number;        // Default: 5 for OPFS, 3 for others
  retryDelay?: number;        // Default: 1000ms
  verbose?: boolean;          // Default: false
  databaseName?: string;      // Default: 'wordnet.sqlite3'
}
```

## Storage Adapter Types

### 1. OPFS Adapter (Preferred)
- **Best performance** and persistence
- **Modern browsers only**
- **Handles access handle conflicts** automatically
- **Fallback strategies** for lingering handles

### 2. IndexedDB Adapter
- **Good persistence** with broader browser support
- **Periodic saving** to IndexedDB
- **Fallback option** when OPFS fails

### 3. Memory Adapter
- **Always available** as last resort
- **No persistence** (data lost on page refresh)
- **Fastest** for temporary operations

## Error Handling

The new system provides better error handling:

```typescript
try {
  await database.createDatabase();
} catch (error) {
  // System automatically tries fallback adapters
  // If all fail, throws the last error
  console.error('All storage adapters failed:', error);
}
```

## Backward Compatibility

The new `WebDatabase` class maintains backward compatibility:
- All existing methods work the same way
- Legacy methods are marked as deprecated but still functional
- Gradual migration is supported

## Testing

The adapter pattern makes testing easier:

```typescript
// Mock a specific adapter
const mockAdapter = {
  getName: () => 'Mock',
  isAvailable: () => true,
  // ... other methods
};

// Test with different adapters
const adapters = WebDatabase.getAvailableAdapters();
adapters.forEach(adapter => {
  // Test each adapter
});
```

## Future Extensions

Adding new storage types is now straightforward:

1. Implement the `StorageAdapter` interface
2. Add the new adapter to `StorageAdapterFactory`
3. Update the type definitions

Example:
```typescript
export class WebSQLStorageAdapter implements StorageAdapter {
  // Implementation
}

// Add to factory
static createAdapter(type: 'websql' | 'opfs' | 'memory' | 'indexeddb') {
  switch (type) {
    case 'websql':
      return new WebSQLStorageAdapter(config);
    // ... other cases
  }
}
```
