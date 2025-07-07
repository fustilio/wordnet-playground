#!/usr/bin/env node

/**
 * Master Demo Runner - All Use Cases
 * 
 * Runs all individual use case demos in sequence to showcase the complete
 * capabilities of the WordNet TypeScript library.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const useCases = [
  {
    name: 'Multilingual Word Linking',
    file: '01-multilingual-linking.js',
    description: 'Linking words across languages using ILI'
  },
  {
    name: 'Word Sense Disambiguation',
    file: '02-word-sense-disambiguation.js',
    description: 'Understanding different meanings of polysemous words'
  },
  {
    name: 'Lexical Database Exploration',
    file: '03-lexical-database-exploration.js',
    description: 'Discovering available linguistic resources'
  },
  {
    name: 'Database Statistics and Coverage',
    file: '04-database-statistics.js',
    description: 'Analyzing database scope and quality'
  }
];

console.log(`
🚀 WordNet TypeScript - Complete Use Cases Demo
===============================================

Running all use cases to showcase the library's capabilities...
`);

async function runUseCase(useCase, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Use Case ${index + 1}: ${useCase.name}`);
    console.log(`📝 ${useCase.description}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const useCasePath = join(__dirname, 'use-cases', useCase.file);
    const child = spawn('node', [useCasePath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Use Case ${index + 1} completed successfully!\n`);
        resolve();
      } else {
        console.log(`\n❌ Use Case ${index + 1} failed with code ${code}\n`);
        reject(new Error(`Use case ${index + 1} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Use Case ${index + 1} error: ${error.message}\n`);
      reject(error);
    });
  });
}

async function runAllUseCases() {
  console.log(`📋 Running ${useCases.length} use cases...\n`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < useCases.length; i++) {
    const useCase = useCases[i];
    try {
      await runUseCase(useCase, i);
      successCount++;
    } catch (error) {
      failureCount++;
      console.log(`⚠️  Continuing with next use case...\n`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 All Use Cases Demo Completed!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}/${useCases.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${useCases.length}`);
  console.log(`  ⏱️  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`\n🚀 WordNet TypeScript library is ready for real-world applications!`);
  console.log(`\n💡 Key capabilities demonstrated:`);
  useCases.forEach((useCase, index) => {
    console.log(`  ${index + 1}. ${useCase.name}: ${useCase.description}`);
  });
}

// Run all use cases
runAllUseCases().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 