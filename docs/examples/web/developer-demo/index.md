---
title: Developer Web Demo
description: Advanced features demonstration with full functionality
---

# Developer Web Demo

Advanced features demonstration with full functionality showcasing the complete WordNet TypeScript ecosystem capabilities.

## Features

- Interactive word exploration
- Relationship browsing (hypernyms, hyponyms, etc.)
- Cross-lingual translation
- Performance benchmarking
- Real-time statistics

## Quick Start

```bash
cd examples/web/developer-demo
pnpm install
pnpm dev
```

## Code Example

```typescript
import { useWordNetContext } from 'wn-ts-web/react';

function DeveloperDemo() {
  const { 
    querySynsets,
    queryWords,
    loadedPackages,
    statistics,
    loading,
    error
  } = useWordNetContext();
  
  const handleAdvancedSearch = async (term: string) => {
    // Use advanced features
    const synsets = await querySynsets(term);
    const words = await queryWords(term);
    console.log('Found synsets:', synsets);
    console.log('Found words:', words);
  };
  
  return (
    <div>
      <div>Loaded packages: {loadedPackages.length}</div>
      <div>Statistics: {JSON.stringify(statistics)}</div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## Further Reading

- **[Web Platform Guide](/platforms/web/)** - Complete web platform documentation
- **[Web API Reference](/api/web/)** - Complete API reference
- **[Web Examples](/examples/web/)** - All web examples

---

**Ready to build advanced web apps? Check out the [Web Platform Guide](/platforms/web/) to get started!**
