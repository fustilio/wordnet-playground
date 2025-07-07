#!/usr/bin/env node

/**
 * Command-line interface for wn-ts library.
 * 
 * Provides tools for downloading, querying, and managing WordNet data.
 */

import { Command } from 'commander';
import { download, add, remove, exportData } from './data-management.js';
import { getProjects } from './project.js';
import { Wordnet } from './wordnet.js';
import { config } from './config.js';

const program = new Command();

program
  .name('wn-ts')
  .description('WordNet TypeScript interface - command line tools')
  .version('0.1.0');

// Download command
program
  .command('download')
  .description('Download WordNet projects')
  .argument('<project>', 'Project identifier (e.g., oewn:2024)')
  .option('-f, --force', 'Force re-download')
  .option('-p, --progress', 'Show progress')
  .action(async (project: string, options: { force?: boolean; progress?: boolean }) => {
    try {
      console.log(`Downloading ${project}...`);
      const downloadOptions: any = { force: options.force };
      if (options.progress) {
        downloadOptions.progress = (p: number) => console.log(`Progress: ${Math.round(p * 100)}%`);
      }
      await download(project, downloadOptions);
      console.log(`✅ Successfully downloaded ${project}`);
    } catch (error) {
      console.error(`❌ Failed to download ${project}:`, error);
      process.exit(1);
    }
  });

// Add command
program
  .command('add')
  .description('Add a lexical resource to the database')
  .argument('<file>', 'Path to LMF XML file')
  .option('-f, --force', 'Force re-add')
  .action(async (file: string, options: { force?: boolean }) => {
    try {
      console.log(`Adding ${file}...`);
      const addOptions: any = {};
      if (options.force) {
        addOptions.force = true;
      }
      addOptions.progress = (p: number) => console.log(`Progress: ${Math.round(p * 100)}%`);
      await add(file, addOptions);
      console.log(`✅ Successfully added ${file}`);
    } catch (error) {
      console.error(`❌ Failed to add ${file}:`, error);
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove')
  .description('Remove a lexicon from the database')
  .argument('<lexicon>', 'Lexicon identifier')
  .action(async (lexicon: string) => {
    try {
      console.log(`Removing ${lexicon}...`);
      await remove(lexicon);
      console.log(`✅ Successfully removed ${lexicon}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${lexicon}:`, error);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export data from the database')
  .option('-f, --format <format>', 'Export format (json, xml, csv)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .option('-i, --include <lexicons>', 'Comma-separated list of lexicons to include')
  .option('-e, --exclude <lexicons>', 'Comma-separated list of lexicons to exclude')
  .action(async (options: { format?: string; output?: string; include?: string; exclude?: string }) => {
    try {
      const include = options.include ? options.include.split(',') : undefined;
      const exclude = options.exclude ? options.exclude.split(',') : undefined;
      
      console.log(`Exporting data in ${options.format} format...`);
      const exportOptions: any = {
        format: (options.format as 'json' | 'xml' | 'csv') || 'json'
      };
      if (options.output) {
        exportOptions.output = options.output;
      }
      if (include) {
        exportOptions.include = include;
      }
      if (exclude) {
        exportOptions.exclude = exclude;
      }
      await exportData(exportOptions);
      console.log(`✅ Successfully exported data`);
    } catch (error) {
      console.error(`❌ Failed to export data:`, error);
      process.exit(1);
    }
  });

// Projects command
program
  .command('projects')
  .description('List available projects')
  .option('-l, --limit <number>', 'Limit number of projects shown', '20')
  .action((options: { limit?: string }) => {
    try {
      const projects = getProjects();
      const limit = parseInt(options.limit || '20');
      
      console.log('Available WordNet Projects:');
      console.log('==========================');
      
      projects.slice(0, limit).forEach(project => {
        console.log(`• ${project.id} - ${project.label}`);
        if (project.description) {
          console.log(`  ${project.description}`);
        }
      });
      
      if (projects.length > limit) {
        console.log(`... and ${projects.length - limit} more projects`);
      }
    } catch (error) {
      console.error(`❌ Failed to list projects:`, error);
      process.exit(1);
    }
  });

// Query command
program
  .command('query')
  .description('Query WordNet data')
  .argument('<word>', 'Word to look up')
  .option('-p, --pos <pos>', 'Part of speech (n, v, a, r)')
  .option('-l, --lexicon <lexicon>', 'Lexicon to query')
  .option('-t, --type <type>', 'Query type (words, synsets, senses)', 'words')
  .action(async (word: string, options: { pos?: string; lexicon?: string; type?: string }) => {
    try {
      const lexicon = options.lexicon || 'oewn';
      const wn = new Wordnet(lexicon);
      
      console.log(`Querying "${word}" in ${lexicon}...`);
      
      switch (options.type) {
        case 'words':
          const words = await wn.words(word, options.pos as any);
          console.log(`Found ${words.length} words:`);
          words.forEach(w => {
            console.log(`• ${w.lemma} (${w.partOfSpeech})`);
          });
          break;
          
        case 'synsets':
          const synsets = await wn.synsets(word, options.pos as any);
          console.log(`Found ${synsets.length} synsets:`);
          synsets.forEach(s => {
            console.log(`• ${s.id} - ${s.definitions[0]?.text || 'No definition'}`);
            console.log(`  Members: ${s.members.join(', ')}`);
          });
          break;
          
        case 'senses':
          const senses = await wn.senses(word, options.pos as any);
          console.log(`Found ${senses.length} senses:`);
          senses.forEach(s => {
            console.log(`• ${s.id} -> ${s.synset}`);
          });
          break;
          
        default:
          console.error(`Unknown query type: ${options.type}`);
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Failed to query "${word}":`, error);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show or modify configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .action((options: { set?: string }) => {
    if (options.set) {
      const [key, value] = options.set.split('=');
      if (key && value) {
        (config as any)[key] = value;
        console.log(`✅ Set ${key} = ${value}`);
      } else {
        console.error('❌ Invalid format. Use key=value');
        process.exit(1);
      }
    } else {
      console.log('Current Configuration:');
      console.log('=====================');
      console.log(`Data Directory: ${config.dataDirectory}`);
      console.log(`Download Directory: ${config.downloadDirectory || 'default'}`);
    }
  });

// Info command
program
  .command('info')
  .description('Show information about installed data')
  .action(async () => {
    try {
      console.log('WordNet Data Information:');
      console.log('========================');
      console.log(`Data Directory: ${config.dataDirectory}`);
      
      // TODO: Add database inspection to show installed lexicons
      console.log('Database inspection not yet implemented');
    } catch (error) {
      console.error(`❌ Failed to get info:`, error);
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .description('Start interactive mode')
  .alias('i')
  .action(async () => {
    console.log('WordNet TypeScript Interactive Mode');
    console.log('==================================');
    console.log('Type "help" for available commands, "exit" to quit');
    console.log('');
    
    // TODO: Implement interactive mode with readline
    console.log('Interactive mode not yet implemented');
  });

program.parse(); 