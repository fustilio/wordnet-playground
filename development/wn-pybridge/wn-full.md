# Wn: A Comprehensive Guide to the Python WordNet Library

`wn` is a modern Python library for working with wordnets. It provides a clean, powerful API, support for multiple languages and versions of wordnets via the Open Multilingual Wordnet, and compatibility with NLTK's WordNet interface. This document combines all major use cases and API details into a single guide.

---

## 1. Installation and Setup

### Installation

Install `wn` using pip from the command line:
```bash
pip install wn
```

### Downloading WordNet Data

After installation, you need to download wordnet data. `wn` manages this data in a local cache. You can download the default English WordNet (part of the OMW English Wordnet 'ewn') with:

```python
import wn
# This downloads 'ewn' which includes the Princeton WordNet
wn.download('ewn')
```

### Configuration

By default, data is stored in `~/.wn_data`. The location of this data directory can be configured via environment variables or programmatically.

```python
import os
import wn

# Option 1: Set via environment variable (before importing wn)
# export WN_DATA_PATH=/path/to/my/data

# Option 2: Set in code (before any other wn functions are called)
# wn.config.data_directory = '/path/to/my/data'

print(f"wn data directory is: {wn.config.data_directory}")
```

### Internal Data Model and Persistence

For a 1:1 reimplementation, understanding the data persistence strategy is crucial. `wn` does not query the raw LMF XML files for every operation. Instead, it parses them once and stores the indexed data in a **SQLite database** located at `wn.db` within the data directory.

This database contains tables for words, senses, synsets, definitions, examples, relations, etc. The schema is designed for efficient querying of the WordNet graph. Recreating this library in JavaScript will require either:
1.  Implementing a compatible SQLite database schema and populating it by parsing LMF files.
2.  Using a different persistence layer (like IndexedDB or even in-memory objects for smaller wordnets) that can support the same query patterns efficiently.

All subsequent operations in the library (e.g., `wn.senses()`, `synset.hypernyms()`) are essentially SQL queries against this database, wrapped in a user-friendly API.

---

## 2. Core Concepts and Basic Usage

### Initializing a WordNet

The main entry point is the `wn.WordNet` class. Without arguments, it loads all downloaded lexicons. You can also specify which lexicons to load.

```python
import wn
# Load all available lexicons
wn_instance = wn.WordNet()

# Load only a specific lexicon (or multiple)
pwn = wn.WordNet('pwn:3.0')

# Load all lexicons for a specific language
es_wn = wn.WordNet(lang='es') # loads all Spanish lexicons
```

### Core Objects: Lexicons, Words, Senses, and Synsets

`wn` revolves around four core objects:

- **Lexicon** (`wn.Lexicon`): Represents a single wordnet resource, e.g., the Princeton WordNet 3.0. It contains metadata like its ID, version, language, and license.
- **Word** (`wn.Word`): A lexical form (lemma) with a part-of-speech, like 'tree' as a noun. It contains lexical properties.
- **Sense** (`wn.Sense`): A specific meaning of a word. For example, 'tree' as a plant vs. 'tree' as a diagram. Each sense belongs to a synset.
- **Synset** (`wn.Synset`): A set of synonymous senses that represent a single concept. This is the main node in the WordNet graph.

```python
# Lexicon object contains metadata about the resource
lexicon = wn_instance.lexicon('pwn:3.0')
print(f"Lexicon: {lexicon.id}, Label: {lexicon.label}, Language: {lexicon.language}")
print(f"License: {lexicon.license}")

# Get a word object by its ID. Words also contain lexical data like forms.
word = wn_instance.word('pwn-tree-n')
print(f"\nWord ID: {word.id}")
print(f"Word Lemma: {word.lemma()}, POS: {word.pos}")
print(f"Forms: {word.forms()}") # e.g., plural forms
print(f"Pronunciations: {word.pronunciations()}")
print(f"Lexicon: {word.lexicon().id}")

# Get all senses of a word
senses_of_tree = word.senses()
print(f"\nThe word '{word.lemma()}' has {len(senses_of_tree)} senses.")

# You can search for senses directly
senses = wn_instance.senses('tree', pos='n')
# >> [Sense('pwn-3.0-09479391-n'), Sense('pwn-3.0-13092497-n'), ...]
sense = senses[0]
print(f"\nSense ID: {sense.id}")
print(f"Sense lemmas: {sense.lemmas()}") # May differ from word lemma, e.g., in phrasal verbs
print(f"It is part of word: '{sense.word().lemma()}'")
print(f"Its synset is: {sense.synset().id}")
print(f"It has sensekey: {sense.sensekey()}")
print(f"Definition (from synset): {sense.definition()}")
print(f"Tags (e.g., usage counts): {sense.tags()}")

# You can also search for synsets
synsets = wn_instance.synsets('tree')
# >> [Synset('pwn-3.0-09479391-n'), Sense('pwn-3.0-13092497-n'), ...]

# Get a specific synset by its ID
synset = wn_instance.synset('pwn-3.0-13092497-n') # 'tree' the plant
print(f"\nSynset ID: {synset.id}")
print(f"Synset POS: {synset.pos}")
print(f"Definition: {synset.definition()}")
print(f"Lemmas (all words in this synset): {synset.lemmas()}")
# >> Lemmas: ['tree', 'tree diagram']
print(f"Senses/Members of this synset: {synset.members()}")
print(f"Examples: {synset.examples()}")
# The ILI (Inter-Lingual Index) links concepts across wordnets
print(f"Inter-lingual Identifier (ILI): {synset.ili.id if synset.ili else 'None'}")
print(f"Lexicalized (is there a word for this concept in this lang?): {synset.lexicalized()}")
```

