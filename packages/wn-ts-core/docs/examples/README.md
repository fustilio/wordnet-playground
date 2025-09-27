# Examples

This directory contains practical examples and usage patterns for the wn-ts-core library.

## Available Examples

### [Kysely Typing Example](./kysely-typing-example.md)
Demonstrates proper Kysely typing in the relations plugin, showing how to achieve full type safety for database queries and eliminate the need for 'any' types.

**Key Topics:**
- Type-safe database queries
- Relations plugin usage
- TypeScript integration
- Compile-time error detection

### [Similarity Methods with Lexicon Context](./similarity-lexicon-examples.md)
Shows how to use the fixed similarity methods that properly handle lexicon context and support cross-lingual comparisons.

**Key Topics:**
- Same-lexicon comparisons
- Cross-lingual similarity
- Error handling
- Performance optimization
- CILI integration

### [Test Data Generation](./test-data-generation.md)
Demonstrates how to use the enhanced xml-introspect capabilities to validate WordNet data sources and generate representative test data.

**Key Topics:**
- Data source validation
- Test data generation
- XML analysis
- Schema generation
- Performance testing

## Getting Started

1. **Choose an example** that matches your use case
2. **Read the documentation** to understand the concepts
3. **Copy the code examples** and adapt them to your needs
4. **Run the examples** to see them in action

## Prerequisites

- Node.js 18+ 
- TypeScript 5+
- pnpm package manager

## Running Examples

```bash
# Install dependencies
pnpm install

# Run specific examples (if they have executable code)
# Note: Examples are now documentation - see individual example files for code

# Or use the CLI tools
pnpm run generate-test-data --help
```

## Contributing

When adding new examples:

1. Create a new markdown file in this directory
2. Include code examples with syntax highlighting
3. Explain the key concepts and benefits
4. Provide usage instructions
5. Update this README with a link to your example

## Related Documentation

- [Main README](../README.md) - Overview of the library
- [API Documentation](../api/) - Detailed API reference
- [Architecture](../architecture/) - System architecture and design
