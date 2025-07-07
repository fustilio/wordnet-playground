#!/usr/bin/env node

import { 
  config, 
  download, 
  add, 
  Wordnet, 
  words, 
  synsets, 
  projects, 
  db,
  // Import additional modules for comprehensive demo
  word,
  sense,
  senses,
  synset,
  ili,
  ilis,
  lexicons
} from 'wn-ts';

// Import additional features that are available
import { 
  path as pathSimilarity,
  wup as wupSimilarity,
  lch as lchSimilarity,
  res as resSimilarity,
  jcn as jcnSimilarity,
  lin as linSimilarity
} from 'wn-ts/similarity';

import {
  roots,
  leaves,
  taxonomyDepth,
  hypernymPaths,
  minDepth,
  taxonomyShortestPath
} from 'wn-ts/taxonomy';

import {
  Morphy,
  createMorphy
} from 'wn-ts/morphy';

import {
  information_content,
  compute as computeInformationContent
} from 'wn-ts/ic';

import { join } from 'path';
import { homedir } from 'os';

console.log('🚀 WordNet Kitchen Sink Demo');
console.log('=============================\n');

async function setupDataDirectory() {
  const demoDataDir = join(homedir(), '.wn_kitchen_sink_demo');
  
  try {
    const fs = await import('fs');
    
    if (!fs.existsSync(demoDataDir)) {
      fs.mkdirSync(demoDataDir, { recursive: true });
    }
    
    return demoDataDir;
  } catch (error) {
    console.error(`❌ Failed to setup data directory: ${error.message}`);
    process.exit(1);
  }
}