---

## 3. Navigating the WordNet Graph

### Semantic Relations

Synsets are connected by a network of semantic relations. The most common are hyponymy/hypernymy (more-specific/more-general).

```python
car_synset = wn_instance.synsets('car', pos='n')[0]

# Get hypernyms (more general concepts)
hypernyms = car_synset.hypernyms()
print(f"Hypernyms of 'car': {[s.lemmas() for s in hypernyms]}")
# >> [['motor_vehicle', 'automotive_vehicle']]

# Get hyponyms (more specific concepts)
hyponyms = car_synset.hyponyms()
print(f"Hyponyms of 'car': {[s.lemmas() for s in hyponyms[:5]]}") # first 5
# >> [['ambulance'], ['beach_wagon', 'station_wagon', 'wagon', 'estate_car'], ...]

# You can also get a list of all relations and filter them.
meronyms = car_synset.relations('part_meronym')
print(f"Parts of a car: {[s.lemmas() for s in meronyms]}")
```

**Common Synset Relations**:
- `hyponyms()` / `hypernyms()`: more specific / general concepts
- `meronyms()` / `holonyms()`: part / whole relations (`part_meronym`, `substance_meronym`, etc.)
- `entailments()`: for verbs, actions that are entailed
- `causes()`: for verbs, actions that are caused
- `similar()`: for adjectives, similar concepts
- `also()`: for verbs, related actions
- `attribute()`: for adjectives, the noun attribute they describe
- `domain_topic()`, `domain_region()`, `exemplifies()`: categorization relations

A full list of relations can be found in `wn.constants.RELATION_TYPES`.

**Common Sense Relations**:
- `antonyms()`: senses with opposite meaning
- `derivationally_related()`: senses that are morphological derivations

### Taxonomy Traversal

The `wn.taxonomy` module provides functions for traversing the hypernym/hyponym hierarchy.

```python
from wn import taxonomy

dog = wn_instance.synsets('dog', 'n')[0]
cat = wn_instance.synsets('cat', 'n')[0]

# Get all hypernym paths to the root(s)
# A path is a list of synsets from the original to a root.
hypernym_paths = taxonomy.hypernym_paths(dog)
for path in hypernym_paths[:1]: # print first path
    print(' -> '.join(s.lemmas()[0] for s in path))
# >> dog -> canine -> carnivore -> placental -> mammal -> vertebrate ...

# Find the lowest common hypernyms (most specific common ancestor)
lchs = taxonomy.lowest_common_hypernyms(dog, cat)
print(f"Lowest common ancestor of dog and cat: {[s.lemmas() for s in lchs]}")
# >> [['carnivore']]

# Other taxonomy functions include finding depth
print(f"Min depth of 'dog': {taxonomy.min_depth(dog)}")
print(f"Max depth of 'dog': {taxonomy.max_depth(dog)}")
```
---

## 4. Lexicon Management

`wn` can manage and query multiple wordnets (lexicons) from different languages and sources.

### Listing and Using Lexicons

```python
# List available lexicons (local and remote)
print(wn.lexicons())

# List only downloaded lexicons
wn_instance = wn.WordNet()
print(f"Loaded lexicons: {wn_instance.lexicons()}")

# Instantiate WordNet with a specific lexicon ID
pwn = wn.WordNet('pwn:3.0') # Princeton WordNet version 3.0
senses = pwn.senses('dog')

# Or filter results by lexicon
senses_pwn = wn_instance.senses('dog', lexicon='pwn:3.0')
```

