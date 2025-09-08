# XML Introspect Usage Guide

This document demonstrates how to use the `xml-introspect` CLI tool to analyze and understand WordNet XML files before processing them with the wn-ts-web library.

## Overview

The `xml-introspect` CLI tool provides powerful capabilities for:
- **Previewing** XML file contents without full parsing
- **Generating schemas** from XML structure
- **Validating** XML against schemas
- **Analyzing** file structure and content patterns
- **Creating samples** from large XML files
- **Generating realistic test data** using Faker

## Installation

### Global Installation (Recommended)

Install `xml-introspect` globally to use it from anywhere:

```bash
npm install -g xml-introspect
```

### Local Usage with npx

Use `npx` to run the tool without installing globally:

```bash
npx xml-introspect [command] [options]
```

## Available Commands

The `xml-introspect` CLI provides the following commands:

```bash
# Preview XML file contents
xml-introspect preview <input> [options]

# Generate XSD schema from XML
xml-introspect schema <input> [output] [options]

# Validate XML against XSD schema
xml-introspect validate <xml> <xsd> [options]

# Generate sample XML from input
xml-introspect sample <input> [output] [options]

# Generate XML from XSD schema
xml-introspect generate <xsd> [output] [options]

# XML roundtrip (XML -> XAST -> XML)
xml-introspect roundtrip <input> [output] [options]

# Expand small XML to larger XML
xml-introspect expand <input> <output> [options]

# Generate realistic XML using Faker
xml-introspect realistic <input> [output] [options]
```

### Global Options

All commands support these global options:

```bash
-V, --version          # Show version number
-v, --verbose          # Enable verbose output
-h, --help             # Show help
```

### Command-Specific Options

#### Schema Generation Options

```bash
xml-introspect schema [options] <input> [output]

Options:
  -n, --namespace <url>     # Target namespace for XSD generation
  --element-form <type>     # Element form default (qualified/unqualified)
  --attribute-form <type>   # Attribute form default (qualified/unqualified)
  --multi-file-mode <mode>  # Multi-file mode: comprehensive, primary-only, or language-specific
  --no-prompt               # Skip interactive prompts and use default multi-file mode
```

#### Sample Generation Options

```bash
xml-introspect sample [options] <input> [output]

Options:
  --max-elements <number>   # Maximum number of elements to include in sample
  --preserve-structure      # Preserve original XML structure
  --random-selection        # Use random selection instead of first N elements
```

## CLI vs pnpm Scripts

### Benefits of Using CLI Directly

**Flexibility:**
- Use any XML file or URL, not just the predefined OMW French WordNet
- Access to all CLI commands (sample, realistic, roundtrip, etc.)
- Custom output file names and locations
- More command-line options and flags

**Portability:**
- Works from any directory, not just the wn-ts-web project
- Can be used in CI/CD pipelines and automation scripts
- No dependency on the wn-ts-web package structure

**Advanced Features:**
- Schema generation with custom namespaces and options
- Multi-file mode for comprehensive schema generation
- Interactive prompts for complex operations

### When to Use pnpm Scripts

**Convenience:**
- Quick access to common WordNet XML operations
- Pre-configured URLs and file paths
- No need to remember long command syntax

**Project Integration:**
- Consistent with other project scripts
- Easy to modify for project-specific needs
- Integrated with project's package.json

### Alternative: Using pnpm Scripts

The wn-ts-web package also provides convenient npm scripts that wrap the CLI commands:

```bash
# Preview XML file contents
pnpm introspect:preview

# Generate XSD schema from XML
pnpm introspect:schema

# Validate XML against schema
pnpm introspect:validate
```

These scripts are equivalent to:
```bash
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose omw-fr-1.4.xsd
xml-introspect validate https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz ./omw-fr-1.4.xsd --verbose
```

## Usage Examples

### 1. Preview XML File Contents

Preview the structure and content of a WordNet XML file:

