# WordNet TypeScript Node.js Implementation

A modern TypeScript implementation for accessing WordNet data, inspired by the [wn library](https://github.com/goodmami/wn). This implementation provides comprehensive WordNet functionality while leveraging TypeScript's type safety and a modern microkernel architecture with plugin system.

## Status: Production Ready

This TypeScript implementation provides comprehensive WordNet functionality including examples support, project management, information content calculations, and export functionality, built on a modern microkernel architecture.

## Architecture

The library uses a microkernel architecture with a plugin system:

```
NodeWordNetKernel
├── NodeWordNetCore (implements WordNetCore)
│   ├── KyselyWordnet (database operations)
│   └── NodeKyselyDatabase (SQLite integration)
├── Plugin System
│   ├── Relations Plugin (hypernyms, hyponyms, etc.)
│   ├── Similarity Plugin (path, Wu-Palmer, etc.)
│   └── Translation Plugin (cross-lingual operations)
└── Schema Management (built-in)
```

## Quick Start

### Installation

```bash
npm install wn-ts-node
# or
pnpm add wn-ts-node
```

### Command-Line Interface

```bash
# Install globally for CLI access
npm install -g wn-ts-node

# Download a WordNet project
wn-ts-node download oewn:2024

# Add a lexical resource
wn-ts-node add oewn-2024-english-wordnet-2024.xml.gz

# Query the database
wn-ts-node query run v

# Show database status
wn-ts-node db status
```

### Basic Usage

#### Kernel API (Recommended)

```typescript
import { NodeWordNetKernel, download, add } from 'wn-ts-node';

// Download and add a WordNet project
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');

// Create a kernel-based WordNet instance
const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db'
});

await wordnet.initialize();

// Basic queries
const words = await wordnet.words({ form: 'run' });
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Plugin methods
const hypernyms = await wordnet.getHypernyms(synsets[0].id);
const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
const translations = await wordnet.getTranslations(synsets[0].id, 'fr');

await wordnet.close();
```

#### Legacy API (Python wn compatibility)

```typescript
import { Wordnet, download, add } from 'wn-ts-node';

// Download and add a WordNet project
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');

// Create a WordNet instance
const wn = new Wordnet('oewn:2024');

// Use convenience methods
const words = await wn.words('run', 'v');
const synsets = await wn.synsets('run', 'v');

for (const synset of synsets) {
  console.log(`Synset: ${synset.id}`);
  console.log(`Definition: ${synset.definitions[0]?.text}`);
  console.log(`Examples: ${synset.examples.map(e => e.text).join(', ')}`);
  console.log(`Members: ${synset.members.join(', ')}`);
}
```

## Available Projects

The library supports downloading and using various WordNet projects:

- **oewn**: Open English WordNet (2024, 2023, 2022)
- **omw**: Open Multilingual Wordnet (1.4)
- **odenet**: Open German WordNet (1.4, 1.3)
- **cili**: Collaborative Interlingual Index (1.0)

And many more language-specific WordNets through the OMW project.

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

## Documentation

- **Usage Guide**: [USAGE.md](../../docs/packages/wn-ts-node/USAGE.md) - Comprehensive usage examples
- **API Reference**: [API_REFERENCE.md](../../docs/packages/wn-ts-node/API_REFERENCE.md) - Complete API documentation
- **Features & Roadmap**: [FEATURES_AND_ROADMAP.md](../../docs/packages/wn-ts-node/FEATURES_AND_ROADMAP.md) - Detailed features and development roadmap

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Python `wn` library](https://github.com/goodmami/wn) - The original implementation
- [WordNet](https://wordnet.princeton.edu/) - The lexical database
- [Open English WordNet](https://en-word.net/) - Modern English WordNet
- [Open Multilingual Wordnet](https://omwn.org/) - Multilingual WordNet resources