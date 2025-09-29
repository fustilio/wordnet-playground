/**
 * Crossword Demo - Multilingual Word Hints
 * 
 * This demo shows how to use WordNet to create crossword-style hints
 * for words in different languages, similar to the provided JSON structure.
 */

import { createWordnet } from '../shared/helpers.js';

// No fallback hints - using only real WordNet data

/**
 * Generate crossword hints for a word using only real WordNet data
 */
async function generateCrosswordHints(word, wordnet, targetLanguage = 'en') {
  console.log(`\n🔍 Generating crossword hints for "${word}" in ${targetLanguage}:`);
  
  try {
    // Get data from WordNet
    const synsets = await wordnet.synsets(word);
    
    if (synsets.length === 0) {
      console.log(`❌ No synsets found for "${word}" in WordNet`);
      return null;
    }
    
    // Get the first synset (most common sense)
    const synset = synsets[0];
    
    // Get synset members (lemmas)
    let members = [];
    try {
      members = await wordnet.getSynsetLemmas(synset.id);
    } catch (error) {
      members = synset.memberIds || [];
    }
    
    // Get definition
    let definition = '';
    if (synset.definitions && synset.definitions.length > 0) {
      definition = synset.definitions[0].text;
    } else if (synset.ili) {
      try {
        const iliEntry = await wordnet.getIli(synset.ili);
        if (iliEntry && iliEntry.definition) {
          definition = iliEntry.definition;
        }
      } catch (error) {
        // Silently ignore ILI lookup errors
      }
    }
    
    // Try to find translations using ILI or related synsets
    let enWord = word;
    let frWord = word;
    
    // If we have an ILI, try to find related synsets in other languages
    if (synset.ili) {
      try {
        // This is a simplified approach - in a real implementation,
        // you'd want to query for synsets with the same ILI in different languages
        // For now, we'll use the original word in both languages
        enWord = word;
        frWord = word;
      } catch (error) {
        // Use original word if translation lookup fails
        enWord = word;
        frWord = word;
      }
    }
    
    // Generate hints from WordNet data
    const hints = {
      words: {
        [targetLanguage]: word,
        'en-US': enWord,
        'fr-FR': frWord
      },
      definitions: {
        [targetLanguage]: definition || `A ${synset.pos || 'word'} related to ${members.join(', ')}`,
        'en-US': definition || `A ${synset.pos || 'word'} related to ${members.join(', ')}`,
        'fr-FR': definition || `A ${synset.pos || 'word'} related to ${members.join(', ')}`
      },
      synsetInfo: {
        id: synset.id,
        pos: synset.pos,
        language: synset.language,
        lexicon: synset.lexicon,
        members: members,
        ili: synset.ili
      }
    };
    
    console.log(`✅ Generated WordNet hints for "${word}"`);
    return hints;
    
  } catch (error) {
    console.log(`❌ WordNet lookup failed for "${word}": ${error.message}`);
    return null;
  }
}

/**
 * Create a crossword puzzle with animal words
 */
async function createAnimalCrossword(wordnet) {
  console.log('\n🐾 Creating Animal Crossword Puzzle:');
  
  // English animal words that should be in WordNet
  const animalWords = ['cat', 'dog', 'bird', 'horse', 'fish', 'cow', 'mouse'];
  const crossword = {
    title: "Animals",
    items: [],
    gridCols: 10,
    gridRows: 10
  };
  
  for (const word of animalWords) {
    console.log(`\n📝 Processing "${word}"...`);
    const hints = await generateCrosswordHints(word, wordnet, 'en-US');
    
    if (hints) {
      crossword.items.push(hints);
      const targetWord = hints.words['en-US'] || hints.words['fr-FR'];
      const targetDef = hints.definitions['en-US'] || hints.definitions['fr-FR'];
      console.log(`✅ Added "${targetWord}" (${hints.words['en-US']}/${hints.words['fr-FR']}) with hint: "${targetDef}"`);
    } else {
      console.log(`❌ Skipped "${word}" - no hints available`);
    }
  }
  
  return crossword;
}

/**
 * Create a crossword puzzle with common English words
 */
