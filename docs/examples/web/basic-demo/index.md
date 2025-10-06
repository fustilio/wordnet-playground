---
title: Web Basic Demo
description: Clean, simple web application with polished UI
---

# Web Basic Demo

Clean, simple React application demonstrating WordNet functionality with polished UI.

> **Even simpler?** See [Hello World Web Example](../../../../examples/hello-world/web/) (27 lines)

## Features

- Word search with clean UI
- Synset results in a table
- Part-of-speech filtering
- Loading states and error handling
- Responsive design

## Quick Start

```bash
cd examples/web/web-basic-demo
pnpm install
pnpm dev
```

Open http://localhost:5173

## What's Different from Hello World?

| Feature | Hello World | Basic Demo |
|---------|-------------|------------|
| **Lines of code** | 27 | ~100 |
| **UI** | Inline styles | CSS with design system |
| **Features** | Search button | Search input, filters, table |
| **Error handling** | Basic | Comprehensive |
| **Loading states** | Simple text | Spinner and progress |

## Code Structure

```
src/
├── App.tsx              # Main component
├── hooks/
│   └── useWordnet.ts    # WordNet integration hook
├── main.tsx             # Entry point
└── index.css            # Styles
```

## Key Code

### Custom Hook

```typescript
// hooks/useWordnet.ts
export function useWordnet() {
  const { 
    querySynsets, 
    loading, 
    error,
    loadPackageData 
  } = useWordNetContext();

  // Auto-load English WordNet
  useEffect(() => {
    if (!loading && loadedPackages.length === 0) {
      loadPackageData('oewn:2024');
    }
  }, [loading, loadedPackages]);

  return { getDefinitions: querySynsets, loading, error };
}
```

### Main Component

```typescript
// App.tsx
export default function App() {
  const { getDefinitions, loading, error, ready } = useWordnet();
  const [results, setResults] = useState([]);

  const handleSearch = async (term) => {
    const synsets = await getDefinitions(term);
    setResults(synsets);
  };

  return (
    <div className="container">
      <input onChange={(e) => setSearchTerm(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <ResultsTable results={results} />
    </div>
  );
}
```

## What You Learn

1. **Custom hooks**: Wrap WordNet context in domain-specific hook
2. **Auto-loading**: Load packages automatically on mount
3. **State management**: Handle loading, error, and ready states
4. **UI patterns**: Clean search interface with results display

## Customize It

### Change Lexicon

```typescript
// In main.tsx, pass different lexiconId
<WordNetProvider lexiconId="omw-fr:1.4">
  <App />
</WordNetProvider>
```

### Add Part-of-Speech Filter

```typescript
const [pos, setPos] = useState('all');

const handleSearch = async (term) => {
  const allSynsets = await getDefinitions(term);
  const filtered = pos === 'all' 
    ? allSynsets 
    : allSynsets.filter(s => s.pos === pos);
  setResults(filtered);
};
```

### Add Search History

```typescript
const [history, setHistory] = useState([]);

const handleSearch = async (term) => {
  const results = await getDefinitions(term);
  setHistory(prev => [term, ...prev.slice(0, 9)]);
  setResults(results);
};
```

## Next Steps

**More complex UI**:
- [Web Showcase](../../web-showcase/) - Multiple demo pages
- [Developer Demo](../../web-developer-demo/) - Full-featured app

**Production ready**:
- [Web Platform Guide](../../../platforms/web/) - Best practices
- [Web Usage Guide](../../../guides/web-usage.md) - Advanced patterns

**API reference**:
- [API Reference](../../../api/api-reference.md) - All methods
- [Web API](../../../api/web/) - Web-specific API

---

**This example is perfect for understanding how to build a clean, user-friendly WordNet application.**
