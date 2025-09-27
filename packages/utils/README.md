# utils

Shared utilities and logging for the WordNet TypeScript ecosystem.

## Features

- **Logging System** - Comprehensive logging with scoped loggers and multiple levels
- **Download Utilities** - File download with retry logic and progress tracking
- **Archive Utilities** - Tar, XZ, and GZ extraction and compression
- **Package ID Management** - Parse, format, and validate package identifiers
- **Error Handling** - Custom error classes with proper error context
- **Validation** - Data validation and type checking utilities
- **Performance** - Timing and memory monitoring utilities

## Installation

```bash
npm install @wordnet-ts/utils
```

## Usage

### Logging
```typescript
import { logger, createScopedLogger, setGlobalLogLevel } from '@wordnet-ts/utils';

// Global logger
logger.info('Application started');
logger.warn('Deprecated API used');
logger.error('Operation failed', { error: 'Details' });

// Scoped logger
const scopedLogger = createScopedLogger('MyComponent');
scopedLogger.debug('Component initialized');
scopedLogger.success('Operation completed');
scopedLogger.fail('Operation failed', error);

// Set log level
setGlobalLogLevel('debug');
```

### Download Utilities
```typescript
import { downloadFile, DownloadError } from '@wordnet-ts/utils';

try {
  const data = await downloadFile('https://example.com/wordnet.xml', {
    timeout: 30000,
    retries: 3
  });
} catch (error) {
  if (error instanceof DownloadError) {
    console.error('Download failed:', error.message);
  }
}
```

### Package ID Management
```typescript
import { 
  parsePackageId, 
  formatPackageId, 
  isValidPackageId 
} from '@wordnet-ts/utils';

// Parse package ID
const parsed = parsePackageId('oewn:2024');
console.log(parsed); // { base: 'oewn', version: '2024' }

// Format package ID
const formatted = formatPackageId({ base: 'oewn', version: '2024' });
console.log(formatted); // 'oewn:2024'

// Validate package ID
const isValid = isValidPackageId('oewn:2024');
console.log(isValid); // true
```

### Error Handling
```typescript
import { 
  WnError, 
  DatabaseError, 
  ConfigurationError 
} from '@wordnet-ts/utils';

// Create custom errors
throw new WnError('Operation failed');
throw new DatabaseError('Connection failed', 'SELECT * FROM words');
throw new ConfigurationError('Invalid config', { setting: 'database' });
```

## Log Levels

- `trace` - Detailed trace information
- `debug` - Debug information
- `info` - General information
- `warn` - Warning messages
- `error` - Error messages
- `silent` - No logging

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Examples](../../docs/examples/README.md)
- [Getting Started](../../docs/getting-started/README.md)
