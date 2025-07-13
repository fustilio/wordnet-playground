#!/usr/bin/env node

/**
 * Use Case 2: Word Sense Disambiguation
 *
 * Problem: You need to understand the different meanings of a polysemous word.
 * Solution: Analyze all synsets for a word to identify different senses.
 *
 * Real-world application: Natural language processing, text analysis, semantic understanding
 */

// No direct imports needed from wn-ts, using wordnet instance
import { createWordnet, displaySynsetsByPOS, safeClose, runDemo } from "../shared/helpers.js";

console.log(`
🎯 Use Case: Word Sense Disambiguation (Advanced)
==============================================

Problem: You need to understand the different meanings of a polysemous word.
Solution: Comprehensively analyze all synsets for a word to identify its different senses.

Real-world application: Natural language processing, text analysis, semantic search
`);

async function demonstrateWordSenseDisambiguation() {
  const wordnet = await createWordnet("disambiguation");
  console.log("✅ Wordnet initialized successfully");

  try {
    console.log(`
🔍 Example 1: Analyzing "bank" - A Classic Polysemous Word
==========================================================`);

    // Get different senses of "bank"
    console.log('\n🏦 Analyzing "bank" senses...');
    const bankWords = await wordnet.words("bank");
    console.log(`📝 Found ${bankWords.length} word forms for "bank"`);

    bankWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech})`);
    });

    const bankSynsets = await wordnet.synsets("bank");
    console.log(`\n📚 Found ${bankSynsets.length} synsets for "bank"`);

    // Display detailed synset information with definitions and examples
    await displaySynsetsByPOS(bankSynsets, 'Bank senses');

    console.log(`
🔍 Example 2: Analyzing "light" - Complex Polysemy
=================================================`);

    // Get different senses of "light"
    console.log('\n💡 Analyzing "light" senses...');
    const lightWords = await wordnet.words("light");
    console.log(`📝 Found ${lightWords.length} word forms for "light"`);

    lightWords.forEach((word, index) => {
      console.log(`  ${index + 1}. ${word.lemma} (${word.partOfSpeech})`);
    });

    const lightSynsets = await wordnet.synsets("light");
    console.log(`\n💡 Found ${lightSynsets.length} synsets for "light"`);

    // Show different parts of speech
    const lightByPOS = {};
    lightSynsets.forEach((synset) => {
      const pos = synset.partOfSpeech;
      if (!lightByPOS[pos]) lightByPOS[pos] = [];
      lightByPOS[pos].push(synset);
    });

    console.log("\n💡 Light by part of speech:");
    Object.entries(lightByPOS).forEach(([pos, synsets]) => {
      console.log(`  ${pos.toUpperCase()}: ${synsets.length} synsets`);
    });

    // Show detailed examples from each POS
    await displaySynsetsByPOS(lightSynsets, 'Light senses');

    console.log(`
🔍 Example 3: Building a Sense Disambiguation System
===================================================`);

    // Demonstrate sense disambiguation for multiple words
    const polysemousWords = ["run", "play", "set", "get"];

    for (const word of polysemousWords) {
      console.log(`\n🔍 "${word}" sense analysis:`);

      const wordEntries = await wordnet.words(word);
      const synsetEntries = await wordnet.synsets(word);
      const senseEntries = await wordnet.senses(word);

      console.log(`  📝 Word forms: ${wordEntries.length}`);
      console.log(`  📚 Synsets: ${synsetEntries.length}`);
      console.log(`  🎯 Senses: ${senseEntries.length}`);

      // Group by part of speech
      const byPOS = {};
      synsetEntries.forEach((synset) => {
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
    console.log("\n🎭 Context-based sense selection examples:");

    const contexts = [
      {
        word: "bank",
        context: "I went to the bank to deposit money",
        expectedPOS: "n",
      },
      {
        word: "bank",
        context: "The plane will bank to the left",
        expectedPOS: "v",
      },
      { word: "light", context: "The light is too bright", expectedPOS: "n" },
      { word: "light", context: "She is light on her feet", expectedPOS: "a" },
    ];

    for (const { word, context, expectedPOS } of contexts) {
      console.log(`\n📝 Context: "${context}"`);
      console.log(`🔍 Word: "${word}" (expected POS: ${expectedPOS})`);

      const wordSynsets = await wordnet.synsets(word, expectedPOS);
      console.log(`📚 Found ${wordSynsets.length} ${expectedPOS} synsets`);

      if (wordSynsets.length > 0) {
        const firstSynset = wordSynsets[0];
        console.log(`🏷️  First synset: ${firstSynset.id}`);
        console.log(`👥 Members: ${firstSynset.members.slice(0, 3).join(", ")}`);
        
        // Show definition for context
        if (firstSynset.definitions && firstSynset.definitions.length > 0) {
          console.log(`📖 Definition: ${firstSynset.definitions[0].text}`);
        }
      }
    }

    console.log(`
🎉 Word Sense Disambiguation Demo Completed!

💡 Key Insights:
   • Polysemous words have multiple synsets representing different meanings
   • Part-of-speech tagging helps narrow down relevant senses
   • Context can be used to select the most appropriate sense
   • Rich sense data enables sophisticated NLP applications
   • Definitions and examples provide crucial disambiguation context

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

    await safeClose(wordnet);
  } catch (error) {
    console.error("❌ Word sense disambiguation demo failed:", error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the word sense disambiguation demo
runDemo(demonstrateWordSenseDisambiguation, "Word Sense Disambiguation Demo").catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
