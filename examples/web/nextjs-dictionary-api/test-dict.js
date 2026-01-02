#!/usr/bin/env node

/**
 * Test script to verify dictionary contents and debug empty translations
 */

import { readFileSync, existsSync } from 'fs';

const dictFiles = [
  { name: 'dict-en-th.js', pair: 'en-th' },
  { name: 'dict-en-fr.js', pair: 'en-fr' },
  { name: 'dict-th-fr.js', pair: 'th-fr' }
];

const testWords = [
  { word: 'hello', lang: 'en' },
  { word: 'computer', lang: 'en' },
  { word: 'water', lang: 'en' },
  { word: 'love', lang: 'en' },
  { word: 'person', lang: 'en' },
  { word: 'time', lang: 'en' }
];

console.log('\n🔍 Testing Dictionary Files\n');
console.log('='.repeat(60));

for (const { name, pair } of dictFiles) {
  console.log(`\n📖 Testing ${name} (${pair})`);
  console.log('-'.repeat(60));

  if (!existsSync(name)) {
    console.log(`❌ File not found: ${name}`);
    console.log(`   Run: wn-dict-export ${pair} ${name.replace('.js', '')}`);
    continue;
  }

  try {
    // Dynamically import the dictionary module
    const dictModule = await import(`./${name}`);
    const { lookup, translate, meta, languages } = dictModule;

    console.log(`✅ File loaded successfully`);
    console.log(`📊 Metadata:`, meta);
    console.log(`🌍 Languages:`, languages);
    console.log('');

    // Test each word
    const [lang1, lang2] = pair.split('-');

    for (const { word, lang } of testWords) {
      // Only test if the word's language is in this dictionary
      if (!languages.includes(lang)) continue;

      const results = lookup(word, lang);
      const targetLang = lang === lang1 ? lang2 : lang1;
      const translations = translate(word, lang, targetLang);

      console.log(`  "${word}" (${lang}):`);
      console.log(`    Synsets found: ${results.length}`);
      console.log(`    Translations to ${targetLang}: ${translations.length > 0 ? translations.join(', ') : '(none)'}`);

      if (results.length > 0) {
        console.log(`    First synset: ${results[0].definition.substring(0, 60)}...`);
      }
    }

  } catch (error) {
    console.log(`❌ Error loading ${name}:`, error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Tip: If translations are empty, the word may not be in the dictionary.');
console.log('   Try increasing the dictionary size or using more common words.\n');