```bash
# Using CLI directly
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose

# Or using pnpm script (equivalent)
pnpm introspect:preview
```

This will:
- Download the OMW French WordNet package
- Extract and analyze the XML structure
- Show file size, encoding, and content preview
- Display first and last lines of the XML file
- Identify XML elements and their structure

**Example Output:**
```
🚀 Starting XML Introspector CLI...
📁 Input: https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz
🔧 Command: preview

🌐 Downloading and analyzing file from URL...
📥 URL: https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz
📊 Downloaded 2026228 bytes
🔄 Processing file with data-loader...
Found 1 XML files in archive:
  - omw-fr/omw-fr.xml (21.9 MB)

📋 File Summary:
══════════════════════════════════════════════════
📁 URL: https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz
📊 Original size: 2,026,228 bytes
📊 Final size: 22,819,706 characters
📄 Total lines: 340,605
🔍 Content type: lmf (confidence: high)
⏱️  Processing time: 1176ms

📄 First 200 lines:
──────────────────────────────────────────────────
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd">
<LexicalResource xmlns:dc="https://globalwordnet.github.io/schemas/dc/">
  <Lexicon id="omw-fr"
           label="WOLF (Wordnet Libre du Français)"
           language="fr"
           email="bond@ieee.org"
           license="http://www.cecill.info/licenses/Licence_CeCILL-C_V1-en.html" 
           version="1.4"
           url="http://pauillac.inria.fr/~sagot/index.html#wolf"
           citation="Benoit Sagot and Darla Fišer. 2008. Building a free French wordnet from multilingual resources...">
    <Requires id="omw-en" version="1.4" />
    <LexicalEntry id="omw-fr-comptable-a">
      <Lemma writtenForm="comptable" partOfSpeech="a" />
      <Sense id="omw-fr-comptable-01996875-a" synset="omw-fr-01996875-a" />      
      <Sense id="omw-fr-comptable-00001740-a" synset="omw-fr-00001740-a" />      
    </LexicalEntry>
  ...
```

### 2. Generate XSD Schema

Generate an XSD schema from the XML structure:

```bash
# Using CLI directly
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose omw-fr-1.4.xsd

# Or using pnpm script (equivalent)
pnpm introspect:schema
```

This will:
- Analyze the XML structure
- Generate a comprehensive XSD schema
- Save it as `omw-fr-1.4.xsd`
- Include element definitions, types, and constraints

**Example Output:**
```
🚀 Starting XML Introspector CLI...
📁 Input: https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz
📄 Output: omw-fr-1.4.xsd
🔧 Command: schema

🔄 Generating XSD schema from XML...
⏳ This may take a while for large files...
🌐 Detected URL input, downloading and processing...
📥 URL: https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz
📊 Downloaded 2026228 bytes
🔄 Processing file with data-loader...
Found 1 XML files in archive:
  - omw-fr/omw-fr.xml (21.9 MB)
📄 Extracted content: 22819706 characters
📊 Large file detected (21.9 MB), using streaming analysis...
✅ XSD generation completed in 8.00 seconds
📊 Generated XSD size: 2.41 KB
💾 XSD saved to: omw-fr-1.4.xsd
✅ Command completed successfully
```

**Generated Schema Features:**
- Element definitions for all XML elements
- Type constraints and validation rules
- Namespace declarations
- Cardinality constraints (minOccurs, maxOccurs)
- Attribute definitions with types

### 3. Validate XML Against Schema

Validate the XML file against the generated schema:

```bash
# Using CLI directly
xml-introspect validate https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz ./omw-fr-1.4.xsd --verbose

# Or using pnpm script (equivalent)
pnpm introspect:validate
```

This will:
- Load the XML file and XSD schema
- Perform comprehensive validation
- Report any structural or content errors
- Provide detailed error messages with line numbers

**Validation Checks:**
- Element structure compliance
- Attribute value validation
- Namespace compliance
- Data type validation
- Required element presence

## Advanced Usage

### Additional CLI Commands

