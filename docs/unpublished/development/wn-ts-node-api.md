# WordNet Node.js API - Simplified & Type-Safe

## 🚀 Quick Start

```typescript
import { createWordnet } from 'wn-ts-node';

// Default persistent storage (recommended)
const wordnet = createWordnet('oewn:2024');
await wordnet.initialize();

// In-memory database (perfect for testing)
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// Custom database location
const wordnet = createWordnet('oewn:2024', { 
  filename: '/path/to/my/wordnet.db' 
});
```

## 📋 Configuration Options

### Database Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `'persistent'` | Store in file system (default) | Production, development |
| `'memory'` | In-memory only | Testing, temporary data |
| `'temp'` | Temporary file (deleted on exit) | One-time processing |

### Complete Configuration

```typescript
interface NodeWordnetConfig {
  // 🗄️ Database Storage
  mode?: DatabaseMode;           // Storage mode (default: 'persistent')
  filename?: string;             // Database file path
  
  // 🔄 Migrations & Backups
  migrations?: {
    enabled?: boolean;           // Enable migrations (default: true)
    backup?: boolean;            // Backup before migrations (default: false)
  };
  
  // ⚙️ Database Options
  forceRecreate?: boolean;       // Force recreation
  readonly?: boolean;            // Read-only mode
  verbose?: boolean;             // Verbose logging
  timeout?: number;              // Connection timeout
  
  // 🔍 Query Options
  strategy?: QueryStrategy;      // Query strategy
  // ... other WordNet options
}
```

## 🎯 Usage Examples

### Production Setup
```typescript
// ✅ Default persistent storage
const wordnet = createWordnet('oewn:2024');

// ✅ With backup enabled for safety
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }
});
```

### Development & Testing
```typescript
// 🧪 In-memory database (no files)
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// 🗂️ Custom location for development
const wordnet = createWordnet('oewn:2024', {
  filename: './dev-wordnet.db',
  verbose: true
});
```

### Advanced Scenarios
```typescript
// 📦 Multiple lexicons
const wordnet = createWordnet(['oewn:2024', 'omw-en:1.4']);

// 🔒 Read-only mode
const wordnet = createWordnet('oewn:2024', { readonly: true });

// 🎛️ Full control
const wordnet = createWordnet('oewn:2024', {
  filename: '/custom/path/wordnet.db',
  mode: 'persistent',
  migrations: { enabled: true, backup: true },
  forceRecreate: false,
  verbose: true,
  strategy: 'fuzzy'
});
```

## 🔧 Schema Migration System

### ✅ Automatic & Safe

- **Zero Configuration**: Works out of the box
- **Automatic Detection**: Checks for missing columns
- **Safe Execution**: Only adds missing columns, never removes data
- **Error Handling**: Graceful fallback if migration fails
- **Backup Support**: Optional pre-migration backups

### How It Works

1. **Startup**: Database initializes normally
2. **Detection**: System checks for missing columns
3. **Migration**: Adds missing columns if needed
4. **Backup**: Optional backup before changes
5. **Ready**: Database is ready to use

## 🎨 TypeScript Support

### Excellent IntelliSense

```typescript
const wordnet = createWordnet('oewn:2024', {
  mode: 'persistent',        // ← TypeScript autocomplete
  filename: './db.sqlite',   // ← Type checking
  migrations: {              // ← Nested object support
    backup: true             // ← Boolean validation
  }
});
```

### Type Safety

- **Compile-time validation** of all options
- **IntelliSense support** for all configuration properties
- **Type inference** for database modes and strategies
- **Error prevention** through strict typing

## 🚀 Performance

### Optimized for Different Use Cases

- **Persistent Mode**: Fast file I/O with SQLite optimizations
- **Memory Mode**: Ultra-fast in-memory operations
- **Temp Mode**: Balanced performance for temporary data

### Migration Performance

- **Lazy Migration**: Only runs when needed
- **Minimal Impact**: Adds columns without data migration
- **Backup Efficiency**: Only backs up when necessary

## 🔍 Debugging

### Verbose Logging

```typescript
const wordnet = createWordnet('oewn:2024', {
  verbose: true  // See SQL queries and operations
});
```

### Error Handling

```typescript
try {
  const wordnet = createWordnet('oewn:2024');
  await wordnet.initialize();
} catch (error) {
  console.error('Database initialization failed:', error);
}
```

## 📚 Migration from Legacy API

### Before (Complex)
```typescript
// Old way - multiple functions, confusing options
const wordnet = new KyselyWordnet('oewn:2024', {
  filename: '/path/to/db',
  persistent: true,
  enableMigrations: true,
  backupBeforeMigration: false
});
```

### After (Simple)
```typescript
// New way - one function, clear options
const wordnet = createWordnet('oewn:2024', {
  filename: '/path/to/db',
  mode: 'persistent',
  migrations: { backup: false }
});
```

## 🎯 Best Practices

### Production
```typescript
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }  // Enable backups
});
```

### Testing
```typescript
const wordnet = createWordnet('oewn:2024', {
  mode: 'memory'  // No file system dependencies
});
```

### Development
```typescript
const wordnet = createWordnet('oewn:2024', {
  filename: './dev.db',
  verbose: true,  // See what's happening
  migrations: { backup: true }
});
```

## 🔗 Related

- [Database Persistence Guide](../../guides/database-persistence.md)
- [API Reference](../../api/)
- [Examples](../../examples/)
