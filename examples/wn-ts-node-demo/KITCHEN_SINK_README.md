# Use Case: Kitchen Sink Demo

A comprehensive demonstration of many major features in the WordNet TypeScript library, framed as a series of solutions to common problems.

## 🎯 What This Demo Shows

The Kitchen Sink Demo is a long-form script that showcases a wide range of `wn-ts` capabilities, from basic queries to advanced data analysis. It is intended for manual execution to observe the library's full potential.

- **Section 1: Basic Word Queries**: How to find all forms and meanings of a word ("computer").
- **Section 2: Multilingual Linking**: How to link concepts across languages using the ILI.
- **Section 3: Word Sense Disambiguation**: How to analyze the different meanings of a polysemous word ("bank").
- **Section 4: Lexical Database Exploration**: How to discover available linguistic resources and their metadata.
- **Section 5: Advanced Word Analysis**: How to perform a deep-dive analysis on a complex word ("light").
- **Section 6: Database Statistics**: How to get a statistical overview of the database's scope and quality.
- **Section 7: Practical Applications**: How to combine APIs to build a simple application like a multilingual dictionary lookup.

## 🚀 How to Run

This script is intended for manual execution due to its long runtime and comprehensive output.

```bash
# From the root of the repository
pnpm demo:kitchen-sink

# Or from the demo directory
cd demo
pnpm kitchen-sink
```

## 📊 Expected Output

The script will run through the 7 sections, printing detailed console output for each. It covers everything from simple word lookups to statistical analysis and multilingual queries, providing a complete picture of what `wn-ts` can do.

## 🎯 Learning Objectives

After running this demo, you'll have a good understanding of:

1.  **Core Query Patterns**: How to search for words, synsets, and senses.
2.  **Multilingual Features**: How to use the ILI for cross-language tasks.
3.  **Data Exploration**: How to discover and analyze available lexical data.
4.  **Statistical Analysis**: How to get efficient statistics on the database.
5.  **API Usage**: How to combine different library functions to build applications.
