---
title: Getting Started
description: Quick start guide for the WordNet TypeScript ecosystem
---

# Getting Started

Welcome to the WordNet TypeScript ecosystem! This guide will help you get up and running quickly with our production-ready TypeScript clients for WordNet data.

> **New to WordNet?** Start with our [What is WordNet?](../what-is-wordnet) guide to understand the basics before diving into the technical details.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **pnpm** (recommended) or npm
- **TypeScript 5.0+**
- **Modern browser** (for web applications)

### Installation

```bash
# Install the core package
npm install wn-ts-core

# For Node.js applications
npm install wn-ts-node

# For web applications
npm install wn-ts-web

# For CLI tools
npm install -g wn-cli
```

### Basic Usage

#### Node.js
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();

// Search for words
const words = await wordnet.words({ form: 'computer' });
console.log('Found words:', words);

await wordnet.close();
```

#### Web/Browser
```typescript
import { useWordNet } from 'wn-ts-web';

const MyComponent = () => {
  const { queryWords, loading } = useWordNet();
  
  const handleSearch = async (term: string) => {
    const words = await queryWords(term);
    console.log('Found words:', words);
  };
  
  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};
```

#### CLI
```bash
# Search for words
wn-cli search "computer" --lexicon oewn:2024

# Get word definitions
wn-cli define "computer" --pos n

# Translate between languages
wn-cli translate "computer" --from en --to fr
```

## 🏗️ What You Get

The WordNet TypeScript ecosystem provides:

- **`wn-ts-core`**: Core library with plugin system
- **`wn-ts-node`**: Node.js version with SQLite database
- **`wn-ts-web`**: Browser version with React components
- **`wn-cli`**: Command-line tools

## 🔌 Advanced Features

The ecosystem includes plugins for advanced functionality:

- **Relations**: Find word relationships (hypernyms, hyponyms, etc.)
- **Similarity**: Calculate semantic similarity between words
- **Translation**: Translate between different languages

See the [API Reference](/api/) for detailed plugin documentation.

## 🌍 Cross-Lingual Support

The ecosystem supports multiple languages through the ILI (Interlingual Index) system:

- **English**: Open English WordNet (OEWN)
- **French**: WOLF (Wordnet Libre du Français)
- **Thai**: Thai WordNet
- **More languages**: As supported by loaded lexicons

## 📚 Next Steps

- **[Examples](/examples/)** - Explore working examples
- **[API Reference](/api/)** - Complete API documentation
- **[Choose Your Platform](/platforms/)** - Pick the right platform for your needs

## 🆘 Need Help?

- **GitHub Issues**: [Report bugs or request features](https://github.com/fustilio/wordnet-playground-2/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/fustilio/wordnet-playground-2/discussions)
- **Documentation**: Browse the comprehensive guides in this documentation

---

**Ready to dive deeper? Check out our [Examples](/examples/) to see the ecosystem in action! 🚀**
