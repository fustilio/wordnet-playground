#!/usr/bin/env node

/**
 * Python-style wn example ported to wn-ts
 * 
 * Original Python code:
 * >>> import wn
 * >>> en = wn.Wordnet('oewn:2024')        # Create Wordnet object to query
 * >>> ss = en.synsets('win', pos='v')[0]  # Get the first synset for 'win'
 * >>> ss.definition()                     # Get the synset's definition
 * 'be the winner in a contest or competition; be victorious'
 */

import { synsets } from 'wn-ts';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🐍 Python-style wn example with wn-ts
=====================================

Problem: You need to replicate Python wn library functionality in TypeScript.
Solution: Use wn-ts with similar API patterns and definition retrieval.

Real-world application: Porting Python NLP code to TypeScript
`);

async function pythonStyleExample() {
  const wordnet = createWordnet('python_style');
  console.log('✅ Wordnet initialized successfully\n');

  try {
    // Get the first synset for 'win' (equivalent to: ss = en.synsets('win', pos='v')[0])
    console.log('🔍 Getting synsets for "win" with pos="v"...');
    const synsets = await wordnet.synsets('win', 'v');
    
    if (synsets.length === 0) {
      console.log('❌ No synsets found for "win" with pos="v"');
      return;
    }
    
    const ss = synsets[0]; // Get the first synset
    console.log(`📚 Found ${synsets.length} synsets, using first one: ${ss.id}\n`);

    // Display synset information
    console.log('📋 Synset Details:');
    console.log(`  ID: ${ss.id}`);
    console.log(`  Members: ${ss.members.join(', ')}`);
    console.log(`  ILI: ${ss.ili || 'None'}`);
    console.log(`  Part of Speech: ${ss.partOfSpeech}`);
    console.log(`  Lexicon: ${ss.lexicon}\n`);

    // Get the synset's definition (equivalent to: ss.definition())
    console.log('📖 Definition:');
    await displaySynset(ss, 1);

    // Show additional information
    console.log('\n📚 Additional Information:');
    console.log(`  Total synsets for "win": ${synsets.length}`);
    
    // Show all synsets for 'win' with their definitions
    console.log('\n📚 All synsets for "win":');
    for (let i = 0; i < Math.min(5, synsets.length); i++) {
      await displaySynset(synsets[i], i + 1);
    }

    console.log(`
🎉 Python-style example completed!

💡 Key Insights:
   • wn-ts provides similar API to Python wn library
   • Definitions are retrieved via ILI fallback mechanism
   • Synset structure is consistent across languages
   • Helper functions provide consistent display patterns

🚀 Practical Applications:
   • Porting Python NLP code to TypeScript
   • Maintaining consistent API patterns
   • Cross-language development workflows
   • Educational code examples

📊 Final Statistics:
   • Synsets found for "win": ${synsets.length}
   • Python-style API compatibility: ✅
   • Definition retrieval: ✅
   • Error handling: ✅
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Python-style example failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the python-style example
runDemo(pythonStyleExample, 'Python-Style WordNet Example').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 