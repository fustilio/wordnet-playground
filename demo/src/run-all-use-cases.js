#!/usr/bin/env node

/**
 * Master Demo Runner - All Examples
 * 
 * Runs all individual example demos in sequence to showcase the complete
 * capabilities of the WordNet TypeScript library.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examples = [
  {
    name: 'Word Sense Disambiguation (Basic)',
    file: 'examples/basic/word-sense-disambiguation.js',
    description: 'Understanding different meanings of polysemous words - focused demo'
  },
  {
    name: 'Database Statistics (Basic)',
    file: 'examples/basic/database-statistics.js',
    description: 'Analyzing database scope and quality - focused demo'
  },
  {
    name: 'Multilingual Word Linking (Advanced)',
    file: 'examples/advanced/multilingual-linking.js',
    description: 'Linking words across languages using ILI - comprehensive demo'
  },
  {
    name: 'Lexical Database Exploration (Advanced)',
    file: 'examples/advanced/lexical-database-exploration.js',
    description: 'Discovering available linguistic resources - comprehensive demo'
  },
  {
    name: 'Word Sense Disambiguation (Advanced)',
    file: 'examples/advanced/word-sense-disambiguation.js',
    description: 'Understanding different meanings of polysemous words - comprehensive demo'
  },
  {
    name: 'Database Statistics (Advanced)',
    file: 'examples/advanced/database-statistics.js',
    description: 'Analyzing database scope and quality - comprehensive demo'
  }
];

console.log(`
🚀 WordNet TypeScript - Complete Examples Demo
==============================================

Running all examples to showcase the library's capabilities...
`);

async function runExample(example, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Example ${index + 1}: ${example.name}`);
    console.log(`📝 ${example.description}`);
    console.log(`${'='.repeat(60)}\n`);
    
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
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 All Examples Demo Completed!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}/${examples.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${examples.length}`);
  console.log(`  ⏱️  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`\n🚀 WordNet TypeScript library is ready for real-world applications!`);
  console.log(`\n💡 Key capabilities demonstrated:`);
  examples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.name}: ${example.description}`);
  });
}

// Run all examples
runAllExamples().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 