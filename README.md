# WordNet TypeScript

TypeScript ecosystem for WordNet data across browsers, Node.js, and CLI.

## Status

**Current Versions** - Independent package evolution with Changesets.

- **wn-ts-core**: v0.5.2 - Foundation library (types and interfaces)
- **wn-ts-web**: v1.0.0 - Browser implementation  
- **wn-ts-node**: v1.0.0 - Node.js implementation
- **wn-react**: v1.0.0 - React hooks and components
- **wn-cli**: v0.5.7 - Command-line interface
- **wn-data-loader**: v0.1.0 - Data loading utilities
- **utils**: v0.5.0 - Shared utilities

## Quick Start

```bash
# Web applications (React)
npm install wn-react wn-ts-web @sqlite.org/sqlite-wasm

# Node.js applications  
npm install wn-ts-node

# Command line tools
npm install -g wn-cli
```

## Usage

### Web (React - Recommended)
```typescript
import { useWordNet } from 'wn-react';

function App() {
  const { search, loading, error } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const handleSearch = async () => {
    const results = await search('computer');
    console.log(results);
  };
  
  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### Node.js (Recommended)
```typescript
import { createWordnet } from 'wn-ts-node';

// Auto-initializes on first use
const wn = createWordnet('oewn:2024');

// Simple search
const results = await wn.search('computer');
console.log(results);

// Advanced operations
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);

// Auto-closes on process exit
```

## Features

- **Simplified APIs** - One clear way to use each package
- **Auto-Initialization** - Works out of the box, no setup required
- **Plugin System** - Optional plugins for advanced functionality
- **Cross-Platform** - Works in browsers and Node.js
- **Type Safety** - Full TypeScript support
- **Cross-Lingual** - Multi-language support with ILI
- **Performance** - Optimized query strategies
- **Real Data** - Processes actual WordNet LMF XML

## Packages

- **[wn-ts-core](./packages/wn-ts-core/)** - Foundation library (types and interfaces)
- **[wn-ts-web](./packages/wn-ts-web/)** - Browser implementation
- **[wn-ts-node](./packages/wn-ts-node/)** - Node.js implementation
- **[wn-react](./packages/wn-react/)** - React hooks and components
- **[wn-cli](./packages/wn-cli/)** - Command-line interface
- **[wn-data-loader](./packages/wn-data-loader/)** - Data loading utilities

## Examples

Start here → **[Hello World](./examples/hello-world/)** - Minimal working examples

Then explore:
- **[Web Examples](./examples/web/)** - Browser demos (React)
- **[Node Examples](./examples/node/wn-ts-node-demo/)** - Server-side examples
- **[Translation Examples](./docs/examples/translation/)** - Cross-lingual workflows

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

- [Quick Start](./docs/quick-start.md) - Get started in 5 minutes
- [API Reference](./docs/api/api-reference.md) - Complete API documentation
- [Version Management](./docs/version-management.md) - Understanding package versions
- [Architecture](./docs/architecture/system-architecture.md) - System design
- [Examples](./examples/hello-world/) - Working code examples
- [Migration Guide](./docs/getting-started/migration-guide.md) - Upgrade guide

## License

MIT License - see [LICENSE](./LICENSE) file.