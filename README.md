# WordNet TypeScript

TypeScript ecosystem for WordNet data across browsers, Node.js, and CLI.

## Status

**Production Ready** - Core functionality is stable and well-tested.

- **wn-ts-core**: v0.5.2 - Foundation library
- **wn-ts-web**: v0.7.2 - Browser implementation  
- **wn-ts-node**: v0.7.2 - Node.js implementation
- **wn-cli**: v0.7.2 - Command-line interface

## Quick Start

```bash
# Web applications
npm install wn-ts-web @sqlite.org/sqlite-wasm

# Node.js applications  
npm install wn-ts-node

# Command line tools
npm install -g wn-cli
```

## Usage

### Web
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wordnet = new WebWordNetKernel('oewn:2024');
await wordnet.initialize();

const words = await wordnet.words({ form: 'computer' });
const synsets = await wordnet.synsets({ wordId: words[0].id });
const hypernyms = await wordnet.getHypernyms(synsets[0].id);

await wordnet.close();
```

### Node.js
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();

const words = await wordnet.words({ form: 'computer' });
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const translations = await wordnet.getTranslations(synsetId, 'fr');

await wordnet.close();
```

## Features

- **Microkernel Architecture** - Plugin-based design
- **Cross-Platform** - Works in browsers and Node.js
- **Type Safety** - Full TypeScript support
- **Cross-Lingual** - Multi-language support with ILI
- **Performance** - Optimized query strategies
- **Real Data** - Processes actual WordNet LMF XML

## Packages

- **[wn-ts-core](./packages/wn-ts-core/)** - Foundation library
- **[wn-ts-web](./packages/wn-ts-web/)** - Browser implementation
- **[wn-ts-node](./packages/wn-ts-node/)** - Node.js implementation
- **[wn-cli](./packages/wn-cli/)** - Command-line interface
- **[wn-data-loader](./packages/wn-data-loader/)** - Data loading utilities

## Examples

- **[Web Examples](./examples/web/)** - Browser demos
- **[Node Examples](./examples/node/)** - Server-side examples
- **[Integration Examples](./docs/examples/)** - Cross-lingual workflows

## Development

```bash
# Setup
git clone https://github.com/fustilio/wordnet-playground.git
cd wordnet-playground
pnpm install
pnpm build

# Test
pnpm test

# Run examples
pnpm demo:all-use-cases
```

## Performance

Query performance varies by strategy:
- **V1 (Default)**: ~1,000 Hz
- **V5 (Cached)**: ~50,000+ Hz  
- **V6 (Memory-opt)**: ~1,000+ Hz

Memory usage: < 2x input size for processing.

## Documentation

- [Documentation Site](./docs/) - Comprehensive guides and API reference
- [Getting Started](./docs/getting-started/) - Quick start guides
- [API Reference](./docs/api/) - Complete API documentation
- [Examples](./docs/examples/) - Working code examples

## License

MIT License - see [LICENSE](./LICENSE) file.