The CLI tool provides several advanced commands not available through pnpm scripts:

#### Generate Sample XML

Create a smaller sample from a large XML file:

```bash
# Generate sample from large XML file
xml-introspect sample https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz sample.xml --verbose

# This creates a representative sample with the same structure but fewer elements
```

#### Generate Realistic Test Data

Create realistic XML using Faker.js for testing:

```bash
# Generate realistic XML data for testing
xml-introspect realistic sample.xml realistic-test-data.xml --verbose

# This creates XML with realistic-looking data using Faker.js
```

#### XML Roundtrip Testing

Test XML parsing and regeneration:

```bash
# XML -> XAST -> XML roundtrip
xml-introspect roundtrip input.xml output.xml --verbose

# This parses XML to XAST (XML Abstract Syntax Tree) and back to XML
```

#### Expand Small XML

Create larger XML files from small templates:

```bash
# Expand small XML to larger XML
xml-introspect expand template.xml expanded.xml --verbose

# This creates a larger version of the XML file
```

#### Generate XML from Schema

Create XML files from XSD schemas:

```bash
# Generate XML from XSD schema
xml-introspect generate schema.xsd generated.xml --verbose

# This creates an XML file that conforms to the XSD schema
```

### Custom XML Files

You can use xml-introspect with any XML file:

```bash
# Preview custom XML file
xml-introspect preview /path/to/your/file.xml --verbose

# Generate schema for custom file
xml-introspect schema /path/to/your/file.xml --verbose output.xsd

# Validate custom file
xml-introspect validate /path/to/your/file.xml schema.xsd --verbose

# Generate sample from custom file
xml-introspect sample /path/to/your/file.xml sample.xml --verbose
```

### Programmatic Usage

You can also use xml-introspect programmatically in your code:

```typescript
import { StandaloneBrowserXMLIntrospector } from 'xml-introspect/browser';

const introspector = new StandaloneBrowserXMLIntrospector();

// Preview XML content
const preview = await introspector.preview('https://example.com/wordnet.xml');
console.log('File size:', preview.fileSize);
console.log('Root element:', preview.rootElement);
console.log('First lines:', preview.firstLines);

// Generate schema
const schema = await introspector.generateSchema('https://example.com/wordnet.xml');
console.log('Generated XSD:', schema);

// Validate XML
const validation = await introspector.validate('https://example.com/wordnet.xml', schema);
if (validation.isValid) {
  console.log('XML is valid!');
} else {
  console.log('Validation errors:', validation.errors);
}
```

## Integration with wn-ts-web

### Before Loading Data

Use xml-introspect to understand the structure before loading:

```typescript
import { StandaloneBrowserXMLIntrospector } from 'xml-introspect/browser';
import { DataLoader } from 'wn-ts-web';

const introspector = new StandaloneBrowserXMLIntrospector();
const dataLoader = new DataLoader();

// Preview the XML structure
const preview = await introspector.preview(packageUrl);
console.log('Expected structure:', preview.rootElement);
console.log('File size:', preview.fileSize);

// Load the data with confidence
await dataLoader.loadProject('omw-fr:1.4');
```

### Schema Validation

Validate XML files before processing:

```typescript
// Generate schema from reference file
const schema = await introspector.generateSchema(referenceXmlUrl);

// Validate new files against schema
const validation = await introspector.validate(newXmlUrl, schema);
if (!validation.isValid) {
  console.error('XML validation failed:', validation.errors);
  return;
}

// Proceed with loading
await dataLoader.loadProject(projectId);
```

## Best Practices

1. **Always preview first**: Use `preview` to understand file structure before processing
2. **Generate schemas**: Create XSD schemas for consistent validation
3. **Validate before loading**: Ensure XML integrity before data processing
4. **Handle errors gracefully**: Check validation results and provide meaningful error messages
5. **Use verbose mode**: Enable `--verbose` flag for detailed output during development

## Troubleshooting

### Common Issues

