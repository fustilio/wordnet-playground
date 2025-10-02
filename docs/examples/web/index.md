---
title: Web Examples
description: Interactive web applications demonstrating WordNet functionality
---

# Web Examples

Interactive web applications showcasing the WordNet TypeScript ecosystem's web platform capabilities.

## Available Examples

### **[Basic Demo](./basic-demo/)**
Simple word search and exploration interface.

**Features:**
- Word lookup and search
- Synset browsing
- Definition display
- Clean, minimal interface

**Perfect for:** Learning the basics, understanding core concepts

### **[Developer Demo](./developer-demo/)**
Advanced features demonstration with full functionality.

**Features:**
- Interactive word exploration
- Relationship browsing (hypernyms, hyponyms, etc.)
- Cross-lingual translation
- Performance benchmarking
- Real-time statistics

**Perfect for:** Understanding advanced features, building complex applications

## Quick Start

### **Run Basic Demo**

```bash
cd examples/web/basic-demo
pnpm install
pnpm dev
```

### **Run Developer Demo**

```bash
cd examples/web/developer-demo
pnpm install
pnpm dev
```

## Example Architecture

Both examples demonstrate:

- **React Integration**: Using `useWordNet()` hook
- **Web Workers**: Non-blocking operations
- **OPFS Storage**: Persistent browser storage
- **Error Handling**: Graceful error management
- **Loading States**: User feedback during operations

## Learning Path

1. **Start with Basic Demo** - Understand core concepts
2. **Explore Developer Demo** - See advanced features
3. **Read the Code** - Learn implementation patterns
4. **Build Your Own** - Apply what you've learned

## Customization

Each example includes:

- **Configuration Options**: Customize behavior
- **Styling**: Modify appearance
- **Features**: Add or remove functionality
- **Data Sources**: Change lexicons

## Code Examples

### **Basic Word Search**

```typescript
import { useWordNet } from 'wn-ts-web';

function WordSearch() {
  const { queryWords, loading } = useWordNet();
  const [results, setResults] = useState([]);
  
  const handleSearch = async (term: string) => {
    const words = await queryWords(term);
    setResults(words);
  };
  
  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {loading && <div>Searching...</div>}
      {results.map(word => (
        <div key={word.id}>{word.lemma}</div>
      ))}
    </div>
  );
}
```

### **Advanced Features**

```typescript
import { useWordNetKernel } from 'wn-ts-web';

function AdvancedDemo() {
  const { 
    getHypernyms, 
    getTranslations, 
    getPathSimilarity 
  } = useWordNetKernel();
  
  // Use advanced features
  const hypernyms = await getHypernyms(synsetId);
  const translations = await getTranslations(synsetId, 'fr');
  const similarity = await getPathSimilarity(synset1, synset2);
}
```

## Next Steps

- **[Platform Guide](/platforms/web/)** - Learn about the web platform
- **[API Reference](/api/web/)** - Complete API documentation
- **[Translation Examples](/examples/translation/)** - Cross-lingual features

---

**Ready to explore? Pick an example and start building! 🚀**