### Managing Lexicon Data with `wn.project`

The `wn.project` module helps download and manage wordnet data files.

```python
import wn.project

# List available projects (lexicons)
projects = wn.project.projects()

# Find a specific project
pwn_info = wn.project.find('pwn')
print(pwn_info)

# Add a new project from a local LMF file
# wn.project.add('my-wordnet', 'path/to/my-wordnet.xml')
```

---

## 5. Interlingual Usage

`wn` uses the Collaborative Interlingual Index (CILI) to link concepts across languages, enabling translation and cross-lingual queries.

```python
# Load English and Catalan wordnets
wn.download('mcr')
wn_instance = wn.WordNet(lexicon='pwn:3.0 mcr:3.0')
en_synset = wn_instance.synset('pwn-3.0-02084071-n') # dog

# Find synsets in other languages linked to this one
ca_synsets = en_synset.interlingual_relations('in', 'mcr:3.0')
print(f"Catalan equivalent for 'dog' synset: {[s.lemmas() for s in ca_synsets]}")
# >> [['ca', 'cus', 'gos']]
```

### Translation

```python
# Translation requires appropriate lexicons to be downloaded
# For example, to translate from Spanish to English, you need a Spanish lexicon
# wn.download('wikt:es')
# es_senses = wn.senses('perro', lang='es')

# Translate to English
# en_senses = []
# for sense in es_senses:
#     en_senses.extend(sense.translate(lang='en'))
```

---

## 6. Lemmatization with `wn.morphy`

The `wn.morphy` module finds the base form (lemma) of a word.

### Morphy Internals
For a 1:1 recreation, it's important to know how `morphy` works. It uses a two-step process:
1.  **Exception Lists**: For each part of speech, it consults a list of irregular forms (e.g., `ran -> run`, `geese -> goose`). These are stored in files within the library.
2.  **Detachment Rules**: If the word is not in the exception list, it applies a series of suffix-detachment rules to guess the lemma (e.g., remove "-s", remove "-ing" and add "e").

A JavaScript recreation would need to port both the exception lists and the ordered set of detachment rules for each part of speech.

```python
from wn import morphy
lemmas_n = morphy.lemmas('dogs', pos='n')
# >> {'dog'}

lemmas_v = morphy.lemmas('running', pos='v')
# >> {'run', 'running'}

# It can be initialized with a WordNet object to only return lemmas
# that are actually present in the loaded wordnets.
wn_instance = wn.WordNet()
morph = morphy.Morphy(wn_instance)
lemmas = morph.lemmas('ran', 'v')
# >> {'run'}
```

---

## 7. Semantic Similarity

The `wn.similarity` module provides various measures to calculate the semantic similarity between two synsets.

```python
from wn import similarity
dog = wn_instance.synsets('dog', pos='n')[0]
cat = wn_instance.synsets('cat', pos='n')[0]
tree = wn_instance.synsets('tree', pos='n')[0]

# Path similarity: based on the shortest path between concepts.
# Value is between 0 and 1 (higher is more similar).
print(f"Path similarity (dog, cat): {similarity.path(dog, cat):.2f}")
print(f"Path similarity (dog, tree): {similarity.path(dog, tree):.2f}")

### Information Content (IC) based similarity

These measures require corpus-based frequency counts, known as Information Content (IC). The `wn.ic` module is used to load and manage these files.

```python
# First, download an IC file (e.g., from SemCor)
wn.download('ic-semcor')
# Then load the IC file into a dictionary-like object
ic = wn.ic('ic-semcor')
```

Now you can use IC-based similarity measures:
```python
# Resnik similarity: based on the IC of the most informative common ancestor.
print(f"Resnik similarity (dog, cat): {similarity.res(dog, cat, ic):.2f}")
print(f"Resnik similarity (dog, tree): {similarity.res(dog, tree, ic):.2f}")
```

# Other measures include:
# - wup: Wu-Palmer similarity (path-based, considers depth)
# - lch: Leacock-Chodorow similarity (path-based)
# - jcn: Jiang-Conrath similarity (IC-based)
# - lin: Lin similarity (IC-based)
print(f"Wu-Palmer (dog, cat): {similarity.wup(dog, cat):.2f}")
```

---

## 8. NLTK Migration

`wn` provides a compatibility layer for projects migrating from NLTK's WordNet API.

