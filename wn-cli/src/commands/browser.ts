import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { config, lexicons } from 'wn-ts';
import type { Lexicon } from 'wn-ts';

function parseIndexFile(text: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(' ')) continue;
    const firstSpace = line.indexOf(' ');
    if (firstSpace === -1) continue;
    const lemma = line.substring(0, firstSpace);
    obj[lemma] = line.substring(firstSpace + 1);
  }
  return obj;
}

function parseDataFile(text: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(' ')) continue;
    const firstSpace = line.indexOf(' ');
    if (firstSpace === -1) continue;
    const offset = line.substring(0, firstSpace);
    obj[offset] = line.substring(firstSpace + 1);
  }
  return obj;
}

export default function registerBrowserCommands(program: Command) {
  const browser = program
    .command('browser')
    .description('Browser/web build tools for wn-ts-web');

  browser
    .command('prep')
    .description('Prepare browser-optimized WordNet data modules for wn-ts-web (multilingual aware)')
    .option('--lexicon <id>', 'Lexicon ID to export (default: oewn)', 'oewn')
    .option('--outDir <dir>', 'Output directory for browser data', '../../wn-ts-web/data')
    .option('--dry-run', 'Show what would be done without writing files')
    .action(async (options) => {
      const lexicon = options.lexicon || 'oewn';
      const outDir = path.resolve(options.outDir, lexicon);
      const dryRun = !!options.dryRun;
      // Check if lexicon is installed using lexicons()
      const installedLexicons = await lexicons();
      const installed = installedLexicons.find((l: Lexicon) => l.id === lexicon);
      if (!installed) {
        console.error(`❌ Lexicon '${lexicon}' is not installed. Please download it first: wn-cli data download ${lexicon}`);
        process.exit(1);
        return;
      }
      // Find index/data files for the lexicon
      // Assume that the data files are in a directory named after the lexicon ID
      // inside the main wn-ts data directory.
      const lexiconDir = path.join(config.dataDirectory, lexicon);
      if (!fs.existsSync(lexiconDir)) {
        console.error(`❌ Could not locate data directory for lexicon '${lexicon}'. Path tried: ${lexiconDir}`);
        process.exit(1);
        return;
      }
      const filesToConvert = ['index.noun', 'index.verb', 'index.adj', 'index.adv', 'data.noun', 'data.verb', 'data.adj', 'data.adv'];
      if (!fs.existsSync(outDir) && !dryRun) fs.mkdirSync(outDir, { recursive: true });
      let anyFound = false;
      for (const file of filesToConvert) {
        const src = path.join(lexiconDir, file);
        const dest = path.join(outDir, file + '.json');
        if (fs.existsSync(src)) {
          anyFound = true;
          const text = fs.readFileSync(src, 'utf8');
          let obj: Record<string, string> = {};
          if (file.startsWith('index.')) obj = parseIndexFile(text);
          else if (file.startsWith('data.')) obj = parseDataFile(text);
          if (!dryRun) fs.writeFileSync(dest, JSON.stringify(obj, null, 2), 'utf8');
          console.log(`[prep] ${dryRun ? 'Would write' : 'Wrote'} ${dest}`);
        } else {
          console.warn(`[prep] Source file not found: ${src}`);
        }
      }
      if (!anyFound) {
        console.error(`❌ No index/data files found for lexicon '${lexicon}'.`);
        process.exit(1);
        return;
      }
      console.log(`[prep] Browser data prep complete for lexicon '${lexicon}'. Output: ${outDir}`);
    })
    .addHelpText('after', `
Examples:
  $ wn-cli browser prep --lexicon oewn
  $ wn-cli browser prep --lexicon wn31 --outDir ../my-web-app/data
`);
} 
