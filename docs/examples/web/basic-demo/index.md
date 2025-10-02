---
title: Basic Web Demo
description: Simple word search and exploration interface
---

# Basic Web Demo

Simple word search and exploration interface demonstrating basic WordNet functionality in the browser.

## Features

- Word lookup and search
- Synset browsing
- Definition display
- Clean, minimal interface

## Quick Start

```bash
cd examples/web/basic-demo
pnpm install
pnpm dev
```

## Code Example

```typescript
import { useWordNetKernel } from 'wn-ts-web/react';

function BasicDemo() {
  const { words, synsets, loading, error, ready } = useWordNetKernel();
  
  const handleSearch = async (term: string) => {
    const wordResults = await words({ form: term });
    const synsetResults = await synsets({ form: term });
    console.log('Found words:', wordResults);
    console.log('Found synsets:', synsetResults);
  };
  
  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {ready && <div>Ready to search!</div>}
    </div>
  );
}
```

## Further Reading

- **[Web Platform Guide](/platforms/web/)** - Complete web platform documentation
- **[Web API Reference](/api/web/)** - Complete API reference
- **[Web Examples](/examples/web/)** - All web examples

---

**Ready to build your web app? Check out the [Web Platform Guide](/platforms/web/) to get started!**
