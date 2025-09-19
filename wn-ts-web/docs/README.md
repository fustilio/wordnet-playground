# wn-ts-web Documentation

## 📖 **Overview**

`wn-ts-web` is the browser-optimized implementation of the WordNet TypeScript ecosystem, featuring a **microkernel architecture** with plugin system, React integration, and Web Worker support.

## 🚀 **Quick Start**

```typescript
import { useWordNet } from 'wn-ts-web/react';

function WordNetApp() {
  const { loading, error, loadPackageData, queryWords } = useWordNet();

  useEffect(() => {
    loadPackageData('oewn:2024');
  }, []);

  const handleSearch = async (term: string) => {
    const results = await queryWords(term);
    console.log('Results:', results);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => handleSearch('computer')}>
        Search for "computer"
      </button>
    </div>
  );
}
```

## 📚 **Documentation**

### **Architecture & Design**
- **[System Architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md)** - Microkernel architecture and design patterns
- **[Web Architecture](../../docs/architecture/WEB_ARCHITECTURE.md)** - Browser-specific architecture and worker patterns

### **API Reference**
- **[Web API](../../docs/api/WEB_API.md)** - Complete API reference and React integration

### **Usage Guides**
- **[Web Usage](../../docs/guides/WEB_USAGE.md)** - Comprehensive usage patterns and examples

### **Key Features**
- **Microkernel Architecture**: Plugin-based system with relations, similarity, and translation plugins
- **React Integration**: Custom hooks and context providers
- **Web Worker Support**: Background processing for UI responsiveness
- **SQLite with OPFS**: Persistent storage capabilities
- **Cross-Lingual Support**: Multi-language lexicon management with ILI linking

## 🔧 **Installation**

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

## 🌐 **Browser Requirements**

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: Graceful degradation when features aren't supported

---

**For detailed documentation, see the [main documentation](../../docs/README.md) directory.**