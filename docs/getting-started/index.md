---
title: Getting Started
description: Quick start guide for the WordNet TypeScript ecosystem
---

# Getting Started

Get up and running with WordNet TypeScript in under 5 minutes.

> **New to WordNet?** Read [What is WordNet?](../what-is-wordnet) first (2 min read).

## Fastest Start

**Copy-paste and run**:

### Web (React)
```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

```typescript
import { useWordNetContext } from 'wn-ts-web/react';
import { WordNetProvider } from 'wn-ts-web/react';

function App() {
  const { querySynsets, loading } = useWordNetContext();
  const search = async () => {
    const results = await querySynsets('computer');
    console.log(results);
  };
  if (loading) return <div>Loading...</div>;
  return <button onClick={search}>Search</button>;
}

export default function Root() {
  return <WordNetProvider><App /></WordNetProvider>;
}
```

### Node.js
```bash
npm install wn-ts-node
```

```typescript
import { createWordnet } from 'wn-ts-node';

const wn = createWordnet('oewn:2024');
await wn.initialize();
const synsets = await wn.synsets('computer');
console.log(synsets);
await wn.close();
```

### CLI
```bash
npm install -g wn-cli
wn-cli search "computer"
```

**Done!** See [Hello World Examples](../../examples/hello-world/) for complete working code.

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **pnpm**
- **TypeScript** 5.0+ (for TypeScript projects)

Check versions:
```bash
node --version  # Should be v18+
npm --version   # Any recent version
```

---

## Installation

Choose your platform:

### Web Applications
```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

**Size**: ~2MB (library) + ~50MB (WordNet data on first run)

### Node.js Applications
```bash
npm install wn-ts-node
```

**Dependencies**: Automatically installs better-sqlite3

### Command Line Tools
```bash
npm install -g wn-cli
```

**Global install**: Available system-wide as `wn-cli`

---

## First Run

### What Happens

On first run, WordNet data is automatically downloaded:

1. **Download**: ~50MB compressed file
2. **Extract**: Decompress and parse XML
3. **Load**: Insert into SQLite database
4. **Cache**: Save for future runs

**Time**: 30-60 seconds  
**Subsequent runs**: Instant (cached)

### Data Location

| Platform | Location |
|----------|----------|
| **Node.js** | `~/.wn_data/` |
| **CLI** | `~/.wn_data/` |
| **Web** | Browser storage (OPFS/IndexedDB) |

To clear cache:
```bash
# Node.js/CLI
rm -rf ~/.wn_data

# Web: Use browser DevTools → Application → Clear Storage
```

---

## Quick Start Examples

> For the absolute simplest examples, see [Hello World](../../examples/hello-world/)

### Web Platform (React)
```typescript
import { useWordNetContext } from 'wn-ts-web/react';

function MyApp() {
  const { querySynsets, loading } = useWordNetContext();
  
  const search = async () => {
    const results = await querySynsets('computer');
    console.log(results);
  };
  
  if (loading) return <div>Loading...</div>;
  return <button onClick={search}>Search</button>;
}
```

### Node.js Platform
```typescript
import { createWordnet } from 'wn-ts-node';

const wn = createWordnet('oewn:2024');
await wn.initialize();

const synsets = await wn.synsets('computer');
console.log('Found', synsets.length, 'synsets');

await wn.close();
```

### CLI Platform
```bash
wn-cli search "computer"
wn-cli define "happy"
wn-cli translate "water" --from en --to fr
```

---

## Next Steps

1. **[Choose Your Platform](./choose-platform)** - Web, Node.js, or CLI?
2. **[Try Hello World](../../examples/hello-world/)** - Copy-paste working code
3. **[Read API Reference](../api/api-reference)** - Complete API docs
4. **[Explore Examples](../../examples/)** - Learn by example

---

## Troubleshooting

### Installation Issues

**Error: "Cannot find module 'wn-ts-web'"**
```bash
# Make sure you're in a workspace with pnpm
pnpm install

# Or use npm
npm install wn-ts-web @sqlite.org/sqlite-wasm
```

### First Run Issues

**"Download failed" or "Network error"**
- Check internet connection
- Disable VPN/proxy temporarily
- Try again (downloads resume automatically)

**First run is very slow**
- **This is normal** - downloading 50MB of data
- Subsequent runs are instant
- See progress in console logs

### Runtime Issues

**Web: "Worker not ready"**
- Wait for initialization to complete
- Check browser console for errors
- Ensure CORS headers are set (see [Web Usage Guide](../guides/web-usage.md))

**Node.js: "Database locked"**
- Only one connection allowed per database file
- Call `await wn.close()` before creating new instance
- Use different filenames for multiple instances

---

## Get Help

- **Questions**: [GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)
- **Bugs**: [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)
- **Examples**: Check [examples directory](../../examples/)

---

**Ready to start? Try [Hello World](../../examples/hello-world/) →**
