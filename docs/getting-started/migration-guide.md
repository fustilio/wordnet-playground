# Migration Guide

## Overview

This guide helps users migrate from older versions of the WordNet TypeScript ecosystem to the current version (v0.7.2), covering breaking changes, new features, and best practices.

## Version History

### **Major Version Changes**

| Version | Release Date | Major Changes | Breaking Changes |
|---------|--------------|---------------|------------------|
| **v0.7.2** | Dec 2024 | Production ready, comprehensive testing | Minor API changes |
| **v0.5.x** | Nov 2024 | Microkernel architecture, plugin system | Major API restructuring |
| **v0.4.x** | Oct 2024 | Cross-lingual support, ILI integration | Database schema changes |
| **v0.3.x** | Sep 2024 | Web implementation, React integration | Platform-specific APIs |
| **v0.2.x** | Aug 2024 | Node.js implementation, SQLite integration | Core API changes |
| **v0.1.x** | Jul 2024 | Initial release, basic functionality | N/A |

## Migration from v0.5.x to v0.7.2

### **Breaking Changes**

#### **1. Plugin System API Changes**
```typescript
// OLD (v0.5.x)
import { WordNetKernel } from 'wn-ts-core';
import { relationsPlugin } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core);
wordnet.use(relationsPlugin);

// NEW (v0.7.2)
import { createWordNet } from 'wn-ts-core';
import { relationsPlugin } from 'wn-ts-core/plugins';

const wordnet = createWordNet({
  core: new WebWordNetCore('oewn:2024'),
  plugins: [relationsPlugin]
});
```

#### **2. Query API Changes**
```typescript
// OLD (v0.5.x)
const words = await wordnet.words('computer', 'n');
const synsets = await wordnet.synsets('computer', 'n');

// NEW (v0.7.2)
const words = await wordnet.words({ form: 'computer', pos: 'n' });
const synsets = await wordnet.synsets({ form: 'computer', pos: 'n' });
```

#### **3. Error Handling Changes**
```typescript
// OLD (v0.5.x)
try {
  const words = await wordnet.words('computer');
} catch (error) {
  console.error('Error:', error.message);
}

// NEW (v0.7.2)
try {
  const words = await wordnet.words({ form: 'computer' });
} catch (error) {
  if (error instanceof WordNetError) {
    console.error(`WordNet Error: ${error.message} (${error.code})`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### **New Features**

#### **1. Enhanced Plugin System**
```typescript
// NEW: Type-safe plugin system
const wordnet = createWordNet({
  core: new WebWordNetCore('oewn:2024'),
  plugins: [
    relationsPlugin,
    similarityPlugin,
    translationPlugin
  ]
});

// TypeScript knows the exact return types
const hypernyms: Synset[] = await wordnet.getHypernyms(synsetId);
const similarity: number = await wordnet.getPathSimilarity(synset1, synset2);
```

#### **2. Improved Query Performance**
```typescript
// NEW: Query strategies
const wordnet = new WebWordNetKernel('oewn:2024', {
  strategy: 'v5' // Ultra-fast with caching
});

// Performance: 50,000+ Hz vs 1,000+ Hz in v0.5.x
const words = await wordnet.words({ form: 'computer' });
```

#### **3. Better Error Handling**
```typescript
// NEW: Structured error types
try {
  const words = await wordnet.words({ form: 'computer' });
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle database errors
  } else if (error instanceof QueryError) {
    // Handle query errors
  } else if (error instanceof PluginError) {
    // Handle plugin errors
  }
}
```

## Migration from v0.4.x to v0.7.2

### **Major Changes**

#### **1. Database Schema Changes**
```typescript
// OLD (v0.4.x): Direct database access
const db = new Database('wordnet.db');
const words = await db.query('SELECT * FROM words WHERE form = ?', ['computer']);

// NEW (v0.7.2): Abstracted API
const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
```

#### **2. Cross-Lingual API Changes**
```typescript
// OLD (v0.4.x): Manual ILI handling
const ili = await db.query('SELECT * FROM ilis WHERE id = ?', [iliId]);
const synsets = await db.query('SELECT * FROM synsets WHERE ili = ?', [iliId]);

// NEW (v0.7.2): Integrated translation
const translations = await wordnet.getTranslations(synsetId, 'fr');
const ili = await wordnet.ili(iliId);
const synsets = await wordnet.synsetsByILI(iliId);
```

### **Migration Steps**

#### **Step 1: Update Dependencies**
```json
{
  "dependencies": {
    "wn-ts-core": "^0.5.2",
    "wn-ts-web": "^0.7.2",
    "wn-ts-node": "^0.7.2"
  }
}
```

#### **Step 2: Update Imports**
```typescript
// OLD
import { WordNetKernel } from 'wn-ts-core';
import { NodeWordNetCore } from 'wn-ts-node';

// NEW
import { createWordNet } from 'wn-ts-core';
import { NodeWordNetCore } from 'wn-ts-node';
import { relationsPlugin, similarityPlugin } from 'wn-ts-core/plugins';
```

#### **Step 3: Update Initialization**
```typescript
// OLD
const core = new NodeWordNetCore('oewn:2024');
const wordnet = new WordNetKernel(core);
await wordnet.initialize();

