#!/usr/bin/env node

/**
 * Use Case: Word Sense Disambiguation
 *
 * Showcases how to analyze and disambiguate polysemous words using synsets, definitions, and context.
 * Focus: Short, clear demonstration of WSD functionality.
 */

import { synsets } from 'wn-ts';
import { createWordnet, displaySynsetsByPOS, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🎯 Use Case 6: Word Sense Disambiguation (Short)
================================================

Problem: You need to understand the different meanings of a polysemous word.
Solution: Analyze synsets with definitions and examples.

Real-world application: Natural language processing, text analysis
`);

async function demonstrateWordSenseDisambiguation() {
  const wordnet = createWordnet('disambiguation_short');
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Example 1: "bank" - Classic Polysemy
=======================================`);

    const bankSynsets = await synsets('bank');
    displaySynsetsByPOS(bankSynsets, 'Bank senses');

    console.log(`
🔍 Example 2: "light" - Complex Polysemy
========================================`);

    const lightSynsets = await synsets('light');
    displaySynsetsByPOS(lightSynsets, 'Light senses');

    console.log(`
🔍 Example 3: Context-Based Sense Selection
==========================================`);

    const contexts = [
      { word: 'bank', context: 'I went to the bank to deposit money', pos: 'n' },
      { word: 'bank', context: 'The plane will bank to the left', pos: 'v' },
      { word: 'light', context: 'The light is too bright', pos: 'n' },
      { word: 'light', context: 'She is light on her feet', pos: 'a' }
    ];

    for (const { word, context, pos } of contexts) {
      console.log(`\n📝 Context: "${context}"`);
      console.log(`🔍 Word: "${word}" (expected POS: ${pos})`);

      const wordSynsets = await synsets(word, pos);
      console.log(`📚 Found ${wordSynsets.length} ${pos} synsets`);

      if (wordSynsets.length > 0) {
        const firstSynset = wordSynsets[0];
        console.log(`🏷️  First synset: ${firstSynset.id}`);
        console.log(`👥 Members: ${firstSynset.members.join(", ")}`);
        
        if (firstSynset.definitions && firstSynset.definitions.length > 0) {
          console.log(`📖 Definition: ${firstSynset.definitions[0].text}`);
        }
      }
    }

    console.log(`
🎉 Word Sense Disambiguation Demo Completed!

💡 Key Insights:
   • Polysemous words have multiple synsets with different meanings
   • Part-of-speech tagging helps narrow down relevant senses
   • Context can be used to select the most appropriate sense
   • Definitions and examples provide crucial disambiguation context

🚀 Practical Applications:
   • Natural language processing systems
   • Text analysis and understanding
   • Machine translation sense selection
   • Information retrieval relevance
   • Semantic analysis and reasoning
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Word sense disambiguation demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the word sense disambiguation demo
runDemo(demonstrateWordSenseDisambiguation, 'Word Sense Disambiguation Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 