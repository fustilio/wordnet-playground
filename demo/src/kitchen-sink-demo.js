#!/usr/bin/env node

/**
 * WordNet Kitchen Sink Demo
 * 
 * Comprehensive demonstration of all major WordNet features with realistic problem statements.
 * Based on actual data structure findings from debug demo.
 */

import { 
  Wordnet, 
  projects, 
  db, 
  words, 
  synsets, 
  senses, 
  lexicons, 
  ilis,
  download,
  add,
  word,
  synset,
  ili
} from 'wn-ts';
import { join } from 'path';
import { homedir } from 'os';

console.log(`
🚀 WordNet Kitchen Sink Demo
============================

🎯 Comprehensive demonstration with realistic problem statements
`);

// Use a dedicated data directory for this demo
const dataDirectory = join(homedir(), '.wn_kitchen_sink_demo');
console.log(`📁 Using data directory: ${dataDirectory}`);

// Initialize Wordnet with proper configuration
let wordnet;
try {
  wordnet = new Wordnet('*', {
    dataDirectory,
    downloadDirectory: join(dataDirectory, 'downloads'),
    extractDirectory: join(dataDirectory, 'extracted'),
    databasePath: join(dataDirectory, 'wordnet.db')
  });
  
  console.log('✅ Wordnet initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Wordnet:', error.message);
  process.exit(1);
}

async function runKitchenSinkDemo() {
  try {
    console.log(`
🔍 SECTION 1: Basic Word Queries
================================

Problem: You need to find all forms and meanings of a word for a dictionary application.
Solution: Query words and their associated synsets.

Example: Analyzing the word "computer"
`);

    // Basic word queries
    console.log('\n📝 Querying words for "computer"...');
    const computerWords = await words('computer');
    console.log(`Found ${computerWords.length} word forms for "computer"`);
    
    computerWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech}) - ${word.lexicon}`);
    });

    // Get synsets for computer
    console.log('\n📚 Getting synsets for "computer"...');
    const computerSynsets = await synsets('computer');
    console.log(`Found ${computerSynsets.length} synsets for "computer"`);
    
    computerSynsets.slice(0, 3).forEach((synset, index) => {
      console.log(`\n🏦 Synset ${index + 1}:`);
      console.log(`  ID: ${synset.id}`);
      console.log(`  POS: ${synset.partOfSpeech}`);
      console.log(`  ILI: ${synset.ili}`);
      console.log(`  Members: ${synset.members.length} words`);
      console.log(`  Sample members: ${synset.members.slice(0, 3).join(', ')}`);
    });

    console.log(`
🔍 SECTION 2: Multilingual Concept Linking
==========================================

Problem: You have English and French word lists that need to be linked by shared concepts.
Solution: Use ILI (Interlingual Index) to find common concepts across languages.

