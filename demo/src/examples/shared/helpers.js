#!/usr/bin/env node

/**
 * Helper functions for WordNet use cases
 */

import { join } from 'path';
import { homedir } from 'os';
import { Wordnet, ili } from 'wn-ts';

/**
 * Initialize Wordnet with common configuration
 */
export function createWordnet(demoName) {
  const dataDirectory = join(homedir(), `.wn_${demoName}_demo`);
  console.log(`📁 Using data directory: ${dataDirectory}`);
  
  return new Wordnet('*', {
    dataDirectory,
    downloadDirectory: join(dataDirectory, 'downloads'),
    extractDirectory: join(dataDirectory, 'extracted'),
    databasePath: join(dataDirectory, 'wordnet.db')
  });
}

/**
 * Display synset information with definitions and examples
 */
export async function displaySynset(synset, index = 1) {
  console.log(`\n  ${index}. ${synset.id} (${synset.members.length} members)`);
  console.log(`     Members: ${synset.members.join(", ")}`);
  console.log(`     ILI: ${synset.ili || 'None'}`);
  
  // Prefer localized definition if available
  const targetLang = synset.language || null;
  let localizedDef = null;
  if (synset.definitions && synset.definitions.length > 0) {
    localizedDef = synset.definitions.find(def => def.language === targetLang);
  }

  if (localizedDef) {
    console.log(`     Localized Definition [${targetLang}]: ${localizedDef.text}`);
  } else if (synset.definitions && synset.definitions.length > 0) {
    // Fallback: show the first available definition
    console.log(`     Definition: ${synset.definitions[0].text}`);
  } else if (synset.ili) {
    // Fallback: show ILI definition
    try {
      const iliEntry = await ili(synset.ili);
      if (iliEntry && iliEntry.definition) {
        console.log(`     ILI Definition: ${iliEntry.definition}`);
      }
    } catch (error) {
      // Silently ignore ILI lookup errors
    }
  }
  
  // Display examples
  if (synset.examples && synset.examples.length > 0) {
    console.log(`     Examples:`);
    synset.examples.forEach((example, exIndex) => {
      console.log(`       ${exIndex + 1}. "${example.text}"`);
    });
  }
  
  // Display relations
  if (synset.relations && synset.relations.length > 0) {
    const relationTypes = {};
    synset.relations.forEach(rel => {
      relationTypes[rel.type] = (relationTypes[rel.type] || 0) + 1;
    });
    const relationSummary = Object.entries(relationTypes)
      .map(([type, count]) => `${type}(${count})`)
      .join(", ");
    console.log(`     Relations: ${relationSummary}`);
  }
}

/**
 * Display synsets grouped by part of speech
 */
export async function displaySynsetsByPOS(synsets, title) {
  console.log(`\n📚 ${title}:`);
  
  // Group by part of speech
  const byPOS = {};
  synsets.forEach(synset => {
    const pos = synset.partOfSpeech;
    if (!byPOS[pos]) byPOS[pos] = [];
    byPOS[pos].push(synset);
  });
  
  for (const [pos, posSynsets] of Object.entries(byPOS)) {
    console.log(`\n📚 ${pos.toUpperCase()} senses (${posSynsets.length}):`);
    for (let i = 0; i < posSynsets.length; i++) {
      await displaySynset(posSynsets[i], i + 1);
    }
  }
}

/**
 * Display multilingual definitions for a word
 */
export async function displayMultilingualDefinitions(word, wordnet) {
  console.log(`\n🌍 Multilingual definitions for "${word}":`);
  
  const synsets = await wordnet.synsets(word);
  console.log(`📚 Found ${synsets.length} synsets across languages`);
  
  // Group by lexicon/language
  const byLexicon = {};
  synsets.forEach(synset => {
    const lexicon = synset.lexicon;
    if (!byLexicon[lexicon]) byLexicon[lexicon] = [];
    byLexicon[lexicon].push(synset);
  });
  
  Object.entries(byLexicon).forEach(([lexicon, lexSynsets]) => {
    console.log(`\n📖 ${lexicon}:`);
    lexSynsets.slice(0, 2).forEach((synset, index) => {
      console.log(`  ${index + 1}. ${synset.id}`);
      console.log(`     Members: ${synset.members.join(", ")}`);
      
      if (synset.definitions && synset.definitions.length > 0) {
        console.log(`     Definition: ${synset.definitions[0].text}`);
      }
      
      if (synset.examples && synset.examples.length > 0) {
        console.log(`     Example: "${synset.examples[0].text}"`);
      }
    });
  });
}

/**
 * Safe database close with error handling
 */
export async function safeClose(wordnet, successMessage = '✅ Database connection closed successfully') {
  try {
    await wordnet.close();
    console.log(successMessage);
  } catch (closeError) {
    console.error('⚠️  Error closing database:', closeError.message);
  }
}

/**
 * Run demo with error handling
 */
export async function runDemo(demoFunction, demoName) {
  try {
    await demoFunction();
  } catch (error) {
    console.error(`❌ ${demoName} failed:`, error.message);
    throw error;
  }
} 