async function runKitchenSinkDemo() {
  try {
    console.log('🔧 Setting up comprehensive demo...');
    
    const demoDataDir = await setupDataDirectory();
    console.log(`📁 Using data directory: ${demoDataDir}\n`);
    
    config.dataDirectory = demoDataDir;
    console.log('✅ Config data directory set successfully\n');

    // ========================================
    // SECTION 1: PROJECT MANAGEMENT
    // ========================================
    console.log('📋 SECTION 1: Project Management');
    console.log('================================');

    console.log('\n🔍 Available WordNet Projects:');
    try {
      const availableProjects = await projects();
      console.log(`Found ${availableProjects.length} projects`);
      
      const projectList = availableProjects.slice(0, 8);
      projectList.forEach(project => {
        const version = project.version || 'latest';
        const language = project.language || project.lang || 'en';
        const name = project.label || project.name || project.id || 'Unknown';
        console.log(`  • ${project.id}:${version} - ${name} (${language})`);
      });
      console.log(`  ... and ${availableProjects.length - 8} more projects`);
    } catch (error) {
      console.log(`⚠️  Error getting projects: ${error.message}`);
    }

    // ========================================
    // SECTION 2: DATA DOWNLOAD & MANAGEMENT
    // ========================================
    console.log('\n📥 SECTION 2: Data Download & Management');
    console.log('=========================================');

    // Download multiple projects
    const projectsToDownload = [
      { id: 'cili:1.0', name: 'CILI (Collaborative Interlingual Index)' },
      { id: 'oewn:2024', name: 'Open English WordNet 2024' },
      { id: 'omw-en:1.4', name: 'OMW English WordNet 1.4' }
    ];

    for (const project of projectsToDownload) {
      console.log(`\n🔄 Downloading ${project.name}...`);
      try {
        const downloadPath = await download(project.id, { force: true });
        console.log(`✅ ${project.name} downloaded successfully!`);
        
        await add(downloadPath, { force: true });
        console.log(`✅ ${project.name} added to database!`);
      } catch (error) {
        console.log(`⚠️  ${project.name} processing failed: ${error.message}`);
      }
    }

    // ========================================
    // SECTION 3: LEXICON EXPLORATION
    // ========================================
    console.log('\n📚 SECTION 3: Lexicon Exploration');
    console.log('==================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      const availableLexicons = await wordnet.lexicons();
      
      console.log('\n📖 Available Lexicons:');
      availableLexicons.forEach(lexicon => {
        console.log(`  • ${lexicon.id}:${lexicon.version} - ${lexicon.label} (${lexicon.language})`);
        console.log(`    License: ${lexicon.license || 'Unknown'}`);
        console.log(`    URL: ${lexicon.url || 'N/A'}`);
      });
    } catch (error) {
      console.log(`⚠️  Error exploring lexicons: ${error.message}`);
    }

    // ========================================
    // SECTION 4: WORD QUERIES
    // ========================================
    console.log('\n🔍 SECTION 4: Word Queries');
    console.log('===========================');

    const testWords = ['information', 'computer', 'happy', 'run', 'quickly'];
    
    for (const testWord of testWords) {
      console.log(`\n📝 Searching for "${testWord}":`);
      try {
        const foundWords = await words(testWord);
        console.log(`Found ${foundWords.length} words containing "${testWord}"`);
        
        foundWords.slice(0, 3).forEach(word => {
          console.log(`  • ${word.lemma} (${word.partOfSpeech}) - ${word.lexicon}`);
        });
        
        if (foundWords.length > 3) {
          console.log(`  ... and ${foundWords.length - 3} more words`);
        }
      } catch (error) {
        console.log(`⚠️  Error searching for "${testWord}": ${error.message}`);
      }
    }

    // ========================================
    // SECTION 5: SYNSET EXPLORATION
    // ========================================
    console.log('\n📚 SECTION 5: Synset Exploration');
    console.log('==================================');

    const testSynsetWords = ['information', 'computer'];
    
    for (const testWord of testSynsetWords) {
      console.log(`\n🔍 Getting synsets for "${testWord}":`);
      try {
        const foundSynsets = await synsets(testWord);
        console.log(`Found ${foundSynsets.length} synsets for "${testWord}"`);
        
        foundSynsets.slice(0, 2).forEach(synset => {
          console.log(`  • ${synset.id} (${synset.partOfSpeech})`);
          if (synset.definitions && synset.definitions.length > 0) {
            console.log(`    Definition: ${synset.definitions[0].text}`);
          }
          console.log(`    Members: ${synset.members.length} words`);
          console.log(`    Relations: ${synset.relations.length} relations`);
        });
        
        if (foundSynsets.length > 2) {
          console.log(`  ... and ${foundSynsets.length - 2} more synsets`);
        }
      } catch (error) {
        console.log(`⚠️  Error getting synsets for "${testWord}": ${error.message}`);
      }
    }

    // ========================================
    // SECTION 6: SENSE EXPLORATION
    // ========================================
    console.log('\n🎯 SECTION 6: Sense Exploration');
    console.log('================================');

    try {
      const testSenses = await senses('information');
      console.log(`\n🔍 Found ${testSenses.length} senses for "information"`);
      
      testSenses.slice(0, 2).forEach(sense => {
        console.log(`  • Sense ${sense.id}:`);
        console.log(`    Synset: ${sense.synset}`);
        console.log(`    Word: ${sense.word}`);
        console.log(`    Part of Speech: ${sense.partOfSpeech}`);
        if (sense.relations && sense.relations.length > 0) {
          console.log(`    Relations: ${sense.relations.length} relations`);
        }
      });
    } catch (error) {
      console.log(`⚠️  Error exploring senses: ${error.message}`);
    }

    // ========================================
    // SECTION 7: TAXONOMY ANALYSIS
    // ========================================
    console.log('\n🌳 SECTION 7: Taxonomy Analysis');
    console.log('================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      
      // Find roots
      console.log('\n🌱 Finding root synsets...');
      const rootSynsets = await roots(wordnet);
      console.log(`Found ${rootSynsets.length} root synsets`);
      rootSynsets.slice(0, 3).forEach(root => {
        console.log(`  • ${root.id} (${root.partOfSpeech})`);
      });

      // Find leaves
      console.log('\n🍃 Finding leaf synsets...');
      const leafSynsets = await leaves(wordnet);
      console.log(`Found ${leafSynsets.length} leaf synsets`);
      leafSynsets.slice(0, 3).forEach(leaf => {
        console.log(`  • ${leaf.id} (${leaf.partOfSpeech})`);
      });

      // Calculate taxonomy depth
      console.log('\n📏 Calculating taxonomy depth...');
      const nounDepth = await taxonomyDepth(wordnet, 'n');
      const verbDepth = await taxonomyDepth(wordnet, 'v');
      console.log(`Noun taxonomy depth: ${nounDepth}`);
      console.log(`Verb taxonomy depth: ${verbDepth}`);

      // Hypernym paths
      console.log('\n🛤️  Finding hypernym paths...');
      const testSynsets = await synsets('computer');
      if (testSynsets.length > 0) {
        const computerSynset = testSynsets[0];
        const paths = await hypernymPaths(computerSynset, wordnet);
        console.log(`Found ${paths.length} hypernym paths for ${computerSynset.id}`);
        
        if (paths.length > 0) {
          const firstPath = paths[0];
          console.log('Sample path:');
          firstPath.forEach((synset, index) => {
            console.log(`  ${index + 1}. ${synset.id} (${synset.partOfSpeech})`);
          });
        }
      }

    } catch (error) {
      console.log(`⚠️  Error in taxonomy analysis: ${error.message}`);
    }

    // ========================================
    // SECTION 8: SIMILARITY METRICS
    // ========================================
    console.log('\n📊 SECTION 8: Similarity Metrics');
    console.log('==================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      
      // Get test synsets
      const computerSynsets = await synsets('computer');
      const informationSynsets = await synsets('information');
      
      if (computerSynsets.length > 0 && informationSynsets.length > 0) {
        const synset1 = computerSynsets[0];
        const synset2 = informationSynsets[0];
        
        console.log(`\n🔍 Comparing synsets:`);
        console.log(`  • ${synset1.id} (computer)`);
        console.log(`  • ${synset2.id} (information)`);
        
        // Path similarity
        const pathSim = await pathSimilarity(synset1, synset2, wordnet);
        console.log(`\n📏 Path Similarity: ${pathSim.toFixed(4)}`);
        
        // Wu-Palmer similarity
        const wupSim = await wupSimilarity(synset1, synset2, wordnet);
        console.log(`🌳 Wu-Palmer Similarity: ${wupSim.toFixed(4)}`);
        
        // Leacock-Chodorow similarity
        const maxDepth = await taxonomyDepth(wordnet, 'n');
        const lchSim = await lchSimilarity(synset1, synset2, maxDepth, wordnet);
        console.log(`📐 Leacock-Chodorow Similarity: ${lchSim.toFixed(4)}`);
        
        // Information Content based similarities
        try {
          // Create a simple corpus for IC calculation
          const simpleCorpus = ['computer', 'information', 'data', 'system', 'technology'];
          const ic = await computeInformationContent(simpleCorpus, wordnet);
          
          const resSim = await resSimilarity(synset1, synset2, ic, wordnet);
          console.log(`📈 Resnik Similarity: ${resSim.toFixed(4)}`);
          
          const jcnSim = await jcnSimilarity(synset1, synset2, ic, wordnet);
          console.log(`🔗 Jiang-Conrath Similarity: ${jcnSim.toFixed(4)}`);
          
          const linSim = await linSimilarity(synset1, synset2, ic, wordnet);
          console.log(`📊 Lin Similarity: ${linSim.toFixed(4)}`);
        } catch (icError) {
          console.log(`⚠️  Information content calculation failed: ${icError.message}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error in similarity analysis: ${error.message}`);
    }

    // ========================================
    // SECTION 9: MORPHOLOGICAL ANALYSIS
    // ========================================
    console.log('\n🔤 SECTION 9: Morphological Analysis');
    console.log('=====================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      const morphy = createMorphy(wordnet);
      
      const testForms = ['computers', 'running', 'happier', 'quickly'];
      
      console.log('\n🔍 Morphological analysis:');
      for (const form of testForms) {
        console.log(`\n📝 Analyzing "${form}":`);
        const analysis = await morphy.analyze(form);
        
        Object.entries(analysis).forEach(([pos, lemmas]) => {
          if (lemmas && lemmas.size > 0) {
            console.log(`  • ${pos}: ${Array.from(lemmas).join(', ')}`);
          }
        });
      }
    } catch (error) {
      console.log(`⚠️  Error in morphological analysis: ${error.message}`);
    }

    // ========================================
    // SECTION 10: ILI (Interlingual Index)
    // ========================================
    console.log('\n🌍 SECTION 10: Interlingual Index (ILI)');
    console.log('=========================================');

    try {
      console.log('\n🔍 Exploring ILI entries...');
      const iliEntries = await ilis();
      console.log(`Found ${iliEntries.length} ILI entries`);
      
      iliEntries.slice(0, 5).forEach(ili => {
        console.log(`  • ${ili.id}: ${ili.definition || 'No definition'}`);
      });
      
      if (iliEntries.length > 5) {
        console.log(`  ... and ${iliEntries.length - 5} more entries`);
      }
    } catch (error) {
      console.log(`⚠️  Error exploring ILI: ${error.message}`);
    }

    // ========================================
    // SECTION 11: ADVANCED QUERIES
    // ========================================
    console.log('\n🔬 SECTION 11: Advanced Queries');
    console.log('=================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      
      // Get specific word by ID
      console.log('\n🎯 Getting specific word by ID...');
      const testWords = await words('computer');
      if (testWords.length > 0) {
        const computerWord = await word(testWords[0].id);
        if (computerWord) {
          console.log(`Found word: ${computerWord.lemma} (${computerWord.partOfSpeech})`);
        }
      }
      
      // Get specific synset by ID
      console.log('\n📚 Getting specific synset by ID...');
      const testSynsets = await synsets('computer');
      if (testSynsets.length > 0) {
        const computerSynset = await synset(testSynsets[0].id);
        if (computerSynset) {
          console.log(`Found synset: ${computerSynset.id} (${computerSynset.partOfSpeech})`);
          if (computerSynset.definitions && computerSynset.definitions.length > 0) {
            console.log(`Definition: ${computerSynset.definitions[0].text}`);
          }
        }
      }
      
      // Get specific sense by ID
      console.log('\n🎯 Getting specific sense by ID...');
      const testSenses = await senses('computer');
      if (testSenses.length > 0) {
        const computerSense = await sense(testSenses[0].id);
        if (computerSense) {
          console.log(`Found sense: ${computerSense.id} (${computerSense.partOfSpeech})`);
        }
      }
      
    } catch (error) {
      console.log(`⚠️  Error in advanced queries: ${error.message}`);
    }

    // ========================================
    // SECTION 12: SHORTEST PATH ANALYSIS
    // ========================================
    console.log('\n🛤️  SECTION 12: Shortest Path Analysis');
    console.log('========================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      
      const computerSynsets = await synsets('computer');
      const informationSynsets = await synsets('information');
      
      if (computerSynsets.length > 0 && informationSynsets.length > 0) {
        const synset1 = computerSynsets[0];
        const synset2 = informationSynsets[0];
        
        console.log(`\n🔍 Finding shortest path between:`);
        console.log(`  • ${synset1.id} (computer)`);
        console.log(`  • ${synset2.id} (information)`);
        
        const shortestPath = await taxonomyShortestPath(synset1, synset2, wordnet);
        console.log(`\n📏 Shortest path (${shortestPath.length} steps):`);
        shortestPath.forEach((synset, index) => {
          console.log(`  ${index + 1}. ${synset.id} (${synset.partOfSpeech})`);
        });
        
        // Calculate minimum depth
        const minDepthValue = await minDepth(synset1, wordnet);
        console.log(`\n📐 Minimum depth of ${synset1.id}: ${minDepthValue}`);
      }
    } catch (error) {
      console.log(`⚠️  Error in shortest path analysis: ${error.message}`);
    }

    // ========================================
    // SECTION 13: PERFORMANCE METRICS
    // ========================================
    console.log('\n⚡ SECTION 13: Performance Metrics');
    console.log('==================================');

    try {
      const wordnet = new Wordnet('oewn:2024');
      
      console.log('\n⏱️  Performance benchmarks:');
      
      // Word search performance
      const startTime = Date.now();
      const searchResults = await words('computer');
      const searchTime = Date.now() - startTime;
      console.log(`  • Word search: ${searchTime}ms for ${searchResults.length} results`);
      
      // Synset search performance
      const synsetStartTime = Date.now();
      const synsetResults = await synsets('computer');
      const synsetTime = Date.now() - synsetStartTime;
      console.log(`  • Synset search: ${synsetTime}ms for ${synsetResults.length} results`);
      
      // Taxonomy depth calculation performance
      const depthStartTime = Date.now();
      const depth = await taxonomyDepth(wordnet, 'n');
      const depthTime = Date.now() - depthStartTime;
      console.log(`  • Taxonomy depth calculation: ${depthTime}ms (depth: ${depth})`);
      
    } catch (error) {
      console.log(`⚠️  Error in performance metrics: ${error.message}`);
    }

    console.log('\n🎉 Kitchen Sink Demo Completed!');
    console.log('\n💡 This demo showcased:');
    console.log('   • Project management and data download');
    console.log('   • Word and synset queries');
    console.log('   • Taxonomy analysis (roots, leaves, paths)');
    console.log('   • Similarity metrics (path, Wu-Palmer, etc.)');
    console.log('   • Morphological analysis (lemmatization)');
    console.log('   • Interlingual Index exploration');
    console.log('   • Advanced queries and performance metrics');
    console.log('\n🚀 Try exploring more features or different projects!');

    // Clean up
    try {
      await db.close?.();
      console.log('✅ Database closed gracefully.');
    } catch (e) {
      console.warn('⚠️ Error closing database:', e);
    }

  } catch (error) {
    console.error('❌ Kitchen sink demo failed:', error.message);
    try {
      await db.close?.();
      console.log('✅ Database closed gracefully (after error).');
    } catch (e) {
      console.warn('⚠️ Error closing database (after error):', e);
    }
    process.exit(1);
  }
}

// Run the comprehensive demo
runKitchenSinkDemo(); 