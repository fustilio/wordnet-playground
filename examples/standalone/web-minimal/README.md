# Standalone Web Example

**This example works with npm** - no workspace required.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What's Different

This is a **standalone version** with real version numbers:

| Feature | Workspace Version | Standalone Version |
|---------|-------------------|-------------------|
| **Dependencies** | `"wn-ts-web": "workspace:*"` | `"wn-ts-web": "^0.7.2"` |
| **React** | `"react": "catalog:"` | `"react": "^18.3.1"` |
| **Vite** | `"vite": "catalog:"` | `"vite": "^6.0.7"` |
| **Package manager** | pnpm only | npm/yarn/pnpm all work |

## Copy This to Your Project

**Download or copy**:
```bash
# Option 1: Copy files
cp -r examples/standalone/web-minimal my-wordnet-app
cd my-wordnet-app
npm install

# Option 2: Use as template
# Just copy package.json, src/, and vite.config.ts
```

## The Complete Code

### package.json (No workspace deps)

```json
{
  "dependencies": {
    "react": "^18.3.1",                    // Real version
    "wn-ts-web": "^0.7.2",                 // Real version
    "@sqlite.org/sqlite-wasm": "^3.46.0"   // Real version
  }
}
```

### src/App.tsx (27 lines)

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
    <div style={{ padding: '20px' }}>
      <h1>WordNet Search</h1>
      <button onClick={search}>Search "computer"</button>
      {results.map(s => (
        <div key={s.id} style={{ margin: '10px 0', padding: '10px', background: '#f5f5f5' }}>
          <strong>{s.id}</strong> ({s.pos})<br />
          {s.definitions?.[0]?.text}
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### "Cannot find module 'wn-ts-web'"

**Fix**:
```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

### First load is slow (60+ seconds)

**This is normal** - downloading WordNet data (~50MB)

**Progress**:
1. Downloads data (30-40s)
2. Processes XML (10-20s)
3. Loads into database (5-10s)

**Subsequent loads**: Instant (cached in browser)

### "Worker failed to initialize"

**Fix**: Check that your Vite config has COOP/COEP headers:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
```

Already included in the example's vite.config.ts ✅

## Next Steps

- Add search input (see [Customize It](#customize-it))
- Add part-of-speech filter
- Try [web-basic-demo](../../web/web-basic-demo/) for polished UI
- Read [Web Platform Guide](../../../docs/platforms/web/)

