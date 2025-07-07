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
  Wordnet,
  words, 
  synsets, 
  ili,
  ilis
} from 'wn-ts';
import { join } from 'path';
import { homedir } from 'os';

console.log(`
🌍 Use Case 1: Multilingual Word Linking
========================================

Problem: You have English and French word lists that need to be linked by shared concepts.
Solution: Use ILI (Interlingual Index) to find common concepts across languages.

Real-world application: Building multilingual dictionary systems
`);

// Use a dedicated data directory for this demo
const dataDirectory = join(homedir(), '.wn_multilingual_demo');
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

async function demonstrateMultilingualLinking() {
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
        
        // Display definition
        if (computerSynset.definitions && computerSynset.definitions.length > 0) {
          console.log(`📖 Definition: ${computerSynset.definitions[0].text}`);
        }
        
        // Display examples
        if (computerSynset.examples && computerSynset.examples.length > 0) {
          console.log(`💡 Examples:`);
          computerSynset.examples.forEach((example, index) => {
            console.log(`  ${index + 1}. "${example.text}"`);
          });
        }
        
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
        
        // Display definition
        if (firstSynset.definitions && firstSynset.definitions.length > 0) {
          console.log(`  📖 Definition: ${firstSynset.definitions[0].text}`);
        }
        
        // Display examples
        if (firstSynset.examples && firstSynset.examples.length > 0) {
          console.log(`  💡 Examples:`);
          firstSynset.examples.slice(0, 2).forEach((example, index) => {
            console.log(`    ${index + 1}. "${example.text}"`);
          });
        }
        
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
      synsets.forEach((synset, index) => {
        console.log(`\n  ${index + 1}. ${synset.id}`);
        console.log(`     Members: ${synset.members.join(", ")}`);
        console.log(`     ILI: ${synset.ili || 'None'}`);
        
        // Display definition
        if (synset.definitions && synset.definitions.length > 0) {
          console.log(`     Definition: ${synset.definitions[0].text}`);
        }
        
        // Display examples
        if (synset.examples && synset.examples.length > 0) {
          console.log(`     Examples:`);
          synset.examples.forEach((example, exIndex) => {
            console.log(`       ${exIndex + 1}. "${example.text}"`);
          });
        }
        
        // Display relations
        if (synset.relations && synset.relations.length > 0) {
          const relationTypes = {};
          synset.relations.forEach(rel => {
            relationTypes[rel.type] = (relationTypes[rel.type] || 0) + 1;
          });
          const relationSummary = Object.entries(relationTypes)
            .map(([type, count]) => `${type}(${count})`)
            .join(", ");
          console.log(`     Relations: ${relationSummary}`);
        }
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

    // Close the database using Wordnet instance method
    await wordnet.close();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Multilingual linking demo failed:', error.message);
    try { 
      await wordnet.close(); 
      console.log('✅ Database connection closed after error');
    } catch (closeError) {
      console.error('⚠️  Error closing database:', closeError.message);
    }
  }
}

// Run the multilingual linking demo
demonstrateMultilingualLinking().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
