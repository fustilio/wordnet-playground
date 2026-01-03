/**
 * Simple Translation Example for wn-ts-web-demo
 * 
 * This example shows how to use the translation utilities
 * in a simple, non-React context.
 */

import { 
  createWordNetInstance, 
  TranslationHelper, 
  quickTranslate 
} from 'wn-ts-web';

/**
 * Simple translation function that can be used anywhere
 */
export async function translateWord(
  word: string, 
  fromLang: string, 
  toLang: string
): Promise<string[]> {
  try {
    // Create WordNet instance - note: createWordNetInstance only supports single lexicon
    // For multiple lexicons, you would need to use a different approach
    const { wordnet } = await createWordNetInstance('oewn:2024');

    // Use quickTranslate for simple results
    const translations = await quickTranslate(wordnet, word, fromLang, toLang);
    return translations;
  } catch (error) {
    console.error('Translation failed:', error);
    return [];
  }
}

/**
 * Detailed translation function with definitions and examples
 */
export async function translateWordDetailed(
  word: string, 
  fromLang: string, 
  toLang: string
) {
  try {
    // Create WordNet instance - note: createWordNetInstance only supports single lexicon
    // For multiple lexicons, you would need to use a different approach
    const { wordnet } = await createWordNetInstance('oewn:2024');

    // Use TranslationHelper for detailed results
    const translator = new TranslationHelper(wordnet);
    const result = await translator.translateWord(word, {
      sourceLanguage: fromLang,
      targetLanguage: toLang,
      includeDefinitions: true,
      includeExamples: true,
      maxTranslations: 5
    });

    return result;
  } catch (error) {
    console.error('Detailed translation failed:', error);
    return null;
  }
}

/**
 * Get available languages
 */
export async function getAvailableLanguages(): Promise<string[]> {
  try {
    const { wordnet } = await createWordNetInstance('oewn:2024');

    const translator = new TranslationHelper(wordnet);
    return await translator.getAvailableLanguages();
  } catch (error) {
    console.error('Failed to get languages:', error);
    return [];
  }
}

/**
 * Example usage function
 */
export async function runTranslationExample() {
  console.log('🌍 Simple Translation Example\n');

  // Example 1: Quick translation
  console.log('1. Quick Translation:');
  const quickResults = await translateWord('computer', 'en', 'fr');
  console.log(`computer (EN) → ${quickResults.join(', ')} (FR)`);

  // Example 2: Detailed translation
  console.log('\n2. Detailed Translation:');
  const detailedResults = await translateWordDetailed('house', 'en', 'fr');
  if (detailedResults) {
    console.log(`Source: ${detailedResults.sourceWord} (${detailedResults.sourceLanguage})`);
    if (detailedResults.translations.fr) {
      console.log(`French words: ${detailedResults.translations.fr.words.join(', ')}`);
      if (detailedResults.translations.fr.definitions.length > 0) {
        console.log(`Definitions: ${detailedResults.translations.fr.definitions.slice(0, 2).join('; ')}`);
      }
    }
  }

  // Example 3: Available languages
  console.log('\n3. Available Languages:');
  const languages = await getAvailableLanguages();
  console.log(`Available: ${languages.join(', ')}`);

  // Example 4: Batch translation
  console.log('\n4. Batch Translation:');
  const words = ['computer', 'house', 'water', 'love', 'book'];
  for (const word of words) {
    const translations = await translateWord(word, 'en', 'fr');
    console.log(`${word} → ${translations.length > 0 ? translations.join(', ') : 'No translations'}`);
  }
}

// Run the example if this file is executed directly
if (typeof window === 'undefined') {
  runTranslationExample().catch(console.error);
}
