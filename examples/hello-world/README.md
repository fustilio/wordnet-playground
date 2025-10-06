# Hello World Examples

The simplest possible examples to get started with WordNet TypeScript. Each example is **less than 20 lines** and demonstrates the core functionality.

## Quick Links

- [Web (React)](#web-react) - Browser application
- [Node.js](#nodejs) - Server-side application  
- [CLI](#cli) - Command-line usage

## Prerequisites

- Node.js 18+
- pnpm (or npm)

## Web (React)

**What it does**: Searches for a word and displays definitions in a React component.

```bash
cd web
pnpm install
pnpm dev
```

Open http://localhost:5173

**Key file**: `web/src/App.tsx` (15 lines)

## Node.js

**What it does**: Searches for a word and prints results to console.

```bash
cd node
pnpm install
pnpm start
```

**Key file**: `node/index.ts` (12 lines)

## CLI

**What it does**: Uses the command-line tool to search for words.

```bash
# Install CLI globally
npm install -g wn-cli

# Run commands
wn-cli search "computer"
wn-cli define "happy"
wn-cli translate "water" --from en --to fr
```

See `cli/README.md` for more commands.

## Next Steps

After trying these minimal examples:

1. **[Basic Examples](../node/wn-ts-node-demo/)** - More features, still simple
2. **[Advanced Examples](../web/web-developer-demo/)** - Full-featured applications
3. **[API Documentation](../../docs/api/)** - Complete API reference

## Common Issues

**Error: "Cannot find module 'wn-ts-web'"**
```bash
# Make sure you're in the workspace root
pnpm install

# Then try the example again
cd examples/hello-world/web
pnpm dev
```

**Error: "Database not found"**
- The first run downloads WordNet data (~50MB)
- This takes 30-60 seconds
- Subsequent runs are instant (cached)

## Philosophy

These examples prioritize:
- **Simplicity**: Minimal code, maximum clarity
- **Working code**: Copy-paste and it works
- **No magic**: Every line is explained
- **Fast start**: See results in under 60 seconds

