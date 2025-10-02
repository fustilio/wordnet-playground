---
title: Basic Node.js Demo
description: Simple server-side WordNet operations and CLI tools
---

# Basic Node.js Demo

Simple server-side WordNet operations and CLI tools demonstrating Node.js platform functionality.

## Features

- Word search and lookup
- Database statistics
- Multilingual definitions
- Python-style WordNet interface

## Quick Start

```bash
cd examples/node/basic-demo
pnpm install
pnpm run all-use-cases
```

## Code Example

```typescript
import { createWordnet } from './shared/helpers.js';

async function basicDemo() {
  const wordnet = await createWordnet('basic_demo');
  
  try {
    // Search for words
    const words = await wordnet.words({ form: 'computer' });
    console.log('Found words:', words);
    
    // Get synsets
    const synsets = await wordnet.synsets({ wordId: words[0].id });
    console.log('Found synsets:', synsets);
  } finally {
    await wordnet.close();
  }
}

basicDemo().catch(console.error);
```

## Further Reading

- **[Node.js Platform Guide](/platforms/node/)** - Complete Node.js platform documentation
- **[Node.js API Reference](/api/node/)** - Complete API reference
- **[Node.js Examples](/examples/node/)** - All Node.js examples

---

**Ready to build server-side apps? Check out the [Node.js Platform Guide](/platforms/node/) to get started!**
