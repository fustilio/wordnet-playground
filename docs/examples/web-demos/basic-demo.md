# Basic Web Demo

A simple web application demonstrating basic WordNet functionality in the browser.

## 🎯 **Overview**

This demo showcases the fundamental WordNet operations in a clean, minimal web interface. Perfect for understanding the basics before diving into more complex features.

## 🚀 **Features**

- **Word Search** - Find words by form or lemma
- **Synset Exploration** - Browse concept groupings
- **Definition Display** - View word definitions and examples
- **Simple UI** - Clean, responsive interface
- **TypeScript** - Full type safety and IntelliSense

## 📁 **Location**

**Source**: `examples/web/web-basic-demo/`  
**Documentation**: This file

## 🛠️ **Setup & Running**

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm
- Modern browser

### **Installation**
```bash
# Navigate to the demo
cd examples/web/web-basic-demo

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

## 🎯 **Key Concepts Demonstrated**

### **1. Basic WordNet Setup**
```typescript
import { useWordNet } from 'wn-ts-web';

const MyComponent = () => {
  const { queryWords, loading, error } = useWordNet();
  
  // Your component logic here
};
```

### **2. Word Search**
```typescript
const handleSearch = async (term: string) => {
  const words = await queryWords(term);
  console.log('Found words:', words);
};
```

### **3. Synset Queries**
```typescript
const { querySynsets } = useWordNet();

const getSynsets = async (term: string) => {
  const synsets = await querySynsets(term);
  return synsets;
};
```

### **4. Definition Access**
```typescript
const getDefinitions = (synset: Synset) => {
  return synset.definitions.map(d => d.text);
};
```

## 📚 **Code Structure**

```
src/
├── App.tsx              # Main application component
├── hooks/
│   └── useWordnet.ts    # Custom WordNet hook
├── main.tsx             # Application entry point
└── index.css            # Basic styling
```

## 🎨 **UI Components**

### **Search Form**
- Input field for word search
- Search button with loading state
- Error handling and display

### **Results Display**
- Word list with basic information
- Synset groupings
- Definitions and examples
- Clean, readable layout

## 🔧 **Configuration**

### **WordNet Configuration**
```typescript
const config = {
  lexicon: 'oewn:2024',        // Default lexicon
  enableWorkers: true,         // Use Web Workers
  fallbackToMainThread: true   // Fallback if workers fail
};
```

### **Development Settings**
```typescript
// Enable debug logging
const logger = createLogger('BasicDemo', 'debug');

// Configure error handling
const errorHandler = (error: Error) => {
  console.error('WordNet Error:', error);
  // Handle error appropriately
};
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### **Test Structure**
- **Unit Tests**: Component logic and hooks
- **Integration Tests**: WordNet API interactions
- **E2E Tests**: Complete user workflows

## 🚀 **Deployment**

### **Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
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

1. **Basic Setup** - How to initialize WordNet in a web app
2. **Word Queries** - How to search for words and get results
3. **Synset Operations** - How to work with concept groupings
4. **Error Handling** - How to handle common errors gracefully
5. **TypeScript Integration** - How to use WordNet with TypeScript

## 🔗 **Next Steps**

- **Advanced Features**: Try the [Developer Demo](./developer-demo.md)
- **Cross-Lingual**: Explore [Translation Examples](../integration-examples/translation.md)
- **Performance**: Learn about [Performance Optimization](../integration-examples/performance.md)

## 🆘 **Troubleshooting**

### **Common Issues**

#### **"Worker not ready" Error**
```typescript
// Ensure WordNet worker is ready before use
const { queryWords, loading, isWorkerReady } = useWordNet();

if (loading) return <div>Loading...</div>;
if (!isWorkerReady()) return <div>Initializing...</div>;

// Now safe to use queryWords
const words = await queryWords('test');
```

#### **CORS Issues**
```typescript
// Configure CORS headers in your server
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};
```

#### **TypeScript Errors**
```typescript
// Ensure proper type imports
import type { Word, Synset, Sense } from 'wn-ts-web';

// Use proper type annotations
const words: Word[] = await wordnet.words({ form: 'test' });
```

## 📄 **License**

This demo is part of the WordNet TypeScript ecosystem and is licensed under the MIT License.

---

**Ready to explore more? Check out the [Developer Demo](./developer-demo.md) for advanced features! 🚀**
