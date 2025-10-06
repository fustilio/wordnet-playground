# WordNet TypeScript Examples

Learn by example - from 12-line scripts to full-featured applications.

## Learning Path

**New to WordNet?** Follow this order:

### 1. Hello World (5 minutes)
**Start here** → [hello-world/](./hello-world/)

The simplest possible examples:
- **Web**: 27 lines - React component with search button
- **Node.js**: 12 lines - Script that prints definitions
- **CLI**: 3 commands - No coding required

**Goal**: See it work, understand the basics.

---

### 2. Basic Examples (15 minutes)

**Web** → [web/web-basic-demo/](./web/web-basic-demo/)
- Clean UI with search and results
- Loading states and error handling
- ~100 lines total

**Node.js** → [node/wn-ts-node-demo/src/examples/basic/](./node/wn-ts-node-demo/src/examples/basic/)
- Word sense disambiguation
- Database statistics
- Multilingual definitions
- Python-style API

**Goal**: Learn core features with practical examples.

---

### 3. Advanced Examples (30 minutes)

**Web** → [web/web-developer-demo/](./web/web-developer-demo/)
- Interactive visualizations
- Plugin system demo
- Translation showcase
- Developer tools

**Node.js** → [node/wn-ts-node-demo/src/examples/advanced/](./node/wn-ts-node-demo/src/examples/advanced/)
- Multilingual linking
- Lexical database exploration
- Kitchen sink demo
- Live download demo

**Goal**: Understand advanced features and plugins.

---

## Quick Reference

| What You Want | Where to Look |
|---------------|---------------|
| Absolute simplest | [hello-world/](./hello-world/) |
| Copy-paste React component | [hello-world/web/](./hello-world/web/) |
| Copy-paste Node.js script | [hello-world/node/](./hello-world/node/) |
| CLI commands | [hello-world/cli/](./hello-world/cli/) |
| Polished web UI | [web/web-basic-demo/](./web/web-basic-demo/) |
| All features demo | [web/web-developer-demo/](./web/web-developer-demo/) |
| Node.js use cases | [node/wn-ts-node-demo/](./node/wn-ts-node-demo/) |
| Translation examples | See [Translation Guide](../docs/examples/translation/) |

## By Use Case

### I want to...

**Build a dictionary website**
→ Start: [hello-world/web/](./hello-world/web/)  
→ Then: [web/web-basic-demo/](./web/web-basic-demo/)  
→ Advanced: [web/web-developer-demo/](./web/web-developer-demo/)

**Build a REST API**
→ Start: [hello-world/node/](./hello-world/node/)  
→ Then: [node/wn-ts-node-demo/](./node/wn-ts-node-demo/)  
→ TODO: Express.js example (coming soon)

**Translate between languages**
→ See: [web/web-developer-demo/](./web/web-developer-demo/) (Translation Showcase tab)  
→ Read: [Translation Guide](../docs/examples/translation/)

**Explore WordNet data**
→ Use: CLI commands in [hello-world/cli/](./hello-world/cli/)  
→ Or: Node.js examples in [node/wn-ts-node-demo/](./node/wn-ts-node-demo/)

**Understand the plugin system**
→ See: [web/web-developer-demo/](./web/web-developer-demo/) (Kernel Demo tab)  
→ Read: [Plugin API](../docs/api/plugins/)

## Running Examples

All examples require pnpm (or npm) and Node.js 18+.

```bash
# General pattern:
cd examples/[example-directory]
pnpm install
pnpm [start|dev|test]

# Specific examples:
cd examples/hello-world/web && pnpm dev
cd examples/hello-world/node && pnpm start
cd examples/web/web-basic-demo && pnpm dev
cd examples/node/wn-ts-node-demo && pnpm test
```

## Example Comparison

| Example | Lines | Features | Best For |
|---------|-------|----------|----------|
| **hello-world/web** | 27 | Bare minimum | First-time users |
| **web-basic-demo** | ~100 | Clean UI | Learning React integration |
| **web-showcase** | ~150 | Multiple demos | Seeing different features |
| **web-developer-demo** | ~1000+ | Everything | Understanding advanced features |
| **hello-world/node** | 12 | Core query | First Node.js script |
| **node/.../basic** | ~50 each | Use cases | Learning patterns |
| **node/.../advanced** | ~150 each | Complex features | Production patterns |

## What's Missing?

Examples we should add:

- [ ] **Express.js REST API** - Full server example
- [ ] **Next.js integration** - SSR + client-side
- [ ] **Vue.js component** - Non-React web framework
- [ ] **CLI tool builder** - Build your own CLI
- [ ] **Error handling patterns** - Production-ready error handling
- [ ] **Testing patterns** - How to test your WordNet code
- [ ] **Deployment guide** - Deploy to Vercel/Netlify/Railway

Want to contribute? Pick one and open a PR!

## Need Help?

- **Can't run example**: Check [Troubleshooting](../docs/QUICK_START.md#troubleshooting)
- **Want different example**: Ask on [GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)
- **Found a bug**: Report on [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)

---

**Start with [Hello World](./hello-world/), then explore based on your use case. Happy coding!**

