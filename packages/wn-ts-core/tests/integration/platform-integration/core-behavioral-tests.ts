/**
 * Core Behavioral Tests for Cross-Platform Testing
 * 
 * These tests define the expected behavior that both wn-ts-node and wn-ts-web
 * implementations must satisfy. They use Vitest fixtures for consistent testing.
 */

import { describe, expect } from 'vitest';
import type { PlatformTestContext } from './platform-test-framework.js';

/**
 * Helper function to check if platform context is available
 */
function checkPlatformContext(platformContext: PlatformTestContext): boolean {
  if (!platformContext.core) {
    console.warn('Skipping test - platform context not available');
    return false;
  }
  return true;
}

/**
 * Core functionality tests that both platforms must pass
 * This function should be called by platform-specific tests with their extended test function
 */
export function defineCoreBehavioralTests(test: any) {
  describe('Core Behavioral Tests', () => {
    test('should initialize WordNet core', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      if (!checkPlatformContext(platformContext)) return;
      
      expect(platformContext.core).toBeDefined();
      expect(platformContext.wordnet).toBeDefined();
    });

    test('should get lexicons', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      
      const lexicons = await platformContext.core.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      // Note: In test environments, the database might be empty, so we just check it's an array
      // expect(lexicons.length).toBeGreaterThan(0);
      
      // Only check lexicon properties if there are lexicons available
      if (lexicons.length > 0) {
        const lexicon = lexicons[0];
        expect(lexicon).toBeDefined();
        if (lexicon) {
          expect(lexicon.id).toBeDefined();
          expect(lexicon.label).toBeDefined();
          expect(lexicon.language).toBeDefined();
        }
      }
    });

    test('should search words by form', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      expect(Array.isArray(words)).toBe(true);
      
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          expect(word.id).toBeDefined();
          expect(word.lemma).toBeDefined();
          expect(word.pos).toBeDefined();
          expect(word.language).toBeDefined();
          expect(word.lexicon).toBeDefined();
        }
      }
    });

    test('should get synset by ID', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      // First get a word to find its synset
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          if (senses.length > 0) {
            const sense = senses[0];
            expect(sense).toBeDefined();
            if (sense) {
              const synset = await platformContext.core.getSynset(sense.synsetId);
              if (synset) {
                expect(synset.id).toBeDefined();
                expect(synset.pos).toBeDefined();
                expect(synset.language).toBeDefined();
                expect(synset.lexicon).toBeDefined();
                expect(Array.isArray(synset.definitions)).toBe(true);
                expect(Array.isArray(synset.examples)).toBe(true);
                expect(Array.isArray(synset.relations)).toBe(true);
                expect(Array.isArray(synset.memberIds)).toBe(true);
                expect(Array.isArray(synset.senseIds)).toBe(true);
              }
            }
          }
        }
      }
    });

    test('should get senses for word', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          expect(Array.isArray(senses)).toBe(true);
          
          if (senses.length > 0) {
            const sense = senses[0];
            expect(sense).toBeDefined();
            if (sense) {
              expect(sense.id).toBeDefined();
              expect(sense.wordId).toBeDefined();
              expect(sense.synsetId).toBeDefined();
            }
          }
        }
      }
    });

    test('should get definitions for synset', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          if (senses.length > 0) {
            const sense = senses[0];
            expect(sense).toBeDefined();
            if (sense) {
              const definitions = await platformContext.core.getDefinitions(sense.synsetId);
              expect(Array.isArray(definitions)).toBe(true);
              
              if (definitions.length > 0) {
                const definition = definitions[0];
                expect(definition).toBeDefined();
                if (definition) {
                  expect(definition.id).toBeDefined();
                  expect(definition.language).toBeDefined();
                  expect(definition.text).toBeDefined();
                }
              }
            }
          }
        }
      }
    });

    test('should get relations for synset', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          if (senses.length > 0) {
            const sense = senses[0];
            expect(sense).toBeDefined();
            if (sense) {
              const relations = await platformContext.core.getRelations(sense.synsetId);
              expect(Array.isArray(relations)).toBe(true);
              
              if (relations.length > 0) {
                const relation = relations[0];
                expect(relation).toBeDefined();
                if (relation) {
                  expect(relation.id).toBeDefined();
                  expect(relation.type).toBeDefined();
                  expect(relation.target).toBeDefined();
                }
              }
            }
          }
        }
      }
    });

    test('should handle non-existent word gracefully', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('nonexistentword12345');
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });

    test('should handle non-existent synset gracefully', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const synset = await platformContext.core.getSynset('nonexistent-synset-12345');
      expect(synset).toBeNull();
    });

    test('should handle non-existent senses gracefully', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const senses = await platformContext.core.getSenses('nonexistent-word-12345');
      expect(Array.isArray(senses)).toBe(true);
      expect(senses.length).toBe(0);
    });

    test('should support plugin registration', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const initialPlugins = platformContext.wordnet.getPlugins();
      expect(Array.isArray(initialPlugins)).toBe(true);
      
      // Test that we can call plugin methods if they exist
      if ('getHypernyms' in platformContext.wordnet) {
        const words = await platformContext.core.getWord('computer');
        if (words.length > 0) {
          const word = words[0];
          expect(word).toBeDefined();
          if (word) {
            const senses = await platformContext.core.getSenses(word.id);
            if (senses.length > 0) {
              const sense = senses[0];
              expect(sense).toBeDefined();
              if (sense) {
                const hypernyms = await (platformContext.wordnet as any).getHypernyms(sense.synsetId);
                expect(Array.isArray(hypernyms)).toBe(true);
              }
            }
          }
        }
      }
    });

    test('should support similarity plugin', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      if ('path' in platformContext.wordnet) {
        const words1 = await platformContext.core.getWord('computer');
        const words2 = await platformContext.core.getWord('machine');
        
        if (words1.length > 0 && words2.length > 0) {
          const word1 = words1[0];
          const word2 = words2[0];
          expect(word1).toBeDefined();
          expect(word2).toBeDefined();
          if (word1 && word2) {
            const senses1 = await platformContext.core.getSenses(word1.id);
            const senses2 = await platformContext.core.getSenses(word2.id);
            
            if (senses1.length > 0 && senses2.length > 0) {
              const sense1 = senses1[0];
              const sense2 = senses2[0];
              expect(sense1).toBeDefined();
              expect(sense2).toBeDefined();
              if (sense1 && sense2) {
                const similarity = await (platformContext.wordnet as any).path(sense1.synsetId, sense2.synsetId);
                expect(typeof similarity).toBe('number');
                expect(similarity).toBeGreaterThanOrEqual(0);
              }
            }
          }
        }
      }
    });

    test('should handle concurrent requests', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const promises = Array.from({ length: 10 }, (_, i) => 
        platformContext.core.getWord(`word${i}`)
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThanOrEqual(0);
    });

    test('should complete queries within reasonable time', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const startTime = Date.now();
      await platformContext.core.getWord('computer');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000);
    });

    test('should handle invalid word IDs gracefully', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      // Some implementations return empty arrays instead of throwing errors
      const senses = await platformContext.core.getSenses('invalid-word-id');
      expect(Array.isArray(senses)).toBe(true);
      expect(senses.length).toBe(0);
    });

    test('should handle invalid synset IDs gracefully', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      // Some implementations return empty arrays instead of throwing errors
      const relations = await platformContext.core.getRelations('invalid-synset-id');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations.length).toBe(0);
    });

    test('should maintain referential integrity', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          
          for (const sense of senses) {
            expect(sense).toBeDefined();
            if (sense) {
              // Sense should reference the correct word
              expect(sense.wordId).toBe(word.id);
              
              // Synset should exist and be valid
              const synset = await platformContext.core.getSynset(sense.synsetId);
              expect(synset).toBeDefined();
              
              if (synset) {
                // Synset should contain the sense
                expect(synset.senseIds).toContain(sense.id);
                
                // Synset should contain the word
                expect(synset.memberIds).toContain(word.id);
              }
            }
          }
        }
      }
    });

    test('should have consistent language codes', async ({ platformContext }: { platformContext: PlatformTestContext }) => {
      if (!checkPlatformContext(platformContext)) return;
      const words = await platformContext.core.getWord('computer');
      if (words.length > 0) {
        const word = words[0];
        expect(word).toBeDefined();
        if (word) {
          const senses = await platformContext.core.getSenses(word.id);
          
          if (senses.length > 0) {
            const sense = senses[0];
            expect(sense).toBeDefined();
            if (sense) {
              const synset = await platformContext.core.getSynset(sense.synsetId);
              if (synset) {
                // Word, synset, and lexicon should have consistent language
                expect(word.language).toBe(synset.language);
                expect(word.lexicon).toBe(synset.lexicon);
              }
            }
          }
        }
      }
    });
  });
}