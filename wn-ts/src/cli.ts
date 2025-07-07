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
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readdirSync, statSync, unlinkSync, rmdirSync } from 'fs';
import { db as database } from './database.js';

// Database CLI class
class DatabaseCLI {
  private cacheDir = join(homedir(), '.wn_ts_data');
  private demoDirs = [
    '.wn_multilingual_basic_demo',
    '.wn_kitchen_sink_demo', 
    '.wn_demo',
    '.wn_data',
    '.wn_test_e2e'
  ];

  async status(options: { verbose?: boolean }) {
    console.log('🔍 Database Status Report');
    console.log('========================\n');

    // Check main cache
    console.log('📁 Main Cache Directory:');
    console.log(`   Path: ${this.cacheDir}`);
    console.log(`   Exists: ${existsSync(this.cacheDir) ? '✅' : '❌'}`);
    
    if (existsSync(this.cacheDir)) {
      const stats = statSync(this.cacheDir);
      console.log(`   Size: ${this.formatBytes(this.getDirSize(this.cacheDir))}`);
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    }

    // Check demo directories
    console.log('\n📁 Demo Directories:');
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      const exists = existsSync(demoPath);
      console.log(`   ${dir}: ${exists ? '✅' : '❌'}`);
      
      if (exists) {
        const size = this.getDirSize(demoPath);
        const stats = statSync(demoPath);
        console.log(`     Size: ${this.formatBytes(size)}`);
        console.log(`     Modified: ${stats.mtime.toLocaleString()}`);
        
        // Check for database files
        const dbFiles = this.findDatabaseFiles(demoPath);
        if (dbFiles.length > 0) {
          console.log(`     Database files: ${dbFiles.length}`);
          for (const file of dbFiles) {
            const filePath = join(demoPath, file);
            const fileStats = statSync(filePath);
            const isLocked = file.endsWith('-journal');
            console.log(`       ${file}: ${this.formatBytes(fileStats.size)} ${isLocked ? '🔒' : ''}`);
          }
        }
      }
    }

    // Check for locked databases
    const lockedFiles = this.findLockedDatabases();
    if (lockedFiles.length > 0) {
      console.log('\n🔒 Locked Database Files:');
      for (const file of lockedFiles) {
        console.log(`   ${file}`);
      }
    } else {
      console.log('\n✅ No locked database files found');
    }

