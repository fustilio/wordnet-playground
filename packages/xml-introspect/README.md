# XML Introspect

A powerful CLI tool and library for analyzing large XML files and generating representative sample files with the exact same structure and format. Perfect for working with large XML datasets like WordNet LMF files.

## Features

- **XML Structure Analysis**: Automatically analyzes XML structure and generates representative samples
- **XSD Schema Support**: Optional XSD validation and schema-aware sampling
- **XSD Generation**: Generate XSD schemas from XML files when not available
- **CLI Interface**: Simple command-line interface for quick file processing
- **Library API**: Programmatic access for integration into other tools
- **Memory Efficient**: Streams large XML files to handle files of any size
- **Format Preservation**: Maintains exact XML structure, attributes, and relationships

## Use Cases

- **Development & Testing**: Create small sample files for development without loading massive datasets
- **Schema Validation**: Generate or validate XSD schemas for XML files
- **Documentation**: Create representative examples for documentation purposes
- **Data Analysis**: Understand XML structure before processing large files
- **Quality Assurance**: Validate XML files against schemas

## Installation

```bash
# Install globally for CLI usage
npm install -g xml-introspect

# Or install locally in your project
npm install xml-introspect

# Using pnpm
pnpm add xml-introspect
```

## CLI Usage

### Basic Usage

The CLI supports both positional arguments and flag-based options:

```bash
# Using positional arguments (recommended)
xml-introspect sample input.xml output.xml --max-elements 100
xml-introspect schema input.xml output.xsd
xml-introspect validate input.xml schema.xsd

# Using flag-based options
xml-introspect sample --input input.xml --output sample.xml --max-elements 100
xml-introspect schema --input input.xml --output schema.xsd
xml-introspect validate --input input.xml --output schema.xsd
```

#### Positional Argument Syntax

The CLI automatically detects positional arguments in this order:
1. **Command**: `sample`, `schema`, `generate`, `roundtrip`, `expand`, `realistic`, `validate`
2. **Input file**: First file path after the command
3. **Output file**: Second file path after the command (optional)

```bash
# This works automatically:
xml-introspect schema input.xml output.xsd

# Equivalent to:
xml-introspect schema --input input.xml --output output.xsd
```

### Command Examples

#### Generate Sample XML
```bash
# Basic sample generation
xml-introspect sample input.xml output.xml

# With element and depth limits
xml-introspect sample input.xml output.xml --max-elements 50 --max-depth 3

# Using flags
xml-introspect sample -i input.xml -o sample.xml -m 50 -d 3
```

#### Generate XSD Schema
```bash
# Generate XSD from XML
xml-introspect schema input.xml output.xsd

# With namespace and form options
xml-introspect schema input.xml output.xsd --namespace "http://example.com" --element-form qualified

# Using flags
xml-introspect schema -i input.xml -o schema.xsd -n "http://example.com"
```

#### Validate XML against XSD
```bash
# Validate XML file
xml-introspect validate input.xml schema.xsd

# Using flags
xml-introspect validate -i input.xml -o schema.xsd
```

#### Generate XML from XSD
```bash
# Basic XML generation
xml-introspect generate schema.xsd output.xml

# With realistic data using Faker
xml-introspect generate schema.xsd output.xml --realistic --seed 42

# Using flags
xml-introspect generate -i schema.xsd -o output.xml -r -s 42
```

#### XML Roundtrip (XML → XAST → XML)
```bash
# Basic roundtrip
xml-introspect roundtrip input.xml output.xml

# Enhanced roundtrip with realistic data
xml-introspect roundtrip input.xml output.xml --realistic

# Using flags
xml-introspect roundtrip -i input.xml -o output.xml -r
```

#### Expand Small XML
```bash
# Expand XML to target size
xml-introspect expand small.xml large.xml --target-size 5000

# With realistic data generation
xml-introspect expand small.xml large.xml --target-size 5000 --realistic --seed 123

# Using flags
xml-introspect expand -i small.xml -o large.xml -t 5000 -r -s 123
```

#### Generate Realistic XML
```bash
# Generate realistic XML using Faker
xml-introspect realistic input.xml output.xml --seed 42

# With custom limits
xml-introspect realistic input.xml output.xml --max-elements 200 --max-depth 4 --seed 42

# Using flags
xml-introspect realistic -i input.xml -o output.xml -s 42 -m 200 -d 4
```

