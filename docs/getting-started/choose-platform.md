---
title: Choose Your Platform
description: Select the right platform for your WordNet TypeScript application
---

# Choose Your Platform

Select the right platform for your WordNet TypeScript application based on your use case and requirements.

## Which Platform Should I Choose?

### **🌐 Web Applications**

**Choose Web if you're building:**
- Interactive dictionary applications
- Educational tools and demos
- Browser-based semantic analysis
- Client-side word processing
- React applications

**Key Features:**
- React hooks and components
- Web Workers for non-blocking operations
- OPFS persistent storage
- Cross-browser compatibility

**[Get Started with Web →](/platforms/web/)**

### **🖥️ Node.js Applications**

**Choose Node.js if you're building:**
- REST APIs and backend services
- Data processing pipelines
- Command-line tools
- Server-side semantic analysis
- Batch processing applications

**Key Features:**
- SQLite database integration
- File system operations
- High performance
- CLI tool integration

**[Get Started with Node.js →](/platforms/node/)**

### **⌨️ Command Line Interface**

**Choose CLI if you need:**
- Quick word lookups
- Data exploration and analysis
- Scripting and automation
- Terminal-based tools
- Batch operations

**Key Features:**
- Interactive TUI (Terminal User Interface)
- Command-line tools
- Batch processing
- Scripting support

**[Get Started with CLI →](/packages/wn-cli/tui/)**

## Platform Comparison

| Feature | Web | Node.js | CLI |
|---------|-----|---------|-----|
| **User Interface** | React Components | API/CLI | Terminal TUI |
| **Storage** | OPFS/Memory | SQLite Files | SQLite Files |
| **Performance** | Good | Excellent | Excellent |
| **Deployment** | Browser | Server | Local |
| **Learning Curve** | Medium | Low | Low |
| **Use Cases** | Interactive Apps | Backend Services | Data Exploration |

## Decision Matrix

### **Building a Web App?**
- **Interactive features** → **Web Platform**
- **User interface required** → **Web Platform**
- **Browser-based** → **Web Platform**

### **Building a Server App?**
- **REST API** → **Node.js Platform**
- **Data processing** → **Node.js Platform**
- **Backend service** → **Node.js Platform**

### **Need Command Line Tools?**
- **Quick lookups** → **CLI Platform**
- **Data exploration** → **CLI Platform**
- **Scripting** → **CLI Platform**

## Can I Use Multiple Platforms?

**Yes!** All platforms share the same core API, so you can:

- **Start with CLI** for exploration, then build a **Web app**
- **Use Node.js** for backend, **Web** for frontend
- **Switch between platforms** as your needs change
- **Share code** between web and Node.js applications

## Quick Start Examples

### **Web Platform**
```typescript
import { useWordNet } from 'wn-ts-web';

function MyApp() {
  const { queryWords } = useWordNet();
  // Start building your web app
}
```

### **Node.js Platform**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
// Start building your server app
```

### **CLI Platform**
```bash
wn-cli search "computer" --lexicon oewn:2024
# Start using command-line tools
```

## Platform-Specific Guides

### **[Web Platform Guide](/platforms/web/)**
- React integration
- Web Workers
- OPFS storage
- Browser compatibility

### **[Node.js Platform Guide](/platforms/node/)**
- SQLite integration
- File system operations
- Performance optimization
- CLI integration

### **[CLI Package Guide](/packages/wn-cli/tui/)**
- Command-line tools
- Interactive TUI
- Batch processing
- Scripting

## Still Not Sure?

### **Try the Examples**

1. **Start with CLI** - Quick and easy to test
   ```bash
   npm install -g wn-cli
   wn-cli search "computer"
   ```

2. **Try Web Demo** - See interactive features
   ```bash
   cd examples/web/basic-demo
   pnpm install && pnpm dev
   ```

3. **Try Node.js Demo** - Understand server usage
   ```bash
   cd examples/node/basic-demo
   pnpm install && pnpm run all-use-cases
   ```

### **Ask the Community**

- **[GitHub Discussions](https://github.com/fustilio/wordnet-playground/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)** - Report problems
- **[Documentation](/)** - Browse complete docs

## Next Steps

Once you've chosen your platform:

1. **[Install the platform](/getting-started/installation)** - Get the right package
2. **[Follow the platform guide](/platforms/)** - Learn platform-specific features
3. **[Try the examples](/examples/)** - See it in action
4. **[Read the API docs](/api/)** - Understand the full API

---

**Ready to choose? Pick your platform and start building! 🚀**
