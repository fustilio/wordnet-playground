// src/browser-data.ts
// Script to convert wn-ts WordNet database data into browser-usable chunked modules for wn-ts-web
// Inspired by wordpos/tools/makeJsonDict.js

import path from 'path';
import fs from 'fs';
import { db } from './db/database.js';
import { logger } from 'wn-ts-core';

export interface MakeBrowserDataOptions {
  lexiconId: string;
  outDir: string;
  chunkSize?: number;
  dryRun?: boolean;
  debug?: boolean; // Changed from verbose to debug to match library patterns
}

// Convert LMF data from database to browser-optimized chunks
function convertLMFToBrowserFormat(
  lexiconId: string, 
  chunkSize: number = 1000,
  debug: boolean = false // Changed from verbose to debug
) {
  if (debug) {
    logger.debug(`Converting LMF data for lexicon '${lexiconId}' with chunk size ${chunkSize}...`);
  }
  
  try {
    if (debug) {
      logger.debug(`Loading data from database...`);
    }
    
    // Get all words for this lexicon
    const words = db.all('SELECT * FROM words WHERE lexicon = ?', [lexiconId]) as any[];
    if (debug) {
      logger.data(`Found ${words.length.toLocaleString()} words for lexicon ${lexiconId}`);
    }
    
    // Get all synsets for this lexicon
    const synsets = db.all('SELECT * FROM synsets WHERE lexicon = ?', [lexiconId]) as any[];
    if (debug) {
      logger.data(`Found ${synsets.length.toLocaleString()} synsets for lexicon ${lexiconId}`);
    }
    
    // Get all senses for this lexicon
    const senses = db.all('SELECT * FROM senses WHERE word_id IN (SELECT id FROM words WHERE lexicon = ?)', [lexiconId]) as any[];
    if (debug) {
      logger.data(`Found ${senses.length.toLocaleString()} senses for lexicon ${lexiconId}`);
    }
    
    // Get all definitions for this lexicon
    const definitions = db.all('SELECT * FROM definitions WHERE synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)', [lexiconId]) as any[];
    if (debug) {
      logger.data(`Found ${definitions.length.toLocaleString()} definitions for lexicon ${lexiconId}`);
    }

    if (debug) {
      logger.debug(`Building lookup maps...`);
    }
    
    // Create maps for efficient lookup
    const synsetDefs = new Map<string, string>();
    for (const def of definitions) {
      synsetDefs.set(def.synset_id, def.text);
    }

    // Build word lookup map
    const wordMap = new Map<string, any>();
    for (const word of words) {
      wordMap.set(word.id, {
        id: word.id,
        lemma: word.lemma,
        partOfSpeech: word.part_of_speech,
        language: word.language,
        lexicon: word.lexicon,
        forms: [],
        senses: []
      });
    }

    // Build synset lookup map
    const synsetMap = new Map<string, any>();
    for (const synset of synsets) {
      synsetMap.set(synset.id, {
        id: synset.id,
        ili: synset.ili,
        partOfSpeech: synset.part_of_speech,
        language: synset.language,
        lexicon: synset.lexicon,
        definition: synsetDefs.get(synset.id) || '',
        members: [],
        senses: []
      });
    }

    // Process senses to link words and synsets
    for (const sense of senses) {
      const word = wordMap.get(sense.word_id);
      const synset = synsetMap.get(sense.synset_id);
      
      if (word && synset) {
        word.senses.push(sense.id);
        synset.senses.push(sense.id);
        synset.members.push(word.id);
      }
    }

    // Convert to arrays for chunking
    const wordArray = Array.from(wordMap.values());
    const synsetArray = Array.from(synsetMap.values());

    if (debug) {
      logger.debug(`Creating chunks...`);
    }

    // Create word chunks
    const wordChunks: Record<string, any>[] = [];
    for (let i = 0; i < wordArray.length; i += chunkSize) {
      const chunk = wordArray.slice(i, i + chunkSize);
      wordChunks.push({
        [`words${Math.floor(i / chunkSize)}`]: chunk
      });
    }

    // Create synset chunks
    const synsetChunks: Record<string, any>[] = [];
    for (let i = 0; i < synsetArray.length; i += chunkSize) {
      const chunk = synsetArray.slice(i, i + chunkSize);
      synsetChunks.push({
        [`synsets${Math.floor(i / chunkSize)}`]: chunk
      });
    }

    // Create metadata
    const metadata = {
      lexiconId,
      totalWords: wordArray.length,
      totalSynsets: synsetArray.length,
      totalSenses: senses.length,
      totalDefinitions: definitions.length,
      wordChunks: wordChunks.length,
      synsetChunks: synsetChunks.length,
      chunkSize,
      generatedAt: new Date().toISOString()
    };

    // Create chunks index
    const chunks = {
      totalWordChunks: wordChunks.length,
      totalSynsetChunks: synsetChunks.length,
      chunkSize,
      words: wordChunks.map((_, index) => `words${index}.json`),
      synsets: synsetChunks.map((_, index) => `synsets${index}.json`)
    };

    if (debug) {
      logger.debug(`Conversion complete. Created ${wordChunks.length} word chunks and ${synsetChunks.length} synset chunks`);
    }

    return {
      browserData: {
        metadata,
        chunks
      },
      wordChunks,
      synsetChunks
    };
  } catch (error) {
    logger.error(`Error converting LMF data: ${error}`);
    throw error;
  }
}

