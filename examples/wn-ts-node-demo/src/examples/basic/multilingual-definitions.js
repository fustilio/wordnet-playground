#!/usr/bin/env node

/**
 * Use Case: Multilingual Definitions
 *
 * Showcases how to retrieve and compare definitions across different languages.
 * Focus: Short, clear demonstration of multilingual definition functionality.
 */

import { ili, download, add } from 'wn-ts-node';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🌍 Use Case: Multilingual Definitions
====================================

Problem: You need to compare how a concept is defined across different languages.
Solution: Query synsets for a concept and display their definitions from multiple lexicons.

Real-world application: Cross-language research, translation validation
`);

async function demonstrateMultilingualDefinitions() {
  const wordnet = await createWordnet('multilingual_basic', { multilingual: true });
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Step 1: Checking Available Lexicons
=====================================`);

    // Get available lexicons
    const availableLexicons = await wordnet.lexicons();
    console.log(`📚 Available lexicons: ${availableLexicons.length}`);
    
    const byLanguage = {};
    availableLexicons.forEach(lexicon => {
      const lang = lexicon.language || 'unknown';
      if (!byLanguage[lang]) byLanguage[lang] = [];
      byLanguage[lang].push(lexicon);
    });
    
    console.log(`\n🌍 Languages available:`);
    Object.entries(byLanguage).forEach(([language, lexicons]) => {
      console.log(`  • ${language}: ${lexicons.length} lexicons`);
      lexicons.forEach(lexicon => {
        console.log(`    - ${lexicon.id}: ${lexicon.label}`);
      });
    });

    console.log(`
🔍 Step 2: "house" Across Multiple Languages
===========================================`);

    // Search for "house" in different languages
    const houseWords = {
      'English': 'house',
      'French': 'maison', 
      'Spanish': 'casa',
      'Italian': 'casa'
    };

    console.log(`\n🏠 Searching for "house" concept in different languages:`);
    
    for (const [language, word] of Object.entries(houseWords)) {
      console.log(`\n📖 ${language} ("${word}"):`);
      try {
        const synsets = await wordnet.synsets(word);
        console.log(`  📚 Found ${synsets.length} synsets`);
        
        if (synsets.length > 0) {
          const firstSynset = synsets[0];
          await displaySynset(firstSynset, 1);
        } else {
          console.log(`  ❌ No synsets found for "${word}"`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error searching for "${word}": ${error.message}`);
      }
    }

    console.log(`
🔍 Step 3: "love" - Emotional Concept Across Languages
=====================================================`);

    // Search for "love" in different languages
    const loveWords = {
      'English': 'love',
      'French': 'amour',
      'Spanish': 'amor', 
      'Italian': 'amore'
    };

    console.log(`\n💕 Searching for "love" concept in different languages:`);
    
    for (const [language, word] of Object.entries(loveWords)) {
      console.log(`\n📖 ${language} ("${word}"):`);
      try {
        const synsets = await wordnet.synsets(word);
        console.log(`  📚 Found ${synsets.length} synsets`);
        
        if (synsets.length > 0) {
          const firstSynset = synsets[0];
          await displaySynset(firstSynset, 1);
        } else {
          console.log(`  ❌ No synsets found for "${word}"`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error searching for "${word}": ${error.message}`);
      }
    }

    console.log(`
🔍 Step 4: "water" Across Multiple Languages
==========================================`);

    // Search for "water" in different languages
    const waterWords = {
      'English': 'water',
      'French': 'eau',
      'Spanish': 'agua',
      'Italian': 'acqua'
    };

    console.log(`\n💧 Searching for "water" concept in different languages:`);
    
    for (const [language, word] of Object.entries(waterWords)) {
      console.log(`\n📖 ${language} ("${word}"):`);
      try {
        const synsets = await wordnet.synsets(word);
        console.log(`  📚 Found ${synsets.length} synsets`);
        
        if (synsets.length > 0) {
          const firstSynset = synsets[0];
          await displaySynset(firstSynset, 1);
        } else {
          console.log(`  ❌ No synsets found for "${word}"`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error searching for "${word}": ${error.message}`);
      }
    }

    console.log(`
🔍 Step 5: ILI Cross-Language Mapping
=====================================`);

    // Show how ILI provides cross-language concept mapping
    console.log(`\n🌍 ILI (Inter-Lingual Index) provides cross-language concept mapping:`);
    
    const waterSynsets = await wordnet.synsets('water');
    if (waterSynsets.length > 0) {
      const firstWaterSynset = waterSynsets[0];
      console.log(`\n💧 "water" synset: ${firstWaterSynset.id}`);
      console.log(`🌍 ILI ID: ${firstWaterSynset.ili}`);
      
      if (firstWaterSynset.ili) {
        try {
          const iliEntry = await ili(firstWaterSynset.ili);
          if (iliEntry && iliEntry.definition) {
            console.log(`📖 ILI Definition: ${iliEntry.definition}`);
            console.log(`🏷️  ILI Status: ${iliEntry.status || 'active'}`);
          }
        } catch (error) {
          console.log(`⚠️  Could not retrieve ILI definition: ${error.message}`);
        }
      }
    }

    console.log(`
🎉 Multilingual Definitions Demo Completed!

💡 Key Insights:
   • Multiple language lexicons can be downloaded and added to the database
   • Different languages may have different numbers of synsets for the same word
   • Definitions can vary significantly across languages
   • ILI provides cross-language concept mapping for true multilingual support
   • Some languages may have more detailed definitions than others
   • ILI entries provide standardized definitions across languages

🚀 Practical Applications:
   • Cross-language research and analysis
   • Translation validation and quality assessment
   • Comparative linguistics studies
   • Multilingual NLP applications
   • Language learning and education
   • ILI-based concept mapping for global knowledge bases

📊 Final Statistics:
   • Available lexicons: ${availableLexicons.length}
   • Languages available: ${Object.keys(byLanguage).length}
   • Concepts compared: 3 (house, love, water)
   • ILI cross-language mapping: ✅
   • Definition comparison: ✅
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Multilingual definitions demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the multilingual definitions demo
runDemo(demonstrateMultilingualDefinitions, 'Multilingual Definitions Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
