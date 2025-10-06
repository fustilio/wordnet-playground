---
title: Project Overview
description: A production-ready TypeScript ecosystem for working with WordNet data
---

# WordNet TypeScript Ecosystem

Production-ready TypeScript ecosystem for WordNet data with microkernel architecture, plugin system, and cross-lingual support.

## Status

- **Core Library**: v0.5.2 - Microkernel architecture with plugin system
- **Web Package**: v1.0.0 - Browser implementation with React integration
- **Node Package**: v1.0.0 - Node.js implementation with SQLite
- **CLI Package**: v0.5.7 - Command-line interface and TUI
- **Data Loader**: v0.1.0 - Data loading utilities
- **Utils**: v0.5.0 - Shared utilities

## Architecture

Microkernel design with plugin system:

- **wn-ts-core**: Foundation library with microkernel and plugin system
- **wn-ts-node**: Node.js implementation with SQLite integration
- **wn-ts-web**: Browser implementation with React components
- **wn-cli**: Command-line interface and TUI

## Quick Start

**Fastest way**: [Quick Start Guide](./quick-start.md) (5 minutes)

**Copy-paste code**: [Hello World Examples](../examples/hello-world/)

**Try examples**:
```bash
# Web example
cd examples/hello-world/web && pnpm install && pnpm dev

# Node.js example  
cd examples/hello-world/node && pnpm install && pnpm start

# CLI example
npm install -g wn-cli && wn-cli search "computer"
```

## Usage

**Node.js** (Recommended API)
```typescript
import { createWordnet } from 'wn-ts-node';

const wn = createWordnet('oewn:2024');
await wn.initialize();
const synsets = await wn.synsets('computer');
await wn.close();
```

**Web** (React Hook - Recommended)
```typescript
import { useWordNetContext } from 'wn-ts-web/react';

function App() {
  const { querySynsets, loading } = useWordNetContext();
  const search = async () => {
    const results = await querySynsets('computer');
    console.log(results);
  };
  if (loading) return <div>Loading...</div>;
  return <button onClick={search}>Search</button>;
}
```

**CLI**
```bash
wn-cli search "computer"
wn-cli define "happy"
wn-cli translate "water" --from en --to fr
```

## Features

- **Microkernel Architecture**: Plugin-based design for extensibility
- **Cross-Platform**: Works in browsers and Node.js
- **Type Safety**: Full TypeScript support
- **Cross-Lingual**: Multi-language support with ILI
- **Performance**: Optimized query strategies

## License

MIT License - see [LICENSE](https://github.com/fustilio/wordnet-playground/blob/main/LICENSE) file for details.

## Contributing

We welcome contributions! Please see our contributing guidelines and development standards in the [documentation](./development/) directory.

