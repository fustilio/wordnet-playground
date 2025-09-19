# WordNet TypeScript Documentation

## 🎯 **Overview**

This directory contains the documentation for the WordNet TypeScript ecosystem. All documentation follows established standards and conventions to ensure consistency, maintainability, and ease of use across all `wn-ts` modules.

## 🏗️ **Microkernel Architecture**

The ecosystem uses a **microkernel architecture** with plugin system:
- **wn-ts-core**: Microkernel foundation with plugin system
- **wn-ts-node**: Node.js kernel implementation
- **wn-ts-web**: Browser kernel implementation with React integration
- **wn-ts-web-demo**: Interactive demo showcasing capabilities

## 📚 **Documentation Structure**

### **Project Overview**
- **[Project Overview](./PROJECT_OVERVIEW.md)** - Complete project overview and ecosystem details
- **[Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)** - Microkernel architecture and design patterns

### **Architecture**
- **[System Architecture](./architecture/SYSTEM_ARCHITECTURE.md)** - Microkernel architecture and design patterns
- **[Web Architecture](./architecture/WEB_ARCHITECTURE.md)** - Browser-specific architecture and worker patterns

### **API Reference**
- **[Web API](./api/WEB_API.md)** - Complete web API reference and React integration

### **Usage Guides**
- **[Web Usage](./guides/WEB_USAGE.md)** - Web usage patterns, React integration, and examples

### **Standards & Conventions**
- **[Development Conventions](./standards/DEVELOPMENT_CONVENTIONS.md)** - Coding standards, architectural patterns, and best practices
- **[Database Schema Standards](./standards/DATABASE_SCHEMA_STANDARDS.md)** - Database design, naming conventions, and optimization strategies
- **[Testing Strategy](./standards/TESTING_STRATEGY.md)** - Testing approach, coverage requirements, and quality assurance
- **[Cross-Lingual Dependencies](./standards/CROSS_LINGUAL_DEPENDENCIES.md)** - Understanding lexicon dependencies

### **Examples & Use Cases**
- **[Usage Examples](./examples/EXAMPLE_USAGE.md)** - Comprehensive examples and use cases
- **[Future Potential](./examples/FUTURE_POTENTIAL.md)** - Advanced applications and future possibilities

### **Key Naming Conventions**

**Rule**: Always use the `Id` suffix for properties that reference IDs of other entities.

**✅ Correct Examples:**
- `wordId: string` - References Word.id
- `synsetId: string` - References Synset.id
- `lexiconId: string` - References Lexicon.id
- `memberIds: string[]` - References Word.id[]
- `senseIds: string[]` - References Sense.id[]

**❌ Incorrect Examples:**
- `word: string` - Should be wordId
- `synset: string` - Should be synsetId
- `members: string[]` - Should be memberIds
- `senses: string[]` - Should be senseIds

## 🏗️ **Implementation Guidelines**

### **Architecture Patterns**
- **Layered Architecture**: Clear separation of concerns across React, Worker, Orchestrator, and Database layers
- **Worker-First Design**: Offload heavy operations to Web Workers for UI responsiveness
- **Explicit Client Passing**: Use dependency injection rather than global state
- **Type Safety**: Full TypeScript coverage with strict interfaces

### **Data Flow Consistency**
- **LMF XML Processing**: Standardized parsing and validation pipeline
- **Database Operations**: Consistent schema and query patterns
- **Cross-Lingual Linking**: ILI-based concept mapping across languages
- **Error Handling**: Specific error types with descriptive messages

## 🚀 **Quick Start for Developers**

### **1. Understanding the Ecosystem**
- Start with the **[Main Project README](../README.md)** for project overview
- Review **[Development Conventions](./DEVELOPMENT_CONVENTIONS.md)** for coding standards
- Check **[Database Schema Standards](./DATABASE_SCHEMA_STANDARDS.md)** for data structure

### **2. Implementation Choices**
- **Browser Applications**: Use `wn-ts-web` with React integration
- **Node.js Applications**: Use `wn-ts-node` for server-side processing
- **Core Library**: Use `wn-ts-core` for foundational types and utilities

### **3. Development Workflow**
```bash
# Setup development environment
pnpm install
pnpm build

# Run tests
pnpm test
pnpm test:browser

# Build packages
pnpm build:packages
```

## 📖 **Module-Specific Documentation**

### **Core Library**
- **[wn-ts-core Documentation](../wn-ts-core/docs/)** - Foundation library, types, and utilities
- **Core Types**: Word, Synset, Sense, Lexicon with consistent ID naming
- **LMF Parser**: XML parsing, validation, and data transformation
- **Schema Builder**: Database schema creation and management

