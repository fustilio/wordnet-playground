#!/usr/bin/env node

/**
 * Use Case 1: Multilingual Word Linking
 * 
 * Problem: You have a list of English words and a list of French words that you want to link together.
 * Solution: Use the Interlingual Index (ILI) to find common concepts across languages.
 * 
 * Real-world application: Building multilingual dictionary systems, cross-language information retrieval
 */

import { 
  words, 
  synsets, 
  ili,
  ilis
} from 'wn-ts';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🌍 Use Case 1: Multilingual Word Linking
========================================

Problem: You have English and French word lists that need to be linked by shared concepts.
Solution: Use ILI (Interlingual Index) to find common concepts across languages.

Real-world application: Building multilingual dictionary systems
`);

async function demonstrateMultilingualLinking() {
  const wordnet = createWordnet('multilingual');
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Example 1: Linking "computer" concepts across languages
=========================================================`);

    // Get English word
    const englishWords = await words('computer', 'n');
    if (englishWords.length > 0) {
      const computerWord = englishWords[0];
      console.log(`📝 English word: ${computerWord.lemma} (${computerWord.partOfSpeech})`);
      
      // Get synsets for this word
      const computerSynsets = await synsets('computer', 'n');
      if (computerSynsets.length > 0) {
        const computerSynset = computerSynsets[0];
        console.log(`📚 Synset ID: ${computerSynset.id}`);
        console.log(`🌍 ILI ID: ${computerSynset.ili}`);
        console.log(`👥 Members: ${computerSynset.members.join(", ")}`);
        
        // Display definition and examples
        await displaySynset(computerSynset, 1);
        
        // Get ILI entry
        const iliEntry = await ili(computerSynset.ili);
        if (iliEntry) {
          console.log(`📖 ILI Definition: ${iliEntry.definition}`);
          console.log(`🏷️  ILI Status: ${iliEntry.status || 'active'}`);
        }
      }
    }

    console.log(`
🔍 Example 2: ILI Database Overview
==================================`);

    // Show ILI statistics
    const iliEntries = await ilis();
    console.log(`📊 Total ILI entries: ${iliEntries.length}`);
    
    // Show sample ILI entries with definitions
    console.log('\n🌐 Sample ILI entries for cross-language mapping:');
    iliEntries.slice(0, 10).forEach((entry, index) => {
      const definition = entry.definition ? entry.definition.substring(0, 60) + '...' : 'No definition';
      console.log(`  ${index + 1}. ${entry.id}: ${definition}`);
    });

    console.log(`
🔍 Example 3: Building a Multilingual Dictionary Lookup
=======================================================`);

    // Demonstrate multilingual lookup for common words
    const commonWords = ['computer', 'information', 'happy', 'run'];
    
    for (const word of commonWords) {
      console.log(`\n🔍 "${word}" multilingual analysis:`);
      
      const wordEntries = await words(word);
      const synsetEntries = await synsets(word);
      
      console.log(`  📝 Word forms: ${wordEntries.length}`);
      console.log(`  📚 Synsets: ${synsetEntries.length}`);
      
      if (synsetEntries.length > 0) {
        const firstSynset = synsetEntries[0];
        console.log(`  🌍 First synset ILI: ${firstSynset.ili}`);
        console.log(`  👥 Members: ${firstSynset.members.join(", ")}`);
        
        // Display definition and examples
        await displaySynset(firstSynset, 1);
        
        if (firstSynset.ili) {
          const iliEntry = await ili(firstSynset.ili);
          if (iliEntry) {
            console.log(`  📖 ILI Definition: ${iliEntry.definition.substring(0, 80)}...`);
          }
        }
      }
    }

    console.log(`
🔍 Example 4: Detailed Cross-Language Concept Analysis
=====================================================`);

    // Show detailed analysis of a specific concept across languages
    console.log('\n🔍 Detailed analysis of "computer" concept:');
    
    const computerSynsets = await synsets('computer');
    console.log(`📚 Found ${computerSynsets.length} synsets for "computer"`);
    
    // Group by part of speech
    const computerByPOS = {};
    computerSynsets.forEach(synset => {
      const pos = synset.partOfSpeech;
      if (!computerByPOS[pos]) computerByPOS[pos] = [];
      computerByPOS[pos].push(synset);
    });
    
    Object.entries(computerByPOS).forEach(([pos, synsets]) => {
      console.log(`\n📚 ${pos.toUpperCase()} senses:`);
      synsets.forEach(async (synset, index) => {
        await displaySynset(synset, index + 1);
      });
    });

    console.log(`
🎉 Multilingual Linking Demo Completed!

💡 Key Insights:
   • ILI provides 117,659+ concepts for cross-language mapping
   • Each synset has a unique ILI identifier for concept linking
   • Definitions are available in ILI entries for concept understanding
   • Multiple lexicons provide diverse linguistic coverage
   • Detailed synset information enables rich cross-language analysis

🚀 Practical Applications:
   • Multilingual dictionary systems
   • Cross-language information retrieval
   • Machine translation concept mapping
   • International NLP applications
   • Global knowledge base linking

📊 Statistics:
   • ILI entries available: ${iliEntries.length}
   • Words analyzed: ${commonWords.length}
   • Synsets explored: ${await Promise.all(commonWords.map(async (word) => {
     const wordSynsets = await synsets(word);
     return wordSynsets.length;
   })).then(lengths => lengths.reduce((acc, len) => acc + len, 0))}
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Multilingual linking demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the multilingual linking demo
runDemo(demonstrateMultilingualLinking, 'Multilingual Word Linking Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
