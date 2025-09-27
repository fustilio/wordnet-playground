# Developer Demo

An advanced web application showcasing the full power of the WordNet TypeScript ecosystem, including the microkernel architecture, plugin system, and comprehensive lexicon introspection.

## 🎯 **Overview**

This demo is designed for developers who want to understand the advanced capabilities of WordNet TypeScript. It demonstrates the microkernel architecture, plugin system, cross-lingual translation, and advanced data management features.

## 🚀 **Features**

### **🏗️ Microkernel Architecture**
- **Plugin System**: Live demonstration of relations, similarity, and translation plugins
- **Type Safety**: Full TypeScript support with compile-time checking
- **Plugin Status**: Real-time display of active plugins and their capabilities
- **Interactive Queries**: Search words and explore relationships using plugin methods

### **🌍 Cross-Lingual Capabilities**
- **Multi-language Support**: English, French, Thai, and more
- **Translation Workflows**: ILI-based cross-lingual translation
- **Language Detection**: Automatic language identification
- **Translation Confidence**: Scoring and validation of translations

### **📊 Advanced Data Management**
- **Lexicon Introspection**: Deep analysis of loaded lexicons
- **Resource Analysis**: Understanding data types and capabilities
- **Integrity Validation**: Data quality and consistency checks
- **Performance Monitoring**: Real-time performance metrics

### **🛠️ Developer Tools**
- **Debug Console**: Built-in debugging and logging
- **Performance Monitor**: Real-time performance tracking
- **Memory Usage**: Resource consumption monitoring
- **Error Tracking**: Comprehensive error reporting

## 📁 **Location**

**Source**: `examples/web/web-developer-demo/`  
**Documentation**: This file

## 🛠️ **Setup & Running**

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm
- Modern browser with OPFS support

### **Installation**
```bash
# Navigate to the demo
cd examples/web/web-developer-demo

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### **Build for Production**
```bash
# Build the application
pnpm build

# Preview production build
pnpm preview
```

## 🎯 **Key Features Demonstrated**

### **1. Microkernel Architecture**
```typescript
import { useWordNetKernel } from 'wn-ts-web';

const MyComponent = () => {
  const {
    wordnet,
    plugins,
    getHypernyms,
    getPathSimilarity,
    getTranslations
  } = useWordNetKernel({ 
    lexicon: 'oewn:2024',
    plugins: ['relations', 'similarity', 'translation']
  });
  
  // Use plugin methods
  const hypernyms = await getHypernyms(synsetId);
  const similarity = await getPathSimilarity(synset1Id, synset2Id);
  const translations = await getTranslations(synsetId, 'fr');
};
```

### **2. Cross-Lingual Translation**
```typescript
const handleTranslation = async (word: string, fromLang: string, toLang: string) => {
  // Search for word in source language
  const sourceWords = await wordnet.words({ form: word, language: fromLang });
  
  // Get synsets
  const synsets = await wordnet.synsets({ wordId: sourceWords[0].id });
  
  // Translate using ILI
  const translations = await wordnet.getTranslations(synsets[0].id, toLang);
  
  return translations;
};
```

### **3. Lexicon Introspection**
```typescript
const analyzeLexicon = async (lexiconId: string) => {
  const introspection = await wordnet.introspectLexicon(lexiconId);
  
  console.log('Lexicon Analysis:', {
    wordCount: introspection.wordCount,
    synsetCount: introspection.synsetCount,
    language: introspection.language,
    capabilities: introspection.capabilities
  });
};
```

### **4. Performance Monitoring**
```typescript
const monitorPerformance = () => {
  const monitor = new PerformanceMonitor();
  
  monitor.start('word-search');
  const words = await wordnet.words({ form: 'computer' });
  monitor.end('word-search');
  
  console.log('Performance:', monitor.getMetrics());
};
```

## 📚 **Code Structure**

```
src/
├── app/
│   └── App.tsx                    # Main application
├── components/
│   ├── screens/                   # Main demo screens
│   │   ├── KernelDemo.tsx        # Microkernel demonstration
│   │   ├── TranslationShowcase.tsx # Translation features
│   │   └── DataCatalog.tsx       # Data management
│   ├── developer-tools/          # Debug and monitoring tools
│   ├── shared/                   # Common UI components
│   └── widgets/                  # Status and control widgets
├── hooks/
│   ├── useWordNet.ts            # Main WordNet hook
│   └── useWordNetKernel.ts      # Kernel-specific hook
├── workers/
│   └── wordnet-worker.ts        # Web Worker implementation
└── utils/
    └── logger.ts                # Logging system
