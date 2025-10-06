# Migration Guide: v0.7.x → v1.0.0

This guide helps you migrate from v0.7.x to v1.0.0, which includes major API improvements and architectural changes.

## 🚨 Breaking Changes

### 1. React Package Separation

**Before (v0.7.x):**
```typescript
import { useWordNetContext } from 'wn-ts-web/react';
```

**After (v1.0.0):**
```typescript
import { useWordNet } from 'wn-react';
```

**Migration Steps:**
1. Install the new package:
   ```bash
   npm install wn-react
   ```
2. Update imports in your React components
3. Update hook usage (see React API Changes below)

### 2. Simplified Node.js API

**Before (v0.7.x):**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wn = new NodeWordNetKernel('oewn:2024');
await wn.initialize();
// ... use wn
await wn.close();
```

**After (v1.0.0):**
```typescript
import { createWordnet } from 'wn-ts-node';

// Auto-initializes on first use
const wn = createWordnet('oewn:2024');
// ... use wn
// Auto-closes on process exit
```

### 3. Simplified Web API

**Before (v0.7.x):**
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wn = new WebWordNetKernel('oewn:2024');
await wn.initialize();
// ... use wn
await wn.close();
```

**After (v1.0.0):**
```typescript
import { createWebWordnet } from 'wn-ts-web';

// Auto-initializes on first use
const wn = createWebWordnet('oewn:2024');
// ... use wn
// Auto-closes on page unload
```

## 🔄 API Changes

### React Hooks

#### useWordNetContext() → useWordNet()

**Before:**
```typescript
import { useWordNetContext } from 'wn-ts-web/react';

function MyComponent() {
  const { 
    querySynsets,
    queryWords,
    loading,
    error 
  } = useWordNetContext();
  
  const results = await querySynsets('computer');
}
```

**After:**
```typescript
import { useWordNet } from 'wn-react';

function MyComponent() {
  const { 
    search,
    words,
    loading,
    error 
  } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const results = await search('computer');
}
```

#### New search() Method

**Before:**
```typescript
const synsets = await querySynsets('computer');
```

**After:**
```typescript
// Simple search - returns synsets
const results = await search('computer');

// Or use the full API
const synsets = await synsets('computer');
```

### Node.js API

#### Auto-Initialization

**Before:**
```typescript
const wn = createWordnet('oewn:2024');
await wn.initialize();
const results = await wn.synsets('computer');
await wn.close();
```

**After:**
```typescript
const wn = createWordnet('oewn:2024');
const results = await wn.search('computer'); // Auto-initializes
// Auto-closes on process exit
```

#### Plugin Support

**Before:**
```typescript
// Plugins were baked into the kernel
const wn = new NodeWordNetKernel('oewn:2024');
await wn.getHypernyms(synsetId); // Always available
```

**After:**
```typescript
import { createWordnet } from 'wn-ts-node';
import { relationsPlugin } from 'wn-ts-node/plugins';

// Plugins are optional
const wn = createWordnet('oewn:2024', {
  plugins: [relationsPlugin]
});

await wn.getHypernyms(synsetId); // Only available if plugin loaded
```

### Web API

#### Factory Function

**Before:**
```typescript
import { WebWordNetKernel } from 'wn-ts-web';

const wn = new WebWordNetKernel('oewn:2024');
await wn.initialize();
```

**After:**
```typescript
import { createWebWordnet } from 'wn-ts-web';

const wn = createWebWordnet('oewn:2024'); // Auto-initializes
```

## 📦 Package Changes

### New Package: wn-react

React functionality has been moved to a separate package:

```bash
# Install the new package
npm install wn-react

# Remove old imports
# ❌ import { useWordNetContext } from 'wn-ts-web/react';
# ✅ import { useWordNet } from 'wn-react';
```

### Subpath Exports

Advanced users can now access specific functionality:

```typescript
// Low-level API
import { NodeWordNetKernel } from 'wn-ts-node/low-level';

// Plugins
import { relationsPlugin } from 'wn-ts-node/plugins';

// Legacy APIs (for migration)
import { Wordnet } from 'wn-ts-node/legacy';
```

## 🔧 Migration Checklist

### For React Applications

- [ ] Install `wn-react` package
- [ ] Update imports from `wn-ts-web/react` to `wn-react`
- [ ] Replace `useWordNetContext()` with `useWordNet()`
- [ ] Update method calls (`querySynsets` → `search`)
- [ ] Remove provider setup (auto-initialization)
- [ ] Test your application

### For Node.js Applications

- [ ] Replace `NodeWordNetKernel` with `createWordnet()`
- [ ] Remove manual `initialize()` calls
- [ ] Remove manual `close()` calls
- [ ] Add plugin imports if using advanced features
- [ ] Test your application

### For Web Applications (Direct)

- [ ] Replace `WebWordNetKernel` with `createWebWordnet()`
- [ ] Remove manual `initialize()` calls
- [ ] Remove manual `close()` calls
- [ ] Test your application

## 🆕 New Features in v1.0.0

### 1. Auto-Initialization

No more manual initialization required:

```typescript
// v1.0.0 - Just works!
const wn = createWordnet('oewn:2024');
const results = await wn.search('computer');
```

### 2. Simple search() Method

New convenience method for common use cases:

```typescript
// Returns synsets directly
const results = await wn.search('computer');
```

### 3. Better Error Handling

User-friendly error messages with solutions:

```typescript
try {
  const results = await wn.search('computer');
} catch (error) {
  console.log(error.userMessage); // "Failed to load WordNet data"
  console.log(error.solutions);   // ["Check your internet connection", ...]
}
```

### 4. Plugin System

Optional plugins for advanced functionality:

```typescript
import { relationsPlugin, similarityPlugin } from 'wn-ts-node/plugins';

const wn = createWordnet('oewn:2024', {
  plugins: [relationsPlugin, similarityPlugin]
});
```

## 🐛 Common Migration Issues

### Issue: "Module not found: wn-react"

**Solution:** Install the new package:
```bash
npm install wn-react
```

### Issue: "useWordNetContext is not a function"

**Solution:** Update your import:
```typescript
// ❌ Old
import { useWordNetContext } from 'wn-ts-web/react';

// ✅ New
import { useWordNet } from 'wn-react';
```

### Issue: "querySynsets is not a function"

**Solution:** Use the new `search()` method:
```typescript
// ❌ Old
const results = await querySynsets('computer');

// ✅ New
const results = await search('computer');
```

### Issue: "Database not initialized"

**Solution:** Remove manual initialization (auto-initialization handles this):
```typescript
// ❌ Old
const wn = createWordnet('oewn:2024');
await wn.initialize();
const results = await wn.search('computer');

// ✅ New
const wn = createWordnet('oewn:2024');
const results = await wn.search('computer'); // Auto-initializes
```

## 📚 Additional Resources

- [Complete API Reference](../api/api-reference.md)
- [React Guide](../platforms/web/)
- [Node.js Guide](../platforms/node/)
- [Examples](../examples/)

## 🆘 Need Help?

If you encounter issues during migration:

1. Check this migration guide
2. Review the [API Reference](../api/api-reference.md)
3. Look at the [Examples](../examples/) for working code
4. Open an issue on [GitHub](https://github.com/fustilio/wordnet-playground/issues)

---

**Migration complete? Check out the new [Quick Start Guide](../quick-start.md) to see the improved developer experience!**

