# Standalone Node.js Example

**This example works with npm** - no workspace required.

## Quick Start

```bash
npm install
npm start
```

## What's Different

This is a **standalone version** of the hello-world example:

| Feature | Workspace Version | Standalone Version |
|---------|-------------------|-------------------|
| **Dependencies** | `"wn-ts-node": "workspace:*"` | `"wn-ts-node": "^0.7.2"` |
| **Package manager** | pnpm required | npm/yarn/pnpm all work |
| **Catalog refs** | `"typescript": "catalog:"` | `"typescript": "^5.7.0"` |
| **Installation** | Must be in monorepo | Works anywhere |

## Copy This to Your Project

**Just copy these files**:
```
your-project/
├── package.json  # Copy from this example
├── index.ts      # Copy from this example
└── tsconfig.json # Optional (tsx works without it)
```

Then:
```bash
npm install
npm start
```

That's it!

## The Code

```typescript
import { createWordnet } from 'wn-ts-node';

async function main() {
  const wn = createWordnet('oewn:2024');
  
  try {
    await wn.initialize();
    const synsets = await wn.synsets('computer');
    console.log(`Found ${synsets.length} synsets`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await wn.close();
  }
}

main();
```

## Customize It

### Add Error Handling

```typescript
// Better error messages
} catch (error) {
  if (error.message.includes('Network')) {
    console.error('Download failed. Check your internet connection.');
  } else if (error.message.includes('not initialized')) {
    console.error('Database initialization failed. Try: rm -rf ~/.wn_data');
  } else {
    console.error('Error:', error.message);
  }
  process.exit(1);
}
```

### Add CLI Arguments

```typescript
const searchTerm = process.argv[2] || 'computer';
const synsets = await wn.synsets(searchTerm);
console.log(`Found ${synsets.length} synsets for "${searchTerm}"`);
```

### Add Multiple Lexicons

```typescript
const wn = createWordnet(['oewn:2024', 'omw-fr:1.4']);
await wn.initialize();

// Search English
const enSynsets = await wn.synsets('computer', { language: 'en' });

// Search French  
const frSynsets = await wn.synsets('ordinateur', { language: 'fr' });
```

## Next Steps

- [Express.js REST API](../node-server/) - Production server example
- [Error Handling Guide](../../../docs/error-handling.md) - Best practices
- [API Reference](../../../docs/api/api-reference.md) - All methods

