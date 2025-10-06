# OPFS Troubleshooting Guide

This guide helps you resolve OPFS (Origin Private File System) access handle conflicts and locking issues.

## Understanding the Problem

The error `NoModificationAllowedError: Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': Access Handles cannot be created if there is another open Access Handle or Writable stream associated with the same file` occurs when:

1. **Multiple browser tabs** are trying to access the same OPFS file
2. **Previous browser sessions** left access handles open
3. **Browser crashes** or unexpected closures left handles in an inconsistent state
4. **Development server restarts** while OPFS handles are still open

## Automatic Solutions

The storage adapter system now includes several automatic solutions:

### 1. Aggressive Cleanup Strategies
When a lingering handle is detected, the system tries multiple cleanup strategies:

- **Strategy 1**: Wait and test database creation
- **Strategy 2**: Try writable stream approach
- **Strategy 3**: Force garbage collection and extended wait
- **Strategy 4**: Read-only file access

### 2. Multiple Instance Coordination
The system uses localStorage to coordinate between multiple instances trying to access the same file.

### 3. Progressive Fallback
If OPFS fails, the system automatically falls back to:
1. IndexedDB (if available)
2. Memory storage (always available)

### 4. Enhanced Retry Logic
- Smart delays between retry attempts
- Exponential backoff for lock errors
- Force clear and nuclear clear options

## Manual Solutions

If automatic cleanup fails, you can use manual utilities:

### Browser Console Utilities

```javascript
// Check OPFS status
await window.opfsCleanup.status()

// Try manual cleanup
await window.opfsCleanup.manual()

// Nuclear cleanup (deletes all OPFS files)
await window.opfsCleanup.nuclear()
```

### Programmatic Usage

```typescript
import { 
  manualOpfsCleanup, 
  nuclearOpfsCleanup, 
  checkOpfsStatus 
} from './storage/index.js';

// Check status
const status = await checkOpfsStatus();
console.log('OPFS Status:', status);

// Try manual cleanup
const result = await manualOpfsCleanup();
console.log('Cleanup Result:', result);

// Nuclear cleanup (use with caution)
const nuclearResult = await nuclearOpfsCleanup();
console.log('Nuclear Cleanup:', nuclearResult);
```

## Prevention Strategies

### 1. Proper Cleanup
Always ensure proper cleanup when closing your application:

```typescript
// In your React component
useEffect(() => {
  return () => {
    // This will be called when component unmounts
    workerClient.dispose().catch(console.error);
  };
}, []);
```

### 2. Single Instance Pattern
Use the singleton pattern to ensure only one instance accesses OPFS:

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

### 3. Graceful Degradation
Always have fallback options:

```typescript
const database = new WebDatabase({
  preferredAdapter: 'opfs' // Will fallback to IndexedDB, then Memory
});
```

## Browser-Specific Issues

### Chrome/Edge
- OPFS is fully supported
- Access handles are properly cleaned up on tab close
- Issues usually occur during development with hot reloading

### Firefox
- OPFS support added in version 111
- May have different cleanup behavior
- Consider using IndexedDB as primary storage

### Safari
- OPFS support added in version 16.4
- May have different behavior with access handles
- Consider using IndexedDB as primary storage

## Development vs Production

### Development
- Hot reloading can cause handle conflicts
- Use `preferredAdapter: 'memory'` for development
- Enable verbose logging to debug issues

### Production
- Use `preferredAdapter: 'opfs'` for best performance
- Implement proper cleanup in your application
- Monitor for OPFS errors and fallback gracefully

## Debugging

### Enable Verbose Logging
```typescript
const database = new WebDatabase({
  preferredAdapter: 'opfs',
  adapterConfig: {
    verbose: true
  }
});
```

### Check Browser Console
Look for these log messages:
- `⚠️ [OpfsStorageAdapter] Detected potential lingering OPFS access handle`
- `✅ [OpfsStorageAdapter] Successfully cleared lingering OPFS access handle`
- `❌ [OpfsStorageAdapter] Failed to create OPFS database`

### Use Browser DevTools
1. Open DevTools → Application → Storage
2. Check "Origin private file system"
3. Look for your database file
4. Try to delete it manually if needed

## Common Solutions

### Solution 1: Refresh the Page
The simplest solution is often to refresh the page, which clears all access handles.

### Solution 2: Close Other Tabs
Close other tabs that might be using the same OPFS file.

### Solution 3: Clear OPFS Storage
Use the nuclear cleanup utility to clear all OPFS files:

```javascript
await window.opfsCleanup.nuclear();
```

### Solution 4: Switch to IndexedDB
If OPFS continues to cause issues, switch to IndexedDB:

```typescript
const database = new WebDatabase({
  preferredAdapter: 'indexeddb'
});
```

### Solution 5: Use Memory Storage
For temporary data or development, use memory storage:

```typescript
const database = new WebDatabase({
  preferredAdapter: 'memory'
});
```

## Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `NoModificationAllowedError` | Access handle conflict | Try manual cleanup or refresh page |
| `SQLITE_BUSY` | Database is locked | Wait and retry, or use fallback storage |
| `GetSyncHandleError` | Cannot create sync handle | Try aggressive cleanup strategies |

## Best Practices

1. **Always implement proper cleanup** in your application
2. **Use the singleton pattern** to prevent multiple instances
3. **Implement graceful fallbacks** when OPFS fails
4. **Monitor for errors** and log them appropriately
5. **Test with multiple tabs** to ensure proper coordination
6. **Use appropriate storage** for your use case (OPFS for persistence, Memory for temporary)

## Getting Help

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Use the debugging utilities to understand the current state
3. Try the manual cleanup utilities
4. Consider switching to IndexedDB or Memory storage
5. Check if the issue is browser-specific

The storage adapter system is designed to handle most OPFS issues automatically, but these manual tools are available when needed.
