# Quick Start Guide

Get up and running with WordNet TypeScript in **under 5 minutes**.

## Choose Your Platform

### Web Application (React)

**Copy-paste this** into your project:

```bash
npm install wn-react wn-ts-web @sqlite.org/sqlite-wasm
```

```typescript
// App.tsx
import { useWordNet } from 'wn-react';

function WordNetApp() {
  const { search, loading, error } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const handleSearch = async () => {
    const results = await search('computer');
    console.log(results);
  };
  
  if (loading) return <div>Loading WordNet...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <button onClick={handleSearch}>Search</button>;
}

// main.tsx
export default function Root() {
  return <WordNetApp />;
}
```

**Done!** See [Web Guide](./platforms/web/) for more.

---

### Node.js Application

**Copy-paste this** into your project:

```bash
npm install wn-ts-node
```

```typescript
// index.ts
import { createWordnet } from 'wn-ts-node';

// Auto-initializes on first use
const wn = createWordnet('oewn:2024');

// Simple search
const results = await wn.search('computer');
console.log(`Found ${results.length} results`);

// Advanced operations
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);

// Auto-closes on process exit
```

**Run it**:
```bash
npx tsx index.ts
```

**Done!** See [Node.js Guide](./platforms/node/) for more.

---

### Command Line

**Install globally**:

```bash
npm install -g wn-cli
```

**Use it**:

```bash
wn-cli search "computer"
wn-cli define "happy"
wn-cli translate "water" --from en --to fr
```

**Done!** See [CLI Guide](./packages/wn-cli/tui/) for more.

---

## What Just Happened?

1. **Installation**: You installed the package (current versions: web/node v1.0.0, core v0.5.2)
2. **First Run**: WordNet data (~50MB) downloads automatically
3. **Cached**: Next runs are instant - data is saved locally
4. **Ready**: You can now query 160,000+ English words

## Package Versions

The ecosystem uses independent versioning with Changesets:
- **wn-ts-web/wn-ts-node**: v1.0.0 (latest stable)
- **wn-ts-core**: v0.5.2 (foundation library)
- **wn-cli**: v0.5.7 (command-line tool)

## Data Storage

Your WordNet data is saved at:
- **Node.js/CLI**: `~/.wn_data/` (~200MB)
- **Web**: Browser storage (OPFS/IndexedDB) (~200MB)

To clear it:
```bash
# Node.js/CLI
rm -rf ~/.wn_data

# Web
// Use browser DevTools → Application → Clear Storage
```

## Next Steps

**New to WordNet?**
1. Read [What is WordNet?](./what-is-wordnet.md) (5 min)
2. Try [Hello World Examples](../examples/hello-world/) (5 min)
3. Read [API Reference](./api/api-reference.md) (10 min)

**Ready to build?**
1. Choose [your platform](./getting-started/choose-platform.md)
2. Explore [examples](./examples/)
3. Read [platform guides](./platforms/)

**Having issues?**
1. Check [Troubleshooting](#troubleshooting)
2. Ask on [GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)
3. Report bugs on [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)

## Troubleshooting

### "Module not found"

```bash
# Make sure you're in a workspace
pnpm install

# Or install globally
npm install -g wn-cli
```

### "Database initialization failed"

```bash
# Clear cache and retry
rm -rf ~/.wn_data
# Then run your app again
```

### "Worker not supported" (Web)

Your browser needs OPFS support. Check compatibility:
- Chrome 88+
- Firefox 111+
- Safari 16.4+

Or disable workers:
```typescript
<WordNetConfigProvider config={{ enableWorkers: false }}>
```

### First run is slow

**This is normal.** The first run downloads WordNet data (~50MB).

Progress:
- Download: 20-40 seconds
- Process: 10-20 seconds
- Total: ~60 seconds

After that, it's instant.

---

**That's it! You now have a working WordNet application. See [Examples](../examples/) for what to build next.**

