#!/usr/bin/env node

/**
 * Use Case 2: Word Sense Disambiguation
 * 
 * Problem: You need to understand the different meanings of a polysemous word.
 * Solution: Analyze all synsets for a word to identify different senses.
 * 
 * Real-world application: Natural language processing, text analysis, semantic understanding
 */

import { 
  Wordnet, 
  words, 
  synsets, 
  senses
} from 'wn-ts';
import { join } from 'path';
import { homedir } from 'os';

console.log(`
🎯 Use Case 2: Word Sense Disambiguation
========================================

Problem: You need to understand the different meanings of a polysemous word.
Solution: Analyze all synsets for a word to identify different senses.

Real-world application: Natural language processing, text analysis
`);

// Use a dedicated data directory for this demo
const dataDirectory = join(homedir(), '.wn_disambiguation_demo');
console.log(`📁 Using data directory: ${dataDirectory}`);

// Initialize Wordnet
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

async function demonstrateWordSenseDisambiguation() {
  try {
    console.log(`
🔍 Example 1: Analyzing "bank" - A Classic Polysemous Word
==========================================================`);

    // Get different senses of "bank"
    console.log('\n🏦 Analyzing "bank" senses...');
    const bankWords = await words('bank');
    console.log(`📝 Found ${bankWords.length} word forms for "bank"`);
    
    bankWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech})`);
    });

    const bankSynsets = await synsets('bank');
    console.log(`\n📚 Found ${bankSynsets.length} synsets for "bank"`);
    
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
🔍 Example 2: Analyzing "light" - Complex Polysemy
=================================================`);

    // Get different senses of "light"
    console.log('\n💡 Analyzing "light" senses...');
    const lightWords = await words('light');
    console.log(`📝 Found ${lightWords.length} word forms for "light"`);
    
    lightWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech})`);
    });

    const lightSynsets = await synsets('light');
    console.log(`\n💡 Found ${lightSynsets.length} synsets for "light"`);
    
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

    // Show some examples from each POS
    Object.entries(lightByPOS).forEach(([pos, synsets]) => {
      console.log(`\n💡 ${pos.toUpperCase()} examples:`);
      synsets.slice(0, 2).forEach((synset, index) => {
        console.log(`  ${index + 1}. ${synset.id} (${synset.members.length} members)`);
        console.log(`     ILI: ${synset.ili}`);
        console.log(`     Sample: ${synset.members.slice(0, 3).join(', ')}`);
      });
    });

    console.log(`
🔍 Example 3: Building a Sense Disambiguation System
===================================================`);

    // Demonstrate sense disambiguation for multiple words
    const polysemousWords = ['run', 'play', 'set', 'get'];
    
    for (const word of polysemousWords) {
      console.log(`\n🔍 "${word}" sense analysis:`);
      
      const wordEntries = await words(word);
      const synsetEntries = await synsets(word);
      const senseEntries = await senses(word);
      
      console.log(`  📝 Word forms: ${wordEntries.length}`);
      console.log(`  📚 Synsets: ${synsetEntries.length}`);
      console.log(`  🎯 Senses: ${senseEntries.length}`);
      
      // Group by part of speech
      const byPOS = {};
      synsetEntries.forEach(synset => {
        const pos = synset.partOfSpeech;
        if (!byPOS[pos]) byPOS[pos] = [];
        byPOS[pos].push(synset);
      });
      
      Object.entries(byPOS).forEach(([pos, synsets]) => {
        console.log(`    ${pos.toUpperCase()}: ${synsets.length} senses`);
      });
    }

    console.log(`
🔍 Example 4: Context-Based Sense Selection
==========================================`);

    // Demonstrate how context could help select the right sense
    console.log('\n🎭 Context-based sense selection examples:');
    
    const contexts = [
      { word: 'bank', context: 'I went to the bank to deposit money', expectedPOS: 'n' },
      { word: 'bank', context: 'The plane will bank to the left', expectedPOS: 'v' },
      { word: 'light', context: 'The light is too bright', expectedPOS: 'n' },
      { word: 'light', context: 'She is light on her feet', expectedPOS: 'a' }
    ];
    
    for (const { word, context, expectedPOS } of contexts) {
      console.log(`\n📝 Context: "${context}"`);
      console.log(`🔍 Word: "${word}" (expected POS: ${expectedPOS})`);
      
      const wordSynsets = await synsets(word, expectedPOS);
      console.log(`📚 Found ${wordSynsets.length} ${expectedPOS} synsets`);
      
      if (wordSynsets.length > 0) {
        const firstSynset = wordSynsets[0];
        console.log(`🏷️  First synset: ${firstSynset.id}`);
        console.log(`👥 Members: ${firstSynset.members.slice(0, 3).join(', ')}`);
      }
    }

    console.log(`
🎉 Word Sense Disambiguation Demo Completed!

💡 Key Insights:
   • Polysemous words have multiple synsets representing different meanings
   • Part-of-speech tagging helps narrow down relevant senses
   • Context can be used to select the most appropriate sense
   • Rich sense data enables sophisticated NLP applications

🚀 Practical Applications:
   • Natural language processing systems
   • Text analysis and understanding
   • Machine translation sense selection
   • Information retrieval relevance
   • Semantic analysis and reasoning

📊 Statistics:
   • "bank" has ${bankSynsets.length} different senses
   • "light" has ${lightSynsets.length} different senses
   • Words analyzed: ${polysemousWords.length}
   • Total synsets explored: ${bankSynsets.length + lightSynsets.length}
`);

    // Close the database using Wordnet instance method
    await wordnet.close();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Word sense disambiguation demo failed:', error.message);
    try { 
      await wordnet.close(); 
      console.log('✅ Database connection closed after error');
    } catch (closeError) {
      console.error('⚠️  Error closing database:', closeError.message);
    }
  }
}

// Run the word sense disambiguation demo
demonstrateWordSenseDisambiguation().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
