# 🎯 Issue Tracker - WordNet TypeScript DX Improvements

**Status**: Active  
**Last Updated**: 2024-12-19  
**Priority**: High Impact DX Issues

---

## 🚨 **Critical Issues (P0)**

### Issue #1: No Clear Main Export
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P0 - Critical  
**Impact**: 90% of users affected

**Problem**: Users can't find the main API
```typescript
// What users want:
import WordNet from 'wn-ts-node';

// What they get:
import { Wordnet, KyselyWordnet, NodeWordNetKernel, createWordnet } from 'wn-ts-node';
// Which one?!?
```

**Solution Implemented**:
- ✅ Added default export: `export { createWordnet as default }`
- ✅ Organized exports (main/advanced/legacy)
- ✅ Clear documentation in quick-start.md

**Files Changed**:
- `packages/wn-ts-node/src/index.ts`
- `packages/wn-ts-web/src/index.ts`

---

### Issue #2: Export Chaos (90+ Exports)
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P0 - Critical  
**Impact**: Overwhelming for users

**Problem**: 90+ named exports in flat namespace
```typescript
// Overwhelming:
import { 
  Wordnet, KyselyWordnet, NodeWordNetKernel, createWordnet,
  download, add, remove, words, synsets, senses,
  getHypernyms, getHyponyms, TranslationHelper,
  // ... 80+ more
} from 'wn-ts-node';
```

**Solution Implemented**:
- ✅ Organized into main/advanced/legacy sections
- ✅ Clear deprecation notices with `@deprecated`
- ✅ Default export for main API

**Files Changed**:
- `packages/wn-ts-node/src/index.ts`
- `packages/wn-ts-web/src/index.ts`

---

### Issue #3: Manual Initialization Required
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P0 - Critical  
**Impact**: #1 user error

**Problem**: Users forget to call `initialize()`
```typescript
const wn = createWordnet('oewn:2024');
await wn.initialize();  // Easy to forget!
const results = await wn.synsets('computer');
```

**Solution Implemented**:
- ✅ Auto-initialize on first query
- ✅ Auto-close on process exit
- ✅ `ensureInitialized()` private method

**Files Changed**:
- `packages/wn-ts-node/src/kysely-wordnet.ts`

---

## 🔥 **High Priority Issues (P1)**

### Issue #4: Non-Intuitive API Methods
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P1 - High  
**Impact**: Learning curve

**Problem**: Technical method names don't match user intent
```typescript
// What users naturally try:
await wn.search('computer');
await wn.define('happy');
await wn.translate('water', 'en', 'fr');

// What they get:
await wn.synsets({ form: 'computer' });
const defs = synsets.map(s => s.definitions[0]?.text);
// Complex translation setup...
```

**Solution Implemented**:
- ✅ Added `search(term, options?)` method
- ✅ Added `define(term, pos?)` method  
- ✅ Added `related(term, type)` method
- ✅ Added `translate(term, from, to)` method (stubbed)
- ✅ Added `similar(word1, word2)` method (stubbed)

**Files Changed**:
- `packages/wn-ts-node/src/kysely-wordnet.ts`
- `packages/wn-ts-web/src/wordnet-kernel.ts`

---

### Issue #5: React Hook Returns 40+ Methods
**Status**: ⏳ **PARTIALLY RESOLVED** (v0.8.0)  
**Priority**: P1 - High  
**Impact**: Cognitive overload

**Problem**: Overwhelming hook return
```typescript
const {
  queryWords, querySynsets, querySenses,
  getHypernyms, getHyponyms, getMeronyms, getHolonyms,
  getPathSimilarity, getWuPalmerSimilarity,
  loadPackageData, refreshPackages, unloadData,
  introspectLexicon, introspectAllResources,
  // ... 30+ more methods
} = useWordNetContext();
```

**Solution Status**:
- ✅ Added default export for hook
- ⏳ **TODO**: Group methods into namespaces (query, plugins, packages, admin, state)

**Files to Change**:
- `packages/wn-ts-web/src/react/hooks/useWordNet.ts`

---

### Issue #6: Missing Documentation
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P1 - High  
**Impact**: 100% of new users

**Problem**: No clear entry point, broken links, confusing structure

**Solution Implemented**:
- ✅ Created `docs/quick-start.md` (5-minute guide)
- ✅ Created `docs/api/api-reference.md` (complete reference)
- ✅ Created `docs/package-manager.md` (pnpm explained)
- ✅ Created `docs/error-handling.md` (troubleshooting)
- ✅ Fixed all broken links (15+ → 0)
- ✅ Lowercase slugs (proper kebab-case)

**Files Created**: 12+ new documentation files

---

## 🔧 **Medium Priority Issues (P2)**

### Issue #7: Platform Inconsistency
**Status**: ⏳ **PARTIALLY RESOLVED** (v0.8.0)  
**Priority**: P2 - Medium  
**Impact**: Confusion across platforms

**Problem**: Different APIs for same functionality
```typescript
// Node.js
import { createWordnet } from 'wn-ts-node';

// Web
import { WebWordNetKernel } from 'wn-ts-web';

// React
import { useWordNetContext } from 'wn-ts-web/react';
```

**Solution Status**:
- ✅ Added consistent user-intent methods across platforms
- ✅ Added default exports for all platforms
- ⏳ **TODO**: Standardize initialization patterns

---

### Issue #8: No npm-Compatible Examples
**Status**: ✅ **RESOLVED** (v0.8.0)  
**Priority**: P2 - Medium  
**Impact**: New users can't try the library

**Problem**: All examples use `workspace:*` and `catalog:` dependencies

