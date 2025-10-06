# Hello World - Web Example

A minimal React application demonstrating WordNet TypeScript in the browser.

## Prerequisites

**pnpm required** (workspace example):
```bash
npm install -g pnpm
```

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

## 📦 Standalone Version (No Workspace)

**Copying to your own project?** Replace `package.json` dependencies:

```json
{
  "dependencies": {
    "react": "^18.3.0",                    // not "catalog:"
    "react-dom": "^18.3.0",                // not "catalog:"
    "wn-ts-web": "^0.7.2",                 // not "workspace:*"
    "@sqlite.org/sqlite-wasm": "^3.46.0"
  }
}
```

Then use npm normally:
```bash
npm install
npm run dev
```

## What You'll See

A simple page with:
- Title: "WordNet Hello World"
- Button: "Search 'computer'"
- Results: Definitions of "computer"

## The Complete Code

### App.tsx (27 lines)

```typescript
import { useState } from 'react';
import { useWordNetContext } from 'wn-ts-web/react';

export default function App() {
  const { querySynsets, loading, error } = useWordNetContext();
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const synsets = await querySynsets('computer');
    setResults(synsets);
  };

  if (loading) return <div>Loading WordNet...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>WordNet Hello World</h1>
      <button onClick={search}>Search "computer"</button>
      <div style={{ marginTop: '20px' }}>
        {results.map((s, i) => (
          <div key={i} style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5' }}>
            <strong>{s.id}</strong> ({s.pos})<br />
            {s.definitions?.[0]?.text || 'No definition'}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### main.tsx (9 lines)

```typescript
import { createRoot } from 'react-dom/client';
import App from './App';
import { WordNetConfigProvider, WordNetProvider } from 'wn-ts-web/react';

createRoot(document.getElementById('root')!).render(
  <WordNetConfigProvider config={{ enableWorkers: true, fallbackToMainThread: true }}>
    <WordNetProvider>
      <App />
    </WordNetProvider>
  </WordNetConfigProvider>
);
```

That's it. **36 lines total** for a working WordNet app.

## How It Works

1. **Providers**: Wrap your app in `WordNetConfigProvider` and `WordNetProvider`
2. **Hook**: Use `useWordNetContext()` to access WordNet functions
3. **Query**: Call `querySynsets(word)` to search
4. **Display**: Render results however you want

## Common Questions

**Where is the data downloaded?**
- Browser storage (OPFS) if supported
- IndexedDB as fallback
- In-memory if neither available

**How long does first load take?**
- 30-60 seconds (downloads ~50MB)
- Subsequent loads: instant (cached)

**Can I customize the lexicon?**
```typescript
// In WordNetProvider, pass lexiconId:
<WordNetProvider lexiconId="omw-fr:1.4">
```

**Can I search without a button?**
```typescript
// Add useEffect to search on mount:
useEffect(() => {
  if (!loading && !error) {
    search();
  }
}, [loading, error]);
```

## Customize It

### Add Search Input

```typescript
const [term, setTerm] = useState('computer');

<input 
  value={term} 
  onChange={e => setTerm(e.target.value)} 
  placeholder="Enter word"
/>
<button onClick={() => search(term)}>Search</button>
```

### Add Loading Spinner

```typescript
if (loading) return (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <div className="spinner">Loading...</div>
  </div>
);
```

### Add Error Retry

```typescript
if (error) return (
  <div style={{ color: 'red', padding: '20px' }}>
    <p>Error: {error}</p>
    <button onClick={() => window.location.reload()}>Retry</button>
  </div>
);
```

## Next Steps

1. **[Basic Demo](../../web/web-basic-demo/)** - Polished UI with styling
2. **[Developer Demo](../../web/web-developer-demo/)** - Advanced features
3. **[Web Platform Guide](../../../docs/platforms/web/)** - Complete documentation
