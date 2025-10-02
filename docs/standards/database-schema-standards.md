# Database Schema Standards

## **Overview**

This document defines the standard database schema structure, naming conventions, and data integrity requirements for all `wn-ts` modules. The schema is designed to support cross-lingual WordNet operations with optimal performance and data integrity.

## **Microkernel Architecture Integration**

The database schema is designed to work with the microkernel architecture:

### **Core Schema Components**
- **`WordNetCore` Interface**: Defines core database operations and schema requirements
- **`WordNetKernel` Class**: Manages schema validation, health checks, and plugin integration
- **Plugin Support**: Schema extensions for relations, similarity, and translation plugins

### **Cross-Platform Compatibility**
- **Node.js**: SQLite with better-sqlite3 and Kysely
- **Browser**: SQLite WASM with OPFS for persistence
- **Unified Interface**: Same schema across all platforms

## **Naming Conventions**

### **ID Properties & References**

**Rule**: Always use the `Id` suffix for properties that reference IDs of other entities.

**✅ Correct Examples:**
```typescript
interface Sense {
  id: string;
  wordId: string;        // References Word.id
  synsetId: string;      // References Synset.id
  lexiconId: string;     // References Lexicon.id
}
```

**❌ Incorrect Examples:**
```typescript
interface Sense {
  id: string;
  word: string;          // Should be wordId
  synset: string;        // Should be synsetId
  lexicon: string;       // Should be lexiconId
}
```

### **Database Column Naming**

**Rule**: Use `snake_case` for database columns to match SQL conventions.

**✅ Correct Examples:**
```sql
CREATE TABLE senses (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  synset_id TEXT NOT NULL,
  lexicon_id TEXT NOT NULL
);
```

## **Core Tables Schema**

### **1. Lexicons Table**
```sql
CREATE TABLE lexicons (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  version TEXT NOT NULL,
  label TEXT,
  description TEXT,
  license TEXT,
  url TEXT,
  citation TEXT,
  confidence REAL DEFAULT 1.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Words Table (Lexical Entries)**
```sql
CREATE TABLE words (
  id TEXT PRIMARY KEY,
  lexicon_id TEXT NOT NULL,
  lemma TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  pronunciation TEXT,
  script TEXT,
  status TEXT,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lexicon_id) REFERENCES lexicons(id)
);
```

### **3. Synsets Table**
```sql
CREATE TABLE synsets (
  id TEXT PRIMARY KEY,
  lexicon_id TEXT NOT NULL,
  ili_id TEXT,
  part_of_speech TEXT NOT NULL,
  definition TEXT,
  example TEXT,
  confidence REAL DEFAULT 1.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lexicon_id) REFERENCES lexicons(id),
  FOREIGN KEY (ili_id) REFERENCES ilis(id)
);
```

### **4. Senses Table**
```sql
CREATE TABLE senses (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  synset_id TEXT NOT NULL,
  source TEXT,
  sensekey TEXT,
  adjposition TEXT,
  subcategory TEXT,
  domain TEXT,
  register TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(id),
  FOREIGN KEY (synset_id) REFERENCES synsets(id)
);
```

### **5. Synset Relations Table**
```sql
CREATE TABLE synset_relations (
  id TEXT PRIMARY KEY,
  source_synset_id TEXT NOT NULL,
  target_synset_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  source_lexicon_id TEXT NOT NULL,
  target_lexicon_id TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_synset_id) REFERENCES synsets(id),
  FOREIGN KEY (target_synset_id) REFERENCES synsets(id),
  FOREIGN KEY (source_lexicon_id) REFERENCES lexicons(id),
  FOREIGN KEY (target_lexicon_id) REFERENCES lexicons(id)
);
```

### **6. ILI Entries Table**
```sql
CREATE TABLE ilis (
  id TEXT PRIMARY KEY,
  definition TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### **7. Definitions Table**
```sql
CREATE TABLE definitions (
  id TEXT PRIMARY KEY,
  synset_id TEXT NOT NULL,
  definition TEXT NOT NULL,
  language TEXT NOT NULL,
  source TEXT,
  confidence REAL DEFAULT 1.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (synset_id) REFERENCES synsets(id)
);
```

### **8. Examples Table**
```sql
CREATE TABLE examples (
  id TEXT PRIMARY KEY,
  synset_id TEXT NOT NULL,
  example TEXT NOT NULL,
  language TEXT NOT NULL,
  source TEXT,
  confidence REAL DEFAULT 1.0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (synset_id) REFERENCES synsets(id)
);
```

### **9. Forms Table**
```sql
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  form TEXT NOT NULL,
  form_type TEXT NOT NULL,
  pronunciation TEXT,
  script TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(id)
);
```

## **Foreign Key Relationships**

### **Core Dependencies**
```
lexicons (1) ←→ (N) words
lexicons (1) ←→ (N) synsets
words (1) ←→ (N) senses
synsets (1) ←→ (N) senses
synsets (1) ←→ (1) ilis (optional)
synsets (1) ←→ (N) definitions
synsets (1) ←→ (N) examples
words (1) ←→ (N) forms
```

### **Cross-Lexicon Linking**
```
synsets (N) ←→ (N) synsets (via synset_relations)
```

## **Indexing Strategy**

### **Primary Indexes**
- All `id` columns (PRIMARY KEY)
- All foreign key columns for JOIN performance

### **Performance Indexes**
```sql
-- Word lookup by lemma
CREATE INDEX idx_words_lemma ON words(lemma);

-- Sense lookup by word
CREATE INDEX idx_senses_word_id ON senses(word_id);

-- Sense lookup by synset
CREATE INDEX idx_senses_synset_id ON senses(synset_id);

-- Synset lookup by ILI
CREATE INDEX idx_synsets_ili_id ON synsets(ili_id);

-- Cross-lexicon relations
CREATE INDEX idx_synset_relations_source ON synset_relations(source_synset_id);
CREATE INDEX idx_synset_relations_target ON synset_relations(target_synset_id);
```

## **Data Integrity Constraints**

### **NOT NULL Constraints**
- All ID fields
- Language and version in lexicons
- Lemma and POS in words
- POS in synsets
- Word and synset references in senses

### **Unique Constraints**
- Lexicon ID
- Word ID within lexicon
- Synset ID within lexicon
- Sense ID within lexicon

### **Check Constraints**
```sql
-- Valid part of speech values
CHECK (part_of_speech IN ('n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x'))

-- Valid confidence range
CHECK (confidence >= 0.0 AND confidence <= 1.0)

-- Valid status values for ILI
CHECK (status IN ('active', 'inactive', 'deprecated'))
```

## 🔄 **Data Migration & Updates**

### **Schema Versioning**
- Track schema changes in `schema_version` table
- Provide migration scripts for major version changes
- Maintain backward compatibility where possible

### **Data Validation**
- Validate foreign key relationships before insertion
- Check data types and constraints
- Verify ILI mappings for cross-lingual operations

## **Performance Considerations**

### **Query Optimization**
- Use prepared statements for repeated queries
- Implement connection pooling for high-concurrency scenarios
- Consider read replicas for heavy query workloads

### **Storage Optimization**
- Use appropriate data types (TEXT vs VARCHAR)
- Consider compression for large text fields
- Implement archiving for historical data

## **Testing Requirements**

### **Schema Validation Tests**
- Verify all tables can be created
- Test foreign key constraints
- Validate index creation and usage

### **Data Integrity Tests**
- Test NOT NULL constraints
- Verify foreign key relationships
- Check unique constraints

### **Performance Tests**
- Measure query performance with indexes
- Test bulk insert operations
- Validate cross-lexicon query performance