**Solution Implemented**:
- ✅ Created `examples/standalone/` with npm-compatible examples
- ✅ Created `examples/hello-world/` minimal examples
- ✅ Documented `catalog:` dependencies in READMEs

**Files Created**:
- `examples/standalone/node-minimal/`
- `examples/standalone/web-minimal/`
- `examples/hello-world/`

---

### Issue #9: Poor Error Messages
**Status**: ⏳ **PARTIALLY RESOLVED** (v0.8.0)  
**Priority**: P2 - Medium  
**Impact**: User frustration

**Problem**: Cryptic technical errors
```typescript
// Current
Error: Parser error in LmfParser: Cannot read property 'getAttribute' of null

// Better
WordNet Error: Failed to load data for oewn:2024
How to fix:
  1. Clear your cache: rm -rf ~/.wn_data
  2. Try downloading again
  3. Or try a different version: oewn:2023
```

**Solution Status**:
- ✅ Created error handling guide
- ⏳ **TODO**: Implement user-friendly error classes throughout codebase

---

## 🏗️ **Architecture Issues (P3)**

### Issue #10: 12-Layer Architecture
**Status**: 📋 **DEFERRED** (v1.0.0)  
**Priority**: P3 - Low  
**Impact**: Performance, debuggability

**Problem**: Too many abstraction layers
```
useWordNetContext() → WordNetProvider → useWordNet() → 
WordNetWorkerClient → Comlink → WordNet Worker → 
WordNetOrchestrator → DataLoader → WebWordnet → 
WebWordNetCore → KyselyQueryService → Kysely → SQLite WASM
```

**Proposed Solution**:
- Reduce to 6 layers
- Merge WordNetOrchestrator + DataLoader + WebWordnet
- Remove WebWordNetCore (interface overhead)

**Effort**: 6-8 hours  
**Breaking**: Yes (internal architecture)

---

### Issue #11: Plugin System Half-Baked
**Status**: 📋 **DEFERRED** (v1.0.0)  
**Priority**: P3 - Low  
**Impact**: Modularity claims

**Problem**: Plugins are baked in, not truly optional
```typescript
// Advertised as modular
const wn = new WordNetKernel(core, [relationsPlugin, similarityPlugin]);

// Reality: All plugins already loaded
const wn = new NodeWordNetKernel('oewn:2024');
await wn.getHypernyms(id);  // Already available!
```

**Proposed Solution**:
- Make plugins truly optional
- Create plugin marketplace
- Allow custom plugins

**Effort**: 20+ hours  
**Breaking**: Yes (plugin API)

---

### Issue #12: Core Package Not Minimal
**Status**: 📋 **DEFERRED** (v1.0.0)  
**Priority**: P3 - Low  
**Impact**: Package bloat

**Problem**: wn-ts-core exports 100+ things instead of being minimal

**Proposed Solution**:
- Split into core (types only) + utilities
- Move parsers, validation, etc. to separate packages

**Effort**: 10+ hours  
**Breaking**: Yes (import paths)

---

## 🎯 **Quick Wins (P4)**

### Issue #13: Method Naming Inconsistency
**Status**: ⏳ **PARTIALLY RESOLVED** (v0.8.0)  
**Priority**: P4 - Low  
**Impact**: Developer experience

**Problem**: Inconsistent prefixes (query, get, search, introspect, etc.)

**Solution Status**:
- ✅ Added consistent user-intent methods
- ⏳ **TODO**: Standardize all method prefixes

---

### Issue #14: Missing Type Inference
**Status**: 📋 **DEFERRED** (v0.9.0)  
**Priority**: P4 - Low  
**Impact**: Developer experience

**Problem**: Complex generic types, poor autocomplete

**Proposed Solution**:
- Better type inference
- Improved JSDoc
- Better IDE support

---

## 📊 **Issue Summary**

| Priority | Total | Resolved | In Progress | Deferred |
|----------|-------|----------|-------------|----------|
| P0 - Critical | 3 | 3 | 0 | 0 |
| P1 - High | 3 | 2 | 1 | 0 |
| P2 - Medium | 3 | 2 | 1 | 0 |
| P3 - Architecture | 3 | 0 | 0 | 3 |
| P4 - Quick Wins | 2 | 0 | 1 | 1 |
| **Total** | **14** | **7** | **2** | **4** |

**Resolved**: 7/14 (50%)  
**In Progress**: 2/14 (14%)  
**Deferred**: 4/14 (29%)  
**Remaining**: 1/14 (7%)

---

## 🚀 **Next Steps**

### Immediate (v0.8.1)
1. **Complete React hook reorganization** (Issue #5)
2. **Implement user-friendly errors** (Issue #9)
3. **Standardize platform APIs** (Issue #7)

### Short-term (v0.9.0)
1. **Better error messages throughout** (Issue #9)
2. **Smart defaults everywhere** (Issue #14)
3. **Complete plugin integration** (translate, similar methods)

### Long-term (v1.0.0)
1. **Simplify architecture** (Issue #10)
2. **True plugin system** (Issue #11)
3. **Minimal core package** (Issue #12)

---

## 📝 **How to Use This Tracker**

### For Contributors
1. Pick an issue from your priority level
2. Check the "Solution Status" section
3. Follow the "Files to Change" guidance
4. Update status when complete

### For Users
1. Check "Resolved" issues for new features
2. Check "In Progress" for upcoming improvements
3. Check "Deferred" for long-term roadmap

### For Maintainers
1. Update issue status when changes are merged
2. Add new issues as they're discovered
3. Prioritize based on user impact

---

**Last Updated**: 2024-12-19  
**Next Review**: 2024-12-26
