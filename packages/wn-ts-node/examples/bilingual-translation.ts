#!/usr/bin/env node

/**
 * Bilingual Translation Example
 * 
 * This example demonstrates how to use the translation utilities
 * for easy bilingual queries between English and French.
 * 
 * Run with: npx tsx examples/bilingual-translation.ts
 */

import { Wordnet, TranslationHelper, quickTranslate } from '../src/index.js';
import { logger } from 'wn-ts-core/utils';

async function main() {
  console.log('🌍 Bilingual Translation Example\n');

  // Initialize WordNet client
  const wordnet = new Wordnet('*');
  
  // Create translation helper
  const translator = new TranslationHelper(wordnet);

  // Example words to translate
  const wordsToTranslate = [
    'computer',
    'house', 
    'water',
    'love',
    'book'
  ];

  console.log('📚 Available languages:');
  const availableLanguages = await translator.getAvailableLanguages();
  console.log(availableLanguages.join(', '));
  console.log();

  // Method 1: Using TranslationHelper for detailed results
  console.log('🔍 Detailed Translation Results:');
  console.log('=' .repeat(50));
  
  for (const word of wordsToTranslate.slice(0, 2)) { // Limit to first 2 for demo
    console.log(`\nTranslating "${word}" (EN → FR):`);
    
    const result = await translator.translateWord(word, {
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      includeDefinitions: true,
      includeExamples: true,
      maxTranslations: 3
    });

    if (result.translations.fr && result.translations.fr.words.length > 0) {
      console.log(`  Words: ${result.translations.fr.words.join(', ')}`);
      
      if (result.translations.fr.definitions.length > 0) {
        console.log(`  Definitions: ${result.translations.fr.definitions.slice(0, 2).join('; ')}`);
      }
      
      if (result.translations.fr.examples.length > 0) {
        console.log(`  Examples: ${result.translations.fr.examples.slice(0, 1).join('; ')}`);
      }
    } else {
      console.log('  No translations found');
    }
  }

  // Method 2: Using quickTranslate for simple results
  console.log('\n⚡ Quick Translation Results:');
  console.log('=' .repeat(50));
  
  for (const word of wordsToTranslate) {
    const translations = await quickTranslate(wordnet, word, 'en', 'fr');
    console.log(`${word} → ${translations.length > 0 ? translations.join(', ') : 'No translations found'}`);
  }

  // Method 3: Bidirectional translation
  console.log('\n🔄 Bidirectional Translation:');
  console.log('=' .repeat(50));
  
  const bidirectionalResult = await translator.getBidirectionalTranslations('house', 'en', 'fr');
  
  console.log('EN → FR:');
  if (bidirectionalResult.en.translations.fr) {
    console.log(`  Words: ${bidirectionalResult.en.translations.fr.words.join(', ')}`);
  }
  
  console.log('FR → EN:');
  if (bidirectionalResult.fr.translations.en) {
    console.log(`  Words: ${bidirectionalResult.fr.translations.en.words.join(', ')}`);
  }

  console.log('\n✅ Translation example completed!');
}

// Run the example
main().catch(console.error);