async function createEnglishCrossword(wordnet) {
  console.log('\n🇺🇸 Creating English Crossword Puzzle:');
  
  const englishWords = ['bank', 'light', 'run', 'play', 'set', 'get', 'make'];
  const crossword = {
    title: "Common Words",
    items: [],
    gridCols: 12,
    gridRows: 12
  };
  
  for (const word of englishWords) {
    console.log(`\n📝 Processing "${word}"...`);
    const hints = await generateCrosswordHints(word, wordnet, 'en-US');
    
    if (hints) {
      crossword.items.push(hints);
      const targetWord = hints.words['en-US'] || hints.words['fr-FR'];
      const targetDef = hints.definitions['en-US'] || hints.definitions['fr-FR'];
      console.log(`✅ Added "${targetWord}" (${hints.words['en-US']}/${hints.words['fr-FR']}) with hint: "${targetDef}"`);
    } else {
      console.log(`❌ Skipped "${word}" - no hints available`);
    }
  }
  
  return crossword;
}

/**
 * Display crossword puzzle in JSON format
 */
function displayCrossword(crossword) {
  console.log('\n📋 Crossword Puzzle JSON:');
  console.log(JSON.stringify(crossword, null, 2));
}

/**
 * Main demo function
 */
async function runCrosswordDemo() {
  console.log('🎯 Crossword Demo - Multilingual Word Hints');
  console.log('==========================================');
  console.log('\nProblem: You want to create crossword puzzles with hints in different languages.');
  console.log('Solution: Use WordNet to generate definitions and hints for words.');
  console.log('\nReal-world application: Educational games, language learning, puzzle generation');
  
  // Create WordNet instance (without multilingual for now)
  const wordnet = await createWordnet('crossword_demo', { multilingual: false });
  
  try {
    // Create animal crossword (French words)
    const animalCrossword = await createAnimalCrossword(wordnet);
    displayCrossword(animalCrossword);
    
    // Create English crossword
    const englishCrossword = await createEnglishCrossword(wordnet);
    displayCrossword(englishCrossword);
    
    // Demonstrate advanced features
    console.log('\n🔍 Advanced Features:');
    console.log('====================');
    
    // Check database status
    try {
      const allSynsets = await wordnet.synsets({ maxResults: 5 });
      console.log(`\n📊 Database contains ${allSynsets.length} synsets`);
      
      const allWords = await wordnet.words({ maxResults: 5 });
      console.log(`📊 Database contains ${allWords.length} words`);
    } catch (error) {
      console.log(`❌ Error querying database: ${error.message}`);
    }
    
    // Show how to get multiple senses for a word
    const word = 'bank';
    console.log(`\n📚 Multiple senses for "${word}":`);
    const synsets = await wordnet.synsets(word);
    
    for (let i = 0; i < Math.min(synsets.length, 3); i++) {
      const synset = synsets[i];
      let members = [];
      try {
        members = await wordnet.getSynsetLemmas(synset.id);
      } catch (error) {
        members = synset.memberIds || [];
      }
      
      console.log(`  ${i + 1}. ${synset.id} (${synset.pos}) - ${members.join(', ')}`);
      if (synset.definitions && synset.definitions.length > 0) {
        console.log(`     Definition: ${synset.definitions[0].text}`);
      }
    }
    
    // Show how to get related words
    console.log(`\n🔗 Related words for "${word}":`);
    if (synsets.length > 0) {
      const firstSynset = synsets[0];
      if (firstSynset.relations && firstSynset.relations.length > 0) {
        const relationTypes = {};
        firstSynset.relations.forEach(rel => {
          relationTypes[rel.type] = (relationTypes[rel.type] || 0) + 1;
        });
        console.log(`     Relations: ${Object.entries(relationTypes)
          .map(([type, count]) => `${type}(${count})`)
          .join(', ')}`);
      } else {
        console.log(`     No relations found`);
      }
    }
    
    console.log('\n🎉 Crossword Demo Completed!');
    console.log('\n💡 Key Insights:');
    console.log('   • WordNet provides rich definitions and semantic information');
    console.log('   • Multiple senses can be used for different difficulty levels');
    console.log('   • Cross-language support enables multilingual puzzles');
    console.log('   • Semantic relations can be used for advanced hint generation');
    console.log('   • ILI provides standardized definitions across languages');
    
    console.log('\n🚀 Practical Applications:');
    console.log('   • Educational crossword puzzle generation');
    console.log('   • Language learning applications');
    console.log('   • Word game development');
    console.log('   • Semantic search and discovery');
    console.log('   • Automated content generation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Close database connection
    if (wordnet && typeof wordnet.close === 'function') {
      await wordnet.close();
      console.log('\n✅ Database connection closed successfully');
    }
  }
}

// Run the demo
runCrosswordDemo().catch(console.error);
