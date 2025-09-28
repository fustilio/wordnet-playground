# Comprehensive Relations Demo

This demo showcases the complete WordNet relations system with support for all 70+ relation types defined in the WN-LMF schema.

## Features

### Relation Categories
- **Hierarchical Relations** (4 types): hypernym, hyponym, instance_hypernym, instance_hyponym
- **Part-Whole Relations** (15 types): meronym, holonym, part_meronym, member_meronym, substance_meronym, etc.
- **Semantic Role Relations** (10 types): agent, patient, instrument, result, source, target, location, direction, manner, role
- **Domain Relations** (6 types): domain_topic, domain_region, exemplifies, is_exemplified_by
- **Causal Relations** (4 types): causes, is_caused_by, entails, is_entailed_by
- **Similarity Relations** (4 types): similar, similar_to, eq_synonym, ir_synonym
- **Opposition Relations** (4 types): antonym, anto_gradable, anto_simple, anto_converse
- **Gender Relations** (4 types): feminine, has_feminine, masculine, has_masculine
- **Size Relations** (4 types): diminutive, has_diminutive, augmentative, has_augmentative
- **Other Relations** (3 types): other, participle, usage

### Interactive Features
- **Word Search**: Enter any word to find its synsets
- **Synset Selection**: Choose a synset to explore its relations
- **Category Filtering**: Filter relations by category (e.g., only hierarchical relations)
- **Relation Statistics**: View counts of relations by category
- **Relation Descriptions**: See descriptions for each relation type
- **Real-time Loading**: All data is loaded from the actual WordNet database

### Usage Examples

1. **Search for a noun**: Enter "car" to see car synsets
2. **Explore relations**: Select a synset to see all its relations
3. **Filter by category**: Use the category buttons to focus on specific relation types
4. **View statistics**: See how many relations of each type exist
5. **Read descriptions**: Hover over relation types to see their meanings

### Technical Implementation

The demo uses the enhanced relations plugin which provides:
- Complete support for all WN-LMF relation types
- Efficient database queries with Kysely
- Type-safe relation results
- Error handling and fallbacks
- Performance optimization for large datasets

### Relation Types Demonstrated

- **Hierarchical**: Shows is-a relationships (car → vehicle)
- **Part-Whole**: Shows part-of relationships (car → wheel, engine)
- **Semantic Roles**: Shows who does what to whom (drive → driver, vehicle)
- **Domain**: Shows topic classification (photosynthesis → biology)
- **Causal**: Shows cause-effect relationships (kill → die)
- **Similarity**: Shows similar concepts (happy → joyful)
- **Opposition**: Shows opposite concepts (happy → sad)
- **Gender**: Shows gender forms (actor → actress)
- **Size**: Shows size variations (house → hut, mansion)

This demo provides a comprehensive exploration of WordNet's semantic network, demonstrating the rich relational structure that makes WordNet such a powerful resource for natural language processing and computational linguistics.
