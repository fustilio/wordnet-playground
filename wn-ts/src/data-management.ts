import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { db } from './db/database.js';
import { downloadFile } from './utils/download.js';
import { loadLMF, isLMF } from './lmf.js';
import { getProjectVersionUrls, getProjectVersionError } from './project.js';
import type { DownloadOptions, AddOptions, ExportOptions } from './types.js';
import { ProjectError, DatabaseError } from './types.js';
import {
  extractTarArchive,
  findLMFiles,
  decompressXz,
  decompressGz,
} from './utils/archive.js';
import { isILI, loadILI } from './ili.js';
import { logger } from './utils/logger.js';
import { batchInsert } from './db/batch-insert.js';

/**
 * Download a project from the web
 */
export async function download(
  projectId: string,
  options: DownloadOptions = {}
): Promise<string> {
  const { force = false, progress } = options;
  logger.download(`Downloading project: ${projectId}`);

  // Parse project ID to get version
  const [projectIdClean, version] = projectId.split(':');
  if (!version) {
    throw new ProjectError(
      `Project ID must include version (e.g., 'oewn:2024'): ${projectId}`
    );
  }

  // Check for version errors
  const versionError = getProjectVersionError(projectIdClean || '', version || '');
  if (versionError) {
    throw new ProjectError(`Project version error: ${versionError}`);
  }

  // Get download URL from project index
  const urls = getProjectVersionUrls(projectIdClean || '', version || '');
  if (!urls || urls.length === 0) {
    throw new ProjectError(`No download URL found for project ${projectId}`);
  }

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      // Determine the correct file extension from the URL
      const urlParts = url.split('/');
      const urlFileName = urlParts[urlParts.length - 1];
      const fileName = `${projectIdClean}-${version}-${urlFileName}`;
      const destination = join(config.downloadDirectory, fileName);

      if (existsSync(destination) && !force) {
        logger.info(`File already exists: ${destination}. Use --force to re-download.`);
        return destination;
      }

      logger.download(`Downloading from ${url}...`);
      await downloadFile(
        url,
        destination,
        progress ? { onProgress: progress } : undefined
      );
      logger.success(`Successfully downloaded to ${destination}`);
      return destination;
    } catch (error) {
      logger.error(`Failed to download from ${url}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new ProjectError(
    `Failed to download project ${projectId} from all sources: ${lastError?.message}`
  );
}

/**
 * Add a lexical resource to the database
 */
export async function add(
  path: string,
  options: AddOptions & { dryRun?: boolean, parser?: string } = {}
): Promise<boolean> {
  const { progress, parser = "" } = options;
  if (progress) progress(0.1); // Initialize progress

  if (!existsSync(path)) {
    throw new ProjectError(`File not found: ${path}`);
  }

  try {
    let processedPath = path;

    if (path.endsWith('.tar.xz') || path.endsWith('.tar.gz')) {
      logger.extract(`Extracting archive: ${path}...`);
      const extractedPath = await extractTarArchive(path);
      logger.success(`Extracted to: ${extractedPath}`);
      const lmfFiles = await findLMFiles(extractedPath);
      if (lmfFiles.length === 0) {
        throw new ProjectError(`No LMF files found in extracted archive: ${path}`);
      }
      processedPath = lmfFiles[0] || '';
    } else if (path.endsWith('.xz')) {
      logger.extract(`Decompressing file: ${path}...`);
      const decompressedPath = path.slice(0, -3);
      await decompressXz(path, decompressedPath);
      processedPath = decompressedPath;
    } else if (path.endsWith('.gz')) {
      logger.extract(`Decompressing file: ${path}...`);
      const decompressedPath = path.slice(0, -3);
      await decompressGz(path, decompressedPath);
      processedPath = decompressedPath;
    }

    const isLmfFile = await isLMF(processedPath);
    const isIliFile = !isLmfFile && (await isILI(processedPath));

    if (isLmfFile) {
      return await _addLmf(processedPath, { ...options, parser });
    } else if (isIliFile) {
      return await _addIli(processedPath, options);
    } else {
      throw new ProjectError(`File is not a valid LMF or ILI file: ${processedPath}`);
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to add lexical resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function _addIli(
  path: string,
  options: AddOptions & { dryRun?: boolean }
): Promise<boolean> {
  const { progress, dryRun = false } = options;
  logger.info(`Loading ILI file: ${path}...`);
  const iliData = await loadILI(path);
  logger.success(`ILI file loaded. Found ${iliData.length} records.`);
  if (progress) progress(0.5);

  if (dryRun) {
    logger.info('[DRY RUN] This is a dry run. No data will be written.');
    logger.info(`[DRY RUN] Would add ${iliData.length} ILI records.`);
    return false;
  }

  const records = iliData.map(record => [
    record.ili,
    record.definition || null,
    record.status,
    null, // superseded_by
    null, // note
    null, // meta
  ]);

  db.initialize();
  try {
    db.transaction(() => {
      logger.insert('Inserting ILI records...');
      batchInsert(
        'ilis',
        ['id', 'definition', 'status', 'superseded_by', 'note', 'meta'],
        records,
        progress ? p => progress(0.5 + p * 0.5) : undefined
      );
    });
    if (progress) progress(1.0);
    logger.success('ILI data added successfully.');
  } finally {
    db.close();
  }
  return false;
}

async function _addLmf(
  path: string,
  options: AddOptions & { dryRun?: boolean, parser?: string }
): Promise<boolean> {
  const { force = false, progress, dryRun = false, parser = "" } = options;

  
  
  db.initialize();
  
  try {
    logger.info(`Loading LMF file: ${path}...`);
    const lmfOptions: any = { debug: false };
    if (parser) lmfOptions.parser = parser;
    if (progress) lmfOptions.progress = progress;
    const lmfData = await loadLMF(path, lmfOptions);
    logger.success(`LMF file loaded. Found ${lmfData.lexicons.length} lexicons.`);

    let lexiconExists = false;
    let existingLexiconId = '';
    let existingLexiconVersion = '';

    // Pre-check lexicons before transaction
    if (!force) {
      for (const lexicon of lmfData.lexicons || []) {
        let existing;
        try {
          existing = db.get(
            'SELECT id FROM lexicons WHERE id = ? AND version = ?',
            [lexicon.id, lexicon.version]
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[DEBUG _addLmf] Error during lexicon existence check:', e);
        }
            
        if (existing) {
          lexiconExists = true;
          existingLexiconId = lexicon.id;
          existingLexiconVersion = lexicon.version || '';
          break;
        }
      }
    }

    if (dryRun) {
      logger.info(
        '\n[DRY RUN] This is a dry run. No data will be written to the database.'
      );
      if (lexiconExists) {
        logger.warn(
          `[DRY RUN] Lexicon ${existingLexiconId}:${existingLexiconVersion} already exists. Existing data will be updated/repaired.`
        );
      } else {
        const lexIds = (lmfData.lexicons || [])
          .map((l: any) => `${l.id}:${l.version}`)
          .join(', ');
        logger.info(`[DRY RUN] Would add new lexicon(s): ${lexIds}`);
      }

      const checkExisting = (table: string, ids: string[]): Set<string> => {
        const existingIds = new Set<string>();
        const BATCH_SIZE = 500;
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = ids.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) continue;
          const placeholders = batch.map(() => '?').join(',');
          const rows = db.all<{ id: string }>(
            `SELECT id FROM ${table} WHERE id IN (${placeholders})`,
            batch
          );
          for (const row of rows) {
            existingIds.add(row.id);
          }
        }
        return existingIds;
      };

      const totalWords = lmfData.words?.length || 0;
      if (totalWords > 0) {
        const wordIds = (lmfData.words || []).map(w => w.id);
        const existingWordIds = checkExisting('words', wordIds);
        const wordsToUpdate = existingWordIds.size;
        const wordsToInsert = totalWords - wordsToUpdate;
        logger.info(
          `[DRY RUN] Words to process: ${totalWords} (insert: ${wordsToInsert}, update: ${wordsToUpdate})`
        );
      } else {
        logger.info('[DRY RUN] Words to add/update: 0');
      }

      const totalSynsets = lmfData.synsets?.length || 0;
      if (totalSynsets > 0) {
        const synsetIds = (lmfData.synsets || []).map(s => s.id);
        const existingSynsetIds = checkExisting('synsets', synsetIds);
        const synsetsToUpdate = existingSynsetIds.size;
        const synsetsToInsert = totalSynsets - synsetsToUpdate;
        logger.info(
          `[DRY RUN] Synsets to process: ${totalSynsets} (insert: ${synsetsToInsert}, update: ${synsetsToUpdate})`
        );
      } else {
        logger.info('[DRY RUN] Synsets to add/update: 0');
      }

      return lexiconExists; // Stop execution for dry run
    }

    if (lexiconExists) {
      logger.warn(
        `Lexicon ${existingLexiconId}:${existingLexiconVersion} already exists. A full update (remove and replace) will be performed.`
      );
    }


    db.transaction(() => {
      
      
      if (lexiconExists) {
        
        const BATCH_SIZE = 500;

        const words = db.all('SELECT id FROM words WHERE lexicon = ?', [
          existingLexiconId,
        ]);
        const wordIds = (words as { id: string }[]).map(w => w.id);

        const synsets = db.all('SELECT id FROM synsets WHERE lexicon = ?', [
          existingLexiconId,
        ]);
        const synsetIds = (synsets as { id: string }[]).map(s => s.id);

        for (let i = 0; i < wordIds.length; i += BATCH_SIZE) {
          const batch = wordIds.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) continue;
          const placeholders = batch.map(() => '?').join(',');
          db.run(`DELETE FROM senses WHERE word_id IN (${placeholders})`, batch);
          db.run(`DELETE FROM forms WHERE word_id IN (${placeholders})`, batch);
        }

        for (let i = 0; i < synsetIds.length; i += BATCH_SIZE) {
          const batch = synsetIds.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) continue;
          const placeholders = batch.map(() => '?').join(',');
          db.run(
            `DELETE FROM relations WHERE source_id IN (${placeholders})`,
            batch
          );
          db.run(
            `DELETE FROM relations WHERE target_id IN (${placeholders})`,
            batch
          );
          db.run(
            `DELETE FROM definitions WHERE synset_id IN (${placeholders})`,
            batch
          );
          db.run(
            `DELETE FROM examples WHERE synset_id IN (${placeholders})`,
            batch
          );
        }

        for (let i = 0; i < wordIds.length; i += BATCH_SIZE) {
          const batch = wordIds.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) continue;
          const placeholders = batch.map(() => '?').join(',');
          db.run(`DELETE FROM words WHERE id IN (${placeholders})`, batch);
        }

        for (let i = 0; i < synsetIds.length; i += BATCH_SIZE) {
          const batch = synsetIds.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) continue;
          const placeholders = batch.map(() => '?').join(',');
          db.run(`DELETE FROM synsets WHERE id IN (${placeholders})`, batch);
        }

        db.run('DELETE FROM lexicons WHERE id = ?', [existingLexiconId]);
      }
      logger.insert('Inserting lexicons...');
      const lexiconData = (lmfData.lexicons || []).map(lexicon => [
        lexicon.id,
        lexicon.label,
        lexicon.language,
        lexicon.version,
        lexicon.email,
        lexicon.license,
        lexicon.url,
        lexicon.citation,
        lexicon.logo,
      ]);
      batchInsert(
        'lexicons',
        [
          'id',
          'label',
          'language',
          'version',
          'email',
          'license',
          'url',
          'citation',
          'logo',
        ],
        lexiconData,
        p => {
          progress?.(0.01 + p * 0.09); // 0.01-0.1

          logger.insert('lexicon progress', p);
        }
      );

      logger.insert('Inserting words...');
      const wordData = (lmfData.words || []).map(word => [
        word.id,
        word.lemma,
        word.partOfSpeech,
        word.language,
        word.lexicon,
      ]);
      batchInsert(
        'words',
        ['id', 'lemma', 'part_of_speech', 'language', 'lexicon'],
        wordData,
        p => {
          progress?.(0.1 + p * 0.2); // 0.1-0.3

          logger.insert('word progress', p);
        }
      );

      logger.insert('Inserting forms...');
      const formData = (lmfData.words || []).flatMap(word =>
        (word.forms || []).map((form: any) => [
          form.id,
          word.id,
          form.writtenForm,
          form.script,
          form.tag,
        ])
      );
      batchInsert(
        'forms',
        ['id', 'word_id', 'written_form', 'script', 'tag'],
        formData,
        p => {
          progress?.(0.3 + p * 0.1); // 0.3-0.4

          logger.insert('form progress', p);
        }
      );

      logger.insert('Inserting synsets...');
      const synsetData = (lmfData.synsets || []).map(synset => [
        synset.id,
        (synset as any).ili,
        synset.partOfSpeech,
        synset.language,
        synset.lexicon,
      ]);
      batchInsert(
        'synsets',
        ['id', 'ili', 'part_of_speech', 'language', 'lexicon'],
        synsetData,
        p => {
          progress?.(0.4 + p * 0.1); // 0.4-0.5

          logger.insert('synset progress', p);
        }
      );

      logger.insert('Inserting definitions...');
      
      
      const definitionData = (lmfData.synsets || []).flatMap(synset =>
        (synset.definitions || []).map((def: any, index: number) => [
          def.id || `def_${synset.id}_${index}`, // Generate unique ID if empty
          synset.id,
          def.language,
          def.text,
          def.source,
        ])
      );
      
      
      // Before batchInsert
      
      try {
        batchInsert(
          'definitions',
          ['id', 'synset_id', 'language', 'text', 'source'],
          definitionData,
          p => {
            progress?.(0.5 + p * 0.1); // 0.5-0.6
            logger.insert('definition progress', p);
          }
        );
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[DEBUG _addLmf] Error in batchInsert for definitions:', error);
        throw error;
      }

      logger.insert('Inserting relations...');
      const relationData = (lmfData.synsets || []).flatMap(synset =>
        (synset.relations || []).map((rel: any) => [
          rel.id,
          synset.id,
          rel.target,
          rel.type,
          rel.source,
        ])
      );
      batchInsert(
        'relations',
        ['id', 'source_id', 'target_id', 'type', 'source'],
        relationData,
        p => {
          progress?.(0.6 + p * 0.1); // 0.6-0.7

          logger.insert('relation progress', p);
        }
      );

      logger.insert('Inserting senses...');
      const senseData = (lmfData.senses || []).map(sense => [
        sense.id,
        sense.word,
        sense.synset,
        (sense as any).source,
        (sense as any).sensekey,
        (sense as any).adjposition,
        (sense as any).subcategory,
        (sense as any).domain,
        (sense as any).register,
      ]);
      batchInsert(
        'senses',
        [
          'id',
          'word_id',
          'synset_id',
          'source',
          'sensekey',
          'adjposition',
          'subcategory',
          'domain',
          'register',
        ],
        senseData,
        p => {
          progress?.(0.7 + p * 0.1); // 0.7-0.8

          logger.insert('sense progress', p);
        }
      );

      logger.insert('Inserting examples...');
      const synsetExampleData = (lmfData.synsets || []).flatMap(synset =>
        (synset.examples || []).map((ex: any) => [
          ex.id,
          synset.id,
          null,
          ex.language,
          ex.text,
          ex.source,
        ])
      );
      const senseExampleData = (lmfData.senses || []).flatMap(sense =>
        (sense.examples || []).map((ex: any) => [
          ex.id,
          null,
          sense.id,
          ex.language,
          ex.text,
          ex.source,
        ])
      );
      batchInsert(
        'examples',
        ['id', 'synset_id', 'sense_id', 'language', 'text', 'source'],
        [...synsetExampleData, ...senseExampleData],
        p => {
          progress?.(0.8 + p * 0.19); // 0.8-0.99

          logger.insert('example progress', p);
        }
      );

      logger.insert('Committing transaction...');
    });
    if (progress) progress(1.0);
    logger.success('Data added successfully.');
    return lexiconExists;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[DEBUG _addLmf] Error during DB transaction:', e);
    throw e;
  } finally {
    db.close();
  }
}

/**
 * Remove a lexicon from the database
 */
export async function remove(lexiconId: string): Promise<void> {
  db.initialize();
  try {
    const existing = db.get('SELECT id FROM lexicons WHERE id = ?', [lexiconId]);
    if (!existing) {
      throw new ProjectError(`Lexicon ${lexiconId} not found.`);
    }

    db.transaction(() => {
      const BATCH_SIZE = 500; // A safe limit for SQLite

      // Get IDs to be deleted
      const words = db.all('SELECT id FROM words WHERE lexicon = ?', [lexiconId]);
      const wordIds = (words as { id: string }[]).map(w => w.id);

      const synsets = db.all('SELECT id FROM synsets WHERE lexicon = ?', [lexiconId]);
      const synsetIds = (synsets as { id: string }[]).map(s => s.id);

      // Batch delete from child tables first to avoid cascade issues
      for (let i = 0; i < wordIds.length; i += BATCH_SIZE) {
        const batch = wordIds.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => '?').join(',');
        db.run(`DELETE FROM senses WHERE word_id IN (${placeholders})`, batch);
        db.run(`DELETE FROM forms WHERE word_id IN (${placeholders})`, batch);
      }

      for (let i = 0; i < synsetIds.length; i += BATCH_SIZE) {
        const batch = synsetIds.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => '?').join(',');
        db.run(`DELETE FROM relations WHERE source_id IN (${placeholders})`, batch);
        db.run(`DELETE FROM relations WHERE target_id IN (${placeholders})`, batch);
        db.run(`DELETE FROM definitions WHERE synset_id IN (${placeholders})`, batch);
        db.run(`DELETE FROM examples WHERE synset_id IN (${placeholders})`, batch);
      }

      // Now delete from parent tables, which should now be safe.
      // We delete by ID in batches to avoid triggering a massive cascade from
      // a single 'DELETE ... WHERE lexicon = ?' statement.
      for (let i = 0; i < wordIds.length; i += BATCH_SIZE) {
        const batch = wordIds.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => '?').join(',');
        db.run(`DELETE FROM words WHERE id IN (${placeholders})`, batch);
      }

      for (let i = 0; i < synsetIds.length; i += BATCH_SIZE) {
        const batch = synsetIds.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => '?').join(',');
        db.run(`DELETE FROM synsets WHERE id IN (${placeholders})`, batch);
      }

      // Finally, delete the lexicon itself.
      db.run('DELETE FROM lexicons WHERE id = ?', [lexiconId]);
    });
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to remove lexicon: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    db.close();
  }
}

/**
 * Export data from the database
 */
export async function exportData(options: ExportOptions): Promise<void> {
  const { format, output, include, exclude } = options;

  if (!['json', 'xml', 'csv'].includes(format)) {
    throw new ProjectError(`Unsupported export format: ${format}`);
  }

  db.initialize();
  try {
    // Get all lexicons
    const lexicons = db.all('SELECT * FROM lexicons');

    // Filter lexicons based on include/exclude
    let filteredLexicons = lexicons;
    if (include && include.length > 0) {
      filteredLexicons = (lexicons as { id: string }[]).filter(l =>
        include.includes(l.id)
      );
    }
    if (exclude && exclude.length > 0) {
      filteredLexicons = (filteredLexicons as { id: string }[]).filter(
        l => !exclude.includes(l.id)
      );
    }

    let outputContent: string;

    switch (format) {
      case 'json':
        outputContent = await exportToJSON(filteredLexicons);
        break;
      case 'xml':
        outputContent = await exportToXML(filteredLexicons);
        break;
      case 'csv':
        outputContent = await exportToCSV(filteredLexicons);
        break;
      default:
        throw new ProjectError(`Unsupported export format: ${format}`);
    }

    if (output) {
      const fs = await import('fs/promises');
      await fs.writeFile(output, outputContent);
    } else {
      logger.info(outputContent);
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to export data: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    db.close();
  }
}

/**
 * Export data to JSON format
 */
async function exportToJSON(lexicons: unknown[]): Promise<string> {
  const exportData: any = {
    lexicons: [],
    exportDate: new Date().toISOString(),
    format: 'json',
  };

  for (const lexicon of lexicons as Record<string, any>[]) {
    const lexiconData: any = {
      ...lexicon,
      entries: [],
      synsets: [],
    };

    // Get words (entries) for this lexicon
    const words = db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as any[]) {
      const entry: any = {
        id: word.id,
        lemma: {
          writtenForm: word.lemma,
          partOfSpeech: word.part_of_speech,
        },
        senses: [],
      };

      // Get senses for this word
      const senses = db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        entry.senses.push({
          id: sense.id,
          synset: sense.synset_id,
        });
      }

      lexiconData.entries.push(entry);
    }

    // Get synsets for this lexicon
    const synsets = db.all('SELECT * FROM synsets WHERE lexicon = ?', [lexicon.id]);
    for (const synset of synsets as any[]) {
      const synsetData: any = {
        id: synset.id,
        partOfSpeech: synset.part_of_speech,
        ili: synset.ili,
        definition: '',
        examples: [],
      };

      // Get definitions for this synset
      const definitions = db.all('SELECT * FROM definitions WHERE synset_id = ?', [
        synset.id,
      ]);
      if (definitions.length > 0) {
        synsetData.definition = (definitions[0] as any).text;
      }

      // Get examples for this synset
      const examples = db.all('SELECT * FROM examples WHERE synset_id = ?', [
        synset.id,
      ]);
      for (const example of examples as any[]) {
        synsetData.examples.push({
          text: example.text,
          language: example.language,
        });
      }

      lexiconData.synsets.push(synsetData);
    }

    exportData.lexicons.push(lexiconData);
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export data to XML format
 */
async function exportToXML(lexicons: unknown[]): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<lexical-resources>\n';

  for (const lexicon of lexicons as Record<string, any>[]) {
    xml += `  <lexicon id="${lexicon.id}" label="${lexicon.label}" language="${lexicon.language}">\n`;

    // Get words for this lexicon
    const words = db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as any[]) {
      xml += `    <word id="${word.id}" lemma="${word.lemma}" pos="${word.part_of_speech}">\n`;

      // Get forms for this word
      const forms = db.all('SELECT * FROM forms WHERE word_id = ?', [word.id]);
      for (const form of forms as any[]) {
        xml += `      <form written="${form.written_form}" script="${form.script || ''}" tag="${form.tag || ''}"/>\n`;
      }

      // Get senses for this word
      const senses = db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        xml += `      <sense id="${sense.id}" synset="${sense.synset_id}"/>\n`;
      }

      xml += '    </word>\n';
    }

    // Get synsets for this lexicon
    const synsets = db.all('SELECT * FROM synsets WHERE lexicon = ?', [lexicon.id]);
    for (const synset of synsets as any[]) {
      xml += `    <synset id="${synset.id}" pos="${synset.part_of_speech}">\n`;

      // Get definitions for this synset
      const definitions = db.all('SELECT * FROM definitions WHERE synset_id = ?', [
        synset.id,
      ]);
      for (const def of definitions as any[]) {
        xml += `      <definition language="${def.language}">${def.text}</definition>\n`;
      }

      // Get examples for this synset
      const examples = db.all('SELECT * FROM examples WHERE synset_id = ?', [
        synset.id,
      ]);
      for (const example of examples as any[]) {
        xml += `      <example language="${example.language}">${example.text}</example>\n`;
      }

      xml += '    </synset>\n';
    }

    xml += '  </lexicon>\n';
  }

  xml += '</lexical-resources>';
  return xml;
}

/**
 * Export data to CSV format
 */
async function exportToCSV(lexicons: unknown[]): Promise<string> {
  const csvLines: string[] = [];

  // Header
  csvLines.push('Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example');

  for (const lexicon of lexicons as Record<string, any>[]) {
    // Get words for this lexicon
    const words = db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as Record<string, any>[]) {
      // Get definitions and examples for this word's synsets
      const senses = db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        const synset = db.get('SELECT * FROM synsets WHERE id = ?', [
          sense.synset_id,
        ]) as { id: string } | undefined;
        if (synset) {
          const definitions = db.all('SELECT * FROM definitions WHERE synset_id = ?', [
            synset.id,
          ]);
          const examples = db.all('SELECT * FROM examples WHERE synset_id = ?', [
            synset.id,
          ]);

          const def =
            Array.isArray(definitions) &&
            definitions.length > 0 &&
            typeof definitions[0] === 'object' &&
            definitions[0] &&
            'text' in definitions[0]
              ? (definitions[0] as any).text
              : '';
          const ex =
            Array.isArray(examples) &&
            examples.length > 0 &&
            typeof examples[0] === 'object' &&
            examples[0] &&
            'text' in examples[0]
              ? (examples[0] as any).text
              : '';

          csvLines.push(
            `word,${word.id},"${word.lemma}",${word.part_of_speech},${word.language},${word.lexicon},"${def}","${ex}"`
          );
        }
      }
    }
  }

  return csvLines.join('\n');
}

/**
 * Add a lexical resource (alias for add function)
 */
export async function addLexicalResource(
  path: string,
  options: AddOptions & { dryRun?: boolean } = {}
): Promise<boolean> {
  return add(path, options);
}
