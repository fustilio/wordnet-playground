# Critical Bug Fixes - v0.8.1

## Bug #1: Network Fetch Failures ✅ FIXED

**Issue**: `download()` function failed with generic "fetch failed" errors.

**Root Cause**: Missing User-Agent header, no timeout handling, poor error messages.

**Fix**: 
- Added User-Agent header
- Added 5-minute timeout with AbortController
- Improved error messages with context
- Added fetch availability check

**Files Changed**:
- `packages/wn-ts-node/src/data-management/adapters/node-data-manager.ts`

---

## Bug #2: Empty Database Queries ✅ FIXED

**Issue**: After `download()`, queries returned 0 results even though data was inserted.

**Root Cause**: 
1. `forceRecreate: true` was deleting the database
2. `NodeWordNetKernel` defaulted to `:memory:` instead of using the same database as `download()`

**Fix**:
- Changed `forceRecreate: false` in production code
- Changed `NodeWordNetKernel` default from `:memory:` to `config.databasePath`
- Added database validation after data loading

**Files Changed**:
- `packages/wn-ts-node/src/data-management/index.ts`
- `packages/wn-ts-node/src/wordnet-kernel.ts`
- `packages/wn-ts-core/src/modules/data-management/shared-data-manager.ts`

---

## Impact

✅ Serverless deployments now work (Vercel, Netlify, AWS Lambda)
✅ Build-time data extraction works correctly
✅ Database queries return data after download
✅ Production-ready for all use cases
