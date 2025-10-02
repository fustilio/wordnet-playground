# Cross-Lingual Dependencies & Lexicon Requirements

## 🎯 **Overview**

This document explains the cross-lingual dependency system in WordNet TypeScript, which is crucial for proper interlingual operations. Many WordNets depend on other lexicons for their taxonomic scaffolding and cross-lingual relationships.

## 🏗️ **Microkernel Architecture Integration**

The cross-lingual dependency system is integrated with the microkernel architecture:

### **Translation Plugin**
- **Cross-Lingual Relations**: Access relations across different languages
- **ILI Mapping**: Map synsets between languages using Interlingual Index
- **Dependency Resolution**: Automatically resolve lexicon dependencies

### **Kernel Management**
- **Dependency Tracking**: Kernel tracks and manages lexicon dependencies
- **Health Checks**: Validate cross-lingual dependencies and ILI mappings

## 🔗 **Understanding Lexicon Dependencies**

### **The `Requires` Field**

WordNets often specify dependencies using the `Requires` element in their LMF XML:

```xml
<Lexicon id="omw-fr" language="fr" version="1.4">
  <Requires id="omw-en" version="1.4" />
  <!-- Lexical entries and synsets -->
</Lexicon>
```

This indicates that the French WordNet (`omw-fr:1.4`) **depends on** the English WordNet (`omw-en:1.4`) for its taxonomic structure.

### **Why Dependencies Matter**

1. **Taxonomic Scaffolding**: Dependent WordNets use the English WordNet's concept hierarchy
2. **ILI Mapping**: French synsets reference English ILIs for cross-lingual linking
3. **Relation Traversal**: Hypernyms, hyponyms, and other relations depend on the base lexicon
4. **Cross-Lingual Queries**: Without the base lexicon, interlingual operations fail

## 📋 **Dependency Chain Example**

```
omw-en:1.4 (Base Lexicon)
    ↓
omw-fr:1.4 (Dependent Lexicon)
    ↓
cili:1.0 (Interlingual Index)
```

**Loading Order**:
1. **First**: Load `omw-en:1.4` (provides core concepts and ILIs)
2. **Second**: Load `omw-fr:1.4` (references English ILIs)
3. **Third**: Load `cili:1.0` (provides stable ILI identifiers)

## ⚠️ **Dependency Warnings**

When loading a dependent lexicon without its requirements, the system should warn users:

```typescript
// Example warning (similar to Python wn)
WnWarning: lexicon dependencies not available: omw-en:1.4
```

**What This Means**:
- The lexicon will load but won't function properly
- Cross-lingual queries will fail
- Relation traversal (hypernyms, hyponyms) won't work
- ILI-based lookups will return empty results

## 🚀 **Implementation Requirements**

### **A. Dependency Detection & Warnings**

The system must:

1. **Parse `Requires` fields** during LMF XML processing
2. **Check dependency availability** before loading dependent lexicons
3. **Issue clear warnings** when dependencies are missing
4. **Provide guidance** on how to resolve dependency issues

### **B. Automatic Dependency Loading**

The system should:

1. **Detect missing dependencies** automatically
2. **Suggest required packages** to download
3. **Load dependencies first** when explicitly requested
4. **Maintain proper loading order** for optimal functionality

## 🔧 **Technical Implementation**

### **Lexicon Interface Updates**

```typescript
interface Lexicon {
  id: string;
  language: string;
  version: string;
  label: string;
  requires: string[];        // Array of required lexicon IDs
  isExpanded: boolean;       // Whether dependencies are loaded
  expandedLexicons: string[]; // List of available expanded lexicons
}
```

### **Dependency Management**

```typescript
class DependencyManager {
  // Check if all dependencies are available
  async checkDependencies(lexicon: Lexicon): Promise<DependencyStatus>;
  
  // Load missing dependencies automatically
  async loadDependencies(lexicon: Lexicon): Promise<void>;
  
  // Get dependency tree for a lexicon
  getDependencyTree(lexiconId: string): DependencyTree;
}
```

### **Warning System**

```typescript
class DependencyWarning {
  static warnMissingDependencies(lexicon: Lexicon, missing: string[]): void;
  static suggestResolution(lexicon: Lexicon): string[];
  static checkExpandedLexicons(lexicon: Lexicon): boolean;
}
```

## 📊 **Testing Requirements**

### **Unit Tests**

```typescript
describe('DependencyManager', () => {
  it('should detect missing dependencies', async () => {});
  it('should warn when dependencies are unavailable', async () => {});
  it('should load dependencies in correct order', async () => {});
  it('should handle circular dependencies gracefully', async () => {});
});
```

### **Integration Tests**

```typescript
describe('Cross-Lingual Dependencies', () => {
  it('should load French WordNet with English dependencies', async () => {});
  it('should warn when English WordNet is missing', async () => {});
  it('should enable cross-lingual queries after dependency loading', async () => {});
});
```

