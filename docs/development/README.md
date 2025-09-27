# Development Guide

Comprehensive guide for contributing to the WordNet TypeScript ecosystem.

## 🎯 **Overview**

This guide covers everything you need to know to contribute to the WordNet TypeScript ecosystem, from setting up your development environment to submitting pull requests.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm
- TypeScript 5.0+
- Git

### **Setup Development Environment**
```bash
# Clone the repository
git clone https://github.com/fustilio/wordnet-playground-2.git
cd wordnet-playground-2

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 🏗️ **Project Structure**

```
wordnet-playground-2/
├── docs/                          # 📚 All documentation
│   ├── getting-started/           # Quick start guides
│   ├── examples/                  # Working examples
│   ├── api/                       # API documentation
│   ├── architecture/              # System architecture
│   ├── packages/                  # Package-specific docs
│   └── development/               # This guide
├── packages/                      # 📦 Core packages
│   ├── wn-ts-core/               # Foundation library
│   ├── wn-ts-web/                # Browser implementation
│   ├── wn-ts-node/               # Node.js implementation
│   ├── wn-cli/                   # Command-line interface
│   └── utils/                    # Shared utilities
├── development/                   # 🔬 Development tools
│   ├── benchmarks/               # Performance testing
│   ├── tools/                    # Development utilities
│   └── experimental/             # Experimental features
└── examples/                     # 🎯 Working examples (legacy)
```

## 🛠️ **Development Workflow**

### **1. Branch Strategy**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b bugfix/issue-description

# Create documentation branch
git checkout -b docs/update-readme
```

### **2. Development Commands**
```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run specific test suite
pnpm test:web
pnpm test:node
pnpm test:core

# Build packages
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

### **3. Testing Strategy**
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run browser tests
pnpm test:browser

# Run E2E tests
pnpm test:e2e
```

## 📦 **Package Development**

### **Core Package (wn-ts-core)**
```bash
cd packages/wn-ts-core

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Run benchmarks
pnpm bench
```

### **Web Package (wn-ts-web)**
```bash
cd packages/wn-ts-web

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run browser tests
pnpm test:browser

# Build package
pnpm build
```

### **Node Package (wn-ts-node)**
```bash
cd packages/wn-ts-node

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build
```

## 🧪 **Testing Guidelines**

### **Test Categories**

#### **Unit Tests**
- Test individual functions and methods
- Mock external dependencies
- Focus on edge cases and error conditions
- Fast execution (< 100ms per test)

#### **Integration Tests**
- Test component interactions
- Use real data when possible
- Test cross-platform compatibility
- Moderate execution time (< 1s per test)

#### **E2E Tests**
- Test complete user workflows
- Use real browser environments
- Test with actual WordNet data
- Longer execution time (< 10s per test)

### **Writing Tests**

#### **Unit Test Example**
```typescript
import { describe, it, expect } from 'vitest';
import { Morphy } from 'wn-ts-core';

describe('Morphy', () => {
  it('should find base forms for verbs', async () => {
    const morphy = new Morphy();
    const result = await morphy.analyze('running', 'v');
    
    expect(result).toEqual({ 'v': new Set(['run']) });
  });
});
```

#### **Integration Test Example**
```typescript
import { describe, it, expect } from 'vitest';
import { NodeWordNetKernel } from 'wn-ts-node';

describe('NodeWordNetKernel Integration', () => {
  it('should initialize and query words', async () => {
    const wordnet = new NodeWordNetKernel('oewn:2024');
    await wordnet.initialize();
    
    const words = await wordnet.words({ form: 'computer' });
    expect(words.length).toBeGreaterThan(0);
    
    await wordnet.close();
  });
});
```

## 🔧 **Code Quality Standards**

### **TypeScript Guidelines**
- Use strict mode
- Prefer interfaces over types
- Use proper type annotations
- Avoid `any` type
- Use generic types when appropriate

### **Code Style**
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Write self-documenting code
- Add JSDoc comments for public APIs

### **Performance Guidelines**
- Use lazy loading for large datasets
- Implement proper caching strategies
- Optimize database queries
- Monitor memory usage
- Use Web Workers for heavy computations

## 📚 **Documentation Standards**

### **README Files**
- Clear project description
- Installation instructions
- Usage examples
- API reference
- Contributing guidelines

### **Code Documentation**
- JSDoc comments for all public APIs
- Type annotations for parameters and return values
- Usage examples in comments
- Error handling documentation

### **Architecture Documentation**
- System design diagrams
- Component relationships
- Data flow descriptions
- Plugin system documentation

## 🚀 **Performance Guidelines**

### **Benchmarking**
```bash
# Run performance benchmarks
pnpm bench

# Run specific benchmark
pnpm bench:core
pnpm bench:web
pnpm bench:node
```

### **Performance Targets**
- **Word Search**: < 50ms for single queries
- **Synset Queries**: < 100ms for complex queries
- **Translation**: < 200ms for cross-lingual operations
- **Memory Usage**: < 2x input size for processing

### **Optimization Techniques**
- Use database indexes
- Implement query caching
- Use streaming for large datasets
- Optimize Web Worker communication
- Minimize bundle size

## 🔍 **Debugging**

### **Logging System**
```typescript
import { createLogger } from 'wn-ts-core/utils';

const logger = createLogger('MyComponent', 'debug');

logger.debug('Debug message', { data });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### **Debug Tools**
- Browser DevTools for web debugging
- Node.js debugger for server debugging
- Performance profilers
- Memory usage monitors

## 🤝 **Contributing Process**

### **1. Fork and Clone**
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/wordnet-playground-2.git
cd wordnet-playground-2

# Add upstream remote
git remote add upstream https://github.com/fustilio/wordnet-playground-2.git
```

### **2. Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

### **3. Make Changes**
- Write code following our standards
- Add tests for new functionality
- Update documentation
- Ensure all tests pass

### **4. Commit Changes**
```bash
git add .
git commit -m "feat: add new feature description"
```

### **5. Push and Create PR**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

## 📋 **Pull Request Guidelines**

### **PR Template**
- **Description**: What changes were made and why
- **Type**: feat, fix, docs, style, refactor, test, chore
- **Breaking Changes**: List any breaking changes
- **Testing**: How the changes were tested
- **Documentation**: What documentation was updated

### **Review Process**
- All PRs require review
- Tests must pass
- Documentation must be updated
- Performance impact must be considered

## 🐛 **Bug Reports**

### **Bug Report Template**
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node.js version, browser version
- **Additional Context**: Screenshots, logs, etc.

## 💡 **Feature Requests**

### **Feature Request Template**
- **Description**: Clear description of the feature
- **Use Case**: Why this feature is needed
- **Proposed Solution**: How you think it should work
- **Alternatives**: Other solutions considered
- **Additional Context**: Any other relevant information

## 📞 **Getting Help**

### **Community**
- **GitHub Discussions**: [Community discussions](https://github.com/fustilio/wordnet-playground-2/discussions)
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/fustilio/wordnet-playground-2/issues)

### **Documentation**
- **[API Reference](../api/README.md)** - Complete API documentation
- **[Examples](../examples/README.md)** - Working code examples
- **[Architecture Guide](../architecture/README.md)** - System design details

## 📄 **License**

This project is licensed under the MIT License. By contributing, you agree that your contributions will be licensed under the same license.

---

**Ready to contribute? Start by forking the repository and creating your first feature branch! 🚀**
