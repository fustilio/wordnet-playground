import { Command } from "commander";
import { lexicons as getInstalledLexicons } from "wn-ts";
import { colors } from "./utils/colors.js";
import { LexiconHelper } from "../utils/lexicon-helpers.js";
import { getWordnetInstance } from "../wordnet-singleton.js";

function registerLexiconsCommand(program: Command) {
  program
    .command("lexicons")
    .description("List all available lexicons with installation status")
    .option("-s, --search <term>", "Search for lexicons containing term")
    .option("-l, --language <lang>", "Filter by language (e.g., en, fr, de)")
    .option("-i, --installed", "Show only installed lexicons")
    .option("-a, --available", "Show only available (not installed) lexicons")
    .option("-v, --verbose", "Show detailed information")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      try {
        getWordnetInstance();
        // Get all available lexicons from the index
        const availableLexicons = LexiconHelper.getAllLexiconIds();
        const lexiconData = LexiconHelper.loadIndexData();
        
        // Get installed lexicons
        let installedLexicons: any[] = [];
        try {
          installedLexicons = await getInstalledLexicons();
        } catch (error) {
          // If no lexicons are installed, this is fine
        }
        
        const installedIds = new Set(installedLexicons.map(l => l.id));
        const installedData = Object.fromEntries(installedLexicons.map(l => [l.id, l]));
        
        // Create a unified list of all lexicon IDs
        const allLexiconIds = [...new Set([...availableLexicons, ...installedIds])];
        
        // Filter lexicons based on options
        let filteredLexicons = allLexiconIds;
        
        if (options.search) {
          const searchTerm = options.search.toLowerCase();
          filteredLexicons = filteredLexicons.filter(id => {
            const indexInfo = lexiconData[id];
            const dbInfo = installedData[id];
            const label = dbInfo?.label || indexInfo?.label;
            const language = dbInfo?.language || indexInfo?.language;
            return id.toLowerCase().includes(searchTerm) ||
                   (label && label.toLowerCase().includes(searchTerm)) ||
                   (language && language.toLowerCase().includes(searchTerm));
          });
        }
        
        if (options.language) {
          const lang = options.language.toLowerCase();
          filteredLexicons = filteredLexicons.filter(id => {
            const indexInfo = lexiconData[id];
            const dbInfo = installedData[id];
            const language = dbInfo?.language || indexInfo?.language;
            return language?.toLowerCase() === lang;
          });
        }
        
        if (options.installed) {
          filteredLexicons = filteredLexicons.filter(id => installedIds.has(id));
        }
        
        if (options.available) {
          filteredLexicons = filteredLexicons.filter(id => !installedIds.has(id));
        }
        
        // Prepare data for output
        const lexiconList = filteredLexicons.map(id => {
          const indexInfo = lexiconData[id];
          const dbInfo = installedData[id];
          const isInstalled = installedIds.has(id);
          
          return {
            id,
            name: dbInfo?.label || indexInfo?.label || id,
            language: dbInfo?.language || indexInfo?.language || 'unknown',
            status: isInstalled ? 'installed' : 'available',
            version: dbInfo?.version || null,
            size: dbInfo?.size || null,
          };
        });
        
        if (options.json) {
          console.log(JSON.stringify(lexiconList, null, 2));
          return;
        }
        
        // Display table
        console.log(colors.bold("Available Lexicons:"));
        console.log(colors.dim("==================="));
        
        if (lexiconList.length === 0) {
          console.log(colors.yellow("No lexicons found matching your criteria."));
          if (options.search) {
            console.log(colors.yellow(`Try a different search term or run without --search to see all lexicons.`));
          }
          if (options.language) {
            console.log(colors.yellow(`Try a different language code or run without --language to see all lexicons.`));
          }
          return;
        }
        
        // Calculate column widths
        const maxIdLength = Math.max(...lexiconList.map(l => l.id.length), 8);
        const maxNameLength = Math.max(...lexiconList.map(l => l.name.length), 20);
        const maxLangLength = Math.max(...lexiconList.map(l => l.language.length), 8);
        
        // Header
        const header = [
          'ID'.padEnd(maxIdLength),
          'Name'.padEnd(maxNameLength),
          'Language'.padEnd(maxLangLength),
          'Status'.padEnd(12),
          'Version'.padEnd(10)
        ].join(' | ');
        
        console.log(colors.bold(header));
        console.log(colors.dim('-'.repeat(header.length)));
        
        // Rows
        lexiconList.forEach(lexicon => {
          const statusColor = lexicon.status === 'installed' ? colors.green : colors.yellow;
          const statusIcon = lexicon.status === 'installed' ? '✅' : '📦';
          
          const row = [
            colors.cyan(lexicon.id.padEnd(maxIdLength)),
            lexicon.name.padEnd(maxNameLength),
            lexicon.language.padEnd(maxLangLength),
            statusColor((statusIcon + ' ' + lexicon.status).padEnd(12)),
            (lexicon.version || '-').padEnd(10)
          ].join(' | ');
          console.log(row);
        });
        // Summary
        const installedCount = lexiconList.filter(l => l.status === 'installed').length;
        const availableCount = lexiconList.filter(l => l.status === 'available').length;
        console.log(colors.dim('-'.repeat(header.length)));
        console.log(colors.bold(`Summary: ${installedCount} installed, ${availableCount} available`));
        if (availableCount > 0) {
          console.log(colors.yellow(`\n💡 Tip: Use 'wn-cli data download <lexicon-id>' to install available lexicons.`));
        }
        if (installedCount > 0) {
          console.log(colors.green(`\n💡 Tip: Use 'wn-cli query lookup <word> --lexicon <lexicon-id>' to query installed lexicons.`));
        }
      } catch (error) {
        console.error(colors.red("Error listing lexicons:"), error);
      }
    });
}

export default registerLexiconsCommand;
