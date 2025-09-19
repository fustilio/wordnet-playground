/**
 * Similarity Methods with Lexicon Context - Usage Examples
 * 
 * This file demonstrates the fixed similarity methods that properly handle
 * lexicon context and support cross-lingual comparisons.
 */

import { NodeWordNetKernel } from 'wn-ts-node';
import type { Synset } from './types.js';

async function demonstrateSimilarityMethods() {
  // Initialize WordNet with multiple lexicons
  const wordnet = new NodeWordNetKernel(['omw-en', 'omw-fr'], {
    filename: 'wordnet.db'
  });
  
  await wordnet.initialize();

  console.log('🔍 Similarity Methods with Lexicon Context Examples\n');

  // Example 1: Same lexicon comparison (works as before)
  console.log('1. Same Lexicon Comparison:');
  try {
    const synset1 = await wordnet.synset('en-n-0001'); // English synset
    const synset2 = await wordnet.synset('en-n-0002'); // English synset
    
    console.log(`   Synset 1: ${synset1.id} (${synset1.lexicon})`);
    console.log(`   Synset 2: ${synset2.id} (${synset2.lexicon})`);
    
    // These work with both synset objects and IDs
    const pathSim = await wordnet.getPathSimilarity(synset1, synset2);
    const wupSim = await wordnet.getWuPalmerSimilarity(synset1.id, synset2.id);
    
    console.log(`   Path Similarity: ${pathSim.toFixed(3)}`);
    console.log(`   Wu-Palmer Similarity: ${wupSim.toFixed(3)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Example 2: Cross-lingual comparison using CILI (optional)
  console.log('2. Cross-Lingual Comparison (CILI optional, required for translation plugin):');
  try {
    const enSynset = await wordnet.synset('en-n-0001'); // English synset
    const frSynset = await wordnet.synset('fr-n-0001'); // French synset
    
    console.log(`   English Synset: ${enSynset.id} (${enSynset.lexicon}) - ILI: ${enSynset.ili || 'none'}`);
    console.log(`   French Synset: ${frSynset.id} (${frSynset.lexicon}) - ILI: ${frSynset.ili || 'none'}`);
    
    // Use cross-lingual similarity method (requires CILI for multilingual operations)
    const crossLingualSim = await wordnet.getCrossLingualSimilarity(enSynset, frSynset);
    console.log(`   Cross-Lingual Similarity: ${crossLingualSim.toFixed(3)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Example 3: Error handling for incompatible lexicons
  console.log('3. Error Handling for Incompatible Lexicons:');
  try {
    const enSynset = await wordnet.synset('en-n-0001');
    const frSynset = await wordnet.synset('fr-n-0001');
    
    // This will throw an error because synsets are from different lexicons
    const invalidSim = await wordnet.getPathSimilarity(enSynset, frSynset);
    console.log(`   This should not print: ${invalidSim}`);
  } catch (error) {
    console.log(`   ✅ Caught expected error: ${error.message}\n`);
  }

  // Example 4: Best similarity method
  console.log('4. Best Similarity Method:');
  try {
    const synset1 = await wordnet.synset('en-n-0001');
    const synset2 = await wordnet.synset('en-n-0002');
    
    // This method tries multiple similarity metrics and returns the best one
    const bestSim = await wordnet.getBestSimilarity(synset1, synset2);
    console.log(`   Best Similarity: ${bestSim.toFixed(3)}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Example 5: Finding most similar synsets
  console.log('5. Finding Most Similar Synsets:');
  try {
    const synsetId = 'en-n-0001';
    const similarSynsets = await wordnet.findMostSimilar(synsetId, 5);
    
    console.log(`   Most similar to ${synsetId}:`);
    similarSynsets.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.id} (similarity: ${result.similarity.toFixed(3)})`);
    });
    console.log();
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Example 6: Working with synset objects directly
  console.log('6. Working with Synset Objects:');
  try {
    const synsets = await wordnet.synsets({ pos: 'n', limit: 3 });
    
    console.log('   Comparing multiple synsets:');
    for (let i = 0; i < synsets.length; i++) {
      for (let j = i + 1; j < synsets.length; j++) {
        const sim = await wordnet.getPathSimilarity(synsets[i], synsets[j]);
        console.log(`   ${synsets[i].id} ↔ ${synsets[j].id}: ${sim.toFixed(3)}`);
      }
    }
    console.log();
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Example 7: CILI-based cross-lingual comparison (optional)
  console.log('7. CILI-Based Cross-Lingual Comparison (CILI optional):');
  try {
    // Find synsets with the same ILI (if CILI is installed)
    const ili = 'i00001'; // Example ILI
    const synsetsByIli = await wordnet.getSynsetsByIli(ili);
    
    console.log(`   Synsets with ILI ${ili}:`);
    synsetsByIli.forEach(synset => {
      console.log(`   - ${synset.id} (${synset.language}, ${synset.lexicon})`);
    });
    
    if (synsetsByIli.length >= 2) {
      const crossSim = await wordnet.getCrossLingualSimilarity(
        synsetsByIli[0], 
        synsetsByIli[1]
      );
      console.log(`   Cross-lingual similarity: ${crossSim.toFixed(3)}`);
    }
    console.log();
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  await wordnet.close();
}

// Example 8: Error scenarios and validation
async function demonstrateErrorScenarios() {
  console.log('8. Error Scenarios and Validation:');
  
  const wordnet = new NodeWordNetKernel(['omw-en', 'omw-fr']);
  await wordnet.initialize();

  try {
    // Scenario 1: Synsets without ILI for cross-lingual comparison
    console.log('   Scenario 1: Synsets without ILI mappings');
    const enSynset = await wordnet.synset('en-n-0001');
    const frSynset = await wordnet.synset('fr-n-0001');
    
    // Check if ILI mappings are missing (this would be a real scenario)
    if (!enSynset.ili || !frSynset.ili) {
      console.log('   ✅ Synsets missing ILI mappings - cross-lingual comparison not possible');
      console.log('   Note: CILI is optional but required for translation plugin and cross-lingual operations');
      console.log('   For English-only similarity, use same-lexicon methods instead');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  try {
    // Scenario 2: Invalid synset IDs
    console.log('   Scenario 2: Invalid synset IDs');
    await wordnet.getPathSimilarity('invalid-id-1', 'invalid-id-2');
  } catch (error) {
    console.log(`   ✅ Caught error for invalid IDs: ${error.message}`);
  }

  await wordnet.close();
}

// Example 9: Performance considerations
async function demonstratePerformanceConsiderations() {
  console.log('9. Performance Considerations:');
  
  const wordnet = new NodeWordNetKernel(['omw-en']);
  await wordnet.initialize();

  try {
    const synsets = await wordnet.synsets({ pos: 'n', limit: 10 });
    
    console.log('   Comparing multiple synsets efficiently:');
    
    // Method 1: Resolve synsets once and reuse
    const start1 = Date.now();
    const synsetObjects = await Promise.all(
      synsets.map(s => wordnet.synset(s.id))
    );
    
    const comparisons1 = [];
    for (let i = 0; i < synsetObjects.length; i++) {
      for (let j = i + 1; j < synsetObjects.length; j++) {
        const sim = await wordnet.getPathSimilarity(synsetObjects[i], synsetObjects[j]);
        comparisons1.push(sim);
      }
    }
    const time1 = Date.now() - start1;
    
    console.log(`   Method 1 (reuse objects): ${comparisons1.length} comparisons in ${time1}ms`);
    
    // Method 2: Use IDs (less efficient due to repeated resolution)
    const start2 = Date.now();
    const comparisons2 = [];
    for (let i = 0; i < synsets.length; i++) {
      for (let j = i + 1; j < synsets.length; j++) {
        const sim = await wordnet.getPathSimilarity(synsets[i].id, synsets[j].id);
        comparisons2.push(sim);
      }
    }
    const time2 = Date.now() - start2;
    
    console.log(`   Method 2 (use IDs): ${comparisons2.length} comparisons in ${time2}ms`);
    console.log(`   Performance difference: ${((time2 - time1) / time1 * 100).toFixed(1)}% slower\n`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  await wordnet.close();
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 WordNet Similarity Methods - Lexicon Context Examples\n');
  console.log('=' .repeat(60) + '\n');
  
  await demonstrateSimilarityMethods();
  await demonstrateErrorScenarios();
  await demonstratePerformanceConsiderations();
  
  console.log('✅ All examples completed!');
  console.log('\nKey Takeaways:');
  console.log('- Use synset objects when possible for better performance');
  console.log('- Use getCrossLingualSimilarity() for different lexicons');
  console.log('- Handle errors gracefully for missing ILI mappings');
  console.log('- Validate lexicon compatibility before comparison');
}

// Export for use in other modules
export {
  demonstrateSimilarityMethods,
  demonstrateErrorScenarios,
  demonstratePerformanceConsiderations,
  runAllExamples
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
