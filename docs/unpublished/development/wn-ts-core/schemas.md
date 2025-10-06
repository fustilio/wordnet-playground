# Global WordNet Schemas

This directory contains the official Global WordNet Association schema files used by `wn-ts` for validation and parsing.

## Files

### DTD Files (XML Schema Definitions)
- **`WN-LMF-1.0.dtd`**: Lexical Markup Framework version 1.0 DTD
- **`WN-LMF-1.1.dtd`**: Lexical Markup Framework version 1.1 DTD  
- **`WN-LMF-1.2.dtd`**: Lexical Markup Framework version 1.2 DTD
- **`WN-LMF-1.3.dtd`**: Lexical Markup Framework version 1.3 DTD
- **`WN-LMF-1.4.dtd`**: Lexical Markup Framework version 1.4 DTD

### JSON Schema
- **`wn-json-schema.json`**: JSON-LD schema for WordNet data validation *(not currently available locally)*

### Dublin Core Schemas
- **`dc/dc.rdf`**: Dublin Core metadata schema in RDF format *(not currently available locally)*

## Usage

These schemas are used by the `wn-ts` library for:

1. **XML Validation**: Validating LMF XML files against the appropriate DTD
2. **Parser Development**: Ensuring parsers handle all supported schema versions
3. **Testing**: Providing reference schemas for test data generation

**Note**: JSON-LD and Dublin Core schemas are not currently available locally but can be referenced from official sources when needed.

## Source

All schemas are downloaded from the official Global WordNet Association repository:
- **DTD Files**: [https://globalwordnet.github.io/schemas/](https://globalwordnet.github.io/schemas/)
- **JSON Schema**: [https://github.com/globalwordnet/schemas](https://github.com/globalwordnet/schemas)

## Version Differences

### LMF 1.0 → 1.1
- Added support for lexicon extensions and external references
- New elements: `Requires`, `Extends`, `Pronunciation`, `LexiconExtension`, `ExternalLexicalEntry`, `ExternalLemma`, `ExternalForm`, `ExternalSense`, `ExternalSynset`

### LMF 1.1 → 1.2
- No new elements, same as 1.1

### LMF 1.2 → 1.3
- Added support for `xml:space` attribute on text content nodes
- Same elements as 1.1

### LMF 1.3 → 1.4
- No new elements, same as 1.1

## Maintenance

These schemas should be updated when new versions are released by the Global WordNet Association. To update:

1. Check for new versions at [https://globalwordnet.github.io/schemas/](https://globalwordnet.github.io/schemas/)
2. Download new DTD files using curl:
   ```bash
   curl -O "https://globalwordnet.github.io/schemas/WN-LMF-X.Y.dtd"
   ```
3. Update the `wn-ts` code to support new versions if needed
4. Update documentation in `docs/GLOBAL_WORDNET_SCHEMAS.md`

## License

These schemas are provided by the Global WordNet Association and are subject to their licensing terms. See [https://globalwordnet.org/](https://globalwordnet.org/) for details.
