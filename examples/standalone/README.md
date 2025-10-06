# Standalone Examples

**These examples work with npm** - no monorepo/workspace required.

## Why Standalone?

The main examples use pnpm workspace features (`workspace:*`, `catalog:`). These **don't work with npm**.

**These standalone examples**:
- ✅ Use real version numbers
- ✅ Work with npm, yarn, or pnpm
- ✅ Can be copied to any project
- ✅ No monorepo setup needed

## Available Examples

### Node.js Minimal

[`node-minimal/`](./node-minimal/) - 12 lines, works with npm

```bash
cd node-minimal
npm install
npm start
```

**Perfect for**:
- Learning Node.js WordNet basics
- Copying to your own project
- Building CLI tools

### Web Minimal

[`web-minimal/`](./web-minimal/) - 27 lines, works with npm

```bash
cd web-minimal
npm install
npm run dev
```

**Perfect for**:
- Learning React integration
- Copying to your own project
- Building web apps

## Quick Comparison

| Example | Package Manager | Dependencies | Use Case |
|---------|----------------|--------------|----------|
| **hello-world/** | pnpm required | `workspace:*`, `catalog:` | Learning in monorepo |
| **standalone/** | npm/yarn/pnpm | Real versions | Copy to your project |

## Copy to Your Project

### Step 1: Choose Example

Pick the one that matches your stack:
- Node.js app? → [`node-minimal/`](./node-minimal/)
- React app? → [`web-minimal/`](./web-minimal/)

### Step 2: Copy Files

```bash
# Copy the entire directory
cp -r examples/standalone/node-minimal my-project

# Or just copy package.json and src/
```

### Step 3: Install & Run

```bash
cd my-project
npm install  # Works with npm!
npm start    # or npm run dev for web
```

### Step 4: Customize

Now you have a working base to build on:
- Add your UI
- Add your features
- Deploy to production

## Version Notes

**Current versions** (as of 2025-10-03):
```json
{
  "wn-ts-web": "^0.7.2",
  "wn-ts-node": "^0.7.2",
  "@sqlite.org/sqlite-wasm": "^3.46.0",
  "react": "^18.3.1",
  "vite": "^6.0.7",
  "typescript": "^5.7.0"
}
```

**Check for updates**:
```bash
npm outdated
```

## Troubleshooting

### "Cannot find module"

Make sure you installed all dependencies:
```bash
npm install
```

### "Worker not supported"

Your browser needs to support Web Workers and OPFS. Use a modern browser:
- Chrome 88+
- Firefox 111+
- Safari 16.4+

### "Download takes too long"

First run downloads ~50MB of WordNet data. This is normal and only happens once.

**Subsequent runs**: Instant (cached)

## Next Steps

**For learning**:
- Try the workspace examples for more features
- Read [Error Handling Guide](../../../docs/error-handling.md)
- Read [API Reference](../../../docs/api/api-reference.md)

**For building**:
- Copy this example to your project
- Add your custom UI and logic
- Deploy (works on Vercel, Netlify, etc.)

---

**These examples are production-ready templates. Use them as starting points for your own applications.**

