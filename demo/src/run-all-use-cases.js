#!/usr/bin/env node

/**
 * Master Demo Runner - All Examples
 * 
 * Runs all individual example demos in sequence to showcase the complete
 * capabilities of the WordNet TypeScript library.
 * 
 * Organized by complexity: Basic → Advanced → Comprehensive
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examples = [
  // ===== BASIC EXAMPLES =====
  {
    name: 'Python-Style WordNet Example (Basic)',
    file: 'examples/basic/python-style-wordnet.js',
    description: 'Minimal Python-wn style example demonstrating basic synset lookup and definition retrieval',
    category: 'Basic',
    focus: 'API Compatibility'
  },
  {
    name: 'Word Sense Disambiguation (Basic)',
    file: 'examples/basic/word-sense-disambiguation.js',
    description: 'Understanding different meanings of polysemous words - focused demo',
    category: 'Basic',
    focus: 'Semantic Analysis'
  },
  {
    name: 'Database Statistics (Basic)',
    file: 'examples/basic/database-statistics.js',
    description: 'Analyzing database scope and quality - focused demo',
    category: 'Basic',
    focus: 'Data Analysis'
  },
  {
    name: 'Multilingual Definitions (Basic)',
    file: 'examples/basic/multilingual-definitions.js',
    description: 'Retrieving and comparing definitions across different languages - focused demo',
    category: 'Basic',
    focus: 'Cross-Language'
  },
  
  // ===== ADVANCED EXAMPLES =====
  {
    name: 'Live Demo (Advanced)',
    file: 'examples/advanced/live-demo.js',
    description: 'Multi-step live demonstration with setup, download, and querying',
    category: 'Advanced',
    focus: 'System Setup'
  },
  {
    name: 'Multilingual Word Linking (Advanced)',
    file: 'examples/advanced/multilingual-linking.js',
    description: 'Linking words across languages using ILI - comprehensive demo',
    category: 'Advanced',
    focus: 'Cross-Language'
  },
  {
    name: 'Lexical Database Exploration (Advanced)',
    file: 'examples/advanced/lexical-database-exploration.js',
    description: 'Discovering available linguistic resources - comprehensive demo',
    category: 'Advanced',
    focus: 'Resource Discovery'
  },
  {
    name: 'Word Sense Disambiguation (Advanced)',
    file: 'examples/advanced/word-sense-disambiguation.js',
    description: 'Understanding different meanings of polysemous words - comprehensive demo',
    category: 'Advanced',
    focus: 'Semantic Analysis'
  },
  {
    name: 'Database Statistics (Advanced)',
    file: 'examples/advanced/database-statistics.js',
    description: 'Analyzing database scope and quality - comprehensive demo',
    category: 'Advanced',
    focus: 'Data Analysis'
  },
  
  // ===== COMPREHENSIVE EXAMPLES =====
  {
    name: 'Kitchen Sink Demo (Comprehensive)',
    file: 'examples/advanced/kitchen-sink-demo.js',
    description: 'Comprehensive feature showcase demonstrating all major WordNet capabilities',
    category: 'Comprehensive',
    focus: 'Feature Showcase'
  }
];

console.log(`
🚀 WordNet TypeScript - Complete Examples Demo
==============================================

Running all examples to showcase the library's capabilities...
Organized by complexity: Basic → Advanced → Comprehensive
`);

async function runExample(example, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎯 Example ${index + 1}: ${example.name}`);
    console.log(`📂 Category: ${example.category}`);
    console.log(`🎯 Focus: ${example.focus}`);
    console.log(`📝 ${example.description}`);
    console.log(`${'='.repeat(70)}\n`);
    
    const examplePath = join(__dirname, example.file);
    const child = spawn('node', [examplePath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Example ${index + 1} completed successfully!\n`);
        resolve();
      } else {
        console.log(`\n❌ Example ${index + 1} failed with code ${code}\n`);
        reject(new Error(`Example ${index + 1} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Example ${index + 1} error: ${error.message}\n`);
      reject(error);
    });
  });
}

async function runAllExamples() {
  console.log(`📋 Running ${examples.length} examples...\n`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
  // Group examples by category for better organization
  const basicExamples = examples.filter(ex => ex.category === 'Basic');
  const advancedExamples = examples.filter(ex => ex.category === 'Advanced');
  const comprehensiveExamples = examples.filter(ex => ex.category === 'Comprehensive');
  
  console.log(`📚 Basic Examples (${basicExamples.length}):`);
  basicExamples.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.focus}`);
  });
  
  console.log(`\n🚀 Advanced Examples (${advancedExamples.length}):`);
  advancedExamples.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.focus}`);
  });
  
  console.log(`\n🌟 Comprehensive Examples (${comprehensiveExamples.length}):`);
  comprehensiveExamples.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.focus}`);
  });
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎬 Starting Demo Sequence...`);
  console.log(`${'='.repeat(70)}\n`);
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    try {
      await runExample(example, i);
      successCount++;
    } catch (error) {
      failureCount++;
      console.log(`⚠️  Continuing with next example...\n`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎉 All Examples Demo Completed!`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}/${examples.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${examples.length}`);
  console.log(`  ⏱️  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`\n🚀 WordNet TypeScript library is ready for real-world applications!`);
  
  console.log(`\n💡 Key capabilities demonstrated:`);
  console.log(`\n📚 Basic Capabilities:`);
  basicExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.name}: ${example.description}`);
  });
  
  console.log(`\n🚀 Advanced Capabilities:`);
  advancedExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.name}: ${example.description}`);
  });
  
  console.log(`\n🌟 Comprehensive Capabilities:`);
  comprehensiveExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.name}: ${example.description}`);
  });
  
  console.log(`\n🎯 Use Cases Covered:`);
  console.log(`  • API Compatibility: Python-style wn library port`);
  console.log(`  • Semantic Analysis: Word sense disambiguation`);
  console.log(`  • Data Analysis: Database statistics and quality metrics`);
  console.log(`  • System Setup: Download, configuration, and initialization`);
  console.log(`  • Cross-Language: Multilingual word linking via ILI`);
  console.log(`  • Resource Discovery: Lexicon exploration and metadata`);
  console.log(`  • Feature Showcase: Comprehensive capability demonstration`);
  
  console.log(`\n🔧 Technical Features:`);
  console.log(`  • Consistent error handling and database management`);
  console.log(`  • Helper functions for standardized patterns`);
  console.log(`  • ILI-based definition retrieval`);
  console.log(`  • Multilingual support across multiple lexicons`);
  console.log(`  • Comprehensive data quality analysis`);
  console.log(`  • Real-world application examples`);
}

// Run all examples
runAllExamples().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 