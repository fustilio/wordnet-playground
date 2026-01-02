/**
 * Example: Using Language-Pair Dictionaries
 *
 * This example demonstrates how to use language-pair dictionaries
 * for memory-efficient serverless deployments.
 */

import { Wordnet } from 'wn-ts-node';
import { generateLanguagePair, PRESETS, createESModule } from '../src/generators/index.js';
import { writeFileSync } from 'fs';

async function demonstrateLanguagePairs() {
  console.log(`
🌍 Language-Pair Dictionary Generation Demo
==========================================
`);

  // Initialize WordNet
  const wordnet = new Wordnet('*');
  console.log('✅ WordNet initialized\n');

  // Example 1: Generate English-Thai dictionary
  console.log('📖 Example 1: English-Thai Dictionary');
  console.log('=====================================\n');

  const enThDict = await generateLanguagePair(wordnet, 'en', 'th', {
    limit: 100,
    pos: ['n', 'v']
  });

  console.log(`✅ Generated EN-TH dictionary:`);
  console.log(`   - Synsets: ${enThDict.m.c}`);
  console.log(`   - Words: ${enThDict.m.w}`);
  console.log(`   - Languages: ${enThDict.m.langs?.join(', ')}`);
  console.log(`   - Size: ${(JSON.stringify(enThDict).length / 1024).toFixed(1)} KB\n`);

  // Save as ES module
  const enThModule = createESModule(enThDict, 'dict-en-th');
  writeFileSync('dict-en-th.js', enThModule);
  console.log('💾 Saved to dict-en-th.js\n');

  // Example 2: Generate English-French dictionary
  console.log('📖 Example 2: English-French Dictionary');
  console.log('=======================================\n');

  const enFrDict = await generateLanguagePair(wordnet, 'en', 'fr', {
    limit: 100,
    pos: ['n', 'v']
  });

  console.log(`✅ Generated EN-FR dictionary:`);
  console.log(`   - Synsets: ${enFrDict.m.c}`);
  console.log(`   - Words: ${enFrDict.m.w}`);
  console.log(`   - Languages: ${enFrDict.m.langs?.join(', ')}`);
  console.log(`   - Size: ${(JSON.stringify(enFrDict).length / 1024).toFixed(1)} KB\n`);

  const enFrModule = createESModule(enFrDict, 'dict-en-fr');
  writeFileSync('dict-en-fr.js', enFrModule);
  console.log('💾 Saved to dict-en-fr.js\n');

  // Example 3: Generate Thai-French dictionary
  console.log('📖 Example 3: Thai-French Dictionary');
  console.log('====================================\n');

  const thFrDict = await generateLanguagePair(wordnet, 'th', 'fr', {
    limit: 100,
    pos: ['n', 'v']
  });

  console.log(`✅ Generated TH-FR dictionary:`);
  console.log(`   - Synsets: ${thFrDict.m.c}`);
  console.log(`   - Words: ${thFrDict.m.w}`);
  console.log(`   - Languages: ${thFrDict.m.langs?.join(', ')}`);
  console.log(`   - Size: ${(JSON.stringify(thFrDict).length / 1024).toFixed(1)} KB\n`);

  const thFrModule = createESModule(thFrDict, 'dict-th-fr');
  writeFileSync('dict-th-fr.js', thFrModule);
  console.log('💾 Saved to dict-th-fr.js\n');

  // Example 4: Using presets
  console.log('📖 Example 4: Using Presets');
  console.log('===========================\n');

  console.log('Available language-pair presets:');
  Object.entries(PRESETS).forEach(([name, config]) => {
    if (config.languages.length === 2) {
      console.log(`  - ${name.padEnd(15)}: ${config.description}`);
    }
  });

  console.log('\n🎉 Language-Pair Generation Complete!\n');

  console.log('💡 Key Benefits:');
  console.log('   ✓ Smaller file sizes (only 2 languages per file)');
  console.log('   ✓ Lower memory usage in serverless');
  console.log('   ✓ Faster cold starts');
  console.log('   ✓ Import only what you need');
  console.log('   ✓ Bidirectional translations (en→th and th→en)\n');

  console.log('📚 Usage in Serverless Function:');
  console.log(`
// Import only the language pair you need
import { lookup, translate } from './dict-en-th.js';

// Lookup English word
const results = lookup('computer', 'en');
console.log(results); // Thai translations via ILI

// Translate English to Thai
const thaiWords = translate('computer', 'en', 'th');
console.log(thaiWords); // ['คอมพิวเตอร์']

// Bidirectional: Thai to English
const englishWords = translate('คอมพิวเตอร์', 'th', 'en');
console.log(englishWords); // ['computer']
`);

  // Close WordNet
  if (typeof wordnet.close === 'function') {
    await wordnet.close();
  }
}

// Run the demo
demonstrateLanguagePairs().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
