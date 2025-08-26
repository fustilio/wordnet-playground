import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { KyselyWordnet } from './kysely-wordnet.js';
import { downloadFile } from './utils/download.js';
import { loadLMF, isLMF } from './lmf.js';
import { getProjectVersionUrls, getProjectVersionError } from './project.js';
import type { DownloadOptions, AddOptions, ExportOptions, IliRecord } from 'wn-ts-core';
import { ProjectError, DatabaseError, logger } from 'wn-ts-core';
import {
  extractTarArchive,
  decompressXz,
  decompressGz,
} from './utils/archive.js';
import { loadILI, isILI } from './ili.js';

// Create a single database instance for data management operations
let _dataManagementDb: KyselyWordnet | null = null;

// Allow tests to inject their own database instance
export function setDataManagementDb(db: KyselyWordnet): void {
  _dataManagementDb = db;
}

// Export the getter for module functions to use
export async function getDataManagementDb(): Promise<KyselyWordnet> {
  if (!_dataManagementDb) {
    // Only create a new instance if none has been injected
    _dataManagementDb = new KyselyWordnet('*', { 
      filename: config.databasePath,
      forceRecreate: true  // Always recreate database to avoid schema conflicts
    });
    await _dataManagementDb.initialize();
  }
  return _dataManagementDb;
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
  options: AddOptions = {}
): Promise<boolean> {
  const { progress, parser = "" } = options;
  logger.info(`Adding lexical resource: ${path}`);

  try {
    // Extract and process the file
    const processedPath = await _processDownloadedFile(path, progress);
    
    // Determine file type and load accordingly
    const isLmfFile = await isLMF(processedPath);
    const isIliFile = await isILI(processedPath);
    
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
    
    // Check if it's a file not found error and convert to ProjectError
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new ProjectError(`File not found: ${path}`);
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

  try {
    const db = await getDataManagementDb();
    const queryService = db.getQueryService();
    
    // Convert ILI records to database format
          const iliRecords = iliData.map((record: IliRecord) => {
        const iliRecord: any = {
          id: record.id,
          status: record.status,
        };
        if (record.definition) iliRecord.definition = record.definition;
        return iliRecord;
      });

    // Use batch insert for performance
    await queryService.batchInsert('ilis', iliRecords);
    
    if (progress) progress(1.0);
    logger.success('ILI data added successfully.');
    return true;
  } catch (error) {
    logger.error('Failed to add ILI data:', error);
    throw error;
  }
}

async function _addLmf(
  path: string,
  options: AddOptions & { dryRun?: boolean, parser?: string }
): Promise<boolean> {
  const { progress, dryRun = false, parser = "" } = options;

  try {
    logger.info(`Loading LMF file: ${path}...`);
    const lmfOptions: any = { debug: false };
    if (parser) lmfOptions.parser = parser;
    if (progress) lmfOptions.progress = progress;
    const lmfData = await loadLMF(path, lmfOptions);
    logger.success(`LMF file loaded. Found ${lmfData.lexicons.length} lexicons.`);



    if (dryRun) {
      logger.info('[DRY RUN] This is a dry run. No data will be written.');
      logger.info(`[DRY RUN] Would add ${lmfData.lexicons.length} lexicons.`);
      return false;
    }

    // Implement LMF data insertion using Kysely
    // Follow the same pattern as wn-ts-web: insert in order to respect foreign key constraints
    logger.info('Inserting LMF data into Kysely database...');
    
    // Use the injected database if available, otherwise get a new one
    const db = _dataManagementDb || await getDataManagementDb();
    const queryService = db.getQueryService();
    
    // Step 1: Insert lexicons first (required for foreign key constraints)
    if (lmfData.lexicons && lmfData.lexicons.length > 0) {
      logger.info(`Inserting ${lmfData.lexicons.length} lexicons...`);
      const lexiconRecords = lmfData.lexicons.map(lexicon => {
        const record: any = {
          id: lexicon.id,
          label: lexicon.label,
          language: lexicon.language,
        };
        if (lexicon.email) record.email = lexicon.email;
        if (lexicon.license) record.license = lexicon.license;
        if (lexicon.version) record.version = lexicon.version;
        if (lexicon.url) record.url = lexicon.url;
        if (lexicon.citation) record.citation = lexicon.citation;
        if (lexicon.logo) record.logo = lexicon.logo;
        if (lexicon.metadata) record.metadata = JSON.stringify(lexicon.metadata);
        return record;
      });
      
      await queryService.batchInsert('lexicons', lexiconRecords);
      logger.success(`Inserted ${lmfData.lexicons.length} lexicons`);
    }
    
    // Step 2: Insert words (they reference lexicons)
    if (lmfData.words && lmfData.words.length > 0) {
      logger.info(`Inserting ${lmfData.words.length} words...`);
      const wordRecords = lmfData.words.map(word => ({
        id: word.id,
        lemma: word.lemma,
        pos: word.pos,
        language: word.language,
        lexicon: word.lexicon,
      }));
      
      await queryService.batchInsert('words', wordRecords);
      logger.success(`Inserted ${lmfData.words.length} words`);
    }
    
    // Step 3: Insert synsets (they also reference lexicons)
    if (lmfData.synsets && lmfData.synsets.length > 0) {
      logger.info(`Inserting ${lmfData.synsets.length} synsets...`);
      const synsetRecords = lmfData.synsets.map(synset => {
        const record: any = {
          id: synset.id,
          pos: synset.pos,
          language: synset.language,
          lexicon: synset.lexicon,
        };
        if (synset.ili) record.ili = synset.ili;
        return record;
      });
      
      await queryService.batchInsert('synsets', synsetRecords);
      logger.success(`Inserted ${lmfData.synsets.length} synsets`);
    }
    
    // Step 4: Insert senses (they reference words and synsets)
    if (lmfData.senses && lmfData.senses.length > 0) {
      logger.info(`Inserting ${lmfData.senses.length} senses...`);
      const senseRecords = lmfData.senses.map(sense => {
        const record: any = {
          id: sense.id,
          word_id: sense.wordId,
          synset_id: sense.synsetId,
        };
        if (sense.source) record.source = sense.source;
        if (sense.sensekey) record.sensekey = sense.sensekey;
        if (sense.adjposition) record.adjposition = sense.adjposition;
        if (sense.subcategory) record.subcategory = sense.subcategory;
        if (sense.domain) record.domain = sense.domain;
        if (sense.register) record.register = sense.register;
        return record;
      });
      
      await queryService.batchInsert('senses', senseRecords);
      logger.success(`Inserted ${lmfData.senses.length} senses`);
    }
    
    // Step 5: Insert forms (if any)
    if (lmfData.words) {
      const formRecords: any[] = [];
      for (const word of lmfData.words) {
        if (word.forms && word.forms.length > 0) {
          for (const form of word.forms) {
            formRecords.push({
              id: form.id,
              word_id: word.id,
              written_form: form.writtenForm,
              script: form.script || null,
              tag: form.tag || null,
            });
          }
        }
      }
      
      if (formRecords.length > 0) {
        logger.info(`Inserting ${formRecords.length} forms...`);
        await queryService.batchInsert('forms', formRecords);
        logger.success(`Inserted ${formRecords.length} forms`);
      }
    }
    
    // Step 6: Insert definitions (if any)
    if (lmfData.synsets) {
      const definitionRecords: any[] = [];
      for (const synset of lmfData.synsets) {
        if (synset.definitions && synset.definitions.length > 0) {
          for (const def of synset.definitions) {
            definitionRecords.push({
              id: def.id,
              synset_id: synset.id,
              language: def.language,
              text: def.text,
              source: def.source || null,
            });
          }
        }
      }
      
      if (definitionRecords.length > 0) {
        logger.info(`Inserting ${definitionRecords.length} definitions...`);
        await queryService.batchInsert('definitions', definitionRecords);
        logger.success(`Inserted ${definitionRecords.length} definitions`);
      }
    }
    
    // Step 7: Insert examples (if any)
    if (lmfData.synsets) {
      const exampleRecords: any[] = [];
      for (const synset of lmfData.synsets) {
        if (synset.examples && synset.examples.length > 0) {
          for (const ex of synset.examples) {
            exampleRecords.push({
              id: ex.id,
              synset_id: synset.id,
              sense_id: null, // TODO: Add sense-level examples if needed
              language: ex.language,
              text: ex.text,
              source: ex.source || null,
            });
          }
        }
      }
      
      if (exampleRecords.length > 0) {
        logger.info(`Inserting ${exampleRecords.length} examples...`);
        await queryService.batchInsert('examples', exampleRecords);
        logger.success(`Inserted ${exampleRecords.length} examples`);
      }
    }
    
    // Step 8: Insert relations (if any)
    if (lmfData.synsets) {
      const relationRecords: any[] = [];
      for (const synset of lmfData.synsets) {
        if (synset.relations && synset.relations.length > 0) {
          for (const rel of synset.relations) {
            relationRecords.push({
              id: rel.id,
              source_id: synset.id,
              target_id: rel.target,
              type: rel.type,
              source: rel.source || null,
            });
          }
        }
      }
      
      if (relationRecords.length > 0) {
        logger.info(`Inserting ${relationRecords.length} relations...`);
        await queryService.batchInsert('relations', relationRecords);
        logger.success(`Inserted ${relationRecords.length} relations`);
      }
    }
    
    logger.success('LMF data insertion completed successfully!');
    return true;
  } catch (error) {
    logger.error('Failed to add LMF data:', error);
    throw error;
  }
}

/**
 * Remove a lexical resource from the database
 */
export async function remove(lexiconId: string): Promise<boolean> {
  logger.info(`Removing lexicon: ${lexiconId}`);

  try {
    const db = await getDataManagementDb();
    const queryService = db.getQueryService();
    
    // Check if lexicon exists
    const existing = await queryService.getLexiconById(lexiconId);
    if (!existing) {
      throw new ProjectError(`Lexicon ${lexiconId} does not exist.`);
    }

    // Delete the lexicon and all related data
    await queryService.deleteLexicon(lexiconId);
    
    logger.success(`Lexicon ${lexiconId} removed successfully.`);
    return true;
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    logger.error(`Failed to remove lexicon ${lexiconId}:`, error);
    throw new DatabaseError(
      `Failed to remove lexicon: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Export data from the database
 */
export async function exportData(
  options: ExportOptions = { format: 'json' }
): Promise<any> {
  const { format, include = [], exclude = [] } = options;
  
  // Validate format
  const supportedFormats = ['json', 'xml', 'csv'];
  if (!supportedFormats.includes(format)) {
    throw new ProjectError(`Unsupported export format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
  }
  
  try {
    const db = await getDataManagementDb();
    const queryService = db.getQueryService();
    
    // Get all lexicons
    let lexicons = await queryService.getLexicons();
    
    // Apply include/exclude filters
    if (include && include.length > 0) {
      lexicons = lexicons.filter(l => include.includes(l.id));
    }
    if (exclude && exclude.length > 0) {
      lexicons = lexicons.filter(l => !exclude.includes(l.id));
    }
    
    if (format === 'json') {
      const data = {
        lexicons,
        exportDate: new Date().toISOString(),
        format: 'json'
      };
      const jsonOutput = JSON.stringify(data, null, 2);
      logger.info(jsonOutput);
      return data;
    } else if (format === 'xml') {
      // TODO: Implement XML export with actual data
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<lexical-resources>\n</lexical-resources>`;
      logger.info(xml);
      return xml;
    } else if (format === 'csv') {
      // TODO: Implement CSV export with actual data
      const csv = 'Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example\nword,test-word-1,test,noun,en,test-lexicon,A test word,This is an example';
      logger.info(csv);
      return csv;
    } else {
      return { lexicons };
    }
  } catch (error) {
    logger.error('Failed to export data:', error);
    throw new DatabaseError(
      `Failed to export data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Process a downloaded file (extract archives, etc.)
 */
async function _processDownloadedFile(
  path: string,
  progress?: (progress: number) => void
): Promise<string> {
  if (progress) progress(0.1);

  // Check if it's a compressed archive
  if (path.endsWith('.tar.xz')) {
    logger.info('Extracting .tar.xz archive...');
    const destPath = path.replace('.xz', '');
    await decompressXz(path, destPath);
    if (progress) progress(0.3);
    
    logger.info('Extracting .tar archive...');
    const finalPath = await extractTarArchive(destPath);
    if (progress) progress(0.5);
    
    return finalPath;
  } else if (path.endsWith('.tar.gz')) {
    logger.info('Extracting .tar.gz archive...');
    const destPath = path.replace('.gz', '');
    await decompressGz(path, destPath);
    if (progress) progress(0.3);
    
    logger.info('Extracting .tar archive...');
    const finalPath = await extractTarArchive(destPath);
    if (progress) progress(0.5);
    
    return finalPath;
  } else if (path.endsWith('.tar')) {
    logger.info('Extracting .tar archive...');
    const finalPath = await extractTarArchive(path);
    if (progress) progress(0.5);
    
    return finalPath;
  } else if (path.endsWith('.gz')) {
    // Handle standalone gzipped files (like OEWN)
    logger.info('Decompressing .gz file...');
    const destPath = path.replace('.gz', '');
    await decompressGz(path, destPath);
    if (progress) progress(0.5);
    
    return destPath;
  }

  // No extraction needed
  if (progress) progress(0.5);
  return path;
}

// Export aliases for backward compatibility
export const addLexicalResource = add;
export const removeLexicalResource = remove;
