import { Command } from 'commander';
import { lexicons, makeBrowserData } from 'wn-ts-core';

export default function registerBrowserCommands(program: Command) {
  const browser = program
    .command('browser')
    .description('Browser/web build tools for wn-ts-web');

  browser
    .command('prep')
    .description('Prepare browser-optimized WordNet data modules for wn-ts-web (multilingual aware)')
    .option('--lexicon <id>', 'Lexicon ID to export (default: oewn)', 'oewn')
    .option('--outDir <dir>', 'Output directory for browser data', '../../wn-ts-web/data')
    .option('--chunk-size <size>', 'Number of entries per chunk (default: 1000)', '1000')
    .option('--dry-run', 'Show what would be done without writing files')
    .option('--debug', 'Enable debug logging output') // Changed from --verbose to --debug
    .action(async (options) => {
      try {
        const lexicon = options.lexicon || 'oewn';
        const outDir = options.outDir;
        const chunkSize = parseInt(options.chunkSize, 10);
        const dryRun = !!options.dryRun;
        const debug = !!options.debug; // Changed from verbose to debug

        if (debug) { // Conditional logging
          console.log(`[prep] 🚀 Starting browser data preparation for lexicon '${lexicon}'`);
          console.log(`[prep] 📁 Output directory: ${outDir}`);
          console.log(`[prep] 📦 Chunk size: ${chunkSize.toLocaleString()}`);
          console.log(`[prep] 🔧 Dry run: ${dryRun ? 'Yes' : 'No'}`);
        }

        // Check if lexicon is installed using lexicons()
        const installedLexicons = await lexicons();
        if (!installedLexicons.some(l => l.id === lexicon)) {
          throw new Error(`Lexicon '${lexicon}' is not installed. Please run 'wn-cli data download ${lexicon}' first.`);
        }

        makeBrowserData({
          lexiconId: lexicon,
          outDir,
          chunkSize,
          dryRun,
          debug // Changed from verbose to debug
        });

        if (debug) { // Conditional logging
          console.log(`[prep] ✅ Browser data preparation completed successfully for lexicon '${lexicon}'`);
        }
      } catch (error) {
        console.error(`❌ Browser data preparation failed: ${error}`);
      }
    });

  browser
    .command('help')
    .description('Show help for browser commands')
    .action(() => {
      console.log(`
Browser Commands:
  prep [options]     Prepare browser-optimized WordNet data modules

Options:
  --lexicon <id>     Lexicon ID to export (default: oewn)
  --outDir <dir>     Output directory for browser data (default: ../../wn-ts-web/data)
  --chunk-size <size> Number of entries per chunk (default: 1000)
  --dry-run          Show what would be done without writing files
  --debug            Enable debug logging output

Examples:
  wn-cli browser prep --lexicon oewn --outDir ./data
  wn-cli browser prep --lexicon oewn --chunk-size 500 --debug
  wn-cli browser prep --dry-run --no-progress
                `);
    });
} 
