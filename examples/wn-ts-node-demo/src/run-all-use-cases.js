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
  {
    name: 'Python-Style WordNet API (Basic)',
    file: 'examples/basic/python-style-wordnet.js',
    description: 'Demonstrates API patterns similar to the Python wn library.',
    focus: 'API Parity'
  },
  {
    name: 'Word Sense Disambiguation (Basic)',
    file: 'examples/basic/word-sense-disambiguation.js',
    description: 'A focused demo on understanding the different meanings of polysemous words.',
    focus: 'Semantic Analysis'
  },
  {
    name: 'Database Statistics (Basic)',
    file: 'examples/basic/database-statistics.js',
    description: 'A focused demo on analyzing database scope and quality.',
    focus: 'Data Analysis'
  },
  {
    name: 'Multilingual Definitions (Basic)',
    file: 'examples/basic/multilingual-definitions.js',
    description: 'A focused demo on retrieving and comparing definitions across different languages.',
    focus: 'Cross-Language'
  },
  {
    name: 'Multilingual Word Linking (Advanced)',
    file: 'examples/advanced/multilingual-linking.js',
    description: 'A comprehensive demo on linking words across languages using the ILI.',
    focus: 'Cross-Language'
  },
  {
    name: 'Lexical Database Exploration (Advanced)',
    file: 'examples/advanced/lexical-database-exploration.js',
    description: 'A comprehensive demo on discovering available linguistic resources.',
    focus: 'Resource Discovery'
  },
  {
    name: 'Word Sense Disambiguation (Advanced)',
    file: 'examples/advanced/word-sense-disambiguation.js',
    description: 'A comprehensive demo on understanding the different meanings of polysemous words.',
    focus: 'Semantic Analysis'
  },
  {
    name: 'Database Statistics (Advanced)',
    file: 'examples/advanced/database-statistics.js',
    description: 'A comprehensive demo on analyzing database scope and quality.',
    focus: 'Data Analysis'
  },
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
    console.log(`🎯 Running Use Case ${index + 1}/${examples.length}: ${example.name}`);
    console.log(`   Focus: ${example.focus}`);
    console.log(`   File: ${example.file}`);
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
  console.log(`📋 Running ${examples.length} automated use cases...\n`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
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
  console.log(`🎉 All Use Cases Completed!`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}/${examples.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${examples.length}`);
  console.log(`  ⏱️  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
  
  if (failureCount > 0) {
    console.log('\nSome use cases failed. Please review the logs above.');
    process.exit(1);
  } else {
    console.log(`\n🚀 All use cases passed, validating the core features of wn-ts.`);
  }
}

// Run all examples
runAllExamples().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
