/**
 * Example demonstrating the new kernel-based WordNet architecture
 * 
 * This example shows how to use the new NodeWordNetKernel with plugins
 * for relations, similarity, and translation.
 */

import { NodeWordNetKernel } from '../src/wordnet-kernel.js';

async function demonstrateKernelArchitecture() {
  console.log('🚀 WordNet Kernel Architecture Demo\n');

  // Create a new kernel-based WordNet instance
  const wordnet = new NodeWordNetKernel('oewn:2024', {
    filename: ':memory:', // Use in-memory database for demo
  });

  try {
    // Initialize the WordNet instance
    console.log('📚 Initializing WordNet...');
    await wordnet.initialize();
    console.log('✅ WordNet initialized successfully!\n');

    // Demonstrate basic WordNet operations
    console.log('🔍 Basic WordNet Operations:');
    const words = await wordnet.words({ form: 'computer' });
    console.log(`Found ${words.length} words for "computer"`);
    
    if (words.length > 0) {
      const word = words[0];
      console.log(`First word: ${word.lemma} (${word.pos})`);
      
      // Get synsets for this word
      const synsets = await wordnet.synsets({ wordId: word.id });
      console.log(`Found ${synsets.length} synsets for "${word.lemma}"`);
      
      if (synsets.length > 0) {
        const synset = synsets[0];
        console.log(`First synset: ${synset.id} - ${synset.definitions?.[0]?.text || 'No definition'}\n`);

        // Demonstrate plugin operations - Relations
        console.log('🔗 Plugin Operations - Relations:');
        const hypernyms = await wordnet.getHypernyms(synset.id);
        console.log(`Hypernyms: ${hypernyms.length} found`);
        hypernyms.slice(0, 3).forEach(h => console.log(`  - ${h.lemma} (${h.pos})`));

        const hyponyms = await wordnet.getHyponyms(synset.id);
        console.log(`Hyponyms: ${hyponyms.length} found`);
        hyponyms.slice(0, 3).forEach(h => console.log(`  - ${h.lemma} (${h.pos})`));

        // Demonstrate plugin operations - Similarity
        console.log('\n📊 Plugin Operations - Similarity:');
        if (synsets.length > 1) {
          const synset2 = synsets[1];
          const pathSimilarity = await wordnet.getPathSimilarity(synset.id, synset2.id);
          const wuPalmerSimilarity = await wordnet.getWuPalmerSimilarity(synset.id, synset2.id);
          
          console.log(`Path similarity between "${synset.id}" and "${synset2.id}": ${pathSimilarity.toFixed(3)}`);
          console.log(`Wu-Palmer similarity: ${wuPalmerSimilarity.toFixed(3)}`);
        }

        // Demonstrate plugin operations - Translation
        console.log('\n🌍 Plugin Operations - Translation:');
        const translations = await wordnet.getTranslations(synset.id);
        console.log(`Translations: ${translations.length} found`);
        translations.slice(0, 3).forEach(t => console.log(`  - ${t.lemma} (${t.language})`));

        // Show available plugins
        console.log('\n🔌 Available Plugins:');
        const plugins = wordnet.getPlugins();
        console.log(`Plugins: ${plugins.join(', ')}`);

        // Show schema management capabilities
        console.log('\n🗄️ Schema Management:');
        const schemaManager = wordnet.schemaManager;
        console.log(`Schema manager available: ${schemaManager ? 'Yes' : 'No'}`);
      }
    }

    console.log('\n✨ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error during demo:', error);
  } finally {
    // Clean up
    await wordnet.close();
    console.log('🧹 WordNet instance closed');
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateKernelArchitecture().catch(console.error);
}

export { demonstrateKernelArchitecture };


