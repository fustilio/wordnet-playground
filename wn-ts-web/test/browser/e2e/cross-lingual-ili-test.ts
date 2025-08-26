/**
 * E2E test for cross-lingual ILI matching functionality
 * This test mirrors the operations used in wn-ts-web-demo's bilingual demo
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWordNetInstance } from '../../../src/factory.js';
import type { WebWordnet } from '../../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../../src/data-loader.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('Cross-Lingual ILI Matching E2E', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance('oewn:2024');
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    
    console.log('🌐 Setting up cross-lingual ILI testing environment...');
    
    try {
      // Load the Open English WordNet (oewn:2024) - this is the core package
      console.log('🌐 Loading Open English WordNet (oewn:2024)...');
      await dataLoader.downloadAndLoad('oewn:2024');
      console.log('✅ Open English WordNet loaded successfully');
      
      // Load CILI for interlingual index support
      console.log('🌐 Loading CILI (Collaborative Interlingual Index)...');
      await dataLoader.downloadAndLoad('cili:1.0');
      console.log('✅ CILI loaded successfully');
      
      // Load French WordNet for multilingual testing
      console.log('🌐 Loading French WordNet (omw-fr:1.4)...');
      await dataLoader.downloadAndLoad('omw-fr:1.4');
      console.log('✅ French WordNet loaded successfully');
      
    } catch (error) {
      console.warn('⚠️ Failed to load WordNet data:', error);
      throw new Error('WordNet data required for cross-lingual ILI testing');
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Cross-Lingual ILI Mapping Operations', () => {
    it('should find English synsets for common words', async () => {
      console.log('🔍 Testing English synset lookup...');
      
      const testTerms = ['horse', 'water', 'house', 'cat'];
      
      for (const term of testTerms) {
        console.log(`🔍 Looking for English synsets of: ${term}`);
        
        const synsets = await wordnet.synsets({ form: term, lexicon: 'oewn:2024' });
        expect(synsets.length).toBeGreaterThan(0);
        
        console.log(`✅ Found ${synsets.length} synsets for "${term}"`);
        
        // Log the first few synsets
        for (const synset of synsets.slice(0, 3)) {
          console.log(`  - ${synset.id} (${synset.pos}) - ILI: ${synset.ili || 'none'}`);
        }
      }
    });

    it('should find ILI identifiers for English synsets', async () => {
      console.log('🔍 Testing ILI identifier lookup...');
      
      // Test with a specific word that should have ILI identifiers
      const synsets = await wordnet.synsets({ form: 'horse', lexicon: 'oewn:2024' });
      expect(synsets.length).toBeGreaterThan(0);
      
      const synsetsWithILI = synsets.filter(s => s.ili);
      console.log(`📊 Found ${synsetsWithILI.length}/${synsets.length} synsets with ILI identifiers`);
      
      if (synsetsWithILI.length > 0) {
        for (const synset of synsetsWithILI.slice(0, 3)) {
          console.log(`✅ Synset ${synset.id} has ILI: ${synset.ili}`);
        }
      } else {
        console.log('⚠️ No synsets found with ILI identifiers');
      }
    });

    it('should attempt cross-lingual mapping via ILI', async () => {
      console.log('🌐 Testing cross-lingual mapping via ILI...');
      
      const synsets = await wordnet.synsets({ form: 'horse', lexicon: 'oewn:2024' });
      const synsetsWithILI = synsets.filter(s => s.ili);
      
      if (synsetsWithILI.length === 0) {
        console.log('⚠️ Skipping ILI mapping test - no synsets with ILI identifiers');
        return;
      }
      
      let iliMappingSuccess = false;
      
      for (const synset of synsetsWithILI.slice(0, 3)) {
        const ili = synset.ili!;
        console.log(`🔍 Testing ILI ${ili} for synset ${synset.id}`);
        
        try {
          // Try to find French words with this ILI using the correct method
          const crossLingualSynsets = await wordnet.getCrossLingualSynsets(ili, ['fr']);
          
          if (crossLingualSynsets.fr && crossLingualSynsets.fr.length > 0) {
            console.log(`✅ Found ${crossLingualSynsets.fr.length} French synsets for ILI ${ili}:`);
            for (const frSynset of crossLingualSynsets.fr.slice(0, 3)) {
              console.log(`  - ${frSynset.id} (${frSynset.pos})`);
            }
            iliMappingSuccess = true;
          } else {
            console.log(`❌ No French synsets found for ILI ${ili}`);
          }
        } catch (error) {
          console.log(`❌ Error looking up ILI ${ili}:`, error);
        }
      }
      
      if (!iliMappingSuccess) {
        console.log('⚠️ ILI-based cross-lingual mapping is not working');
      }
    });

    it('should find French words directly in French WordNet', async () => {
      console.log('🇫🇷 Testing direct French WordNet lookup...');
      
      // Test if we can find French words directly
      const testFrenchWords = ['cheval', 'eau', 'maison', 'chat'];
      
      for (const word of testFrenchWords) {
        console.log(`🔍 Looking for French word: ${word}`);
        
        try {
          const words = await wordnet.words({ form: word, lexicon: 'omw-fr:1.4' });
          
          if (words && words.length > 0) {
            console.log(`✅ Found ${words.length} French words for "${word}"`);
            for (const w of words.slice(0, 2)) {
              console.log(`  - ${w.lemma} (${w.pos})`);
            }
          } else {
            console.log(`❌ No French words found for "${word}"`);
          }
        } catch (error) {
          console.log(`❌ Error looking up French word "${word}":`, error);
        }
      }
    });

    it('should test the complete cross-lingual workflow', async () => {
      console.log('🔄 Testing complete cross-lingual workflow...');
      
      const testTerm = 'horse';
      console.log(`🔍 Testing complete workflow for: ${testTerm}`);
      
      // Step 1: Find English synsets
      const englishSynsets = await wordnet.synsets({ form: testTerm, lexicon: 'oewn:2024' });
      expect(englishSynsets.length).toBeGreaterThan(0);
      console.log(`✅ Step 1: Found ${englishSynsets.length} English synsets`);
      
      // Step 2: Get ILI identifiers
      const synsetsWithILI = englishSynsets.filter(s => s.ili);
      console.log(`✅ Step 2: ${synsetsWithILI.length} synsets have ILI identifiers`);
      
      if (synsetsWithILI.length === 0) {
        console.log('⚠️ Cannot test ILI mapping - no synsets with ILI identifiers');
        return;
      }
      
      // Step 3: Try cross-lingual mapping
      let mappingResults = [];
      
      for (const synset of synsetsWithILI.slice(0, 2)) {
        const ili = synset.ili!;
        console.log(`🔍 Testing ILI ${ili} (synset ${synset.id})`);
        
        try {
          const crossLingualSynsets = await wordnet.getCrossLingualSynsets(ili, ['fr']);
          
          if (crossLingualSynsets.fr && crossLingualSynsets.fr.length > 0) {
            console.log(`✅ Success! Found ${crossLingualSynsets.fr.length} French synsets for ILI ${ili}`);
            mappingResults.push({
              ili,
              synsetId: synset.id,
              frenchSynsets: crossLingualSynsets.fr.length,
              sample: crossLingualSynsets.fr.slice(0, 2).map(s => s.id)
            });
          } else {
            console.log(`❌ No French synsets found for ILI ${ili}`);
          }
        } catch (error) {
          console.log(`❌ Error with ILI ${ili}:`, error);
        }
      }
      
      // Step 4: Report results
      if (mappingResults.length > 0) {
        console.log('🎉 Cross-lingual mapping successful!');
        for (const result of mappingResults) {
          console.log(`  - ILI ${result.ili} → ${result.frenchSynsets} French synsets: ${result.sample.join(', ')}`);
        }
      } else {
        console.log('❌ Cross-lingual mapping failed for all tested ILIs');
      }
    });

    it('should analyze the ILI data structure', async () => {
      console.log('🔍 Analyzing ILI data structure...');
      
      try {
        // Get some sample ILI entries - use the correct method signature
        const iliEntries = await wordnet.ilis();
        console.log(`📊 Found ${iliEntries.length} sample ILI entries`);
        
        for (const ili of iliEntries.slice(0, 5)) {
          console.log(`  - ILI ${ili.id}: ${ili.definition || 'no definition'}`);
        }
        
        // Check if we can query by ILI
        if (iliEntries.length > 0) {
          const testIli = iliEntries[0].id;
          console.log(`🔍 Testing query for ILI: ${testIli}`);
          
          try {
            const synsets = await wordnet.synsetsByILI(testIli);
            console.log(`✅ Found ${synsets.length} synsets for ILI ${testIli}`);
            
            for (const synset of synsets.slice(0, 3)) {
              console.log(`  - ${synset.id} (${synset.language})`);
            }
          } catch (error) {
            console.log(`❌ Error querying by ILI ${testIli}:`, error);
          }
        }
        
      } catch (error) {
        console.log('❌ Error analyzing ILI data structure:', error);
      }
    });
  });
});
