---
title: Node.js Examples
description: Server-side WordNet operations and use cases
---

# Node.js Examples

Server-side WordNet operations demonstrating core functionality.

> **Note**: All Node.js examples are located in `examples/node/wn-ts-node-demo/`

## Quick Start

**Hello World** (simplest - 12 lines):
```bash
cd examples/hello-world/node
pnpm install
pnpm start
```

**All Examples** (comprehensive use cases):
```bash
cd examples/node/wn-ts-node-demo
pnpm install
pnpm test
```

## Available Examples

### Basic Examples

Located in `src/examples/basic/`:

- **`python-style-wordnet.js`** - API patterns similar to Python `wn` library
- **`word-sense-disambiguation.js`** - Understanding polysemous words
- **`database-statistics.js`** - Quick database overview
- **`multilingual-definitions.js`** - Cross-language definitions

Run with:
```bash
pnpm example:python-style
pnpm example:word-sense-disambiguation
pnpm example:database-statistics
pnpm example:multilingual-definitions
```

### Advanced Examples

Located in `src/examples/advanced/`:

- **`multilingual-linking.js`** - Cross-language concept mapping
- **`lexical-database-exploration.js`** - Resource discovery
- **`word-sense-disambiguation.js`** - Comprehensive polysemy analysis
- **`database-statistics.js`** - Detailed statistics and quality metrics
- **`kitchen-sink-demo.js`** - All features in one demo
- **`live-demo.js`** - Complete workflow from download to query
- **`crossword-demo.js`** - Generate crossword hints

Run with:
```bash
pnpm example:multilingual-linking
pnpm example:lexical-exploration
pnpm kitchen-sink
pnpm demo
```

## Code Example

```typescript
import { createWordnet } from 'wn-ts-node';

async function main() {
  // Initialize WordNet
  const wn = createWordnet('oewn:2024');
  await wn.initialize();
  
  try {
    // Search for synsets
    const synsets = await wn.synsets('computer');
    console.log(`Found ${synsets.length} synsets`);
    
    // Print definitions
    synsets.forEach(s => {
      console.log(`${s.id}: ${s.definitions[0]?.text}`);
    });
    
    // Get statistics
    const stats = await wn.getStatistics();
    console.log(`Database has ${stats.totalWords} words`);
    
  } finally {
    await wn.close();
  }
}

main().catch(console.error);
```

## Example Structure

Each example follows this pattern:

```typescript
import { createWordnet } from 'wn-ts-node';

async function demonstrateFeature() {
  const wn = createWordnet('demo_name');
  await wn.initialize();
  
  try {
    // Demo code here
  } finally {
    await wn.close();
  }
}

demonstrateFeature().catch(console.error);
```

## Helper Functions

All examples use shared helpers from `src/examples/shared/helpers.js`:

```javascript
import { createWordnet, displaySynset, safeClose } from '../shared/helpers.js';

// createWordnet(demoName, options)
// - Handles data directory setup
// - Downloads OEWN/CILI if needed
// - Returns initialized instance

// displaySynset(synset, wordnet, index)
// - Pretty-prints synset information
// - Shows definitions, examples, relations

// safeClose(wordnet, message)
// - Safely closes connection
// - Handles errors gracefully
```

## Data Storage

Examples store data in:
```
~/.wn_{demoName}_demo/
└── wn.db
```

To clean up:
```bash
rm -rf ~/.wn_*_demo
```

## Further Reading

- **[Node.js Platform Guide](/platforms/node/)** - Complete platform documentation
- **[Node.js API Reference](/api/node/)** - Complete API reference
- **[Hello World](../../examples/hello-world/node/)** - Minimal example

---

**Ready to build? Start with [Hello World](../../examples/hello-world/node/) then explore these comprehensive examples!**
