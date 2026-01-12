/**
 * Turso Demo - Demonstrates actual Turso database connectivity
 *
 * Requires environment variables:
 *   TURSO_URL - Your Turso database URL (libsql://...)
 *   TURSO_AUTH_TOKEN - Your Turso auth token
 *
 * Run with: TURSO_URL=... TURSO_AUTH_TOKEN=... pnpm turso
 */

import { TursoDatabase } from 'wn-turso';

async function main() {
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.log('Turso Demo - Database Connectivity Test\n');
    console.log('This demo requires Turso credentials.');
    console.log('');
    console.log('Set environment variables:');
    console.log('  TURSO_URL=libsql://your-db.turso.io');
    console.log('  TURSO_AUTH_TOKEN=your-token');
    console.log('');
    console.log('Then run: TURSO_URL=... TURSO_AUTH_TOKEN=... pnpm turso');
    console.log('');
    console.log('For now, running pipeline demo instead...\n');

    // Fall back to pipeline demo
    const { default: pipelineDemo } = await import('./pipeline-demo.js');
    return;
  }

  console.log('Turso Demo - Database Connectivity Test\n');
  console.log('='.repeat(50));
  console.log();

  console.log('Connecting to Turso...');
  console.log('URL:', url);
  console.log();

  const db = new TursoDatabase({
    url,
    authToken,
    mode: 'remote',
    readonly: true,
  });

  try {
    await db.initialize();
    console.log('Connected successfully!\n');

    const adapter = db.getAdapter();
    console.log('Adapter:', adapter.getName());
    console.log('Status:', adapter.getInfo());
    console.log();

    // Try a simple query
    const queryService = db.getQueryService();
    const lexicons = await queryService.getLexicons();
    console.log('Lexicons found:', lexicons.length);

    if (lexicons.length > 0) {
      console.log('First lexicon:', lexicons[0]);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
    console.log('\nConnection closed.');
  }

  console.log('='.repeat(50));
  console.log('Demo completed!');
}

main().catch(console.error);
