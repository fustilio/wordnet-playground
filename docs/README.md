---
title: Documentation Overview
description: Comprehensive documentation for the WordNet TypeScript ecosystem
---

# WordNet TypeScript Ecosystem Documentation

Welcome to the comprehensive documentation for the WordNet TypeScript ecosystem. This documentation covers everything from quick start guides to advanced API references.

## Quick Start

- **[Getting Started Guide](./getting-started/)** - Set up and run your first WordNet application

## What You'll Find Here

### Learn WordNet
- **[What is WordNet?](./what-is-wordnet)** - Understand the basics of WordNet
- **[Project Overview](./project-overview.md)** - What this ecosystem offers

### Getting Started
- **[Quick Start Guide](./getting-started/)** - Get up and running in minutes
- **[Choose Your Platform](/platforms/)** - Pick the right platform for your needs

### Examples & Tutorials
- **[Web Examples](/examples/web/)** - Interactive browser demos
- **[Node.js Examples](/examples/node/)** - Server-side usage
- **[Translation Examples](/examples/translation/)** - Cross-language features

### API Reference
- **[API Overview](./api/)** - Complete API documentation
- **[Platform Documentation](/platforms/)** - Platform-specific guides


## Common Use Cases

### Web Applications
```typescript
import { useWordNetKernel } from 'wn-ts-web';

const MyComponent = () => {
  const { words, synsets, loading } = useWordNetKernel();
  // Your WordNet-powered React component
};
```

### Node.js Applications
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
```

### Command Line Tools
```bash
wn-cli search "computer" --lexicon oewn:2024
wn-cli translate "computer" --from en --to fr
```

## What Should I Read?

### New to WordNet?
Start with the [Getting Started Guide](./getting-started/) to learn the basics.

### Building a Web App?
Check out [Web Examples](/examples/web/) and the [Web Platform Guide](/platforms/web/).

### Building a Node.js App?
See [Node.js Examples](/examples/node/) and the [Node.js Platform Guide](/platforms/node/).

### Need Translation Features?
Explore [Translation Examples](/examples/translation/) to see cross-language capabilities.


## Contributing to Documentation

We welcome contributions to improve this documentation! Please open an issue or pull request on GitHub.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)
- **Examples**: Check the [Examples section](./examples/) for working code

---

**Happy WordNet Exploring! 🎉**