```python
# wn style for NLTK's 'dog.n.01'
import wn
from wn.formats import synset_id_to_wn
pwn = wn.WordNet('pwn:3.0')
wn_synset_id = synset_id_to_wn('dog.n.01')
wn_synset = pwn.synset(wn_synset_id)

# Using the wn.compat module for a more direct mapping
from wn.compat import NLTKWordNet
wn_compat = NLTKWordNet()
synset = wn_compat.synset('dog.n.01')
print(synset.definition())
print([lemma.name() for lemma in synset.lemmas()])
```

### Sense Keys

The `wn.compat.sensekey` module helps work with WordNet sense keys.

```python
from wn.compat import sensekey

# Decode a sense key
sk = sensekey.decode('dog%1:05:00::')
print(sk)
# >> SenseKey('dog', 'pwn-3.0-02084071-n', 1, 5, 0)

# Get synset or sense from the key
synset = wn_instance.synset(sk.synset_id)
sense = wn_instance.sense(sk.sense_id())
```

---

## 9. Command-Line Interface (CLI)

`wn` has a powerful CLI for exploring wordnets and managing data.

```bash
# Get info about the word 'lead' (senses, synsets, etc.)
wn info lead

# Search for synsets with part-of-speech
wn synsets car --pos n

# Get details for a specific synset or sense ID
wn get pwn-3.0-02958343-n

# List available lexicons (local and remote)
wn list

# Download a new lexicon
wn download oewn

# Add a local lexicon file to the index
# wn add my-wn path/to/my-wn.xml

# Update the database from downloaded files
wn update
```

---

## 10. Data and Web APIs

### `wn.lmf`: Working with LMF data

The Lexical Markup Framework (LMF) is the XML format used by many wordnets.

```python
import wn.lmf

# Reading an LMF file requires a path to an XML file
# This returns a list of Lexicon objects
# lexicons = wn.lmf.load('path/to/wordnet.xml')
# if lexicons:
#   lexicon = lexicons[0]
#   print(f"Loaded {lexicon.label} with {len(lexicon.entries)} entries.")

# Writing a lexicon to an LMF file
# This is useful for converting or creating custom wordnets
# wn.lmf.dump(lexicons, 'path/to/output.xml')
```

### `wn.validate`: Validating WordNet Data

This module can be used to validate LMF files against the `wn-lmf` schema.

```python
import wn.validate

# Validate an LMF file. It returns a report of any issues.
# report = wn.validate.validate('path/to/wordnet.xml')
# if report.errors:
#     print("Validation failed:")
#     for error in report.errors:
#         print(error)
# else:
#     print("Validation successful.")
```

### `wn.web`: Web Interfaces and Servers

The `wn.web` module allows `wn` to serve wordnet data over a network using a simple Flask-based server.

### `wn.web` API Specification
For recreation, you need to know the API endpoints. The server exposes the `wn.WordNet` methods as a JSON-based RESTful API.

- `GET /api/1/lexicons`: List available lexicons.
- `GET /api/1/lexicon/{id}`: Get metadata for a specific lexicon.
- `GET /api/1/senses?lemma=...&pos=...`: Search for senses.
- `GET /api/1/synsets?lemma=...&pos=...`: Search for synsets.
- `GET /api/1/sense/{id}`: Get data for a specific sense.
- `GET /api/1/synset/{id}`: Get data for a specific synset.
- ...and so on for other methods.

The responses are JSON representations of the corresponding `wn` objects.

```python
# from wn import web
# import wn

# Load a wordnet
# wn_instance = wn.WordNet('pwn:3.0')

# Serve it on localhost (this is a blocking call)
# web.serve(wn_instance)

# In another process, you can connect as a client
# client = web.Client() # connects to http://localhost:5000 by default
# senses = client.senses('tree')
# print(senses)
```
---

## 11. API Utilities

### `wn.util` and `wn.constants`

- `wn.constants`: Contains useful constants, like `wn.constants.PARTS_OF_SPEECH`.
- `wn.util`: Contains helper functions, e.g., for parsing IDs.

```python
from wn import constants
from wn.util import synset_id_to_parts

print(constants.PARTS_OF_SPEECH)
# >> ('n', 'v', 'a', 'r', 's')

synset_id = 'pwn-3.0-02084071-n'
lexicon, version, offset, pos = synset_id_to_parts(synset_id)
print(f"Lexicon: {lexicon}, POS: {pos}")
```
---

## 13. Frequently Asked Questions (FAQ)

