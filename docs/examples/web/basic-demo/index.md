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
import { useWordnet } from './hooks/useWordnet';

function BasicDemo() {
  const { getDefinitions, loading, error, ready } = useWordnet({ lang: 'en-US' });
  
  const handleSearch = async (term: string) => {
    const definitions = await getDefinitions(term);
    console.log('Found definitions:', definitions);
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