### **Web Implementation**
- **[wn-ts-web Documentation](../wn-ts-web/docs/)** - Browser-optimized implementation
- **React Integration**: Custom hooks and components
- **Web Worker Architecture**: Background processing for performance
- **SQLite with OPFS**: Persistent storage capabilities

### **Node.js Implementation**
- **[wn-ts-node Documentation](../wn-ts-node/docs/)** - Server-side implementation
- **File System Operations**: Local file processing and management
- **CLI Tools**: Command-line interface and utilities
- **Database Management**: Advanced database operations

## ✅ **Compliance Requirements**

### **Mandatory Standards**
- **Naming Conventions**: Follow established ID property naming (wordId, synsetId, etc.)
- **Type Safety**: Maintain full TypeScript coverage
- **Error Handling**: Use specific error types with proper fallbacks
- **Testing Coverage**: Meet minimum coverage requirements (90% unit, 80% integration)

### **Quality Assurance**
- **Code Review**: All changes must follow established conventions
- **Documentation**: Update documentation for API changes
- **Testing**: Ensure all tests pass before merging
- **Performance**: Meet benchmark requirements for critical paths

## 🔍 **Common Issues & Solutions**

### **Type Mismatches**
- **Problem**: Using `word` instead of `wordId` in Sense interface
- **Solution**: Always use `Id` suffix for ID references
- **Example**: `sense.wordId` not `sense.word`

### **Database Schema Issues**
- **Problem**: Inconsistent column naming between TypeScript and SQL
- **Solution**: Use camelCase for TypeScript, snake_case for SQL
- **Example**: `wordId` in TypeScript maps to `word_id` in database

### **Test Failures**
- **Problem**: Tests expecting old property names
- **Solution**: Update test assertions to use new naming conventions
- **Example**: `expect(sense.wordId).toBe(...)` not `expect(sense.word).toBe(...)`

## 📊 **Performance Benchmarks**

### **Current Performance Standards**
- **XML Parsing**: < 100ms for 1MB LMF files
- **Database Operations**: < 50ms for single queries
- **Cross-Lingual Queries**: < 200ms for complex ILI lookups
- **Memory Usage**: < 2x input size for processing

### **Optimization Strategies**
- **Lazy Loading**: Load lexicons on-demand
- **Intelligent Caching**: Multi-level caching strategy
- **Parallel Processing**: Use Web Workers for heavy operations
- **Database Indexing**: Strategic indexes for common queries

## 🔄 **Version Compatibility**

### **Breaking Changes**
- **v2.0.0**: Updated property naming from `word`/`synset` to `wordId`/`synsetId`
- **Migration**: Update all code to use new property names
- **Testing**: Ensure all tests pass with updated naming

### **Backward Compatibility**
- **API Stability**: Maintain API compatibility within major versions
- **Data Migration**: Provide utilities for schema updates
- **Deprecation**: Proper deprecation notices for removed features

## 🧪 **Testing & Validation**

### **Test Coverage Requirements**
- **Unit Tests**: 90%+ coverage for core functionality
- **Integration Tests**: 80%+ coverage for module interaction
- **E2E Tests**: 70%+ coverage for complete workflows
- **Browser Tests**: Cross-browser compatibility verification

### **Validation Pipeline**
1. **XML Structure**: Schema compliance and well-formedness
2. **Data Consistency**: Referential integrity validation
3. **Business Rules**: WordNet-specific validation logic
4. **Cross-Reference**: ILI mapping validation

## 📚 **Additional Resources**

### **External References**
- **[WordNet Project](https://wordnet.princeton.edu/)** - Original WordNet database
- **[LMF Specification](https://www.lexicalmarkupframework.org/)** - Lexical Markup Framework standard
- **[Interlingual Index](https://en.wikipedia.org/wiki/Interlingual_Index)** - Cross-lingual concept mapping
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript language reference

### **Community & Support**
- **Issue Reporting**: Use GitHub issues for bugs and feature requests
- **Contributing**: Follow contributing guidelines and development standards
- **Documentation**: Help improve and maintain documentation quality

## 📋 **Documentation Maintenance**

### **Update Requirements**
- **API Changes**: Update all relevant documentation
- **New Features**: Add comprehensive usage examples
- **Bug Fixes**: Document workarounds and solutions
- **Performance**: Update benchmark results and optimization tips

### **Quality Standards**
- **Accuracy**: Ensure all examples and references are current
- **Completeness**: Cover all public APIs and common use cases
- **Clarity**: Use clear, concise language with practical examples
- **Consistency**: Follow established formatting and structure

---

**Remember**: This documentation serves as the authoritative source for all `wn-ts` development standards and conventions. Following these guidelines ensures consistency, maintainability, and interoperability across the entire ecosystem.
