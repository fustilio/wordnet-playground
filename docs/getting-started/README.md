# Getting Started

Quick setup guide for the WordNet TypeScript ecosystem.

## Installation

```bash
# Web applications
npm install wn-ts-web @sqlite.org/sqlite-wasm

# Node.js applications  
npm install wn-ts-node

# Command line tools
npm install -g wn-cli
```

## Basic Usage

### Web (React)
```tsx
import { useWordNet } from 'wn-ts-web';

const { queryWords, loading } = useWordNet();
const words = await queryWords('computer');
```

### Node.js
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

### CLI
```bash
wn-cli search "computer" --lexicon oewn:2024
```

## 📚 **Next Steps**

### **Learn the Basics**
1. **[Basic Usage Guide](./basic-usage.md)** - Core concepts and common operations
2. **[Installation Guide](./installation.md)** - Detailed setup instructions
3. **[Examples](./examples/README.md)** - Working code examples

### **Explore Advanced Features**
1. **[Plugin System](../api/PLUGIN_API.md)** - Extending functionality with plugins
2. **[Cross-Lingual Translation](../examples/integration-examples/translation.md)** - Multi-language support
3. **[Performance Optimization](../development/PERFORMANCE.md)** - Making your app faster

### **Platform-Specific Guides**
- **[Web Development](../packages/wn-ts-web/README.md)** - Browser-specific features
- **[Node.js Development](../packages/wn-ts-node/README.md)** - Server-side usage
- **[CLI Development](../packages/wn-cli/README.md)** - Command-line tools

## 🎯 **Common Use Cases**

### **1. Building a Dictionary App**
```typescript
// Search for words and get definitions
const words = await wordnet.words({ form: 'happy' });
const synsets = await wordnet.synsets({ wordId: words[0].id });
const definitions = synsets[0].definitions.map(d => d.text);
```

### **2. Finding Word Relationships**
```typescript
// Get hypernyms (more general words)
const hypernyms = await wordnet.getHypernyms(synsetId);

// Get hyponyms (more specific words)
const hyponyms = await wordnet.getHyponyms(synsetId);
```

### **3. Cross-Lingual Translation**
```typescript
// Translate between languages
const translations = await wordnet.getTranslations(synsetId, 'fr');
```

### **4. Semantic Similarity**
```typescript
// Calculate similarity between concepts
const similarity = await wordnet.getPathSimilarity(synset1Id, synset2Id);
```

## 🔧 **Configuration**

### **Environment Setup**
- **Node.js**: 18+ recommended
- **TypeScript**: 5.0+ for full type support
- **Browser**: Modern browsers with ES2020+ support

### **Required Headers (Web)**
For optimal performance with OPFS, configure your server:
```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 🆘 **Getting Help**

### **Documentation**
- **[API Reference](../api/README.md)** - Complete API documentation
- **[Examples](../examples/README.md)** - Working code examples
- **[Architecture Guide](../architecture/README.md)** - System design details

### **Community**
- **GitHub Issues**: [Report bugs or ask questions](https://github.com/fustilio/wordnet-playground-2/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/fustilio/wordnet-playground-2/discussions)

### **Common Issues**
- **Installation problems**: Check [Installation Guide](./installation.md)
- **Type errors**: Ensure you're using TypeScript 5.0+
- **Browser compatibility**: Check [Web Requirements](../packages/wn-ts-web/README.md#browser-requirements)

## 🎉 **Ready to Go!**

You now have the basics to start using WordNet TypeScript! Choose your next step:

- **New to WordNet?** → [Basic Usage Guide](./basic-usage.md)
- **Ready to build?** → [Examples](../examples/README.md)
- **Need specific help?** → [API Reference](../api/README.md)

Happy coding! 🚀
