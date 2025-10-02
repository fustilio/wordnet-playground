---
title: API Reference
description: Complete API documentation for the WordNet TypeScript ecosystem
---

# API Reference

## Packages

- **[Core API](/api/core/)** - Foundation library
- **[Web API](/api/web/)** - Browser implementation  
- **[Node API](/api/node/)** - Node.js implementation
- **[CLI Package](/packages/wn-cli/tui/)** - Command-line interface

## Plugins

- **Relations**: `getHypernyms()`, `getHyponyms()`, `getMeronyms()`
- **Similarity**: `getPathSimilarity()`, `getWuPalmerSimilarity()`
- **Translation**: `getTranslations()`, `getAvailableLanguages()`

## Core Methods

- `words(query?)` - Find words
- `synsets(query?)` - Find synsets  
- `senses(query?)` - Find senses
- `ili(iliId)` - Get interlingual index

## Further Reading

- [Getting Started Guide](../getting-started/) - Quick setup and basic usage
- [Examples](../examples/) - Working code examples

---

**Need more specific information? Check out the individual package documentation or explore our [Examples](/examples/) for working code! 🚀**
