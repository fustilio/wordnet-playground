# Hello World - Node.js Example

The simplest possible Node.js application using WordNet TypeScript.

## What This Does

Searches for "computer", prints the first 3 definitions to console, then exits. **16 lines total.**

## Prerequisites

**pnpm required** (workspace example):
```bash
npm install -g pnpm
```

## Run It

```bash
pnpm install
pnpm start
```

## 📦 Standalone Version (No Workspace)

**Copying to your own project?** Replace `package.json` dependencies:

```json
{
  "dependencies": {
    "wn-ts-node": "^0.7.2"  // not "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "@types/node": "^20.0.0",   // not "catalog:"
    "typescript": "^5.7.0"       // not "catalog:"
  }
}
```

Then use npm normally:
```bash
npm install
npm start
```

## Output

```
Found 3 synsets for "computer":

1. oewn-computer-n (n)
   a machine for performing calculations automatically

2. oewn-calculator-n (n)
   an expert at calculation

3. oewn-estimator-n (n)
   a person who computes
```

## The Code Explained

```typescript
// 1. Import the factory function
import { createWordnet } from 'wn-ts-node';

// 2. Create instance (auto-downloads data if needed)
const wn = createWordnet('oewn:2024');
await wn.initialize();

// 3. Query synsets
const synsets = await wn.synsets('computer');

// 4. Print results
console.log(`Found ${synsets.length} synsets`);

// 5. Clean up
await wn.close();
```

## What You Learn

1. How to import: `createWordnet` is the recommended factory function
2. How to initialize: Downloads data automatically on first run
3. How to query: `wn.synsets('word')` returns array of synsets
4. How to clean up: Always call `wn.close()` when done

## Data Storage

On first run, WordNet data is downloaded to:
- **Linux/Mac**: `~/.wn_data/`
- **Windows**: `%USERPROFILE%/.wn_data/`

Size: ~50MB compressed, ~200MB uncompressed.

Subsequent runs are instant (data cached).

## Next Steps

**Add more features**:
```typescript
// Search words instead of synsets
const words = await wn.words('run');

// Filter by part of speech
const nouns = await wn.synsets('bank', 'n');
const verbs = await wn.synsets('bank', 'v');

// Get statistics
const stats = await wn.getStatistics();
console.log(`Database has ${stats.totalWords} words`);

// Get related words
const hypernyms = await wn.getHypernyms(synsets[0].id);
```

**Try other examples**:
- [Node.js Examples](../../node/wn-ts-node-demo/) - Use cases and patterns
- [API Server Example](../../node/wn-ts-node-demo/src/examples/advanced/) - REST API

**Read the docs**:
- [Node.js Platform Guide](../../../docs/platforms/node/)
- [Node.js API Reference](../../../docs/api/node/)

