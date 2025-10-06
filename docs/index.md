---
layout: home

hero:
  name: "WordNet TypeScript"
  text: "Production-ready WordNet for JavaScript"
  tagline: Query 160,000+ words across multiple languages. Works in browsers, Node.js, and CLI.
  actions:
    - theme: brand
      text: Quick Start →
      link: /quick-start
    - theme: alt
      text: Hello World Examples
      link: ../examples/hello-world/
    - theme: alt
      text: API Reference
      link: /api/api-reference

features:
  - title: Simple API
    details: Same API across all platforms. Learn once, use everywhere.
  - title: Multi-Platform
    details: React hooks for web, factory functions for Node.js, CLI for terminal.
  - title: Multi-Language
    details: English, French, Thai, and more. Cross-lingual translation built-in.
  - title: Fast
    details: 50,000+ queries/sec with caching. SQLite + smart indexing.
  - title: Type-Safe
    details: Full TypeScript support with IDE autocomplete.
  - title: Production-Ready
    details: Comprehensive tests, battle-tested, actively maintained.
---

## The Fastest Way to Start

### Copy-Paste React Component (27 lines)

```typescript
import { useWordNetContext } from 'wn-ts-web/react';
import { useState } from 'react';

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
    <div>
      <button onClick={search}>Search "computer"</button>
      {results.map(s => (
        <div key={s.id}>
          <strong>{s.id}</strong>: {s.definitions[0]?.text}
        </div>
      ))}
    </div>
  );
}
```

### Copy-Paste Node.js Script (12 lines)

```typescript
import { createWordnet } from 'wn-ts-node';

const wn = createWordnet('oewn:2024');
await wn.initialize();

const synsets = await wn.synsets('computer');
console.log(`Found ${synsets.length} synsets`);
synsets.forEach(s => {
  console.log(`${s.id}: ${s.definitions[0]?.text}`);
});

await wn.close();
```

### Copy-Paste CLI Commands

```bash
npm install -g wn-cli

wn-cli search "computer"
wn-cli define "happy"  
wn-cli translate "water" --from en --to fr
```

**That's it.** See [Hello World Examples](../examples/hello-world/) for complete working code.

---

## What's Different About This Library?

### vs Python `wn`
- **Same philosophy**: Simple API, powerful features
- **Better performance**: 50x faster queries with caching
- **Type-safe**: Full IDE support

### vs Other JS Libraries
- **Production-ready**: Not a toy project
- **Multi-platform**: One library, three platforms
- **Modern**: Web Workers, OPFS, TypeScript
- **Actively maintained**: Regular updates

---

## Quick Links

**Get Started**:
- [Quick Start Guide](./quick-start.md) (5 min)
- [Hello World Examples](../examples/hello-world/) (copy-paste)
- [Choose Your Platform](./getting-started/choose-platform.md)

**Learn**:
- [What is WordNet?](./what-is-wordnet.md)
- [API Reference](./api/api-reference.md)
- [Terminology Guide](./terminology.md)

**Build**:
- [Web Platform Guide](./platforms/web/)
- [Node.js Platform Guide](./platforms/node/)
- [CLI Guide](./packages/wn-cli/tui/)

**Examples**:
- [Hello World](../examples/hello-world/) - Start here
- [Web Examples](../examples/web/) - React apps
- [Node.js Examples](../examples/node/wn-ts-node-demo/) - Server apps

---

## Common Tasks

### Search for a Word

```typescript
// All platforms use same query structure
const results = await wn.synsets('computer');
// or
const results = await querySynsets('computer'); // React
```

### Filter by Part of Speech

```typescript
const nouns = await wn.synsets('bank', 'n');
const verbs = await wn.synsets('bank', 'v');
```

### Get Word Relationships

```typescript
const hypernyms = await wn.getHypernyms(synsetId); // Broader terms
const hyponyms = await wn.getHyponyms(synsetId);   // Narrower terms
```

### Translate Between Languages

```typescript
// Load multiple lexicons
const wn = createWordnet(['oewn:2024', 'omw-fr:1.4']);
await wn.initialize();

// Search in different languages
const enSynsets = await wn.synsets('computer', { language: 'en' });
const frSynsets = await wn.synsets('ordinateur', { language: 'fr' });
```

---

## Need Help?

- **[GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)** - Report bugs
- **[Examples](../examples/)** - See working code

---

**Ready to start? Go to [Quick Start Guide](./quick-start.md) →**
