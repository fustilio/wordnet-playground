# 🚀 WordNet Demo Logger - Super Simple & Powerful Logging

The WordNet Demo Logger makes logging **10x easier** than `console.log` while giving you **10x more power**. It automatically handles timestamps, component labels, grouping, timing, and formatting.

## ✨ Features

- **🕒 Auto-timestamps** - Every log includes precise timing
- **🏷️ Component labels** - Automatically shows which component logged the message
- **📊 Structured data** - Easy key=value logging with automatic JSON formatting
- **🎯 Log levels** - Control verbosity (trace, debug, info, warn, error, silent)
- **🚀 Operation grouping** - Collapsible console groups for complex operations
- **⏱️ Auto-timing** - Start/end operations with automatic duration measurement
- **📍 Step logging** - Show progress within operations
- **✅ Success/failure** - Special methods for common logging patterns
- **💾 Persistent settings** - Log level persists across browser sessions

## 🚀 Quick Start

### 1. Create a Logger

```typescript
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('MyComponent');
```

### 2. Start Logging

```typescript
// Simple logging
logger.log('Button clicked', { buttonId: 'save' });

// Success/failure
logger.success('Data loaded', { recordCount: 150 });
logger.fail('API call failed', error);

// Operations with timing
logger.start('loading data');
logger.step('connecting to server');
logger.step('downloading file', { size: '2.5MB' });
logger.end('loading data', { totalRecords: 1000 });
```

## 📚 API Reference

### Basic Methods

#### `logger.log(message, data?)`
Simple logging - just like `console.log` but better formatted.

```typescript
logger.log('User clicked button', { buttonId: 'save', timestamp: Date.now() });
// Output: 14:23:45.123 ℹ️ [MyComponent] User clicked button { buttonId: 'save', timestamp: 1703123456789 }
```

#### `logger.success(message, fields?)`
Log success messages with ✅ icon.

```typescript
logger.success('User logged in successfully', { userId: 123, method: 'oauth' });
// Output: ✅ 14:23:45.123 ℹ️ [MyComponent] User logged in successfully | userId=123 method="oauth"
```

#### `logger.fail(message, error?)`
Log failure messages with ❌ icon.

```typescript
logger.fail('Login failed', error);
// Output: ❌ 14:23:45.123 ❌ [MyComponent] Login failed [Error object]
```

### Operation Lifecycle Methods

#### `logger.start(operation)`
Start an operation - creates a grouped log entry with 🚀 icon.

```typescript
logger.start('database query');
// Creates a collapsible group in console
```

#### `logger.step(step, data?)`
Log a step within an operation - shows progress with 📍 icon.

```typescript
logger.step('connecting to database');
logger.step('executing query', { sql: 'SELECT * FROM users' });
logger.step('processing results');
```

#### `logger.end(operation, result?)`
End an operation - completes the grouped log entry with ✅ icon.

```typescript
logger.end('database query', { recordCount: 25, duration: '150ms' });
// Closes the group and shows results
```

### Traditional Methods

#### `logger.info(message, fields?)`
Log at info level with structured data.

```typescript
logger.info('Processing user data', { userId: 123, action: 'update' });
```

#### `logger.warn(message, fields?)`
Log warnings with ⚠️ icon.

```typescript
logger.warn('User session expiring soon', { userId: 123, expiresIn: '5m' });
```

#### `logger.error(message, fields?)`
Log errors with ❌ icon.

```typescript
logger.error('Database connection failed', { retryCount: 3, lastError: 'timeout' });
```

#### `logger.debug(message, fields?)`
Log debug information with 🐛 icon.

```typescript
logger.debug('Component state updated', { prevState: oldState, newState: newState });
```

#### `logger.trace(message, fields?)`
Log trace information with 🔍 icon.

```typescript
logger.trace('Function called', { functionName: 'handleClick', args: [event] });
```

### Console Utility Methods

#### `logger.time(label)` / `logger.timeEnd(label)`
Manual timing control.

```typescript
logger.time('custom-operation');
// ... do work ...
logger.timeEnd('custom-operation');
```

#### `logger.group(label)` / `logger.groupEnd()`
Manual group control.

```typescript
logger.group('Custom Group');
// ... logs ...
logger.groupEnd();
```

#### `logger.table(data, columns?)`
Display data in table format.

```typescript
logger.table(users, ['id', 'name', 'email']);
```

#### `logger.count(label)` / `logger.countReset(label)`
Count occurrences.

```typescript
logger.count('button-clicks');
logger.countReset('button-clicks');
```

## 🎯 Usage Patterns

### Pattern 1: Simple Component Logging

```typescript
const logger = createScopedLogger('UserProfile');

// Component lifecycle
logger.log('Component mounted');
logger.log('User data loaded', { userId: 123, name: 'John' });

// User interactions
logger.log('Edit button clicked');
logger.log('Form submitted', { formData: { name: 'Jane', email: 'jane@example.com' } });
```

### Pattern 2: Operation with Progress

