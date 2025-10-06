# Terminology Guide

**Consistent terms** used throughout this project's documentation and code.

> When you see conflicting terms in old docs, refer to this guide for the correct usage.

## Core Concepts

### WordNet (proper noun)
**Use**: WordNet  
**Not**: Wordnet, wordnet, WORDNET

**Example**: "WordNet is a lexical database."

### Package vs Lexicon vs Project

| Term | Meaning | Example | Where Used |
|------|---------|---------|------------|
| **package** | Downloadable unit (id + version) | `oewn:2024` | Installation, loading |
| **lexicon** | Linguistic resource in database | `oewn` | Database queries, filtering |
| **project** | Source/upstream project | "Open English WordNet" | Documentation, attribution |

**Examples**:
```typescript
// ✅ Correct
loadPackageData('oewn:2024');        // package = id:version
wn.words({ lexicon: 'oewn' });      // lexicon = id only
"Data from the OEWN project"         // project = human name

// ❌ Wrong
loadLexiconData('oewn:2024');       // Don't use "lexicon" for loading
wn.words({ package: 'oewn' });      // Don't use "package" for queries
```

### Form vs Lemma vs Word

| Term | Meaning | Example |
|------|---------|---------|
| **form** | Any surface form | "running", "ran", "runs" |
| **lemma** | Base/dictionary form | "run" |
| **word** | Database entry | `{ id, lemma, pos, ... }` |

**Examples**:
```typescript
// ✅ Correct
wn.words({ form: 'running' });     // Search any form
console.log(word.lemma);            // Print base form
const words = await wn.words();     // Get word objects

// ❌ Wrong
wn.words({ word: 'running' });     // Don't use "word" as param
wn.words({ lemma: 'running' });    // Use "form" for search
```

### Synset vs Concept vs Sense

| Term | Meaning | Usage |
|------|---------|-------|
| **synset** | Set of synonymous words | Technical, code, API |
| **concept** | Abstract meaning | Documentation, explanations |
| **sense** | Word-synset connection | Technical, when discussing polysemy |

**Examples**:
```typescript
// ✅ Correct - Technical context
const synsets = await wn.synsets('bank');
const senses = await wn.senses({ wordId: 'bank-n' });

// ✅ Correct - Explanation context
"The concept of 'computer' has evolved over time"
"The word 'bank' has multiple senses"
```

### ILI vs CILI vs Interlingual Index

| Term | Use When | Example |
|------|----------|---------|
| **ILI** | Code, technical docs | `synset.ili`, `getIli('i00001')` |
| **CILI** | Referring to the data package | "Download CILI for cross-lingual support" |
| **Interlingual Index** | First mention, explanations | "The Interlingual Index (ILI) maps concepts..." |

**Pattern**:
```markdown
The Interlingual Index (ILI) enables cross-lingual mapping. 
To use ILI features, download the CILI package.
Then query: `synset.ili` to get the ILI ID.
```

## API Naming

### Current (Correct) API

| Platform | Initialization | Hook Name |
|----------|----------------|-----------|
| **Node.js** | `createWordnet()` | N/A |
| **Web (React)** | Auto (via provider) | `useWordNetContext()` |
| **Web (Direct)** | `new WebWordNetKernel()` | N/A |

### Deprecated API (Don't Use)

| Old | New | Status |
|-----|-----|--------|
| `new Wordnet()` | `createWordnet()` | ⚠️ Still works, don't use |
| `useWordNet()` | `useWordNetContext()` | ⚠️ Still works, don't use |
| `NodeWordnet` | `createWordnet()` | ⚠️ Still works, don't use |

**In docs**: Show new API only. Add deprecation note if mentioning old API.

## Method Naming

### Prefix Conventions

| Prefix | Platform | Example |
|--------|----------|---------|
| None | Node.js direct | `wn.words()` |
| `query*` | React hooks | `queryWords()` |
| `get*` | Plugins | `getHypernyms()` |

**Why different?**
- React hooks use `query*` prefix to avoid naming conflicts
- Plugin methods use `get*` prefix for clarity
- Node.js uses no prefix (matches Python `wn` library)

### Query vs Get

| Use | When | Example |
|-----|------|---------|
| **query** | Searching/filtering | `queryWords('computer')` |
| **get** | Fetching by ID | `getSynsetById('oewn-01')` |

```typescript
// ✅ Correct
const words = await queryWords('computer');     // Search
const synset = await getSynsetById('oewn-01'); // Fetch by ID

// ❌ Wrong  
const words = await getWords('computer');       // Use query*
const synset = await querySynsetById('id');    // Use get*
```

## Part of Speech

| Code | Full Name | Use |
|------|-----------|-----|
| `n` | Noun | Code, API, database |
| `v` | Verb | Code, API, database |
| `a` | Adjective | Code, API, database |
| `r` | Adverb | Code, API, database |
| `s` | Adjective Satellite | Code, API, database |

**In documentation**, spell out on first use:
```markdown
Search for nouns (`n`) using `wn.words({ pos: 'n' })`.
```

**In code**, always use single-letter codes:
```typescript
// ✅ Correct
const nouns = await wn.words({ pos: 'n' });

// ❌ Wrong
const nouns = await wn.words({ pos: 'noun' });
```

## File Naming

### Documentation

| Type | Pattern | Example |
|------|---------|---------|
| Guides | lowercase-with-dashes | `web-usage.md` |
| Reference | UPPERCASE | `API_REFERENCE.md` |
| Concept | lowercase | `what-is-wordnet.md` |

### Code Examples

| Type | Pattern | Example |
|------|---------|---------|
| Example files | kebab-case.js/ts | `word-sense-disambiguation.js` |
| Demo apps | lowercase | `web-basic-demo/` |
| Helpers | camelCase.js/ts | `helpers.js` |

## Writing Style

### Do

- **Active voice**: "Use `createWordnet()` to initialize"
- **Imperative**: "Run `pnpm install` first"  
- **Specific**: "Search for nouns with `pos: 'n'`"
- **Consistent capitalization**: "WordNet", "Node.js", "React"

### Don't

- **Passive voice**: "The instance can be created with..."
- **Vague**: "You might want to install dependencies"
- **Inconsistent**: "Wordnet", "NodeJS", "react"
- **Emoji overload**: "🚀🎯💡🔥" (max 1-2 per section)

## Code Comment Style

```typescript
// ✅ Good - Explains WHY
// Use tmpdir() for cross-platform compatibility
const dir = tmpdir();

// ❌ Bad - Explains WHAT (code already says that)
// Get the temp directory
const dir = tmpdir();
```

## Documentation Structure

```markdown
# Title

Brief description (1-2 sentences).

## Section

Content here.

### Subsection

More specific content.

## Examples

```typescript
// Always include working code
```
\`\`\`

## Next Steps

- Link to related docs
```

**Note**: Use `##` for main sections, `###` for subsections. Never go deeper than `###`.

## Changelog

- **2025-10-03**: Initial terminology guide created
- Standardized package/lexicon/project usage  
- Defined API naming conventions
- Established code comment style

---

**When writing docs, follow this guide. When reading old docs that conflict, this guide is correct.**