### **E2E Tests**

```typescript
describe('End-to-End Dependency Loading', () => {
  it('should complete full dependency chain loading', async () => {});
  it('should handle dependency failures gracefully', async () => {});
  it('should provide meaningful error messages', async () => {});
});
```

## 🌐 **Cross-Lingual Query Examples**

### **With Dependencies Loaded**

```typescript
// ✅ All dependencies available
const fr = await wn.loadLexicon('omw-fr:1.4');
const en = await wn.loadLexicon('omw-en:1.4');

// Cross-lingual query works
const apricot = await en.synsets('apricot')[0];
const frenchApricot = await apricot.translate('omw-fr:1.4');
// Result: [Synset('omw-fr-13235-n')]

// Relations work
const hypernyms = await frenchApricot[0].hypernyms();
// Result: [Synset('omw-fr-07705931-n')] - "fruit"
```

### **Without Dependencies**

```typescript
// ❌ Missing dependencies
const fr = await wn.loadLexicon('omw-fr:1.4');
// Warning: lexicon dependencies not available: omw-en:1.4

// Cross-lingual query fails
const apricot = await fr.synsets('abricot')[0];
const englishApricot = await apricot.translate('omw-en:1.4');
// Result: [] (empty)

// Relations don't work
const hypernyms = await apricot.hypernyms();
// Result: [] (empty)
```

## 📚 **Common Dependency Patterns**

### **Open Multilingual Wordnet (OMW)**

```
omw-en:1.4 (Base)
├── omw-fr:1.4 (French)
├── omw-de:1.4 (German)
├── omw-ja:1.4 (Japanese)
└── omw-zh:1.4 (Chinese)
```

### **Open English WordNet (OEWN)**

```
oewn:2024 (Base)
├── odenet:1.4 (German - independent)
└── cili:1.0 (Interlingual Index)
```

## 🚨 **Error Handling & Recovery**

### **Missing Dependency Errors**

```typescript
class MissingDependencyError extends Error {
  constructor(
    public lexiconId: string,
    public missingDependencies: string[]
  ) {
    super(`Lexicon '${lexiconId}' requires: ${missingDependencies.join(', ')}`);
    this.name = 'MissingDependencyError';
  }
}
```

### **Recovery Strategies**

1. **Automatic Download**: Suggest downloading missing dependencies
2. **Graceful Degradation**: Load lexicon with limited functionality
3. **User Guidance**: Provide clear instructions for resolution
4. **Fallback Options**: Use alternative lexicons if available

## 📈 **Performance Considerations**

### **Dependency Loading**

- **Parallel Loading**: Load independent dependencies concurrently
- **Caching**: Cache dependency information to avoid repeated checks
- **Lazy Loading**: Only load dependencies when actually needed
- **Validation**: Verify dependency integrity after loading

### **Cross-Lingual Queries**

- **Index Optimization**: Optimize ILI-based lookups
- **Relation Caching**: Cache frequently accessed relations
- **Batch Operations**: Support batch cross-lingual queries
- **Memory Management**: Efficient memory usage for large lexicons

## 🔍 **Monitoring & Debugging**

### **Dependency Status**

```typescript
// Check dependency status
const status = await wn.getDependencyStatus('omw-fr:1.4');
console.log(status);
// Output:
// {
//   lexiconId: 'omw-fr:1.4',
//   dependencies: ['omw-en:1.4'],
//   loaded: true,
//   expandedLexicons: ['omw-en:1.4'],
//   warnings: []
// }
```

### **Debug Information**

```typescript
// Get detailed dependency information
const info = await wn.getDependencyInfo('omw-fr:1.4');
console.log(info);
// Output:
// {
//   dependencyTree: {...},
//   loadingOrder: ['omw-en:1.4', 'omw-fr:1.4'],
//   conflicts: [],
//   recommendations: [...]
// }
```

## 📋 **Implementation Checklist**

- [ ] Parse `Requires` fields in LMF XML
- [ ] Implement dependency detection
- [ ] Add warning system for missing dependencies
- [ ] Create automatic dependency loading
- [ ] Update lexicon interface with dependency fields
- [ ] Implement dependency validation
- [ ] Add comprehensive testing
- [ ] Update documentation
- [ ] Add error handling and recovery
- [ ] Implement performance optimizations

## 📚 **References**

- **[Python wn Documentation](https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html#cross-lingual-relation-traversal)** - Original dependency system reference
- **[LMF Specification](https://www.lexicalmarkupframework.org/)** - Standard for lexicon dependencies
- **[Global WordNet Association](https://globalwordnet.org/)** - WordNet standards and best practices
- **[Interlingual Index](https://en.wikipedia.org/wiki/Interlingual_Index)** - Cross-lingual concept mapping

---

**Remember**: Proper dependency management is essential for cross-lingual WordNet operations. Always check dependencies before loading lexicons and provide clear guidance to users when dependencies are missing.
