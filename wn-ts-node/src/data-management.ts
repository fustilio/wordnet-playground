import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { db } from './db/database.js';
import { downloadFile } from './utils/download.js';
import { loadLMF, isLMF } from './lmf.js';
import { getProjectVersionUrls, getProjectVersionError } from './project.js';
import type { DownloadOptions, AddOptions, ExportOptions, IliRecord } from 'wn-ts-core';
import { ProjectError, DatabaseError, logger } from 'wn-ts-core';
import {
  extractTarArchive,
  findLMFiles,
  decompressXz,
  decompressGz,
} from './utils/archive.js';
import { loadILI, isILI } from './ili.js';
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
        progress ? { progress: progress } : undefined
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
  const iliData: IliRecord[] = await loadILI(path);
  logger.success(`ILI file loaded. Found ${iliData.length} records.`);
  if (progress) progress(0.5);

  if (dryRun) {
    logger.info('[DRY RUN] This is a dry run. No data will be written.');
    logger.info(`[DRY RUN] Would add ${iliData.length} ILI records.`);
    return false;
  }

  const records = iliData.map((record: IliRecord) => [
    record.id,
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
        word.pos,
        word.language,
        word.lexicon,
      ]);
      batchInsert(
        'words',
        ['id', 'lemma', 'pos', 'language', 'lexicon'],
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
        synset.pos,
        synset.language,
        synset.lexicon,
      ]);
      batchInsert(
        'synsets',
        ['id', 'ili', 'pos', 'language', 'lexicon'],
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
          progress?.(0.8 + p * 0.05); // 0.8-0.85

          logger.insert('example progress', p);
        }
      );

      logger.insert('Inserting word tags...');
      const wordTagData = (lmfData.words || []).flatMap(word =>
        (word.tags || []).map((tag: any, index: number) => [
          tag.id || `tag_${word.id}_${index}`,
          word.id,
          null, // form_id
          tag.category,
          tag.value,
        ])
      );
      batchInsert(
        'tags',
        ['id', 'word_id', 'form_id', 'category', 'text'],
        wordTagData,
        p => {
          progress?.(0.85 + p * 0.02); // 0.85-0.87

          logger.insert('word tag progress', p);
        }
      );

      logger.insert('Inserting form tags...');
      const formTagData = (lmfData.words || []).flatMap(word =>
        (word.forms || []).flatMap(form =>
          form.tag ? [[
            `tag_${form.id}_0`,
            null, // word_id
            form.id,
            'tag-category', // Default category
            form.tag,
          ]] : []
        )
      );
      batchInsert(
        'tags',
        ['id', 'word_id', 'form_id', 'category', 'text'],
        formTagData,
        p => {
          progress?.(0.87 + p * 0.02); // 0.87-0.89

          logger.insert('form tag progress', p);
        }
      );

      logger.insert('Inserting sense tags...');
      const senseTagData = (lmfData.senses || []).flatMap(sense =>
        (sense.tags || []).map((tag: any, index: number) => [
          tag.id || `tag_${sense.id}_${index}`,
          null, // word_id
          null, // form_id
          tag.category,
          tag.value,
        ])
      );
      batchInsert(
        'tags',
        ['id', 'word_id', 'form_id', 'category', 'text'],
        senseTagData,
        p => {
          progress?.(0.89 + p * 0.02); // 0.89-0.91

          logger.insert('sense tag progress', p);
        }
      );

      logger.insert('Inserting word counts...');
      const wordCountData = (lmfData.words || []).flatMap(word =>
        (word.counts || []).map((count: any, index: number) => [
          count.id || `count_${word.id}_${index}`,
          null, // sense_id
          count.value,
          count.dc_source,
        ])
      );
      batchInsert(
        'counts',
        ['id', 'sense_id', 'value', 'dc_source'],
        wordCountData,
        p => {
          progress?.(0.91 + p * 0.02); // 0.91-0.93

          logger.insert('word count progress', p);
        }
      );

      logger.insert('Inserting sense counts...');
      const senseCountData = (lmfData.senses || []).flatMap(sense =>
        (sense.counts || []).map((count: any, index: number) => [
          count.id || `count_${sense.id}_${index}`,
          sense.id,
          count.value,
          count.dc_source,
        ])
      );
      batchInsert(
        'counts',
        ['id', 'sense_id', 'value', 'dc_source'],
        senseCountData,
        p => {
          progress?.(0.93 + p * 0.02); // 0.93-0.95

          logger.insert('sense count progress', p);
        }
      );

      logger.insert('Inserting sense relations...');
      const senseRelationData = (lmfData.senses || []).flatMap(sense =>
        (sense.relations || []).map((rel: any, index: number) => [
          rel.id || `sense_rel_${sense.id}_${index}`,
          sense.id,
          rel.type,
          rel.target,
          rel.dc_type,
        ])
      );
      batchInsert(
        'sense_relations',
        ['id', 'sense_id', 'rel_type', 'target', 'dc_type'],
        senseRelationData,
        p => {
          progress?.(0.95 + p * 0.02); // 0.95-0.97

          logger.insert('sense relation progress', p);
        }
      );

      logger.insert('Inserting ILI definitions...');
      const iliDefinitionData = (lmfData.synsets || []).flatMap(synset =>
        (synset.iliDefinitions || []).map((def: any, index: number) => [
          def.id || `ili_def_${synset.id}_${index}`,
          synset.id,
          def.text,
          def.language || 'en',
        ])
      );
      batchInsert(
        'ili_definitions',
        ['id', 'synset_id', 'text', 'language'],
        iliDefinitionData,
        p => {
          progress?.(0.97 + p * 0.015); // 0.97-0.985

          logger.insert('ili definition progress', p);
        }
      );

      logger.insert('Inserting syntactic behaviours...');
      const syntacticBehaviourData = (lmfData.words || []).flatMap(word =>
        (word.frames || []).map((frame: any, index: number) => [
          frame.id || `sb_${word.id}_${index}`,
          word.id,
          frame.senses,
          frame.subcategorizationFrame,
          frame.source || '',
        ])
      );
      batchInsert(
        'syntactic_behaviours',
        ['id', 'word_id', 'senses', 'subcategorization_frame', 'source'],
        syntacticBehaviourData,
        p => {
          progress?.(0.97 + p * 0.015); // 0.97-0.985

          logger.insert('syntactic behaviour progress', p);
        }
      );

      logger.insert('Inserting synset relations...');
      const synsetRelationData = (lmfData.synsets || []).flatMap(synset =>
        (synset.relations || []).map((rel: any, index: number) => [
          rel.id || `synset_rel_${synset.id}_${index}`,
          synset.id,
          rel.type,
          rel.target,
        ])
      );
      batchInsert(
        'synset_relations',
        ['id', 'synset_id', 'rel_type', 'target'],
        synsetRelationData,
        p => {
          progress?.(0.985 + p * 0.015); // 0.985-1.0

          logger.insert('synset relation progress', p);
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
          partOfSpeech: word.pos,
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
        partOfSpeech: synset.pos,
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
 * Export data to XML format following LMF schema
 */
async function exportToXML(lexicons: unknown[]): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">\n';
  xml += '<LexicalResource xmlns:dc="http://purl.org/dc/elements/1.1/">\n';

  for (const lexicon of lexicons as Record<string, any>[]) {
    // Export lexicon with all required attributes
    xml += `  <Lexicon id="${lexicon.id}" label="${lexicon.label}" language="${lexicon.language}"`;
    xml += ` email="${lexicon.email || 'maintainer@example.com'}"`;
    xml += ` license="${lexicon.license || 'https://creativecommons.org/licenses/by/4.0/'}"`;
    xml += ` version="${lexicon.version || '1'}"`;
    if (lexicon.url) xml += ` url="${lexicon.url}"`;
    if (lexicon.citation) xml += ` citation="${lexicon.citation}"`;
    if (lexicon.dc_contributor) xml += ` dc:contributor="${lexicon.dc_contributor}"`;
    if (lexicon.dc_coverage) xml += ` dc:coverage="${lexicon.dc_coverage}"`;
    if (lexicon.dc_creator) xml += ` dc:creator="${lexicon.dc_creator}"`;
    if (lexicon.dc_date) xml += ` dc:date="${lexicon.dc_date}"`;
    if (lexicon.dc_description) xml += ` dc:description="${lexicon.dc_description}"`;
    if (lexicon.dc_format) xml += ` dc:format="${lexicon.dc_format}"`;
    if (lexicon.dc_identifier) xml += ` dc:identifier="${lexicon.dc_identifier}"`;
    if (lexicon.dc_publisher) xml += ` dc:publisher="${lexicon.dc_publisher}"`;
    if (lexicon.dc_relation) xml += ` dc:relation="${lexicon.dc_relation}"`;
    if (lexicon.dc_rights) xml += ` dc:rights="${lexicon.dc_rights}"`;
    if (lexicon.dc_source) xml += ` dc:source="${lexicon.dc_source}"`;
    if (lexicon.dc_subject) xml += ` dc:subject="${lexicon.dc_subject}"`;
    if (lexicon.dc_title) xml += ` dc:title="${lexicon.dc_title}"`;
    if (lexicon.dc_type) xml += ` dc:type="${lexicon.dc_type}"`;
    if (lexicon.status) xml += ` status="${lexicon.status}"`;
    if (lexicon.note) xml += ` note="${lexicon.note}"`;
    if (lexicon.confidence_score) xml += ` confidenceScore="${lexicon.confidence_score}"`;
    xml += '>\n';

    // Get words (LexicalEntry) for this lexicon
    const words = db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as any[]) {
      xml += `    <LexicalEntry id="${word.id}"`;
      if (word.dc_contributor) xml += ` dc:contributor="${word.dc_contributor}"`;
      if (word.dc_coverage) xml += ` dc:coverage="${word.dc_coverage}"`;
      if (word.dc_creator) xml += ` dc:creator="${word.dc_creator}"`;
      if (word.dc_date) xml += ` dc:date="${word.dc_date}"`;
      if (word.dc_description) xml += ` dc:description="${word.dc_description}"`;
      if (word.dc_format) xml += ` dc:format="${word.dc_format}"`;
      if (word.dc_identifier) xml += ` dc:identifier="${word.dc_identifier}"`;
      if (word.dc_publisher) xml += ` dc:publisher="${word.dc_publisher}"`;
      if (word.dc_relation) xml += ` dc:relation="${word.dc_relation}"`;
      if (word.dc_rights) xml += ` dc:rights="${word.dc_rights}"`;
      if (word.dc_source) xml += ` dc:source="${word.dc_source}"`;
      if (word.dc_subject) xml += ` dc:subject="${word.dc_subject}"`;
      if (word.dc_title) xml += ` dc:title="${word.dc_title}"`;
      if (word.dc_type) xml += ` dc:type="${word.dc_type}"`;
      if (word.status) xml += ` status="${word.status}"`;
      if (word.note) xml += ` note="${word.note}"`;
      if (word.confidence_score) xml += ` confidenceScore="${word.confidence_score}"`;
      xml += '>\n';

      // Export Lemma
      xml += `      <Lemma partOfSpeech="${word.pos}" writtenForm="${word.lemma}"`;
      if (word.script) xml += ` script="${word.script}"`;
      xml += '>\n';
      
      // Get tags for this word
      const tags = db.all('SELECT * FROM tags WHERE word_id = ?', [word.id]);
      for (const tag of tags as any[]) {
        xml += `        <Tag category="${tag.category}">${tag.text}</Tag>\n`;
      }
      xml += '      </Lemma>\n';

      // Get forms for this word
      const forms = db.all('SELECT * FROM forms WHERE word_id = ?', [word.id]);
      for (const form of forms as any[]) {
        xml += `      <Form writtenForm="${form.written_form}"`;
        if (form.script) xml += ` script="${form.script}"`;
        xml += '>\n';
        
        // Get tags for this form
        const formTags = db.all('SELECT * FROM tags WHERE form_id = ?', [form.id]);
        for (const tag of formTags as any[]) {
          xml += `        <Tag category="${tag.category}">${tag.text}</Tag>\n`;
        }
        xml += '      </Form>\n';
      }

      // Get senses for this word
      const senses = db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        xml += `      <Sense id="${sense.id}" synset="${sense.synset_id}"`;
        if (sense.lexicalized !== undefined) xml += ` lexicalized="${sense.lexicalized}"`;
        if (sense.adjposition) xml += ` adjposition="${sense.adjposition}"`;
        if (sense.dc_contributor) xml += ` dc:contributor="${sense.dc_contributor}"`;
        if (sense.dc_coverage) xml += ` dc:coverage="${sense.dc_coverage}"`;
        if (sense.dc_creator) xml += ` dc:creator="${sense.dc_creator}"`;
        if (sense.dc_date) xml += ` dc:date="${sense.dc_date}"`;
        if (sense.dc_description) xml += ` dc:description="${sense.dc_description}"`;
        if (sense.dc_format) xml += ` dc:format="${sense.dc_format}"`;
        if (sense.dc_identifier) xml += ` dc:identifier="${sense.dc_identifier}"`;
        if (sense.dc_publisher) xml += ` dc:publisher="${sense.dc_publisher}"`;
        if (sense.dc_relation) xml += ` dc:relation="${sense.dc_relation}"`;
        if (sense.dc_rights) xml += ` dc:rights="${sense.dc_rights}"`;
        if (sense.dc_source) xml += ` dc:source="${sense.dc_source}"`;
        if (sense.dc_subject) xml += ` dc:subject="${sense.dc_subject}"`;
        if (sense.dc_title) xml += ` dc:title="${sense.dc_title}"`;
        if (sense.dc_type) xml += ` dc:type="${sense.dc_type}"`;
        if (sense.status) xml += ` status="${sense.status}"`;
        if (sense.note) xml += ` note="${sense.note}"`;
        if (sense.confidence_score) xml += ` confidenceScore="${sense.confidence_score}"`;
        xml += '>\n';

        // Get sense relations
        const senseRelations = db.all('SELECT * FROM sense_relations WHERE sense_id = ?', [sense.id]);
        for (const rel of senseRelations as any[]) {
          xml += `        <SenseRelation relType="${rel.rel_type}" target="${rel.target}"`;
          if (rel.dc_type) xml += ` dc:type="${rel.dc_type}"`;
          xml += ' />\n';
        }

        // Get examples for this sense
        const senseExamples = db.all('SELECT * FROM examples WHERE sense_id = ?', [sense.id]);
        for (const example of senseExamples as any[]) {
          xml += `        <Example`;
          if (example.language) xml += ` language="${example.language}"`;
          xml += `>${example.text}</Example>\n`;
        }

        // Get counts for this sense
        const counts = db.all('SELECT * FROM counts WHERE sense_id = ?', [sense.id]);
        for (const count of counts as any[]) {
          xml += `        <Count`;
          if (count.dc_source) xml += ` dc:source="${count.dc_source}"`;
          xml += `>${count.value}</Count>\n`;
        }

        xml += '      </Sense>\n';
      }

      // Get syntactic behaviours for this word
      const syntacticBehaviours = db.all('SELECT * FROM syntactic_behaviours WHERE word_id = ?', [word.id]);
      for (const sb of syntacticBehaviours as any[]) {
        xml += `      <SyntacticBehaviour senses="${sb.senses}" subcategorizationFrame="${sb.subcategorization_frame}"`;
        if (sb.dc_contributor) xml += ` dc:contributor="${sb.dc_contributor}"`;
        if (sb.dc_coverage) xml += ` dc:coverage="${sb.dc_coverage}"`;
        if (sb.dc_creator) xml += ` dc:creator="${sb.dc_creator}"`;
        if (sb.dc_date) xml += ` dc:date="${sb.dc_date}"`;
        if (sb.dc_description) xml += ` dc:description="${sb.dc_description}"`;
        if (sb.dc_format) xml += ` dc:format="${sb.dc_format}"`;
        if (sb.dc_identifier) xml += ` dc:identifier="${sb.dc_identifier}"`;
        if (sb.dc_publisher) xml += ` dc:publisher="${sb.dc_publisher}"`;
        if (sb.dc_relation) xml += ` dc:relation="${sb.dc_relation}"`;
        if (sb.dc_rights) xml += ` dc:rights="${sb.dc_rights}"`;
        if (sb.dc_source) xml += ` dc:source="${sb.dc_source}"`;
        if (sb.dc_subject) xml += ` dc:subject="${sb.dc_subject}"`;
        if (sb.dc_title) xml += ` dc:title="${sb.dc_title}"`;
        if (sb.dc_type) xml += ` dc:type="${sb.dc_type}"`;
        if (sb.status) xml += ` status="${sb.status}"`;
        if (sb.note) xml += ` note="${sb.note}"`;
        if (sb.confidence_score) xml += ` confidenceScore="${sb.confidence_score}"`;
        xml += ' />\n';
      }

      xml += '    </LexicalEntry>\n';
    }

    // Get synsets for this lexicon
    const synsets = db.all('SELECT * FROM synsets WHERE lexicon = ?', [lexicon.id]);
    for (const synset of synsets as any[]) {
      xml += `    <Synset id="${synset.id}" ili="${synset.ili || ''}" partOfSpeech="${synset.pos}"`;
      if (synset.lexicalized !== undefined) xml += ` lexicalized="${synset.lexicalized}"`;
      if (synset.dc_contributor) xml += ` dc:contributor="${synset.dc_contributor}"`;
      if (synset.dc_coverage) xml += ` dc:coverage="${synset.dc_coverage}"`;
      if (synset.dc_creator) xml += ` dc:creator="${synset.dc_creator}"`;
      if (synset.dc_date) xml += ` dc:date="${synset.dc_date}"`;
      if (synset.dc_description) xml += ` dc:description="${synset.dc_description}"`;
      if (synset.dc_format) xml += ` dc:format="${synset.dc_format}"`;
      if (synset.dc_identifier) xml += ` dc:identifier="${synset.dc_identifier}"`;
      if (synset.dc_publisher) xml += ` dc:publisher="${synset.dc_publisher}"`;
      if (synset.dc_relation) xml += ` dc:relation="${synset.dc_relation}"`;
      if (synset.dc_rights) xml += ` dc:rights="${synset.dc_rights}"`;
      if (synset.dc_source) xml += ` dc:source="${synset.dc_source}"`;
      if (synset.dc_subject) xml += ` dc:subject="${synset.dc_subject}"`;
      if (synset.dc_title) xml += ` dc:title="${synset.dc_title}"`;
      if (synset.dc_type) xml += ` dc:type="${synset.dc_type}"`;
      if (synset.status) xml += ` status="${synset.status}"`;
      if (synset.note) xml += ` note="${synset.note}"`;
      if (synset.confidence_score) xml += ` confidenceScore="${synset.confidence_score}"`;
      xml += '>\n';

      // Get definitions for this synset
      const definitions = db.all('SELECT * FROM definitions WHERE synset_id = ?', [synset.id]);
      for (const def of definitions as any[]) {
        xml += `      <Definition`;
        if (def.language) xml += ` language="${def.language}"`;
        if (def.source_sense) xml += ` sourceSense="${def.source_sense}"`;
        xml += `>${def.text}</Definition>\n`;
      }

      // Get ILI definitions for this synset
      const iliDefinitions = db.all('SELECT * FROM ili_definitions WHERE synset_id = ?', [synset.id]);
      for (const iliDef of iliDefinitions as any[]) {
        xml += `      <ILIDefinition>${iliDef.text}</ILIDefinition>\n`;
      }

      // Get synset relations
      const synsetRelations = db.all('SELECT * FROM synset_relations WHERE synset_id = ?', [synset.id]);
      for (const rel of synsetRelations as any[]) {
        xml += `      <SynsetRelation relType="${rel.rel_type}" target="${rel.target}" />\n`;
      }

      // Get examples for this synset
      const examples = db.all('SELECT * FROM examples WHERE synset_id = ?', [synset.id]);
      for (const example of examples as any[]) {
        xml += `      <Example`;
        if (example.language) xml += ` language="${example.language}"`;
        xml += `>${example.text}</Example>\n`;
      }

      xml += '    </Synset>\n';
    }

    xml += '  </Lexicon>\n';
  }

  xml += '</LexicalResource>';
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
            `word,${word.id},"${word.lemma}",${word.pos},${word.language},${word.lexicon},"${def}","${ex}"`
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

/**
 * Load and parse a lexical resource file
 * This function is environment-agnostic and returns parsed data
 */
export async function loadLexicalResource(
  path: string,
  options: { progress?: (progress: number) => void, parser?: string } = {}
): Promise<{ type: 'lmf' | 'ili', data: any }> {
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
      const lmfOptions: any = { debug: false };
      if (parser) lmfOptions.parser = parser;
      if (progress) lmfOptions.progress = progress;
      const lmfData = await loadLMF(processedPath, lmfOptions);
      return { type: 'lmf', data: lmfData };
    } else if (isIliFile) {
      const iliData = await loadILI(processedPath);
      return { type: 'ili', data: iliData };
    } else {
      throw new ProjectError(`File is not a valid LMF or ILI file: ${processedPath}`);
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new ProjectError(
      `Failed to load lexical resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
