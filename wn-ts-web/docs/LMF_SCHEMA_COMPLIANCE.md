# LMF Schema Compliance and Processing Order

## Overview

This document explains how the `wn-ts` LMF parser ensures compliance with the official Lexical Markup Framework (LMF) schema and why the processing order is critical.

## Official LMF Schema Structure

According to the official LMF 1.4 DTD (`wn-ts-core/schemas/WN-LMF-1.4.dtd`):

```dtd
<!ELEMENT LexicalResource (Lexicon|LexiconExtension)+>
<!ELEMENT Lexicon (Requires*, LexicalEntry+, Synset*, SyntacticBehaviour*)>
<!ELEMENT LexicalEntry (Lemma, Form*, Sense*, SyntacticBehaviour*)>
```

**Key Points:**
1. **`Sense` elements are ONLY allowed INSIDE `LexicalEntry`** - they are **NOT** direct children of `Lexicon`
2. **The valid hierarchy is:** `LexicalResource` → `Lexicon` → `LexicalEntry` → `Sense`
3. **Invalid structure:** `LexicalResource` → `Lexicon` → `Sense` (this violates the schema)

## Why Processing Order Matters

### Correct Order (Current Implementation)
```typescript
// PHASE 1: Process LexicalEntry elements FIRST
for (const child of lexiconElement.children) {
  if (child.name === "LexicalEntry") {
    const word = this.processLexicalEntry(child);
    // Process nested senses within this lexical entry
    if (child.children && Array.isArray(child.children)) {
      for (const senseChild of child.children) {
        if (senseChild.name === "Sense") {
          const sense = this.processSense(senseChild, word.id);
        }
      }
    }
  }
}

// PHASE 2: Process Synset elements
for (const child of lexiconElement.children) {
  if (child.name === "Synset") {
    const synset = this.processSynset(child);
  }
}
```

### Why This Order is Correct
1. **Dependencies First**: `LexicalEntry` elements must be processed first because `Sense` elements reference them
2. **Nested Processing**: Senses are processed within their parent `LexicalEntry`, ensuring proper word association
3. **Schema Compliance**: This matches the official LMF schema structure exactly

## The "Standalone Senses" Problem Explained

### What Was Happening Before
Our previous implementation had a "hybrid resolution" strategy that tried to "fix" invalid LMF XML by:
1. Accepting `Sense` elements that appeared outside of `LexicalEntry` (invalid schema)
2. Trying to guess which word they belonged to using similarity algorithms
3. Creating placeholder words for these orphaned senses

### Why This Was Wrong
1. **Schema Violation**: Accepting invalid XML structure
2. **Unreliable Resolution**: Similarity algorithms could make incorrect matches
3. **Data Corruption**: Incorrectly associating senses with wrong words
4. **Performance Issues**: Complex similarity calculations for every orphaned sense

### The Correct Solution
1. **Schema Validation**: Only accept valid LMF XML that conforms to the official schema
2. **Proper Processing Order**: Process elements in the order defined by the schema
3. **Reject Invalid XML**: If `Sense` elements appear outside `LexicalEntry`, reject the entire document

## Schema Validation Examples

### Valid LMF XML (Accepted)
```xml
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word-n">
      <Lemma partOfSpeech="n" writtenForm="word" />
      <Sense id="word-n-sense" synset="synset1" />
    </LexicalEntry>
    <Synset id="synset1" ili="i1" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>
```

### Invalid LMF XML (Rejected)
```xml
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word-n">
      <Lemma partOfSpeech="n" writtenForm="word" />
      <Sense id="word-n-sense" synset="synset1" />
    </LexicalEntry>
    <!-- INVALID: Sense outside LexicalEntry -->
    <Sense id="standalone-sense" synset="synset1" />
    <Synset id="synset1" ili="i1" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>
```

## Benefits of Schema Compliance

1. **Data Integrity**: Ensures all senses are properly associated with their words
2. **Performance**: No complex similarity calculations or placeholder word creation
3. **Reliability**: Predictable behavior based on official standards
4. **Maintainability**: Simpler code that follows established patterns
5. **Interoperability**: Compatible with other LMF-compliant tools

## Migration from Old Approach

If you have existing data with "standalone senses":

1. **Fix the XML**: Move all `Sense` elements inside appropriate `LexicalEntry` elements
2. **Validate**: Use the official LMF schema to validate your XML
3. **Update Tests**: Ensure tests expect valid LMF structure, not invalid "standalone" senses

## References

- **Official LMF Schemas**: `wn-ts-core/schemas/`
- **LMF 1.4 DTD**: `wn-ts-core/schemas/WN-LMF-1.4.dtd`
- **Global WordNet Association**: [https://globalwordnet.org/](https://globalwordnet.org/)
- **LMF Schema Repository**: [https://globalwordnet.github.io/schemas/](https://globalwordnet.github.io/schemas/)

## Conclusion

The current implementation correctly follows the LMF schema and processing order. The "standalone senses" problem was never a real problem - it was a schema validation issue. By ensuring schema compliance, we get:

- **Correct data structure**
- **Better performance** 
- **Reliable parsing**
- **Standards compliance**

This approach is both simpler and more correct than trying to "fix" invalid XML.