export function makeBrowserData({
  lexiconId,
  outDir,
  chunkSize = 1000,
  dryRun = false,
  debug = false, // Changed from verbose to debug
}: MakeBrowserDataOptions) {
  const startTime = Date.now();
  
  if (debug) {
    logger.debug(`Starting browser data preparation for lexicon '${lexiconId}'`);
    logger.config(`Output directory: ${outDir}`);
    logger.config(`Chunk size: ${chunkSize.toLocaleString()}`);
    logger.config(`Dry run: ${dryRun ? 'Yes' : 'No'}`);
  }

  // Initialize database
  db.initialize();

  // Validate lexicon exists
  const lexiconExists = db.get('SELECT id FROM lexicons WHERE id = ?', [lexiconId]);
  if (!lexiconExists) {
    throw new Error(`Lexicon '${lexiconId}' not found in database`);
  }

  // Validate output directory
  if (!dryRun) {
    try {
      // Check if we can write to the directory
      const testFile = path.join(outDir, '.test-write');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      // Test write access
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      throw new Error(`Cannot create or access output directory '${outDir}': ${error}`);
    }
  }

  // Convert LMF data from database to browser-optimized format
  const { browserData, wordChunks, synsetChunks } = convertLMFToBrowserFormat(lexiconId, chunkSize, debug);

  if (debug) {
    logger.debug(`Writing files...`);
  }

  // Write metadata file
  const metadataPath = path.join(outDir, 'metadata.json');
  if (!dryRun) {
    fs.writeFileSync(metadataPath, JSON.stringify(browserData.metadata, null, 2), 'utf8');
  }
  if (debug) {
    logger.debug(`${dryRun ? 'Would write' : 'Wrote'} ${metadataPath}`);
  }

  // Write chunks index file
  const chunksPath = path.join(outDir, 'chunks.json');
  if (!dryRun) {
    fs.writeFileSync(chunksPath, JSON.stringify(browserData.chunks, null, 2), 'utf8');
  }
  if (debug) {
    logger.debug(`${dryRun ? 'Would write' : 'Wrote'} ${chunksPath}`);
  }

  // Write word chunks
  for (let i = 0; i < wordChunks.length; i++) {
    const chunk = wordChunks[i];
    if (!chunk) continue;
    
    const chunkKey = Object.keys(chunk)[0];
    if (!chunkKey) continue;
    
    const chunkPath = path.join(outDir, `${chunkKey}.json`);
    
    if (!dryRun) {
      fs.writeFileSync(chunkPath, JSON.stringify(chunk[chunkKey], null, 2), 'utf8');
    }
    if (debug) {
      logger.debug(`${dryRun ? 'Would write' : 'Wrote'} ${chunkPath} (${chunk[chunkKey].length} words)`);
    }
  }

  // Write synset chunks
  for (let i = 0; i < synsetChunks.length; i++) {
    const chunk = synsetChunks[i];
    if (!chunk) continue;
    
    const chunkKey = Object.keys(chunk)[0];
    if (!chunkKey) continue;
    
    const chunkPath = path.join(outDir, `${chunkKey}.json`);
    
    if (!dryRun) {
      fs.writeFileSync(chunkPath, JSON.stringify(chunk[chunkKey], null, 2), 'utf8');
    }
    if (debug) {
      logger.debug(`${dryRun ? 'Would write' : 'Wrote'} ${chunkPath} (${chunk[chunkKey].length} synsets)`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  if (debug) {
    logger.success(`Browser data prep complete for lexicon '${lexiconId}'!`);
    logger.data(`Created ${wordChunks.length} word chunks and ${synsetChunks.length} synset chunks`);
    logger.config(`Output: ${outDir}`);
    logger.config(`Total time: ${totalTime.toFixed(1)}s`);
  }
} 