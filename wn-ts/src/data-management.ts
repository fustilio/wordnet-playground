import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { db } from './database.js';
import { downloadFile } from './utils/download.js';
import { loadLMF, isLMF } from './lmf.js';
import { getProjectVersionUrls, getProjectVersionError } from './project.js';
import type { DownloadOptions, AddOptions, ExportOptions } from './types.js';
import { ProjectError, DatabaseError } from './types.js';
import { extractTarArchive, findLMFiles, decompressXz, decompressGz } from './utils/archive.js';
import { isILI, loadILI } from './ili.js';
import { logger } from './utils/logger.js';

/**
 * Helper to batch insert data into SQLite to avoid performance issues.
 */
async function batchInsert(
  tableName: string,
  columns: string[],
  data: any[][]
): Promise<void> {
  if (data.length === 0) return;

  // SQLite has a default limit of 999 variables per statement.
  // We'll use a slightly lower number to be safe.
  const MAX_VARS = 900;
  const batchSize = Math.floor(MAX_VARS / columns.length);
  const colNames = columns.join(', ');

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    if (batch.length === 0) continue;
    
    const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const params = batch.flat();
    const sql = `INSERT OR REPLACE INTO ${tableName} (${colNames}) VALUES ${placeholders}`;
    await db.run(sql, params);
  }
}

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
    throw new ProjectError(`Project ID must include version (e.g., 'oewn:2024'): ${projectId}`);
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
      await downloadFile(url, destination, progress ? { onProgress: progress } : undefined);
      logger.success(`Successfully downloaded to ${destination}`);
      return destination;
    } catch (error) {
      logger.error(`Failed to download from ${url}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new ProjectError(`Failed to download project ${projectId} from all sources: ${lastError?.message}`);
}

/**
 * Add a lexical resource to the database
 */
export async function add(
  path: string,
  options: AddOptions = {}
): Promise<void> {
  const { progress } = options;
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
    const isIliFile = !isLmfFile && await isILI(processedPath);

    if (isLmfFile) {
      await _addLmf(processedPath, options);
    } else if (isIliFile) {
      await _addIli(processedPath, options);
    } else {
      throw new ProjectError(`File is not a valid LMF or ILI file: ${processedPath}`);
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new DatabaseError(`Failed to add lexical resource: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function _addIli(path: string, options: AddOptions): Promise<void> {
  const { progress } = options;
  logger.info(`Loading ILI file: ${path}...`);
  const iliData = await loadILI(path);
  logger.success(`ILI file loaded. Found ${iliData.length} records.`);
  if (progress) progress(0.5);

  const records = iliData.map(record => [
    record.ili,
    record.definition || null,
    record.status,
    null, // superseded_by
    null, // note
    null, // meta
  ]);

  await db.initialize();
  await db.run('BEGIN TRANSACTION');
  try {
    logger.insert('Inserting ILI records...');
    await batchInsert('ilis', ['id', 'definition', 'status', 'superseded_by', 'note', 'meta'], records);
    await db.run('COMMIT');
    if (progress) progress(1.0);
    logger.success('ILI data added successfully.');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

async function _addLmf(path: string, options: AddOptions): Promise<void> {
  const { force = false, progress } = options;

  await db.initialize();
    logger.info(`Loading LMF file: ${path}...`);
    const lmfOptions: any = { debug: false };
    if (progress) lmfOptions.progress = progress;
    const lmfData = await loadLMF(path, lmfOptions);
    logger.success(`LMF file loaded. Found ${lmfData.lexicons.length} lexicons.`);
    
    // Pre-check lexicons before transaction
    if (!force) {
      for (const lexicon of lmfData.lexicons || []) {
        const existing = await db.get(
          'SELECT id FROM lexicons WHERE id = ? AND version = ?',
          [lexicon.id, lexicon.version]
        );
        if (existing) {
          throw new ProjectError(`Lexicon ${lexicon.id}:${lexicon.version} already exists. Use force=true to overwrite.`);
        }
      }
    }

    await db.run('BEGIN TRANSACTION');

    try {
      logger.insert('Inserting lexicons...');
      const lexiconData = (lmfData.lexicons || []).map(lexicon => [
        lexicon.id, lexicon.label, lexicon.language, lexicon.version,
        lexicon.email, lexicon.license, lexicon.url, lexicon.citation, lexicon.logo
      ]);
      await batchInsert('lexicons', ['id', 'label', 'language', 'version', 'email', 'license', 'url', 'citation', 'logo'], lexiconData);
      
      logger.insert('Inserting words...');
      const wordData = (lmfData.words || []).map(word => [word.id, word.lemma, word.partOfSpeech, word.language, word.lexicon]);
      await batchInsert('words', ['id', 'lemma', 'part_of_speech', 'language', 'lexicon'], wordData);
      
      logger.insert('Inserting forms...');
      const formData = (lmfData.words || []).flatMap(word => (word.forms || []).map((form: any) => [form.id, word.id, form.writtenForm, form.script, form.tag]));
      await batchInsert('forms', ['id', 'word_id', 'written_form', 'script', 'tag'], formData);
      
      logger.insert('Inserting synsets...');
      const synsetData = (lmfData.synsets || []).map(synset => [synset.id, (synset as any).ili, synset.partOfSpeech, synset.language, synset.lexicon]);
      await batchInsert('synsets', ['id', 'ili', 'part_of_speech', 'language', 'lexicon'], synsetData);
      
      logger.insert('Inserting definitions...');
      const definitionData = (lmfData.synsets || []).flatMap(synset => (synset.definitions || []).map((def: any) => [def.id, synset.id, def.language, def.text, def.source]));
      await batchInsert('definitions', ['id', 'synset_id', 'language', 'text', 'source'], definitionData);
      
      logger.insert('Inserting relations...');
      const relationData = (lmfData.synsets || []).flatMap(synset => (synset.relations || []).map((rel: any) => [rel.id, synset.id, rel.target, rel.type, rel.source]));
      await batchInsert('relations', ['id', 'source_id', 'target_id', 'type', 'source'], relationData);
      
      logger.insert('Inserting senses...');
      const senseData = (lmfData.senses || []).map(sense => [
        sense.id, sense.word, sense.synset, (sense as any).source, (sense as any).sensekey,
        (sense as any).adjposition, (sense as any).subcategory, (sense as any).domain, (sense as any).register
      ]);
      await batchInsert('senses', ['id', 'word_id', 'synset_id', 'source', 'sensekey', 'adjposition', 'subcategory', 'domain', 'register'], senseData);
      
      logger.insert('Inserting examples...');
      const synsetExampleData = (lmfData.synsets || []).flatMap(synset => (synset.examples || []).map((ex: any) => [ex.id, synset.id, null, ex.language, ex.text, ex.source]));
      const senseExampleData = (lmfData.senses || []).flatMap(sense => (sense.examples || []).map((ex: any) => [ex.id, null, sense.id, ex.language, ex.text, ex.source]));
      await batchInsert('examples', ['id', 'synset_id', 'sense_id', 'language', 'text', 'source'], [...synsetExampleData, ...senseExampleData]);

      logger.insert('Committing transaction...');
      await db.run('COMMIT');
      if (progress) progress(1.0);
      logger.success('Data added successfully.');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
}

/**
 * Remove a lexicon from the database
 */
export async function remove(lexiconId: string): Promise<void> {
  await db.initialize();
  
  try {
    const existing = await db.get('SELECT id FROM lexicons WHERE id = ?', [lexiconId]);
    if (!existing) {
      throw new ProjectError(`Lexicon ${lexiconId} not found.`);
    }
    
    await db.run('BEGIN TRANSACTION');
    try {
      // Get synset IDs to clean up relations table, which doesn't use cascades from synsets
      const synsets = await db.all('SELECT id FROM synsets WHERE lexicon = ?', [lexiconId]);
      const synsetIds = (synsets as { id: string }[]).map(s => s.id);

      if (synsetIds.length > 0) {
        const placeholders = synsetIds.map(() => '?').join(',');
        // Delete relations where source or target is in this lexicon
        await db.run(`DELETE FROM relations WHERE source_id IN (${placeholders})`, synsetIds);
        await db.run(`DELETE FROM relations WHERE target_id IN (${placeholders})`, synsetIds);
      }
      
      // With ON DELETE CASCADE on other tables, we only need to delete from lexicons
      await db.run('DELETE FROM lexicons WHERE id = ?', [lexiconId]);
      
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new DatabaseError(`Failed to remove lexicon: ${error instanceof Error ? error.message : String(error)}`);
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
  
  await db.initialize();
  
  try {
    // Get all lexicons
    const lexicons = await db.all('SELECT * FROM lexicons');
    
    // Filter lexicons based on include/exclude
    let filteredLexicons = lexicons;
    if (include && include.length > 0) {
      filteredLexicons = (lexicons as { id: string }[]).filter(l => include.includes(l.id));
    }
    if (exclude && exclude.length > 0) {
      filteredLexicons = (filteredLexicons as { id: string }[]).filter(l => !exclude.includes(l.id));
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
    throw new DatabaseError(`Failed to export data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Export data to JSON format
 */
async function exportToJSON(lexicons: unknown[]): Promise<string> {
  const exportData = {
    lexicons,
    exportDate: new Date().toISOString(),
    format: 'json',
  };
  
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
    const words = await db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as any[]) {
      xml += `    <word id="${word.id}" lemma="${word.lemma}" pos="${word.part_of_speech}">\n`;
      
      // Get forms for this word
      const forms = await db.all('SELECT * FROM forms WHERE word_id = ?', [word.id]);
      for (const form of forms as any[]) {
        xml += `      <form written="${form.written_form}" script="${form.script || ''}" tag="${form.tag || ''}"/>\n`;
      }
      
      // Get senses for this word
      const senses = await db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        xml += `      <sense id="${sense.id}" synset="${sense.synset_id}"/>\n`;
      }
      
      xml += '    </word>\n';
    }
    
    // Get synsets for this lexicon
    const synsets = await db.all('SELECT * FROM synsets WHERE lexicon = ?', [lexicon.id]);
    for (const synset of synsets as any[]) {
      xml += `    <synset id="${synset.id}" pos="${synset.part_of_speech}">\n`;
      
      // Get definitions for this synset
      const definitions = await db.all('SELECT * FROM definitions WHERE synset_id = ?', [synset.id]);
      for (const def of definitions as any[]) {
        xml += `      <definition language="${def.language}">${def.text}</definition>\n`;
      }
      
      // Get examples for this synset
      const examples = await db.all('SELECT * FROM examples WHERE synset_id = ?', [synset.id]);
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
    const words = await db.all('SELECT * FROM words WHERE lexicon = ?', [lexicon.id]);
    for (const word of words as Record<string, any>[]) {
      // Get definitions and examples for this word's synsets
      const senses = await db.all('SELECT * FROM senses WHERE word_id = ?', [word.id]);
      for (const sense of senses as any[]) {
        const synset = await db.get('SELECT * FROM synsets WHERE id = ?', [sense.synset_id]) as { id: string } | undefined;
        if (synset) {
          const definitions = await db.all('SELECT * FROM definitions WHERE synset_id = ?', [synset.id]);
          const examples = await db.all('SELECT * FROM examples WHERE synset_id = ?', [synset.id]);
          
          const def = Array.isArray(definitions) && definitions.length > 0 && typeof definitions[0] === 'object' && definitions[0] && 'text' in definitions[0] ? (definitions[0] as any).text : '';
          const ex = Array.isArray(examples) && examples.length > 0 && typeof examples[0] === 'object' && examples[0] && 'text' in examples[0] ? (examples[0] as any).text : '';
          
          csvLines.push(`word,${word.id},"${word.lemma}",${word.part_of_speech},${word.language},${word.lexicon},"${def}","${ex}"`);
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
  options: AddOptions = {}
): Promise<void> {
  return add(path, options);
}