## CLI Options

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--input, -i` | Input file path | Required |
| `--output, -o` | Output file path | stdout |
| `--help, -h` | Show help message | false |

### Command-Specific Options

#### Sample Command
| Option | Description | Default |
|--------|-------------|---------|
| `--max-elements, -m` | Maximum elements to include | `100` |
| `--max-depth, -d` | Maximum nesting depth | `5` |

#### Schema Command
| Option | Description | Default |
|--------|-------------|---------|
| `--namespace, -n` | Target namespace for generated schema | Auto-detected |
| `--element-form` | Element form: `qualified`, `unqualified` | `qualified` |
| `--attribute-form` | Attribute form: `qualified`, `unqualified` | `unqualified` |

#### Generate Command
| Option | Description | Default |
|--------|-------------|---------|
| `--max-elements, -m` | Maximum elements to include | `100` |
| `--max-depth, -d` | Maximum nesting depth | `5` |
| `--realistic, -r` | Use Faker for realistic data | `false` |
| `--seed, -s` | Random seed for consistent generation | Random |

#### Roundtrip Command
| Option | Description | Default |
|--------|-------------|---------|
| `--realistic, -r` | Use enhanced roundtrip with realistic data | `false` |

#### Expand Command
| Option | Description | Default |
|--------|-------------|---------|
| `--target-size, -t` | Target size for expansion | `1000` |
| `--max-depth, -d` | Maximum nesting depth | `5` |
| `--realistic, -r` | Use realistic data generation | `false` |
| `--seed, -s` | Random seed for consistent generation | Random |

#### Realistic Command
| Option | Description | Default |
|--------|-------------|---------|
| `--max-elements, -m` | Maximum elements to include | `100` |
| `--max-depth, -d` | Maximum nesting depth | `5` |
| `--seed, -s` | Random seed for consistent generation | Random |

#### Validate Command
| Option | Description | Default |
|--------|-------------|---------|
| *No additional options* | Both XML and XSD files are required as positional arguments | - |

## Library Usage

### Basic API

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample
const sample = await introspector.generateSample('input.xml', {
  maxElements: 100,
  maxDepth: 3,
  preserveAllTypes: true
});

await sample.save('sample.xml');

// Generate schema
const schema = await introspector.generateSchema('input.xml');
await schema.save('schema.xsd');

// Validate file
const isValid = await introspector.validate('input.xml', 'schema.xsd');
```

### Advanced API

```typescript
import { XMLIntrospector, SamplingStrategy } from 'xml-introspect';

const introspector = new XMLIntrospector({
  // Configuration options
  defaultMaxElements: 100,
  defaultMaxDepth: 5,
  preserveAttributes: true,
  preserveRelationships: true
});

// Custom sampling strategy
const sample = await introspector.generateSample('input.xml', {
  strategy: SamplingStrategy.BALANCED,
  maxElements: 200,
  maxDepth: 4,
  elementTypeLimits: {
    'LexicalEntry': 50,
    'Synset': 30,
    'Sense': 40
  }
});

// Process with callbacks
await introspector.processWithCallbacks('input.xml', {
  onElement: (element, depth) => {
    console.log(`Processing ${element.tagName} at depth ${depth}`);
  },
  onProgress: (processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  }
});
```

## Sampling Strategies

### Balanced Strategy (Default)
- Distributes elements evenly across different types
- Maintains representative proportions
- Best for understanding overall structure

### Random Strategy
- Randomly selects elements throughout the document
- Good for statistical analysis
- May miss rare element types

### First Strategy
- Takes elements from the beginning of the document
- Fastest processing
- May not represent the full structure

## XSD Schema Generation

When generating XSD schemas, the tool:

1. **Analyzes XML Structure**: Examines element hierarchy, attributes, and content
2. **Infers Types**: Determines data types from content patterns
3. **Generates Constraints**: Creates min/max occurrences and validation rules
4. **Handles Namespaces**: Automatically detects and handles XML namespaces
5. **Creates Documentation**: Generates annotations for better understanding

