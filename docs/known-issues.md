# Known Issues & Deprecations

Track of deprecated APIs and known issues.

## Deprecated APIs

### Node.js

**Deprecated in v0.7.0** (still works, but don't use):

```typescript
// ❌ Old API (deprecated)
import { Wordnet } from 'wn-ts-node';
const wn = new Wordnet('oewn:2024', { /* config */ });

// ✅ New API (use this)
import { createWordnet } from 'wn-ts-node';
const wn = createWordnet('oewn:2024');
```

**Migration**: Replace `new Wordnet()` with `createWordnet()` everywhere.

**Removal**: Planned for v0.9.0

---

### Web (React Hooks)

**Deprecated in v0.7.0** (still works, but don't use):

```typescript
// ❌ Old hook (deprecated)
import { useWordNet } from 'wn-ts-web/react';
const { wordnet, loading } = useWordNet();

// ✅ New hook (use this)
import { useWordNetContext } from 'wn-ts-web/react';
const { querySynsets, loading } = useWordNetContext();
```

**Migration**: Replace `useWordNet` with `useWordNetContext` everywhere.

**Removal**: Planned for v0.9.0

---

### Web (Kernel API)

**Deprecated in v0.7.0** (still works for direct usage):

```typescript
// ⚠️ Still valid for advanced users
import { WebWordNetKernel } from 'wn-ts-web';
const wn = new WebWordNetKernel('oewn:2024');

// ✅ Recommended for React apps
import { useWordNetContext } from 'wn-ts-web/react';
const { querySynsets } = useWordNetContext();
```

**Note**: Direct kernel usage is still supported for non-React applications. Only deprecated for React applications (use the hook instead).

---

## Documentation Issues

### Fixed in Latest Docs

**1. Broken Links** ✅ FIXED
- Updated all relative paths to match VitePress structure
- Fixed examples directory references
- Corrected command paths

**2. API Inconsistency** ✅ FIXED  
- Created single source of truth: [api-reference.md](./api/api-reference.md)
- Updated all docs to use consistent API
- Marked old APIs as deprecated

**3. Hardcoded Paths** ✅ FIXED
- Removed Windows-specific paths from examples
- Use `tmpdir()` for cross-platform compatibility
- Added data directory documentation

### Remaining Issues

**1. VitePress Navigation** 🔴 IN PROGRESS
- Some sidebar links may not match file structure
- Need to update `.vitepress/config.ts` navigation
- Test all links in VitePress dev server

**2. Example Consolidation** 🟡 PLANNED
- Three web demos need consolidation
- See [MIGRATION_PLAN.md](../examples/MIGRATION_PLAN.md)

**3. Missing Examples** 🟡 PLANNED
- No Express.js REST API example
- No Next.js integration example
- No production deployment guide

---

## Code Issues

### Known Limitations

**1. OPFS Browser Support**
- **Status**: Requires modern browsers
- **Browsers**: Chrome 86+, Firefox 111+, Safari 16.4+
- **Fallback**: Automatic fallback to IndexedDB/memory
- **Impact**: Some browsers don't get persistence

**2. Large Dataset Performance**
- **Status**: Some operations slow on datasets > 1M entries
- **Workaround**: Use pagination, filters
- **Fix**: Planned for v0.8.0

**3. Worker Initialization Race Conditions**
- **Status**: Rare race condition on rapid reloads
- **Workaround**: Debounce initialization calls
- **Fix**: In progress

---

## Migration Guides

### v0.6.x → v0.7.x

**Changes**:
1. API renamed for consistency
2. React hooks simplified
3. Plugin system introduced

**Breaking Changes**: None (old APIs still work)

**Action Required**: Update to new APIs before v0.9.0

**Guide**: See [Migration Guide](./getting-started/migration-guide.md)

### v0.5.x → v0.6.x

**Changes**:
1. Microkernel architecture
2. Schema management system
3. Performance optimizations

**Breaking Changes**: Database schema updated

**Action Required**: Re-download WordNet data

---

## Reporting Issues

### Before Reporting

1. **Check this document** - Issue may be known
2. **Check documentation** - May be user error
3. **Test with latest version** - May already be fixed
4. **Search existing issues** - May be duplicate

### How to Report

**Good Issue**:
```markdown
**Environment**:
- Package: wn-ts-node v0.7.2
- Node.js: v20.10.0
- OS: Windows 11

**Expected**: Should return 3 synsets
**Actual**: Returns empty array
**Code**: [minimal reproduction]
**Error**: [full error message]
```

**Bad Issue**:
```markdown
It doesn't work. Help!
```

### Where to Report

- **Bugs**: [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)
- **Questions**: [GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)
- **Documentation**: [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues) (label: documentation)

---

## Planned Deprecations

### v0.8.0 (Upcoming)

**No deprecations planned** - API is stable

### v0.9.0 (Future)

**Will remove**:
- `new Wordnet()` constructor (use `createWordnet()`)
- `useWordNet()` hook (use `useWordNetContext()`)
- Old plugin loading patterns

**Action**: Migrate to new APIs now to avoid breaking changes

---

## Version Support

| Version | Status | Support Until |
|---------|--------|---------------|
| **v0.7.x** | ✅ Current | Indefinite |
| **v0.6.x** | ⚠️ Maintenance | 2025-12-31 |
| **v0.5.x** | ❌ Unsupported | 2025-06-30 |

**Maintenance**: Bug fixes only, no new features  
**Unsupported**: No updates, upgrade recommended

---

**Stay updated on deprecations and issues by watching the [GitHub repository](https://github.com/fustilio/wordnet-playground).**