    if (options.verbose) {
      console.log('\n📊 Detailed Statistics:');
      console.log(`   Total demo directories: ${this.demoDirs.length}`);
      console.log(`   Locked files found: ${lockedFiles.length}`);
      console.log(`   Main cache exists: ${existsSync(this.cacheDir)}`);
    }
  }

  async cache() {
    console.log('📚 Cache Contents');
    console.log('=================\n');

    if (!existsSync(this.cacheDir)) {
      console.log('❌ Cache directory does not exist');
      return;
    }

    const contents = this.getCacheContents(this.cacheDir);
    console.log(`📁 Cache Directory: ${this.cacheDir}`);
    console.log(`📊 Total Size: ${this.formatBytes(contents.totalSize)}`);
    console.log(`📄 Files: ${contents.files.length}\n`);

    for (const file of contents.files) {
      console.log(`   ${file.name}: ${this.formatBytes(file.size)}`);
    }
  }

  async unlock(options: { force?: boolean }) {
    console.log('🔓 Unlocking Databases');
    console.log('=====================\n');

    // Kill any Node.js processes that might be holding locks
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      console.log('🔄 Terminating Node.js processes...');
      await execAsync('taskkill /f /im node.exe 2>nul || echo "No Node.js processes found"');
      console.log('✅ Node.js processes terminated');
    } catch (error) {
      console.log('⚠️  Could not terminate Node.js processes');
    }

    // Remove journal files
    const lockedFiles = this.findLockedDatabases();
    if (lockedFiles.length > 0) {
      console.log('\n🗑️  Removing journal files:');
      for (const file of lockedFiles) {
        try {
          unlinkSync(file);
          console.log(`   ✅ Removed: ${file}`);
        } catch (error) {
          console.log(`   ❌ Failed to remove: ${file}`);
        }
      }
    } else {
      console.log('\n✅ No journal files found to remove');
    }

    // Try to close any existing database connections
    console.log('\n🔌 Closing database connections:');
    for (const dir of this.demoDirs) {
      try {
        const demoPath = join(homedir(), dir);
        if (existsSync(demoPath)) {
          const wordnet = new Wordnet('*');
          
          await wordnet.close();
          console.log(`   ✅ Closed: ${dir}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`   ⚠️  Could not close ${dir}: ${errorMessage}`);
      }
    }

    console.log('\n✅ Database unlock completed');
    
    if (options.force) {
      console.log('💪 Force unlock completed - all processes terminated');
    }
  }

  async clean(options: { dryRun?: boolean }) {
    console.log('🧹 Cleaning Cache');
    console.log('================\n');

    let totalCleaned = 0;
    let totalSize = 0;

    // Clean demo directories
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      if (existsSync(demoPath)) {
        const size = this.getDirSize(demoPath);
        console.log(`🗑️  ${options.dryRun ? '[DRY RUN] ' : ''}Removing: ${dir} (${this.formatBytes(size)})`);
        
        if (!options.dryRun) {
          try {
            this.removeDirectory(demoPath);
            totalCleaned++;
            totalSize += size;
            console.log(`   ✅ Removed: ${dir}`);
          } catch (error) {
            console.log(`   ❌ Failed to remove: ${dir}`);
          }
        } else {
          totalCleaned++;
          totalSize += size;
          console.log(`   [DRY RUN] Would remove: ${dir}`);
        }
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Directories ${options.dryRun ? 'that would be ' : ''}removed: ${totalCleaned}`);
    console.log(`   Total size ${options.dryRun ? 'that would be ' : ''}freed: ${this.formatBytes(totalSize)}`);
  }

  async reset(options: { force?: boolean }) {
    console.log('🔄 Resetting All Databases');
    console.log('=========================\n');

    if (!options.force) {
      console.log('⚠️  This will remove ALL WordNet data and cache directories.');
      console.log('   This action cannot be undone.');
      console.log('   Use --force to proceed.\n');
      return;
    }

    console.log('⚠️  Force reset enabled. Removing all databases...\n');

    // Clean everything
    await this.clean({ dryRun: false });
    
    // Reset main database
    try {
      await database.reset();
      console.log('✅ Main database reset');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Failed to reset main database: ${errorMessage}`);
    }

    console.log('\n✅ All databases reset');
  }

  private getDirSize(dirPath: string): number {
    if (!existsSync(dirPath)) return 0;
    
    let size = 0;
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      
      if (stats.isDirectory()) {
        size += this.getDirSize(itemPath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }

  private findDatabaseFiles(dirPath: string): string[] {
    if (!existsSync(dirPath)) return [];
    
    const files: string[] = [];
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      if (item.endsWith('.db') || item.endsWith('.db-journal')) {
        files.push(item);
      }
    }
    
    return files;
  }

  private findLockedDatabases(): string[] {
    const lockedFiles: string[] = [];
    
    // Check all demo directories
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      if (existsSync(demoPath)) {
        const dbFiles = this.findDatabaseFiles(demoPath);
        for (const file of dbFiles) {
          if (file.endsWith('-journal')) {
            lockedFiles.push(join(demoPath, file));
          }
        }
      }
    }
    
    return lockedFiles;
  }

  private getCacheContents(dirPath: string): { files: Array<{name: string, size: number}>, totalSize: number } {
    const files: Array<{name: string, size: number}> = [];
    let totalSize = 0;
    
    if (!existsSync(dirPath)) {
      return { files, totalSize };
    }
    
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      
      if (stats.isFile()) {
        files.push({ name: item, size: stats.size });
        totalSize += stats.size;
      }
    }
    
    return { files, totalSize };
  }

  private removeDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) return;
    
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      
      if (stats.isDirectory()) {
        this.removeDirectory(itemPath);
      } else {
        unlinkSync(itemPath);
      }
    }
    
    rmdirSync(dirPath);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

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

// Database management subcommand
const db = program.command('db').description('Database and cache management commands');
const cli = new DatabaseCLI();

db
  .command('status')
  .description('Show database status and cache information')
  .option('-v, --verbose', 'Show detailed statistics')
  .action(async (options) => {
    await cli.status(options);
  });

db
  .command('cache')
  .description('Show cache contents and file sizes')
  .action(async () => {
    await cli.cache();
  });

db
  .command('unlock')
  .description('Unlock locked databases by removing journal files and closing connections')
  .option('-f, --force', 'Force unlock even if processes are running')
  .action(async (options) => {
    await cli.unlock(options);
  });

db
  .command('clean')
  .description('Clean up cache directories to free space')
  .option('--dry-run', 'Show what would be cleaned without actually doing it')
  .action(async (options) => {
    await cli.clean(options);
  });

db
  .command('reset')
  .description('Reset all databases (WARNING: This removes all data)')
  .option('-f, --force', 'Force reset without confirmation')
  .action(async (options) => {
    await cli.reset(options);
  });

program.parseAsync().catch(error => {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
}); 