**Large file handling:**
- xml-introspect handles large files efficiently
- Use streaming for very large files (>100MB)
- Consider memory limits in browser environments

**Network issues:**
- Ensure URLs are accessible
- Check CORS policies for cross-origin requests
- Use local files for development

**Schema generation:**
- Complex XML structures may generate large schemas
- Review generated schemas for accuracy
- Customize schema generation options as needed

### Error Messages

**"Failed to download package":**
- Check URL accessibility
- Verify network connectivity
- Ensure proper authentication if required

**"Invalid XML structure":**
- Use preview to identify structural issues
- Check for encoding problems
- Validate against known good examples

**"Schema validation failed":**
- Review validation errors carefully
- Check for namespace mismatches
- Verify element structure compliance

## Practical Examples

### Workflow: Analyzing a New WordNet File

Here's a complete workflow for analyzing a new WordNet XML file:

```bash
# 1. Preview the file to understand its structure
xml-introspect preview https://example.com/new-wordnet.xml --verbose

# 2. Generate a schema for validation
xml-introspect schema https://example.com/new-wordnet.xml --verbose new-wordnet.xsd

# 3. Create a sample for testing
xml-introspect sample https://example.com/new-wordnet.xml sample.xml --verbose

# 4. Generate realistic test data
xml-introspect realistic sample.xml test-data.xml --verbose

# 5. Validate the original file against the schema
xml-introspect validate https://example.com/new-wordnet.xml new-wordnet.xsd --verbose
```

### Development Workflow

For developers working with WordNet data:

```bash
# Quick preview of any WordNet file
xml-introspect preview <url-or-path> --verbose

# Generate comprehensive schema with custom namespace
xml-introspect schema <input> --namespace "http://example.com/wordnet" --verbose schema.xsd

# Create test samples for unit testing
xml-introspect sample <input> test-sample.xml --max-elements 100 --verbose

# Validate before processing
xml-introspect validate <xml-file> <schema-file> --verbose
```

### CI/CD Integration

For automated testing and validation:

```bash
#!/bin/bash
# validate-wordnet.sh

XML_URL="$1"
SCHEMA_FILE="$2"

echo "🔍 Previewing XML file..."
xml-introspect preview "$XML_URL" --verbose

echo "📋 Validating against schema..."
xml-introspect validate "$XML_URL" "$SCHEMA_FILE" --verbose

if [ $? -eq 0 ]; then
    echo "✅ Validation passed"
    exit 0
else
    echo "❌ Validation failed"
    exit 1
fi
```

## Examples with WordNet Data

### OMW (Open Multilingual WordNet) Files

```bash
# Using CLI directly
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz --verbose omw-fr-1.4.xsd
xml-introspect validate https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz ./omw-fr-1.4.xsd --verbose

# Or using pnpm scripts (equivalent)
pnpm introspect:preview
pnpm introspect:schema
pnpm introspect:validate
```

### Custom WordNet Files

```bash
# Preview custom WordNet file
xml-introspect preview https://your-domain.com/wordnet.xml --verbose

# Generate schema for custom file
xml-introspect schema https://your-domain.com/wordnet.xml --verbose custom-schema.xsd

# Validate custom file
xml-introspect validate https://your-domain.com/wordnet.xml custom-schema.xsd --verbose

# Create sample for testing
xml-introspect sample https://your-domain.com/wordnet.xml sample.xml --max-elements 50 --verbose
```

### Multiple Language Support

```bash
# Analyze different language WordNets
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz --verbose
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-de-1.4.tar.xz --verbose
xml-introspect preview https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz --verbose

# Generate schemas for each
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz --verbose omw-en-1.4.xsd
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-de-1.4.tar.xz --verbose omw-de-1.4.xsd
xml-introspect schema https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz --verbose omw-es-1.4.xsd
```

This comprehensive approach ensures that WordNet XML files are properly understood and validated before being processed by the wn-ts-web library, leading to more reliable data loading and better error handling.