```typescript
const logger = createScopedLogger('DataLoader');

logger.start('loading user data');
logger.step('connecting to API');
logger.step('fetching user profile', { userId: 123 });
logger.step('parsing response');
logger.step('updating state');
logger.end('loading user data', { success: true, duration: '250ms' });
```

### Pattern 3: Success/Failure Handling

```typescript
const logger = createScopedLogger('AuthService');

try {
  const user = await login(credentials);
  logger.success('User logged in', { userId: user.id, method: 'password' });
} catch (error) {
  logger.fail('Login failed', error);
}
```

### Pattern 4: Complex Operations

```typescript
const logger = createScopedLogger('BackupManager');

logger.start('creating backup');
logger.step('validating data', { recordCount: 15000 });
logger.step('compressing data', { originalSize: '50MB', compressedSize: '15MB' });
logger.step('encrypting backup', { algorithm: 'AES-256' });
logger.step('uploading to storage', { destination: 'cloud-backup' });
logger.end('creating backup', { 
  backupId: 'backup-2024-01-15',
  totalSize: '15MB',
  duration: '2.5s'
});
```

## ⚙️ Configuration

### Log Levels

Control what gets logged globally:

```typescript
import { setGlobalLogLevel, getGlobalLogLevel } from '../logger';

// Set log level
setGlobalLogLevel('debug');  // Show debug and above
setGlobalLogLevel('warn');   // Show only warnings and errors
setGlobalLogLevel('silent'); // Turn off all logging

// Get current level
const currentLevel = getGlobalLogLevel();
console.log(`Current log level: ${currentLevel}`);
```

**Available levels:**
- `trace` - Show everything (most verbose)
- `debug` - Show debug and above
- `info` - Show info and above (default)
- `warn` - Show only warnings and errors
- `error` - Show only errors
- `silent` - Show nothing

### Persistent Settings

Log level automatically persists in localStorage and can be set via environment variable:

```typescript
// Set via environment variable (in your build config)
globalThis.LOG_LEVEL = 'debug';

// Or set programmatically
setGlobalLogLevel('debug');
```

## 🎨 Console Output Examples

### Simple Log
```
14:23:45.123 ℹ️ [UserProfile] Component mounted
```

### Success Log
```
✅ 14:23:45.123 ℹ️ [AuthService] User logged in successfully | userId=123 method="oauth"
```

### Operation Group
```
🚀 14:23:45.123 ℹ️ [DataLoader] Starting: loading user data
  📍 connecting to API
  📍 fetching user profile userId=123
  📍 parsing response
  📍 updating state
✅ 14:23:45.456 ℹ️ [DataLoader] Completed: loading user data | success=true duration="250ms"
```

### Error Log
```
❌ 14:23:45.789 ❌ [AuthService] Login failed [Error: Invalid credentials]
```

## 🔧 Advanced Usage

### Custom Timing

```typescript
logger.start('custom operation');
logger.time('sub-operation');
// ... do work ...
logger.timeEnd('sub-operation');
logger.end('custom operation');
```

### Conditional Logging

```typescript
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug info only in dev mode');
}
```

### Batch Operations

```typescript
logger.start('batch processing');
items.forEach((item, index) => {
  logger.step(`processing item ${index + 1}/${items.length}`, { itemId: item.id });
  // ... process item ...
});
logger.end('batch processing', { processed: items.length, success: true });
```

## 🚀 Migration from console.log

### Before (Old Way)
```typescript
console.log('User clicked button:', { buttonId: 'save', timestamp: Date.now() });
console.time('operation');
// ... do work ...
console.timeEnd('operation');
console.group('Complex Operation');
console.log('Step 1 completed');
console.log('Step 2 completed');
console.groupEnd();
```

### After (New Way)
```typescript
const logger = createScopedLogger('MyComponent');

logger.log('User clicked button', { buttonId: 'save', timestamp: Date.now() });
logger.start('Complex Operation');
logger.step('Step 1 completed');
logger.step('Step 2 completed');
logger.end('Complex Operation');
```

## 🎯 Best Practices

1. **Use descriptive component names** - `createScopedLogger('UserProfile')` not `createScopedLogger('comp')`
2. **Group related operations** - Use `start()`/`end()` for multi-step processes
3. **Include relevant data** - Log context that helps with debugging
4. **Use appropriate levels** - `debug` for development, `info` for user actions, `warn` for issues, `error` for failures
5. **Keep messages concise** - Clear, actionable log messages
6. **Structure your data** - Use objects for complex data, simple values for basic info

## 🔍 Troubleshooting

### Logs not appearing?
- Check log level: `getGlobalLogLevel()`
- Ensure component label is set: `createScopedLogger('ComponentName')`
- Check browser console for errors

### Performance concerns?
- Use `silent` level in production: `setGlobalLogLevel('silent')`
- Log level is checked before any processing
- Structured data is only processed when needed

### Console groups not working?
- Ensure `start()` and `end()` are called in pairs
- Check that `end()` is called in finally blocks for error handling

---

**Happy Logging! 🎉**

The WordNet Demo Logger makes debugging and monitoring your application a breeze while keeping your code clean and readable.