### How is `wn` different from NLTK's WordNet interface?
- **Multiple WordNets**: `wn` seamlessly handles multiple wordnets and languages. NLTK is primarily for the Princeton WordNet.
- **Data Management**: `wn` has a built-in system for downloading and managing wordnet data from the Open Multilingual Wordnet project.
- **API Design**: The API is more Pythonic and consistent.
- **LMF Support**: It has first-class support for the Lexical Markup Framework (LMF) XML format.

### How do I cite `wn` or the wordnets I use?
When you load a lexicon, inspect its metadata for citation information.

```python
wn_instance = wn.WordNet('pwn:3.0')
lexicon = wn_instance.lexicon('pwn:3.0')
print(lexicon.citation)
```

For citing the `wn` library itself, please see its official documentation or GitHub repository.

---

## 12. Implementation Details for Recreation

### Asynchronous Operations

In JavaScript, many I/O-bound operations are asynchronous. When recreating `wn`, the following actions would likely return Promises:
- `wn.download()`: Network request to fetch data.
- `wn.lmf.load()`: Reading a large XML file from disk.
- All database queries made by `wn.WordNet` methods (`.senses()`, `.synsets()`, etc.). While Python's SQLite interface can be blocking, a JS version using IndexedDB or a remote DB would be async.
- `wn.web.Client` methods: All client methods are network requests.

### Error Handling

`wn` defines a hierarchy of custom exceptions to allow for fine-grained error handling. A JS implementation should replicate this. The base class is `wn.Error`.

- `wn.WnError`: Base class for all library errors.
- `wn.ConfigurationError`: Raised for issues with the `wn` configuration, such as a non-existent data directory.
- `wn.DatabaseError`: Raised for issues with the backing SQLite database, such as a corrupt file or failed query.
- `wn.ProjectError`: Raised when a requested lexicon project is not found.

```python
import wn
try:
    wn.download('non-existent-project')
except wn.ProjectError as e:
    print(f"Caught an error: {e}")
```

---

## 14. API Reference Summary

This section provides a quick reference to the main classes and functions in the `wn` library.

### Top-level `wn` package
- `wn.WordNet(lexicon?, lang?)`: The main database interface.
- `wn.words(form, pos?, lexicon?)`: Search for words.
- `wn.senses(form, pos?, lexicon?)`: Search for senses.
- `wn.synsets(form, pos?, lexicon?)`: Search for synsets.
- `wn.lexicons()`: List available lexicons.
- `wn.download(id)`: Download a lexicon or data file.
- `wn.config`: Configuration object (`data_directory`, etc.).

### Core Objects
- `wn.Lexicon`:
  - `.id`, `.label`, `.language`, `.email`, `.license`, `.version`, `.url`, `.citation`
- `wn.Word`:
  - `.id`, `.pos`, `.forms()`, `.lexicon()`, `.lemma()`, `.senses()`, `.pronunciations()`
- `wn.Sense`:
  - `.id`, `.pos`, `.word()`, `.synset()`, `.lexicon()`, `.lemma()`, `.lemmas()`, `.definition()`, `.examples()`, `.relations()`, `.antonyms()`, `.sensekey()`, `.tags()`
- `wn.Synset`:
  - `.id`, `.pos`, `.ili`, `.lexicon()`, `.definition()`, `.examples()`, `.lemmas()`, `.members()`, `.relations()`, `.hypernyms()`, `.lexicalized()`, etc.

### Modules
- `wn.taxonomy`:
  - `hypernym_paths()`, `lowest_common_hypernyms()`, `min_depth()`, `max_depth()`
- `wn.similarity`:
  - `path()`, `wup()`, `lch()`, `res()`, `jcn()`, `lin()`
- `wn.morphy`:
  - `lemmas()`, `Morphy()` class for context-aware lemmatization.
- `wn.lmf`:
  - `load(path)`, `dump(lexicons, path)`
- `wn.project`:
  - `projects()`, `find(id)`, `add(id, path)`, `remove(id)`, `search(query)`
- `wn.validate`:
  - `validate(path)`
- `wn.ic`:
  - `ic(path)`: load an information content file.
- `wn.compat`:
  - `NLTKWordNet`: NLTK-compatible interface.
  - `sensekey`: module for handling sense keys.
- `wn.constants`:
  - `PARTS_OF_SPEECH`, `RELATION_TYPES`
- `wn.util`:
  - Helper functions like `synset_id_to_parts()`.
- `wn.errors`:
  - `WnError`, `ConfigurationError`, `DatabaseError`, `ProjectError`
