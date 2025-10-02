---
title: Installation
description: Install the WordNet TypeScript ecosystem for your platform
---

# Installation

Install the WordNet TypeScript ecosystem for your chosen platform.

## Quick Installation

### **Web Applications**

```bash
npm install wn-ts-web @sqlite.org/sqlite-wasm
# or
pnpm add wn-ts-web @sqlite.org/sqlite-wasm
# or
yarn add wn-ts-web @sqlite.org/sqlite-wasm
```

### **Node.js Applications**

```bash
npm install wn-ts-node better-sqlite3
# or
pnpm add wn-ts-node better-sqlite3
# or
yarn add wn-ts-node better-sqlite3
```

### **Command Line Interface**

```bash
npm install -g wn-cli
# or
pnpm add -g wn-cli
# or
yarn global add wn-cli
```

## Platform-Specific Installation

### **Web Platform**

#### **Prerequisites**
- Node.js 18+
- Modern browser (Chrome 88+, Firefox 85+, Safari 14+)
- Package manager (npm, pnpm, or yarn)

#### **Installation Steps**

1. **Install the package**
   ```bash
   npm install wn-ts-web @sqlite.org/sqlite-wasm
   ```

2. **Install peer dependencies**
   ```bash
   npm install react react-dom
   ```

3. **Configure your bundler** (if using Vite, Webpack, etc.)
   ```javascript
   // vite.config.js
   export default {
     optimizeDeps: {
       include: ['@sqlite.org/sqlite-wasm']
     }
   }
   ```

#### **TypeScript Support**
```bash
npm install -D @types/react @types/react-dom
```

### **Node.js Platform**

#### **Prerequisites**
- Node.js 18+
- SQLite3 (system dependency)
- Package manager (npm, pnpm, or yarn)

#### **Installation Steps**

1. **Install the package**
   ```bash
   npm install wn-ts-node better-sqlite3
   ```

2. **Install system dependencies** (if needed)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install sqlite3
   
   # macOS
   brew install sqlite3
   
   # Windows
   # SQLite3 is included with better-sqlite3
   ```

3. **Verify installation**
   ```bash
   node -e "console.log(require('wn-ts-node'))"
   ```

#### **TypeScript Support**
```bash
npm install -D typescript @types/node
```

### **CLI Platform**

#### **Prerequisites**
- Node.js 18+
- Package manager (npm, pnpm, or yarn)

#### **Installation Steps**

1. **Global installation**
   ```bash
   npm install -g wn-cli
   ```

2. **Verify installation**
   ```bash
   wn-cli --version
   ```

3. **Initialize configuration**
   ```bash
   wn-cli init
   ```

#### **Local Installation** (for projects)
```bash
npm install wn-cli
npx wn-cli --version
```

## Development Installation

### **Clone and Build from Source**

```bash
# Clone the repository
git clone https://github.com/fustilio/wordnet-playground.git
cd wordnet-playground

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### **Development Dependencies**

```bash
# Install development dependencies
pnpm install -D typescript vitest @types/node
```

## Browser Compatibility

### **Supported Browsers**

| Browser | Minimum Version | Features |
|---------|----------------|----------|
| Chrome | 88+ | Full support including OPFS |
| Firefox | 85+ | Full support including OPFS |
| Safari | 14+ | Full support including OPFS |
| Edge | 88+ | Full support including OPFS |

### **Feature Support**

- **Web Workers**: All supported browsers
- **OPFS Storage**: Chrome 86+, Firefox 111+, Safari 16.4+
- **SQLite WASM**: All supported browsers
- **ES Modules**: All supported browsers

## Node.js Compatibility

### **Supported Versions**

- **Node.js**: 18.0.0+
- **TypeScript**: 5.0.0+
- **SQLite**: 3.40.0+ (via better-sqlite3)

### **Platform Support**

- **Windows**: 10+
- **macOS**: 10.15+
- **Linux**: Ubuntu 18.04+, CentOS 7+

## Verification

### **Test Web Installation**

```typescript
import { useWordNet } from 'wn-ts-web';

// This should work without errors
console.log('Web package loaded successfully');
```

### **Test Node.js Installation**

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

// This should work without errors
console.log('Node.js package loaded successfully');
```

### **Test CLI Installation**

```bash
wn-cli --version
wn-cli search "test" --lexicon oewn:2024
```

## Troubleshooting

### **Common Issues**

#### **Web: SQLite WASM Not Loading**
```bash
# Ensure you have the correct version
npm install @sqlite.org/sqlite-wasm@latest

# Check your bundler configuration
# Make sure SQLite WASM files are properly served
```

#### **Node.js: SQLite3 Not Found**
```bash
# Install system SQLite3
# Ubuntu/Debian
sudo apt-get install sqlite3 libsqlite3-dev

# macOS
brew install sqlite3

# Windows
# better-sqlite3 includes SQLite3, no additional installation needed
```

#### **CLI: Command Not Found**
```bash
# Check if npm global bin is in PATH
npm config get prefix

# Add to PATH if needed
export PATH="$PATH:$(npm config get prefix)/bin"
```

### **Getting Help**

- **[GitHub Issues](https://github.com/fustilio/wordnet-playground/issues)** - Report bugs and ask questions
- **[Discussions](https://github.com/fustilio/wordnet-playground/discussions)** - Community support
- **[Documentation](/)** - Complete documentation

## Next Steps

- **[Choose Your Platform](/getting-started/choose-platform)** - Select the right platform for your needs
- **[Platform Guides](/platforms/)** - Platform-specific getting started guides
- **[Examples](/examples/)** - See it in action

---

**Installation complete? Head to [Choose Your Platform](/getting-started/choose-platform) to select the right platform for your project! 🚀**
