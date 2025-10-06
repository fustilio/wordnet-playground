# Storage Adapter System

The storage adapter system provides a flexible, hot-swappable architecture for different database storage backends in the web environment. This allows you to easily switch between OPFS, IndexedDB, and Memory storage, or add new storage types in the future.

## Features

- **Hot-swappable storage backends** - Switch between different storage types at runtime
- **Automatic fallback** - Gracefully falls back to available storage when preferred options fail
- **Consistent API** - All adapters implement the same interface
- **Better error handling** - Robust retry mechanisms and error recovery
- **Future extensibility** - Easy to add new storage types
- **Backward compatibility** - Existing code continues to work

## Quick Start

```typescript
import { WebDatabase } from './storage/index.js';

// Auto-detect best available storage
const database = new WebDatabase();
await database.initializeWithModule(sqlModule);
await database.createDatabase();

console.log('Using storage:', database.getStorageInfo().type);
```

## Storage Adapters

### 1. OPFS Adapter (Preferred)
- **Best performance** and persistence
- **Modern browsers only** (Chrome 86+, Firefox 111+)
- **Handles access handle conflicts** automatically
- **Fallback strategies** for lingering handles

```typescript
const database = new WebDatabase({
  preferredAdapter: 'opfs',
  adapterConfig: {
    maxRetries: 5,
    retryDelay: 1000,
    verbose: true
  }
});
```

### 2. IndexedDB Adapter
- **Good persistence** with broader browser support
- **Periodic saving** to IndexedDB
- **Fallback option** when OPFS fails

```typescript
const database = new WebDatabase({
  preferredAdapter: 'indexeddb'
});
```

### 3. Memory Adapter
- **Always available** as last resort
- **No persistence** (data lost on page refresh)
- **Fastest** for temporary operations

```typescript
const database = new WebDatabase({
  preferredAdapter: 'memory'
});
```

## Hot-Swapping Storage

Switch between different storage adapters at runtime:

```typescript
// Start with OPFS
const database = new WebDatabase({ preferredAdapter: 'opfs' });
await database.initializeWithModule(sqlModule);
await database.createDatabase();

// Switch to IndexedDB
await database.switchAdapter('indexeddb');

// Switch to memory
await database.switchAdapter('memory');
```

## Configuration

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

## API Reference

### WebDatabase

```typescript
class WebDatabase {
  constructor(config?: WebDatabaseConfig);
  
  // Core methods
  async initializeWithModule(sqlModule: Sqlite3Static): Promise<void>;
  async createDatabase(data?: Uint8Array): Promise<void>;
  getDatabase(): Database | null;
  close(): void;
  
  // Storage information
  getStorageInfo(): StorageInfo;
  get useOPFS(): boolean;
  
  // Hot-swapping
  async switchAdapter(adapterType: 'opfs' | 'memory' | 'indexeddb'): Promise<void>;
  getCurrentAdapter(): StorageAdapter | null;
  
  // Static methods
  static getAvailableAdapters(config?: StorageAdapterConfig): StorageAdapter[];
  static getBestAdapter(config?: StorageAdapterConfig): StorageAdapter;
}
```

### StorageAdapter

```typescript
interface StorageAdapter {
  // Core methods
  initialize(sqlModule: Sqlite3Static): Promise<void>;
  createDatabase(data?: Uint8Array): Promise<void>;
  getDatabase(): Database | null;
  close(): void;
  
  // Information
  getStorageInfo(): StorageInfo;
  isAvailable(): boolean;
  isInitialized(): boolean;
  getName(): string;
}
```

## Error Handling

The system provides robust error handling with automatic fallbacks:

```typescript
try {
  await database.createDatabase();
} catch (error) {
  // System automatically tries fallback adapters
  // If all fail, throws the last error
  console.error('All storage adapters failed:', error);
}
```

## Migration from Legacy WebDatabase

The new system is backward compatible:

```typescript
// Old way (still works)
import { WebDatabase } from './client/submodules/web-database.js';

// New way (recommended)
import { WebDatabase } from './storage/index.js';
```

## Adding New Storage Types

To add a new storage adapter:

1. Implement the `StorageAdapter` interface:

```typescript
export class CustomStorageAdapter implements StorageAdapter {
  // Implementation
}
```

2. Add to the factory:

```typescript
// In storage-adapter.ts
static createAdapter(type: 'custom' | 'opfs' | 'memory' | 'indexeddb') {
  switch (type) {
    case 'custom':
      return new CustomStorageAdapter(config);
    // ... other cases
  }
}
```

3. Update type definitions:

```typescript
type AdapterType = 'opfs' | 'memory' | 'indexeddb' | 'custom';
```

## Examples

See `src/storage/examples/adapter-usage-example.ts` for comprehensive usage examples.

## Troubleshooting

### OPFS Access Handle Conflicts

If you encounter "Access Handles cannot be created" errors:

1. The system automatically detects and clears lingering handles
2. If persistent, try refreshing the page
3. As a last resort, the system will fall back to memory storage

### Storage Not Available

Check browser compatibility:

```typescript
const adapters = StorageAdapterFactory.getAvailableAdapters();
adapters.forEach(adapter => {
  console.log(`${adapter.getName()}: ${adapter.isAvailable()}`);
});
```

### Performance Issues

- Use OPFS for best performance
- IndexedDB for broader compatibility
- Memory for temporary operations

## Browser Support

| Storage Type | Chrome | Firefox | Safari | Edge |
|-------------|--------|---------|--------|------|
| OPFS        | 86+    | 111+    | 16.4+  | 86+  |
| IndexedDB   | 24+    | 16+     | 10+    | 12+  |
| Memory      | All    | All     | All    | All  |