## Faker Integration & Realistic Data Generation

The package integrates with [Faker.js](https://fakerjs.dev/) to generate realistic XML data:

### Features
- **Smart Data Generation**: Automatically generates appropriate data based on element names
- **WordNet LMF Support**: Specialized generators for lexical data (lemmas, synsets, etc.)
- **Custom Generators**: Extensible system for domain-specific data generation
- **Seeded Generation**: Consistent results for testing and development

### Usage
```bash
# Generate realistic XML using Faker
xml-introspect realistic input.xml --output realistic.xml --seed 42

# Generate XML from XSD with realistic data
xml-introspect generate schema.xsd --output realistic.xml --realistic --seed 123
```

## XAST (XML Abstract Syntax Tree) Support

Built-in support for XAST using `xast-util-from-xml` and `xast-util-to-xml`:

### Features
- **XML → XAST → XML Roundtrip**: Preserve structure through parsing and regeneration
- **Structure Preservation**: Maintains element hierarchy, attributes, and content
- **Namespace Handling**: Properly processes XML namespaces
- **Performance**: Efficient processing for large files

### Usage
```bash
# Perform XAST roundtrip
xml-introspect roundtrip input.xml --output roundtrip.xml

# Enhanced roundtrip with realistic data
xml-introspect roundtrip input.xml --output enhanced.xml --realistic
```

## Examples

### WordNet LMF File Processing

```bash
# Generate sample from large WordNet file
xml-introspect sample oewn.xml oewn-sample.xml --max-elements 200

# Generate XSD schema
xml-introspect schema oewn.xml oewn-schema.xsd

# Validate against generated schema
xml-introspect validate oewn.xml oewn-schema.xsd
```

### Working Examples

The following examples demonstrate the CLI working with actual files:

```bash
# Generate XSD schema from French WordNet (22MB)
xml-introspect schema ./data/input/omw-fr.xml ./data/output/schema.xsd

# Generate sample XML with custom limits
xml-introspect sample ./data/input/omw-fr.xml ./data/output/sample.xml -m 50 -d 3

# Generate realistic XML using Faker
xml-introspect realistic ./data/input/omw-fr.xml ./data/output/realistic.xml -s 42 -m 100

# Expand small XML to larger size
xml-introspect expand ./data/input/small.xml ./data/output/expanded.xml -t 5000
```

### Command-Line Help

Get help for any command:

```bash
# General help
xml-introspect --help

# Command-specific help
xml-introspect sample --help
xml-introspect schema --help
```

## Data Files

The package includes sample data files for testing and demonstration:

### Input Files
- **`data/input/oewn.xml`** (98MB): Complete Open English WordNet in LMF format
- **`data/input/omw-fr.xml`** (22MB): French WordNet in LMF format

### Output Files  
- **`data/output/oewn-sample.xml`** (8.6KB): Sampled version of oewn.xml

### Schema Consistency
Both the large `oewn.xml` and the sampled `oewn-sample.xml` parse into identical XSD and XAST schemas, demonstrating that our sampling approach preserves the structural integrity of the original WordNet LMF format.

Run the schema consistency demo to validate this:
```bash
pnpm run demo:schema
```

## Performance

- **Memory Usage**: Streams files to handle files of any size
- **Processing Speed**: Optimized for large XML files (100MB+)
- **Scalability**: Performance scales with available memory and CPU cores

## Requirements

- Node.js 18+ (ES modules support)
- Sufficient memory for processing large files
- Optional: XSD validation libraries for schema operations

## Development

```bash
# Clone and install dependencies
git clone <repository>
cd xml-introspect
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the project
pnpm build

# Run demo scripts
pnpm run demo:faker      # Faker integration demo
pnpm run demo:schema     # Schema consistency demo

# Test CLI functionality
pnpm test:cli:two        # Test schema generation with output file
```

## Contributing

Contributions are welcome! Please see our contributing guidelines for details.

## License

MIT License - see LICENSE file for details.

## Related Projects

- **wn-ts-core**: Core WordNet TypeScript library
- **wn-ts-web**: Web-based WordNet interface
- **wn-cli**: Command-line WordNet tools

## Support

For issues, questions, or contributions, please use our GitHub repository or contact the maintainers.
