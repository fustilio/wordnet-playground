#!/usr/bin/env node

/**
 * wn-turso CLI
 */

import { parseArgs } from 'util';

async function main() {
  const { positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      url: { type: 'string' },
      token: { type: 'string', short: 't' },
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      verbose: { type: 'boolean', short: 'v' },
    },
  });

  const command = positionals[0];

  switch (command) {
    case 'upload':
      console.log('Upload command - not yet implemented');
      console.log('Will upload a local SQLite database to Turso');
      break;
    case 'sync':
      console.log('Sync command - not yet implemented');
      console.log('Will sync an embedded replica with Turso cloud');
      break;
    case 'help':
    default:
      showHelp();
  }
}

function showHelp() {
  console.log(`
wn-turso - Turso database tools for WordNet

USAGE:
  wn-turso <command> [options]

COMMANDS:
  upload    Upload local SQLite database to Turso
  sync      Sync embedded replica with Turso cloud
  help      Show this help

OPTIONS:
  --url       Turso database URL
  --token     Turso auth token
  --input     Input file path
  --output    Output file path
  --verbose   Enable verbose logging
  --help      Show this help

EXAMPLES:
  wn-turso upload --url libsql://db.turso.io --token $TURSO_TOKEN --input ./wordnet.db
  wn-turso sync --url file:./local.db --token $TURSO_TOKEN
`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
