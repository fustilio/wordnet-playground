/**
 * Examples Index
 * 
 * This file exports all available examples for the wn-ts-web-demo application.
 */

// Translation Examples
export { UnifiedTranslationDemo } from './tabs/multilingual/UnifiedTranslationDemo';
export { TranslationShowcase } from './tabs/multilingual/TranslationShowcase';
export { 
  translateWord, 
  translateWordDetailed, 
  getAvailableLanguages,
  runTranslationExample 
} from './tabs/multilingual/SimpleTranslationExample';

// Project Management Examples
export { ProjectList } from './ProjectList';

// Testing Examples
export { SequentialRunner } from './SequentialRunner';

// Re-export types
export type { TranslationResult, BilingualQueryOptions } from 'wn-ts-web';