```

## 🎨 **Demo Tabs**

### **🏗️ Kernel Demo**
- **Plugin System**: Live demonstration of relations, similarity, and translation plugins
- **Type Safety**: Full TypeScript support with compile-time checking
- **Plugin Status**: Real-time display of active plugins and their capabilities
- **Interactive Queries**: Search words and explore relationships using plugin methods

### **🌍 Translation Showcase**
- **Cross-Lingual Translation**: ILI-based translation between languages
- **Language Detection**: Automatic language identification
- **Translation Confidence**: Scoring and validation of translations
- **Multi-language Support**: English, French, Thai, and more

### **📊 Data Catalog**
- **Lexicon Management**: Load, unload, and manage lexicons
- **Resource Analysis**: Understanding data types and capabilities
- **Integrity Validation**: Data quality and consistency checks
- **Performance Metrics**: Real-time performance monitoring

### **🔍 Visualizations**
- **Word Relationship Graphs**: Interactive relationship visualization
- **Synset Hierarchies**: Tree-based synset exploration
- **Data Flow Diagrams**: System architecture visualization

### **🛠️ Developer Tools**
- **Debug Console**: Built-in debugging and logging
- **Performance Monitor**: Real-time performance tracking
- **Memory Usage**: Resource consumption monitoring
- **Error Tracking**: Comprehensive error reporting

## 🔧 **Configuration**

### **WordNet Configuration**
```typescript
const config = {
  lexicon: 'oewn:2024',
  enableWorkers: true,
  fallbackToMainThread: true,
  plugins: ['relations', 'similarity', 'translation'],
  debugMode: true
};
```

### **Worker Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [comlink(), react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
    plugins: () => [comlink()],
  },
});
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run Cypress tests
pnpm test:cypress

# Run specific test suite
pnpm test:cypress:local

# Open Cypress UI
pnpm cypress:open
```

### **Test Categories**
- **Unit Tests**: Component logic and hooks
- **Integration Tests**: WordNet API interactions
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Benchmarking and optimization

## 🚀 **Deployment**

### **Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [comlink(), react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'wordnet-core': ['wn-ts-core'],
          'wordnet-web': ['wn-ts-web']
        }
      }
    }
  }
});
```

### **Deploy to Static Hosting**
```bash
# Build the application
pnpm build

# Deploy dist/ folder to your hosting service
# Examples: Vercel, Netlify, GitHub Pages
```

## 📖 **Learning Outcomes**

After working with this demo, you'll understand:

1. **Microkernel Architecture** - How the plugin system works
2. **Cross-Lingual Translation** - How to translate between languages
3. **Advanced Data Management** - How to introspect and manage lexicons
4. **Performance Optimization** - How to monitor and optimize performance
5. **Developer Tools** - How to debug and monitor WordNet applications

## 🔗 **Next Steps**

- **Plugin Development**: Learn [Plugin Development](../integration-examples/plugin-development.md)
- **Performance Optimization**: Explore [Performance Examples](../integration-examples/performance.md)
- **Custom Integrations**: Build your own WordNet applications

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Plugin Not Found Error**
```typescript
// Ensure plugins are properly imported and configured
import { relations, similarity, translation } from 'wn-ts-core/plugins';

const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation]
});
```

#### **Worker Initialization Failed**
```typescript
// Check worker URL and CORS headers
const worker = new ComlinkWorker(
  new URL('./workers/wordnet-worker.ts', import.meta.url)
);

// Ensure proper headers are set
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};
```

#### **Translation Not Working**
```typescript
// Ensure ILI data is loaded
const iliData = await wordnet.ilis();
if (iliData.length === 0) {
  console.warn('No ILI data loaded for translation');
}

// Check language support
const languages = await wordnet.getAvailableLanguages();
console.log('Supported languages:', languages);
```

## 📄 **License**

This demo is part of the WordNet TypeScript ecosystem and is licensed under the MIT License.

---

**Ready to build your own WordNet application? Check out the [Integration Examples](../integration-examples/README.md) for more advanced patterns! 🚀**
