#!/usr/bin/env node

/**
 * CLI tool for generating serverless dictionaries
 */

import { writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { Wordnet, download, add, lexicons } from 'wn-ts-node';
import { PRESETS, generateDictionary, createESModule } from '../generators/index.js';
import type { PresetConfig } from '../types/index.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--presets')) {
    showPresets();
    process.exit(0);
  }

  const presetName = args[0] || 'small';
  const outputName = args[1] || 'serverless-dict';

  const preset = PRESETS[presetName];
  if (!preset) {
    console.error(`❌ Unknown preset: ${presetName}`);
    console.log('\nAvailable presets:');
    showPresets();
    process.exit(1);
  }

  console.log(`
🚀 Serverless Dictionary Generator
===================================
`);

  console.log(`📦 Preset: ${presetName}`);
  console.log(`   ${preset.description}`);
  console.log(`   Languages: ${preset.languages.join(', ')}`);
  console.log(`   POS: ${preset.pos ? preset.pos.join(', ') : 'all'}`);
  console.log(`   Limit: ${preset.limit} synsets\n`);

  try {
    // Initialize WordNet
    const wordnet = new Wordnet('*');
    console.log('✅ WordNet initialized\n');

    // Ensure required lexicons are loaded
    console.log('📦 Checking required lexicons...');
    const existingLexicons = await lexicons();
    const lexiconIds = new Set(existingLexicons.map((l: any) => l.id));
    
    // Determine required lexicons based on preset languages
    const requiredLexicons: string[] = [];
    
    // Map languages to lexicon IDs
    const languageToLexicon: Record<string, string> = {
      'en': 'oewn:2024',
      'fr': 'omw-fr:1.4',
      'es': 'omw-es:1.4',
      'de': 'omw-de:1.4',
      'th': 'omw-th:1.4',
    };
    
    // Add required lexicons for each language
    for (const lang of preset.languages) {
      const lexiconId = languageToLexicon[lang];
      if (lexiconId) {
        const baseId = lexiconId.split(':')[0];
        if (!lexiconIds.has(baseId)) {
          requiredLexicons.push(lexiconId);
        }
      }
    }
    
    // Ensure CILI is present for ILI support (required for cross-language linking)
    // CILI provides the Interlingual Index that links synsets across languages
    // Note: For English-only presets, OEWN may already have ILI values, so CILI is optional
    const needsCILI = preset.languages.length > 1 || preset.languages.some(lang => lang !== 'en');
    if (needsCILI && !lexiconIds.has('cili')) {
      requiredLexicons.push('cili:1.0');
    }
    
    // Download and load missing lexicons (download() already loads data via downloadAndLoad)
    for (const lexiconId of requiredLexicons) {
      const baseId = lexiconId.split(':')[0];
      if (lexiconIds.has(baseId)) {
        console.log(`   ✅ ${baseId} already present`);
        continue;
      }
      
      try {
        console.log(`   ⬇️  Downloading and loading ${lexiconId}...`);
        // download() calls downloadAndLoad() which automatically loads data into the database
        await download(lexiconId, { force: false });
        
        // Verify it was loaded by checking lexicons again
        const updatedLexicons = await lexicons();
        const updatedLexiconIds = new Set(updatedLexicons.map((l: any) => l.id));
        if (updatedLexiconIds.has(baseId)) {
          console.log(`   ✅ ${baseId} loaded successfully`);
          lexiconIds.add(baseId);
        } else {
          throw new Error(`${baseId} was not found after download`);
        }
      } catch (error) {
        // For CILI, if it fails, warn but continue (OEWN may have ILI values already)
        if (baseId === 'cili') {
          console.warn(`   ⚠️  Failed to load CILI (continuing anyway):`, error instanceof Error ? error.message : error);
          console.warn(`   ℹ️  OEWN may already have ILI values for English synsets`);
          continue;
        }
        console.error(`   ❌ Failed to load ${lexiconId}:`, error instanceof Error ? error.message : error);
        throw error;
      }
    }
    
    if (requiredLexicons.length === 0) {
      console.log('   ✅ All required lexicons are present\n');
    } else {
      console.log(''); // Empty line after loading
    }

    // Generate dictionary
    console.log('📊 Generating dictionary...');
    const dictionary = await generateDictionary(wordnet, preset);

    // Calculate sizes
    const jsonStr = JSON.stringify(dictionary);
    const jsonSize = jsonStr.length;
    const gzipped = gzipSync(jsonStr);
    const gzippedSize = gzipped.length;

    console.log(`\n📊 Dictionary Statistics:`);
    console.log(`   Synsets: ${dictionary.m.c}`);
    console.log(`   Words: ${dictionary.m.w}`);
    console.log(`   JSON size: ${(jsonSize / 1024).toFixed(1)} KB`);
    console.log(`   Gzipped: ${(gzippedSize / 1024).toFixed(1)} KB`);

    // Save JSON format
    const jsonPath = `${outputName}.json`;
    writeFileSync(jsonPath, JSON.stringify(dictionary, null, 2));
    console.log(`\n✅ Saved JSON: ${jsonPath}`);

    // Save compressed JSON
    const gzPath = `${outputName}.json.gz`;
    writeFileSync(gzPath, gzipped);
    console.log(`✅ Saved compressed: ${gzPath}`);

    // Save as ES module
    const modulePath = `${outputName}.js`;
    const moduleCode = createESModule(dictionary, outputName);
    writeFileSync(modulePath, moduleCode);
    console.log(`✅ Saved ES module: ${modulePath}`);

    console.log(`\n🎉 Dictionary generated successfully!`);

    // Close WordNet
    if (typeof wordnet.close === 'function') {
      await wordnet.close();
    }

  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
wn-dict-export - Generate serverless-optimized dictionaries from WordNet

USAGE:
  wn-dict-export [preset] [output-name]

OPTIONS:
  --presets     Show available presets
  --help, -h    Show this help

PRESETS:
  Use predefined presets for common use cases:
  - mini, small, medium (English only)
  - en-th, en-fr, th-fr (Language pairs, 1000 words)
  - en-th-large, en-fr-large, th-fr-large (Language pairs, 3000 words)
  - bilingual, multilingual (Multiple languages)

EXAMPLES:
  wn-dict-export mini             # Generate mini dictionary
  wn-dict-export small my-dict    # Generate small dictionary as 'my-dict'
  wn-dict-export en-th            # Generate English-Thai dictionary
  wn-dict-export en-fr dict-en-fr # Generate English-French dictionary
  wn-dict-export th-fr-large      # Generate large Thai-French dictionary

LANGUAGE PAIRS:
  Each language pair creates a bidirectional dictionary:
  - en-th: English ↔ Thai translations
  - en-fr: English ↔ French translations
  - th-fr: Thai ↔ French translations

  Benefits of language pairs:
  - Smaller file size (only 2 languages instead of all)
  - Lower memory usage in serverless environments
  - Faster imports and cold starts
  - Optimized for specific translation tasks
`);
}

function showPresets() {
  Object.entries(PRESETS).forEach(([name, config]) => {
    console.log(`  ${name.padEnd(15)} - ${config.description}`);
    console.log(`                    ${config.limit} synsets, ${config.languages.join(', ')}`);
  });
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
