# Global WordNet Schemas

> **📚 Related Documentation:**
> - [Testing Strategy](./TESTING_STRATEGY.md) - Testing guidelines and patterns
> - [Advanced Use Cases](./ROADMAP.md) - Superpower operations and examples
> - [Development Conventions](../../standards/DEVELOPMENT_CONVENTIONS.md) - Coding standards and patterns
> - [Database Schema Standards](../../standards/DATABASE_SCHEMA_STANDARDS.md) - Database design and optimization

This document describes the Global WordNet Association schemas that `wn-ts` supports and how they integrate with the library.

## Overview

The Global WordNet Association provides standardized formats for publishing and submitting WordNets to the Interlingual Index (ILI). These schemas ensure consistency and interoperability across different language WordNets.

**Official Schema Documentation**: [https://globalwordnet.github.io/schemas/](https://globalwordnet.github.io/schemas/)

## Supported Formats

`wn-ts` supports all three official Global WordNet formats:

### 1. Lexical Markup Framework (LMF) - XML
- **Primary Format**: Most commonly used in the `wn-ts` ecosystem
- **File Extension**: `.xml`
- **Validation**: Uses DTD (Document Type Definition) files
- **Versions Supported**: 1.0, 1.1, 1.2, 1.3, 1.4

### 2. JSON-LD using the Lemon Vocabulary
- **Format**: JSON with Linked Data semantics
- **File Extension**: `.json` or `.jsonld`
- **Validation**: Uses JSON Schema
- **Schema**: [wn-json-schema.json](https://github.com/globalwordnet/schemas/blob/master/wn-json-schema.json)

### 3. OntoLex RDF
- **Format**: RDF/OWL representation
- **File Extension**: `.ttl` or `.rdf`
- **Vocabularies**: Based on W3C OntoLex Model and W3C RDF/OWL Representation of WordNet

## LMF XML Schema Versions

### Version 1.0
- **DTD URL**: `http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd`
- **Features**: Basic LMF structure with core elements
- **Dublin Core**: Uses `http://purl.org/dc/elements/1.1/`

### Version 1.1
- **DTD URL**: `http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd`
- **New Elements**: `Requires`, `Extends`, `Pronunciation`, `LexiconExtension`, `ExternalLexicalEntry`, `ExternalLemma`, `ExternalForm`, `ExternalSense`, `ExternalSynset`
- **Dublin Core**: Uses `https://globalwordnet.github.io/schemas/dc/`

### Version 1.2
- **DTD URL**: `http://globalwordnet.github.io/schemas/WN-LMF-1.2.dtd`
- **Features**: Same as 1.1, no new elements
- **Dublin Core**: Uses `https://globalwordnet.github.io/schemas/dc/`

### Version 1.3
- **DTD URL**: `http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd`
- **Features**: Same as 1.1, but allows `xml:space` on nodes with text content
- **Dublin Core**: Uses `https://globalwordnet.github.io/schemas/dc/`

### Version 1.4
- **DTD URL**: `http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd`
- **Features**: Same as 1.1, no new elements
- **Dublin Core**: Uses `https://globalwordnet.github.io/schemas/dc/`

## Core LMF Elements

### Required Elements
- **`LexicalResource`**: Root element containing all lexicons
- **`Lexicon`**: Container for language-specific WordNet data
- **`LexicalEntry`**: Individual word entries
- **`Lemma`**: Canonical form of a word
- **`Sense`**: Word meanings linked to synsets
- **`Synset`**: Sets of synonymous words

### Optional Elements
- **`Form`**: Alternative word forms
- **`Tag`**: Grammatical or semantic tags
- **`SenseRelation`**: Relations between word senses
- **`SynsetRelation`**: Relations between synsets
- **`Definition`**: Glosses and explanations
- **`Example`**: Usage examples
- **`Count`**: Frequency information
- **`SyntacticBehaviour`**: Syntactic frames

## Part of Speech Values

The LMF schema supports these part-of-speech values:
- **`n`**: Noun
- **`v`**: Verb
- **`a`**: Adjective
- **`r`**: Adverb
- **`s`**: Adjective Satellite
- **`c`**: Conjunction
- **`p`**: Adposition (Preposition, postposition, etc.)
- **`x`**: Other (particle, classifier, bound morphemes, determiners)
- **`u`**: Unknown

## WordNet Relations

### Princeton WordNet Relations
- **`hypernym`**: More general concept
- **`hyponym`**: More specific concept
- **`antonym`**: Opposite meaning
- **`derivation`**: Derived word forms
- **`pertainym`**: Relational adjectives
- **`domain_topic`**: Category classification
- **`mero_part`**: Part-whole relationships
- **`mero_member`**: Member-collection relationships

### Extended Relations
- **`feminine`/`has_feminine`**: Gender-specific forms
- **`diminutive`/`has_diminutive`**: Size variations
- **`metaphor`/`has_metaphor`**: Metaphorical extensions
- **`metonym`/`has_metonym`**: Metonymic extensions

## Integration with wn-ts

### Parser Support
The `wn-ts` library includes robust LMF XML parsing capabilities:

```typescript
import { parseLMF } from 'wn-ts-core/parsers';

// Parse LMF XML file
const document = await parseLMF(xmlContent, {
  validateSchema: true,  // Enable DTD validation
  version: '1.3'         // Specify expected version
});
```

### Schema Validation
`wn-ts` can validate LMF files against the official DTDs:

```typescript
import { validateLMF } from 'wn-ts-core/parsers';

const isValid = await validateLMF(xmlContent, '1.3');
if (!isValid) {
  console.log('LMF validation failed');
}
```

### Version Detection
The library automatically detects LMF versions from DOCTYPE declarations:

```typescript
import { detectLMFVersion } from 'wn-ts-core/parsers';

const version = await detectLMFVersion(xmlContent);
console.log(`Detected LMF version: ${version}`);
```

## Local DTD Storage

For offline development and testing, consider storing DTD files locally in the `schemas/` directory:

```
wn-ts-core/
├── schemas/
│   ├── WN-LMF-1.0.dtd
│   ├── WN-LMF-1.1.dtd
│   ├── WN-LMF-1.2.dtd
│   ├── WN-LMF-1.3.dtd
│   └── WN-LMF-1.4.dtd
└── docs/
    └── GLOBAL_WORDNET_SCHEMAS.md
```

This allows for:
- Offline development
- Faster validation
- Version control of schemas
- Consistent testing environments

## Testing with LMF Files

The `wn-ts` test suite includes sample LMF files for different versions:

- **`mini-lmf-1.0.xml`**: Basic English/Spanish lexicon
- **`mini-lmf-1.1.xml`**: Extended features demonstration
- **`mini-lmf-1.3.xml`**: Whitespace handling examples
- **`mini-lmf-1.4.xml`**: Latest version compatibility

## Resources

- **Official Schemas**: [https://globalwordnet.github.io/schemas/](https://globalwordnet.github.io/schemas/)
- **Converter/Validator**: [http://server1.nlp.insight-centre.org/gwn-converter/](http://server1.nlp.insight-centre.org/gwn-converter/)
- **JSON Schema**: [https://github.com/globalwordnet/schemas/blob/master/wn-json-schema.json](https://github.com/globalwordnet/schemas/blob/master/wn-json-schema.json)
- **Global WordNet Association**: [https://globalwordnet.org/](https://globalwordnet.org/)

## Contributing

When contributing to `wn-ts` LMF support:

1. **Test with multiple LMF versions** to ensure compatibility
2. **Validate against official DTDs** before submitting
3. **Include sample LMF files** for new features
4. **Update this documentation** for schema changes
5. **Follow Global WordNet Association guidelines** for extensions
