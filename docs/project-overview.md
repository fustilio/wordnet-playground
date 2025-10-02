---
title: Project Overview
description: A production-ready TypeScript ecosystem for working with WordNet data
---

# WordNet TypeScript Ecosystem

Production-ready TypeScript ecosystem for WordNet data with microkernel architecture, plugin system, and cross-lingual support.

## Status

- **Core Library**: v0.6.3 - Microkernel architecture with plugin system
- **Web Package**: v0.6.3 - Browser implementation with React integration
- **Node Package**: v0.6.3 - Node.js implementation with SQLite
- **CLI Package**: v0.6.3 - Command-line interface and TUI

## Architecture

Microkernel design with plugin system:

- **wn-ts-core**: Foundation library with microkernel and plugin system
- **wn-ts-node**: Node.js implementation with SQLite integration
- **wn-ts-web**: Browser implementation with React components
- **wn-cli**: Command-line interface and TUI

## Quick Start

```bash
pnpm install
pnpm test
pnpm demo:all-use-cases
```

## Usage

**Node.js**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

**Web**
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wordnet = new WebWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

**CLI**
```bash
wn-cli search "computer"
wn-cli define "computer"
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

