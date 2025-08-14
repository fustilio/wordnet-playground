#!/usr/bin/env node

/**
 * E2E Test Runner for WordNet Orchestration
 * 
 * This script runs the end-to-end tests for the new orchestration architecture.
 * It can be run independently or as part of the main test suite.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';

const TEST_DIR = resolve(__dirname);
const PROJECT_ROOT = resolve(TEST_DIR, '../..');

console.log('🚀 Starting WordNet Orchestration E2E Tests');
console.log(`📁 Test directory: ${TEST_DIR}`);
console.log(`🏠 Project root: ${PROJECT_ROOT}`);

// Check if we're in the right directory
if (!existsSync(resolve(PROJECT_ROOT, 'package.json'))) {
  console.error('❌ Error: package.json not found. Please run from project root.');
  process.exit(1);
}

// Check if vitest is available
try {
  execSync('npx vitest --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Error: vitest not found. Please install it first:');
  console.error('   npm install -D vitest');
  console.error('   or');
  console.error('   pnpm add -D vitest');
  process.exit(1);
}

// Run the e2e tests
console.log('\n🧪 Running E2E tests...\n');

try {
  const testCommand = `npx vitest run ${TEST_DIR} --reporter=verbose --config=${resolve(PROJECT_ROOT, 'vitest.config.ts')}`;
  
  console.log(`📝 Command: ${testCommand}\n`);
  
  execSync(testCommand, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      VITEST_MODE: 'e2e'
    }
  });
  
  console.log('\n✅ All E2E tests passed!');
  
} catch (error) {
  console.error('\n❌ E2E tests failed!');
  console.error('Check the output above for details.');
  process.exit(1);
}

console.log('\n🎉 E2E test run completed successfully!');
console.log('\n📋 Test Summary:');
console.log('   • WordNetOrchestrator E2E tests');
console.log('   • WordNetWorkerClient E2E tests');
console.log('   • Integration scenarios');
console.log('   • Error handling and edge cases');
console.log('\n💡 Next steps:');
console.log('   • Run unit tests: pnpm test');
console.log('   • Run all tests: pnpm test:all');
console.log('   • Build project: pnpm build');
