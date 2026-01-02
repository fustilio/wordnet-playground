# wn-ts-core

Core TypeScript library for the WordNet ecosystem with microkernel architecture and comprehensive plugin system.

## Features

- **Microkernel Architecture** - Modern plugin-based design with composable functionality
- **Environment Agnostic** - Works in browsers, Node.js, and other JavaScript environments
- **TypeScript First** - Full TypeScript support with comprehensive type definitions
- **Plugin System** - Extensible, composable, and type-safe plugins
- **Core Modules** - Essential WordNet functionality (morphology, comprehensive relations, data management)
- **Comprehensive Relations** - Complete support for all 70+ WordNet relation types from WN-LMF schema
- **LMF Parsing** - Multiple parser implementations for LMF XML files (1.0-1.4)
- **Schema Management** - Built-in database schema management and health checking
- **Cross-Lingual Support** - ILI-based translation and cross-language queries
- **Query Caching** - Optional, extensible caching for improved performance (LRU, TTL support)

## Installation

```bash
npm install wn-ts-core
```

## Usage

### Core Types
```typescript
import type { Word, Synset, Sense, WordNetCore } from 'wn-ts-core';

interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  language: string;
  lexicon: string;
}
```

### Kernel Architecture
```typescript
import { createWordNet, enhancedRelations, similarity, translation } from 'wn-ts-core';

const wordnet = createWordNet({
  core: myCore,
  plugins: [enhancedRelations, similarity, translation]
});

// Use comprehensive relation methods
const hypernyms = await wordnet.getHypernyms(synsetId);
const meronyms = await wordnet.getMeronyms(synsetId);
const agents = await wordnet.getAgents(synsetId);
const domainTopics = await wordnet.getDomainTopics(synsetId);

// Query by relation category
const hierarchicalRelations = await wordnet.getRelationsByCategory(synsetId, 'HIERARCHICAL');
const semanticRoles = await wordnet.getRelationsByCategory(synsetId, 'SEMANTIC_ROLES');

// Get relation statistics
const stats = await wordnet.getRelationStatsByCategory(synsetId);
console.log(`Synset has ${stats.HIERARCHICAL} hierarchical relations`);
```

### Comprehensive Relations Support

The enhanced relations plugin provides complete support for all WordNet relation types as defined in the WN-LMF schema:

#### Relation Categories

**Hierarchical Relations** (4 types)
- `hypernym` - More general concepts (is-a relationship)
- `hyponym` - More specific concepts (is-a relationship)  
- `instance_hypernym` - Instance of a more general concept
- `instance_hyponym` - More specific instance

**Part-Whole Relations** (15 types)
- `meronym` - Part of something
- `holonym` - Whole of something
- `part_meronym`, `member_meronym`, `substance_meronym` - Specific part types
- `holo_part`, `holo_member`, `holo_substance` - Corresponding whole types

**Semantic Role Relations** (10 types)
- `agent` - Agent performing action
- `patient` - Patient affected by action
- `instrument` - Instrument used in action
- `result` - Result of action
- `source`, `target` - Source and target of action
- `location`, `direction`, `manner`, `role` - Additional semantic roles

**Domain Relations** (6 types)
- `domain_topic` - Domain topic classification
- `domain_region` - Domain region classification
- `exemplifies` - Exemplifies concept
- `is_exemplified_by` - Is exemplified by concept

**Causal Relations** (4 types)
- `causes` - Causes action
- `is_caused_by` - Is caused by action
- `entails` - Entails action
- `is_entailed_by` - Is entailed by action

**Similarity Relations** (4 types)
- `similar` - Similar to concept
- `similar_to` - Similar to concept
- `eq_synonym` - Equivalent synonym
- `ir_synonym` - Irregular synonym

**Opposition Relations** (4 types)
- `antonym` - Antonym of concept
- `anto_gradable` - Gradable antonym
- `anto_simple` - Simple antonym
- `anto_converse` - Converse antonym

**Gender Relations** (4 types)
- `feminine` - Feminine form
- `masculine` - Masculine form
- `has_feminine` - Has feminine form
- `has_masculine` - Has masculine form

**Size Relations** (4 types)
- `diminutive` - Diminutive form
- `augmentative` - Augmentative form
- `has_diminutive` - Has diminutive form
- `has_augmentative` - Has augmentative form

#### Usage Examples

```typescript
// Get specific relation types
const hypernyms = await wordnet.getHypernyms('car-synset-id');
const meronyms = await wordnet.getMeronyms('car-synset-id');
const agents = await wordnet.getAgents('drive-synset-id');
const domainTopics = await wordnet.getDomainTopics('photosynthesis-synset-id');

// Query by category
const hierarchicalRelations = await wordnet.getRelationsByCategory('car-synset-id', 'HIERARCHICAL');
const semanticRoles = await wordnet.getRelationsByCategory('drive-synset-id', 'SEMANTIC_ROLES');

// Get all available relation types for a synset
const relationTypes = await wordnet.getAvailableRelationTypes('car-synset-id');

// Get relation statistics by category
const stats = await wordnet.getRelationStatsByCategory('car-synset-id');
console.log(`Car has ${stats.HIERARCHICAL} hierarchical relations, ${stats.PART_WHOLE} part-whole relations`);

// Utility methods
const descriptions = await wordnet.getRelationDescriptions();
const categories = await wordnet.getRelationCategories();
const isValid = await wordnet.isValidRelationType('hypernym');
```

### Plugin Development
```typescript
import { Plugin } from 'wn-ts-core';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Initialize plugin
  }
  
  async destroy(): Promise<void> {
    // Clean up resources
  }
}
```

## Core Modules

- **Morphology** - Lemmatization and word form analysis
- **Relations** - WordNet relationship queries (hypernyms, hyponyms, etc.)
- **Data Management** - Project and ILI management
- **Environment** - Configuration and environment detection

## Plugins

- **Relations Plugin** - WordNet relationship queries
- **Similarity Plugin** - Semantic similarity calculations
- **Translation Plugin** - Cross-lingual operations

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Plugin Development](../../docs/api/PLUGIN_API.md)
- [Architecture Guide](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Query Caching Guide](./docs/CACHE.md)