// NEW
const wordnet = createWordNet({
  core: new NodeWordNetCore('oewn:2024'),
  plugins: [relationsPlugin, similarityPlugin]
});
await wordnet.initialize();
```

#### **Step 4: Update Query Calls**
```typescript
// OLD
const words = await wordnet.words('computer', 'n');
const synsets = await wordnet.synsets('computer', 'n');

// NEW
const words = await wordnet.words({ form: 'computer', pos: 'n' });
const synsets = await wordnet.synsets({ form: 'computer', pos: 'n' });
```

## Migration from v0.3.x to v0.7.2

### **Web-Specific Changes**

#### **1. React Integration Changes**
```typescript
// OLD (v0.3.x): Manual React integration
import { WordNetProvider } from 'wn-ts-web/react';

function App() {
  return (
    <WordNetProvider lexiconId="oewn:2024">
      <MyComponent />
    </WordNetProvider>
  );
}

// NEW (v0.7.2): Enhanced React integration
import { WordNetProvider, useWordNet } from 'wn-ts-web/react';

function App() {
  return (
    <WordNetProvider 
      lexiconId="oewn:2024"
      options={{
        strategy: 'v5',
        autoLoad: true
      }}
    >
      <MyComponent />
    </WordNetProvider>
  );
}

function MyComponent() {
  const { wordnet, loading, error } = useWordNet();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>WordNet ready!</div>;
}
```

#### **2. Web Worker Changes**
```typescript
// OLD (v0.3.x): Manual worker setup
const worker = new Worker('./wordnet-worker.js');
const wordnet = Comlink.wrap(worker);

// NEW (v0.7.2): Integrated worker management
const wordnet = new WebWordNetKernel('oewn:2024', {
  workerOptions: {
    maxWorkers: 4,
    timeout: 30000
  }
});
```

## Migration from v0.2.x to v0.7.2

### **Node.js-Specific Changes**

#### **1. CLI Changes**
```bash
# OLD (v0.2.x)
wn-ts words computer
wn-ts synsets computer

# NEW (v0.7.2)
wn-ts words --form computer
wn-ts synsets --form computer
wn-ts relations --synset-id synset-1
wn-ts similarity --synset1 synset-1 --synset2 synset-2
```

#### **2. Database Management**
```typescript
// OLD (v0.2.x): Manual database management
const db = new Database('wordnet.db');
await db.initialize();

// NEW (v0.7.2): Integrated database management
const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db',
  autoLoad: true
});
await wordnet.initialize();
```

## Migration Tools

### **Automated Migration Script**
```bash
# Run migration script
npx wn-ts-migrate --from v0.5.x --to v0.7.2

# Interactive migration
npx wn-ts-migrate --interactive

# Check migration compatibility
npx wn-ts-migrate --check
```

### **Manual Migration Checklist**

#### **Pre-Migration**
- [ ] Backup current codebase
- [ ] Update package.json dependencies
- [ ] Run existing tests to establish baseline
- [ ] Document current API usage

#### **Migration Steps**
- [ ] Update import statements
- [ ] Update initialization code
- [ ] Update query calls
- [ ] Update error handling
- [ ] Update plugin usage
- [ ] Update React components (if applicable)

#### **Post-Migration**
- [ ] Run test suite
- [ ] Update documentation
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Deploy to staging environment

## Common Migration Issues

### **Issue 1: Plugin System Changes**
```typescript
// PROBLEM: Old plugin usage
const wordnet = new WordNetKernel(core);
wordnet.use(relationsPlugin);

// SOLUTION: New plugin usage
const wordnet = createWordNet({
  core: new WebWordNetCore('oewn:2024'),
  plugins: [relationsPlugin]
});
```

### **Issue 2: Query API Changes**
```typescript
// PROBLEM: Old query syntax
const words = await wordnet.words('computer', 'n');

// SOLUTION: New query syntax
const words = await wordnet.words({ form: 'computer', pos: 'n' });
```

### **Issue 3: Error Handling Changes**
```typescript
// PROBLEM: Generic error handling
try {
  const words = await wordnet.words('computer');
} catch (error) {
  console.error('Error:', error.message);
}

// SOLUTION: Structured error handling
try {
  const words = await wordnet.words({ form: 'computer' });
} catch (error) {
  if (error instanceof WordNetError) {
    console.error(`WordNet Error: ${error.message} (${error.code})`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Migration Resources

### **Documentation**
- [API Reference](/api/)** - Complete API documentation
- [Examples](/examples/)** - Working examples and demos
- [Performance Guide](/development/performance.md)** - Performance optimization
- [Testing Guide](/development/test-coverage.md)** - Testing best practices

### **Support**
- [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues) - Bug reports and feature requests
- [Discussions](https://github.com/fustilio/wordnet-playground/discussions) - Community support
- [Documentation](../) - Complete documentation

### **Migration Examples**
- [Migration Examples](/examples/)** - Migration examples and guides

## Migration Timeline

### **Recommended Migration Schedule**

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Planning** | 1 week | Assess current usage, plan migration |
| **Development** | 2-3 weeks | Implement changes, update code |
| **Testing** | 1-2 weeks | Test migration, fix issues |
| **Deployment** | 1 week | Deploy to production, monitor |

### **Migration Support**

- **Community Support**: Available through GitHub discussions
- **Professional Support**: Available for enterprise customers
- **Migration Services**: Custom migration assistance available

---

**Last Updated**: December 2024
**Migration Version**: v0.7.2
**Supported Versions**: v0.2.x → v0.7.2
**Migration Tools**: Available