Example: Linking "computer" concepts across languages
`);

    // Get ILI entry for computer
    if (computerSynsets.length > 0) {
      const computerSynset = computerSynsets[0];
      console.log(`\n🌍 Getting ILI entry for ${computerSynset.ili}...`);
      
      const iliEntry = await ili(computerSynset.ili);
      if (iliEntry) {
        console.log(`📖 ILI Definition: ${iliEntry.definition}`);
        console.log(`🏷️  ILI Status: ${iliEntry.status || 'active'}`);
      }
    }

    // Show some ILI statistics
    console.log('\n📊 ILI Database Overview:');
    const iliEntries = await ilis();
    console.log(`Total ILI entries: ${iliEntries.length}`);
    
    // Show sample ILI entries
    console.log('\n🌐 Sample ILI entries:');
    iliEntries.slice(0, 5).forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.id}: ${entry.definition.substring(0, 60)}...`);
    });

    console.log(`
🔍 SECTION 3: Word Sense Disambiguation
=======================================

Problem: You need to understand the different meanings of a polysemous word.
Solution: Analyze all synsets for a word to identify different senses.

Example: Understanding different senses of "bank"
`);

    // Get different senses of "bank"
    console.log('\n🏦 Analyzing "bank" senses...');
    const bankWords = await words('bank');
    console.log(`Found ${bankWords.length} word forms for "bank"`);
    
    const bankSynsets = await synsets('bank');
    console.log(`Found ${bankSynsets.length} synsets for "bank"`);
    
    // Group by part of speech
    const bankByPOS = {};
    bankSynsets.forEach(synset => {
      const pos = synset.partOfSpeech;
      if (!bankByPOS[pos]) bankByPOS[pos] = [];
      bankByPOS[pos].push(synset);
    });
    
    Object.entries(bankByPOS).forEach(([pos, synsets]) => {
      console.log(`\n📚 ${pos.toUpperCase()} senses (${synsets.length}):`);
      synsets.slice(0, 3).forEach((synset, index) => {
        console.log(`  ${index + 1}. ${synset.id} (${synset.members.length} members)`);
        console.log(`     ILI: ${synset.ili}`);
        console.log(`     Sample: ${synset.members.slice(0, 3).join(', ')}`);
      });
    });

    console.log(`
🔍 SECTION 4: Lexical Database Exploration
==========================================

Problem: You want to understand what linguistic resources are available in the database.
Solution: Explore lexicons and their metadata.

Example: Discovering available WordNet projects
`);

    // Get available lexicons
    console.log('\n📖 Exploring available lexicons...');
    const availableLexicons = await lexicons();
    console.log(`Found ${availableLexicons.length} lexicons:`);
    
    availableLexicons.forEach((lexicon, index) => {
      console.log(`\n📚 Lexicon ${index + 1}:`);
      console.log(`  ID: ${lexicon.id}`);
      console.log(`  Label: ${lexicon.label}`);
      console.log(`  Language: ${lexicon.language}`);
      console.log(`  Version: ${lexicon.version}`);
      console.log(`  License: ${lexicon.license}`);
      console.log(`  URL: ${lexicon.url}`);
    });

    console.log(`
🔍 SECTION 5: Advanced Word Analysis
====================================

Problem: You need to analyze complex words with multiple meanings and forms.
Solution: Comprehensive word analysis using multiple API functions.

Example: Analyzing "light" with its many meanings
`);

    // Advanced analysis of "light"
    console.log('\n💡 Analyzing "light" comprehensively...');
    const lightWords = await words('light');
    const lightSynsets = await synsets('light');
    const lightSenses = await senses('light');
    
    console.log(`📝 Word forms: ${lightWords.length}`);
    console.log(`📚 Synsets: ${lightSynsets.length}`);
    console.log(`🎯 Senses: ${lightSenses.length}`);
    
    // Show different parts of speech
    const lightByPOS = {};
    lightSynsets.forEach(synset => {
      const pos = synset.partOfSpeech;
      if (!lightByPOS[pos]) lightByPOS[pos] = [];
      lightByPOS[pos].push(synset);
    });
    
    console.log('\n💡 Light by part of speech:');
    Object.entries(lightByPOS).forEach(([pos, synsets]) => {
      console.log(`  ${pos.toUpperCase()}: ${synsets.length} synsets`);
    });

    console.log(`
🔍 SECTION 6: Database Statistics and Coverage
==============================================

Problem: You need to understand the scope and quality of the WordNet database.
Solution: Analyze database statistics and content coverage.

Example: Database overview and statistics
`);

    // Get overall statistics
    console.log('\n📊 Database Statistics:');
    const allWords = await words();
    const allSynsets = await synsets();
    const allSenses = await senses();
    const allILIs = await ilis();
    const allLexicons = await lexicons();

    console.log(`  📝 Total words: ${allWords.length}`);
    console.log(`  📚 Total synsets: ${allSynsets.length}`);
    console.log(`  🎯 Total senses: ${allSenses.length}`);
    console.log(`  🌍 Total ILI entries: ${allILIs.length}`);
    console.log(`  📖 Total lexicons: ${allLexicons.length}`);

    // Show lexicon breakdown
    console.log('\n📖 Lexicon Breakdown:');
    allLexicons.forEach(lexicon => {
      console.log(`  • ${lexicon.label} (${lexicon.language}): ${lexicon.version}`);
    });

    // Analyze data quality
    console.log('\n🔍 Data Quality Analysis:');
    const synsetsWithILI = allSynsets.filter(synset => synset.ili);
    const synsetsWithoutILI = allSynsets.filter(synset => !synset.ili);
    
    console.log(`  🌍 Synsets with ILI: ${synsetsWithILI.length}`);
    console.log(`  ❌ Synsets without ILI: ${synsetsWithoutILI.length}`);
    
    if (allSynsets.length > 0) {
      const iliCoverage = ((synsetsWithILI.length / allSynsets.length) * 100).toFixed(2);
      console.log(`  📊 ILI coverage: ${iliCoverage}%`);
    }

    console.log(`
🔍 SECTION 7: Practical Applications
====================================

Problem: You need to demonstrate real-world applications of WordNet.
Solution: Show practical use cases with concrete examples.

Example: Building a multilingual dictionary lookup system
`);

    // Practical application: Multilingual lookup
    console.log('\n🌐 Multilingual Dictionary Lookup Example:');
    
    const testWords = ['computer', 'information', 'happy', 'run'];
    for (const word of testWords) {
      console.log(`\n🔍 "${word}" analysis:`);
      
      const wordEntries = await words(word);
      const synsetEntries = await synsets(word);
      
      console.log(`  📝 Word forms: ${wordEntries.length}`);
      console.log(`  📚 Synsets: ${synsetEntries.length}`);
      
      if (synsetEntries.length > 0) {
        const firstSynset = synsetEntries[0];
        console.log(`  🌍 First synset ILI: ${firstSynset.ili}`);
        
        if (firstSynset.ili) {
          const iliEntry = await ili(firstSynset.ili);
          if (iliEntry) {
            console.log(`  📖 Definition: ${iliEntry.definition.substring(0, 80)}...`);
          }
        }
      }
    }

    console.log(`
🎉 Kitchen Sink Demo Completed!

💡 Key Insights:
   • WordNet provides comprehensive lexical data with cross-language mapping
   • ILI enables multilingual concept linking across 117,659+ concepts
   • Synsets group related words by meaning for disambiguation
   • Multiple lexicons provide diverse linguistic resources
   • Database contains extensive coverage for practical NLP applications

🚀 Practical Applications Demonstrated:
   • Multilingual dictionary systems
   • Word sense disambiguation
   • Cross-language information retrieval
   • Lexical database development
   • Natural language understanding systems
   • Computational linguistics research

📊 Final Statistics:
   • Words analyzed: ${computerWords.length + bankWords.length + lightWords.length}
   • Synsets explored: ${computerSynsets.length + bankSynsets.length + lightSynsets.length}
   • ILI entries available: ${iliEntries.length}
   • Lexicons available: ${allLexicons.length}

🚀 WordNet is ready for real-world applications!
`);

    // Close the database
    await db.close();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Kitchen sink demo failed:', error.message);
    try { 
      await db.close(); 
      console.log('✅ Database connection closed after error');
    } catch (closeError) {
      console.error('⚠️  Error closing database:', closeError.message);
    }
  }
}

// Run the kitchen sink demo
runKitchenSinkDemo().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 