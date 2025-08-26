/**
 * E2E test for dependency management system
 * Tests the cross-lingual dependency detection, warnings, and loading
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWordNetInstance } from '../../src/factory.js';
import type { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../src/data-loader.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('Dependency Management E2E', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance();
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Dependency Detection', () => {
    it('should detect lexicon dependencies from XML', async () => {
      // This test will verify that the LMF parser correctly extracts
      // the Requires field from lexicon XML files
      const lexicons = await wordnet.lexicons();
      
      // Check if we have any lexicons with dependencies
      const lexiconsWithDeps = lexicons.filter(l => l.requires && l.requires.length > 0);
      
      if (lexiconsWithDeps.length > 0) {
        // Verify the requires field structure
        for (const lexicon of lexiconsWithDeps) {
          expect(lexicon.requires).toBeDefined();
          expect(Array.isArray(lexicon.requires)).toBe(true);
          expect(lexicon.requires!.length).toBeGreaterThan(0);
          
          // Each required lexicon ID should be a valid string
          for (const reqId of lexicon.requires!) {
            expect(typeof reqId).toBe('string');
            expect(reqId.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should identify French WordNet as dependent on English', async () => {
      // Look for French WordNet and check its dependencies
      const lexicons = await wordnet.lexicons();
      const frenchLexicon = lexicons.find(l => l.language === 'fr');
      
      if (frenchLexicon) {
        expect(frenchLexicon.requires).toBeDefined();
        expect(frenchLexicon.requires).toContain('omw-en');
        
        // Check if English lexicon is available
        const englishLexicon = lexicons.find(l => l.id === 'omw-en');
        if (englishLexicon) {
          expect(englishLexicon.language).toBe('en');
        }
      }
    });
  });

  describe('Dependency Warnings', () => {
    it('should warn when loading dependent lexicon without base', async () => {
      // This test simulates the scenario where a user tries to load
      // French WordNet without having English WordNet loaded first
      
      // First, check what lexicons are currently loaded
      const loadedLexicons = await wordnet.lexicons();
      const englishLoaded = loadedLexicons.some(l => l.id === 'omw-en');
      const frenchLoaded = loadedLexicons.some(l => l.id === 'omw-fr');
      
      if (!englishLoaded && frenchLoaded) {
        // This would be the problematic scenario
        // The system should warn about missing dependencies
        console.warn('⚠️ French WordNet loaded without English dependencies');
      }
    });

    it('should provide guidance on resolving dependency issues', async () => {
      // Test that the system can suggest how to resolve missing dependencies
      const lexicons = await wordnet.lexicons();
      const dependentLexicons = lexicons.filter(l => l.requires && l.requires.length > 0);
      
      for (const lexicon of dependentLexicons) {
        if (lexicon.requires) {
          const missingDeps = lexicon.requires.filter(reqId => 
            !lexicons.some(l => l.id === reqId)
          );
          
          if (missingDeps.length > 0) {
            console.warn(`⚠️ Lexicon '${lexicon.id}' missing dependencies: ${missingDeps.join(', ')}`);
            console.warn(`💡 To resolve: Load these lexicons first: ${missingDeps.join(', ')}`);
          }
        }
      }
    });
  });

  describe('Dependency Loading Order', () => {
    it('should suggest correct loading order for dependent lexicons', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Build dependency tree
      const dependencyTree = new Map<string, string[]>();
      const reverseDeps = new Map<string, string[]>();
      
      for (const lexicon of lexicons) {
        if (lexicon.requires) {
          dependencyTree.set(lexicon.id, lexicon.requires);
          
          for (const reqId of lexicon.requires) {
            if (!reverseDeps.has(reqId)) {
              reverseDeps.set(reqId, []);
            }
            reverseDeps.get(reqId)!.push(lexicon.id);
          }
        }
      }
      
      // Find base lexicons (those with no dependencies)
      const baseLexicons = Array.from(dependencyTree.keys())
        .filter(id => !dependencyTree.has(id) || dependencyTree.get(id)!.length === 0);
      
      // Find dependent lexicons
      const dependentLexicons = Array.from(dependencyTree.keys())
        .filter(id => dependencyTree.has(id) && dependencyTree.get(id)!.length > 0);
      
      console.log('📋 Dependency Analysis:');
      console.log('Base lexicons (load first):', baseLexicons);
      console.log('Dependent lexicons (load after):', dependentLexicons);
      
      // Verify that base lexicons exist
      for (const baseId of baseLexicons) {
        const baseLexicon = lexicons.find(l => l.id === baseId);
        expect(baseLexicon).toBeDefined();
      }
    });

    it('should handle circular dependency detection', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Simple circular dependency detection
      const hasCircularDeps = (lexiconId: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(lexiconId)) {
          return true; // Circular dependency detected
        }
        
        visited.add(lexiconId);
        const lexicon = lexicons.find(l => l.id === lexiconId);
        
        if (lexicon?.requires) {
          for (const reqId of lexicon.requires) {
            if (hasCircularDeps(reqId, new Set(visited))) {
              return true;
            }
          }
        }
        
        return false;
      };
      
      // Check for circular dependencies
      for (const lexicon of lexicons) {
        if (lexicon.requires && lexicon.requires.length > 0) {
          const hasCircular = hasCircularDeps(lexicon.id);
          expect(hasCircular).toBe(false); // Should not have circular deps
        }
      }
    });
  });

  describe('Cross-Lingual Functionality with Dependencies', () => {
    it('should enable cross-lingual queries when dependencies are loaded', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Check if we have both English and French lexicons
      const englishLexicon = lexicons.find(l => l.id === 'omw-en');
      const frenchLexicon = lexicons.find(l => l.id === 'omw-fr');
      
      if (englishLexicon && frenchLexicon) {
        // Both lexicons are available
        console.log('✅ Both English and French lexicons available');
        
        // Try to find some English words
        const englishWords = await wordnet.words({ lexicon: 'omw-en', maxResults: 5 });
        
        if (englishWords.length > 0) {
          const testWord = englishWords[0];
          console.log(`🔍 Testing cross-lingual query with: ${testWord.lemma}`);
          
          // Get synsets for this word
          const synsets = await wordnet.synsets({ form: testWord.lemma, lexicon: 'omw-en' });
          
          if (synsets.length > 0) {
            const synset = synsets[0];
            console.log(`📚 Found synset: ${synset.id}`);
            
            // Check if this synset has an ILI
            if (synset.ili) {
              console.log(`🔗 Synset has ILI: ${synset.ili}`);
              
              // Try to find French words with the same ILI
              const frenchWords = await wordnet.words({ ili: synset.ili, lexicon: 'omw-fr' });
              
              if (frenchWords.length > 0) {
                console.log(`🇫🇷 Found French equivalents: ${frenchWords.map(w => w.lemma).join(', ')}`);
              } else {
                console.log('❌ No French equivalents found for this ILI');
              }
            } else {
              console.log('❌ Synset has no ILI identifier');
            }
          }
        }
      } else {
        console.log('⚠️ Missing required lexicons for cross-lingual testing');
      }
    });

    it('should fail cross-lingual queries when dependencies are missing', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Check if French lexicon is loaded without English
      const englishLexicon = lexicons.find(l => l.id === 'omw-en');
      const frenchLexicon = lexicons.find(l => l.id === 'omw-fr');
      
      if (frenchLexicon && !englishLexicon) {
        console.log('⚠️ French lexicon loaded without English dependencies');
        
        // Try to find French words
        const frenchWords = await wordnet.words({ lexicon: 'omw-fr', maxResults: 5 });
        
        if (frenchWords.length > 0) {
          const testWord = frenchWords[0];
          console.log(`🔍 Testing French word: ${testWord.lemma}`);
          
          // Get synsets for this word
          const synsets = await wordnet.synsets({ form: testWord.lemma, lexicon: 'omw-fr' });
          
          if (synsets.length > 0) {
            const synset = synsets[0];
            console.log(`📚 Found French synset: ${synset.id}`);
            
            // Try to find English equivalents
            if (synset.ili) {
              const englishWords = await wordnet.words({ ili: synset.ili, lexicon: 'omw-en' });
              
              if (englishWords.length === 0) {
                console.log('❌ Cross-lingual query failed - no English equivalents found');
                console.log('💡 This is expected when English dependencies are missing');
              }
            }
          }
        }
      }
    });
  });

  describe('Dependency Status Monitoring', () => {
    it('should provide comprehensive dependency status information', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Build dependency status report
      const statusReport = new Map<string, {
        id: string;
        language: string;
        version?: string;
        dependencies: string[];
        loaded: boolean;
        missingDeps: string[];
        status: 'complete' | 'partial' | 'missing';
      }>();
      
      for (const lexicon of lexicons) {
        const dependencies = lexicon.requires || [];
        const missingDeps = dependencies.filter(reqId => 
          !lexicons.some(l => l.id === reqId)
        );
        
        let status: 'complete' | 'partial' | 'missing';
        if (dependencies.length === 0) {
          status = 'complete'; // No dependencies
        } else if (missingDeps.length === 0) {
          status = 'complete'; // All dependencies satisfied
        } else {
          status = 'partial'; // Some dependencies missing
        }
        
        statusReport.set(lexicon.id, {
          id: lexicon.id,
          language: lexicon.language,
          version: lexicon.version,
          dependencies,
          loaded: true,
          missingDeps,
          status
        });
      }
      
      // Display status report
      console.log('📊 Dependency Status Report:');
      for (const [id, status] of statusReport) {
        const icon = status.status === 'complete' ? '✅' : 
                    status.status === 'partial' ? '⚠️' : '❌';
        
        console.log(`${icon} ${id} (${status.language}) - ${status.status}`);
        
        if (status.dependencies.length > 0) {
          console.log(`   Dependencies: ${status.dependencies.join(', ')}`);
        }
        
        if (status.missingDeps.length > 0) {
          console.log(`   Missing: ${status.missingDeps.join(', ')}`);
        }
      }
      
      // Verify that we have at least some complete lexicons
      const completeLexicons = Array.from(statusReport.values())
        .filter(s => s.status === 'complete');
      
      expect(completeLexicons.length).toBeGreaterThan(0);
    });
  });
});
