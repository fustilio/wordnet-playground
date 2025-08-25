#!/usr/bin/env node

import { run } from '@vitest/run';
import { createServer } from 'vitest/node';

async function runTests() {
  console.log('🚀 Starting XML Introspector Tests...\n');

  try {
    // Run all tests
    const server = await createServer({
      configFile: '../vitest.config.ts',
      mode: 'test'
    });

    await server.start();

    const result = await run({
      server,
      include: ['**/*.test.ts'],
      reporter: 'verbose'
    });

    await server.close();

    if (result.exitCode === 0) {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
