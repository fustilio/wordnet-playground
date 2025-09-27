# API Reference

Complete API documentation for the WordNet TypeScript ecosystem.

## Quick Reference

- **[Unified API](./UNIFIED_API.md)** - Complete API reference for all packages

## Package APIs

### Core
- **[wn-ts-core](../../packages/wn-ts-core/README.md)** - Foundation library with microkernel architecture

### Platforms
- **[wn-ts-web](../../packages/wn-ts-web/README.md)** - Browser implementation with React integration
- **[wn-ts-node](../../packages/wn-ts-node/README.md)** - Node.js implementation with SQLite
- **[wn-cli](../../packages/wn-cli/README.md)** - Command-line interface and TUI

### Utilities
- **[wn-data-loader](../../packages/wn-data-loader/README.md)** - Data loading and processing
- **[utils](../../packages/utils/README.md)** - Shared utilities and logging

## Common Patterns

### Error Handling
```typescript
try {
  const words = await queryWords('computer');
} catch (error) {
  if (error.message.includes('Worker not available')) {
    console.error('Web Worker not supported');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Data Loading
```typescript
// Web
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');

// Node.js
import { download, add } from 'wn-ts-node';
await download('oewn:2024');
await add('oewn:2024');
```

## Further Reading

- [Getting Started Guide](../getting-started/README.md) - Quick setup and basic usage
- [Examples](../examples/README.md) - Working code examples
- [Architecture Guide](../architecture/SYSTEM_ARCHITECTURE.md) - System design details