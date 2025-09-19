#!/usr/bin/env node

/**
 * Kitchen Sink Demo: Comprehensive feature showcase for wn-ts.
 * This file demonstrates all major features, not necessarily as a single use case.
 */

import { 
  projects, 
  ilis,
  download,
  add,
  word,
  synset,
  ili
} from 'wn-ts-node';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🚀 WordNet Kitchen Sink Demo
============================

🎯 Comprehensive demonstration with realistic problem statements
`);

async function runKitchenSinkDemo() {
  const wordnet = await createWordnet('kitchen_sink', { multilingual: true });
  console.log('✅ Wordnet initialized successfully');

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
    const computerWords = await wordnet.words('computer');
    console.log(`Found ${computerWords.length} word forms for "computer"`);
    
    computerWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech}) - ${word.lexicon}`);
    });

    // Get synsets for computer
    console.log('\n📚 Getting synsets for "computer"...');
    const computerSynsets = await wordnet.synsets('computer');
    console.log(`Found ${computerSynsets.length} synsets for "computer"`);
    
    computerSynsets.slice(0, 3).forEach(async (synset, index) => {
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
    const allILIs = await ilis();
    console.log(`Total ILI entries: ${allILIs.length}`);
    
    // Show sample ILI entries
    console.log('\n🌐 Sample ILI entries:');
    allILIs.slice(0, 5).forEach((entry, index) => {
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
    const bankWords = await wordnet.words('bank');
    console.log(`Found ${bankWords.length} word forms for "bank"`);
    
    const bankSynsets = await wordnet.synsets('bank');
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
      synsets.slice(0, 3).forEach(async (synset, index) => {
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
    const allLexicons = await wordnet.lexicons();
    console.log(`Found ${allLexicons.length} lexicons:`);
    
    allLexicons.forEach((lexicon, index) => {
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
    const lightWords = await wordnet.words('light');
    const lightSynsets = await wordnet.synsets('light');
    const lightSenses = await wordnet.senses('light');
    
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
    const stats = await wordnet.getStatistics();
    const allILIs = await ilis();
    const allLexicons = await wordnet.lexicons();

    console.log(`  📝 Total words: ${stats.totalWords}`);
    console.log(`  📚 Total synsets: ${stats.totalSynsets}`);
    console.log(`  🎯 Total senses: ${stats.totalSenses}`);
    console.log(`  🌍 Total ILI entries: ${stats.totalILIs}`);
    console.log(`  📖 Total lexicons: ${stats.totalLexicons}`);

    // Show lexicon breakdown
    console.log('\n📖 Lexicon Breakdown:');
    allLexicons.forEach(lexicon => {
      console.log(`  • ${lexicon.label} (${lexicon.language}): ${lexicon.version}`);
    });

    // Analyze data quality
    console.log('\n🔍 Data Quality Analysis:');
    const qualityMetrics = await wordnet.getDataQualityMetrics();
    
    console.log(`  🌍 Synsets with ILI: ${qualityMetrics.synsetsWithILI}`);
    console.log(`  ❌ Synsets without ILI: ${qualityMetrics.synsetsWithoutILI}`);
    
    if (stats.totalSynsets > 0) {
      const iliCoverage = ((qualityMetrics.synsetsWithILI / stats.totalSynsets) * 100).toFixed(2);
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
      
      const wordEntries = await wordnet.words(word);
      const synsetEntries = await wordnet.synsets(word);
      
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
   • ILI entries available: ${allILIs.length}
   • Lexicons available: ${allLexicons.length}

🚀 WordNet is ready for real-world applications!
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Kitchen sink demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the kitchen sink demo
runDemo(runKitchenSinkDemo, 'Kitchen Sink Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
