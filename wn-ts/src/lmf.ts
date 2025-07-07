/**
 * LMF (Lexical Markup Framework) loader and parser.
 * 
 * This module provides functionality to load and parse LMF XML files
 * into TypeScript data structures.
 * 
 * For different parser implementations, see the parsers module.
 */

import { readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import sax from 'sax';
import type { Synset, Word, Sense, Lexicon, PartOfSpeech } from './types.js';

export interface LMFDocument {
  lmfVersion: string;
  lexicons: Lexicon[];
  synsets: Synset[];
  words: Word[];
  senses: Sense[];
}

export interface LMFLoadOptions {
  progress?: (progress: number) => void;
  debug?: boolean; // Add debug flag to control logging
}

// Supported LMF versions
const SUPPORTED_VERSIONS = new Set(['1.0', '1.1', '1.2', '1.3', '1.4']);

// XML declaration and DOCTYPE patterns
const DOCTYPE_PATTERN = /<!DOCTYPE LexicalResource SYSTEM "([^"]+)">/;

// Schema URLs for different versions
const SCHEMAS = {
  '1.0': 'http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd',
  '1.1': 'http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd',
  '1.2': 'http://globalwordnet.github.io/schemas/WN-LMF-1.2.dtd',
  '1.3': 'http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd',
  '1.4': 'http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd',
};

// Local type for hierarchical parsing
interface ParsedLexicon extends Lexicon {
  entries: any[];
  synsets: any[];
  frames: any[];
}

/**
 * Check if a file is a valid LMF file
 */
export async function isLMF(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const stream = createReadStream(filePath, { encoding: 'utf-8', start: 0, end: 1024 });
    let header = '';
    stream.on('data', (chunk) => {
      header += chunk;
    });
    stream.on('end', () => {
      resolve(
        header.includes('<?xml version="1.0"') &&
        header.includes('<!DOCTYPE LexicalResource') &&
        header.includes('<LexicalResource')
      );
    });
    stream.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Quick scan to get version and estimate number of elements
 */
async function quickScan(filePath: string, debug = false): Promise<{ version: string; elementCount: number }> {
  if (debug) console.log(`[DEBUG] Quick scanning file for version and element count...`);
  
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract version from DOCTYPE
  let version = '1.0';
  for (const line of lines) {
    const match = line.match(DOCTYPE_PATTERN);
    if (match?.[1]) {
      const schemaUrl = match[1];
      for (const [ver, url] of Object.entries(SCHEMAS)) {
        if (url === schemaUrl) {
          version = ver;
          break;
        }
      }
      break;
    }
  }
  
  // Count closing tags to estimate element count
  const elementCount = (content.match(/<\/[^>]+>/g) || []).length + 
                      (content.match(/\/>/g) || []).length;
  
  if (debug) console.log(`[DEBUG] Quick scan: version=${version}, estimated elements=${elementCount}`);
  
  return { version, elementCount };
}

/**
 * Load an LMF XML file and parse it into TypeScript data structures.
 * 
 * @param filePath - Path to the LMF XML file
 * @param options - Loading options
 * @returns Parsed LMF document
 */
export async function loadLMF(
  filePath: string, 
  options: LMFLoadOptions = {}
): Promise<LMFDocument> {
  const { debug = false } = options;
  
  if (debug) console.log(`[DEBUG] loadLMF() starting for file: ${filePath}`);
  
  try {
    // Get file stats for size information (only if debug is enabled)
    if (debug) {
      const fileStats = await stat(filePath);
      const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
      console.log(`[DEBUG] File size: ${fileSizeMB} MB (${fileStats.size.toLocaleString()} bytes)`);
    }
    
    // Quick scan for version and element count
    const { version, elementCount } = await quickScan(filePath, debug);
    
    if (!SUPPORTED_VERSIONS.has(version)) {
      throw new Error(`Unsupported LMF version: ${version}`);
    }
    
    if (debug) console.log(`[DEBUG] Using streaming parser for version ${version}...`);
    const startTime = Date.now();
    
    // Use streaming parser for better performance
    const result = await parseLMFStreaming(filePath, version, elementCount, options);
    
    const totalTime = Date.now() - startTime;
    if (debug) console.log(`[DEBUG] loadLMF() completed in ${totalTime}ms total`);
    
    return result;
  } catch (error) {
    if (debug) console.log(`[DEBUG] loadLMF() error:`, error);
    throw new Error(`Failed to load LMF file: ${error}`);
  }
}

/**
 * Parse LMF XML using streaming parser (more efficient for large files)
 */
async function parseLMFStreaming(
  filePath: string,
  version: string,
  totalElements: number,
  options: LMFLoadOptions = {}
): Promise<LMFDocument> {
  const { debug = false } = options;

  return new Promise((resolve, reject) => {
    const lexicons: Lexicon[] = [];
    const synsets: Synset[] = [];
    const words: Word[] = [];
    const senses: Sense[] = [];

    const synsetToSenses = new Map<string, Sense[]>();

    let currentLexicon: ParsedLexicon | null = null;
    let currentEntry: any = null;
    let currentSynset: Synset | null = null;
    let currentSense: Sense | null = null;
    let currentExample: any = null;
    let elementCount = 0;
    let lastProgressUpdate = 0;

    const parser = sax.createStream(true, {
      trim: true,
      normalize: true,
      lowercase: true,
      position: false,
      xmlns: false,
    });

    // Progress tracking
    const updateProgress = () => {
      if (options.progress && elementCount - lastProgressUpdate > 1000) {
        const progress = Math.min(elementCount / totalElements, 0.95);
        options.progress(progress);
        lastProgressUpdate = elementCount;
      }
    };

    parser.on('opentag', (node: sax.Tag) => {
      elementCount++;
      updateProgress();

      const { attributes } = node;
      const name = node.name.toLowerCase();

      if (debug && (elementCount % 1000 === 0 || ['lexicalresource', 'lexicon', 'lexicalentry'].includes(name))) {
        console.log(`[DEBUG] Processing tag: ${name} (element #${elementCount})`);
      }

      switch (name) {
        case 'lexicalresource':
          if (debug) console.log(`[DEBUG] Starting to parse LexicalResource (version: ${version})`);
          break;
        case 'lexicon':
          currentLexicon = {
            id: attributes.id || 'unknown',
            label: attributes.label || 'Unknown Lexicon',
            language: attributes.language || 'en',
            version: attributes.version || '1.0',
            email: attributes.email || '',
            license: attributes.license || '',
            url: attributes.url || '',
            citation: attributes.citation || '',
            logo: attributes.logo || '',
            entries: [],
            synsets: [],
            frames: [],
          };
          if (debug) console.log(`[DEBUG] Processing lexicon: ${currentLexicon.id}`);
          break;
        case 'lexicalentry':
          currentEntry = {
            id: attributes.id || 'unknown-word',
            lemma: 'unknown',
            partOfSpeech: 'n',
            language: currentLexicon?.language || 'en',
            lexicon: currentLexicon?.id || 'unknown',
            forms: [],
            tags: [],
            pronunciations: [],
            counts: [],
            senses: [],
            frames: [],
          };
          if (debug) console.log(`[DEBUG] Created word: ${currentEntry.id}`);
          break;
        case 'lemma':
          if (currentEntry) {
            currentEntry.lemma = attributes.writtenform || attributes.writtenForm || 'unknown';
            currentEntry.partOfSpeech = (attributes.partofspeech || attributes.partOfSpeech || 'n') as PartOfSpeech;
            if (debug) console.log(`[DEBUG] Set lemma for word ${currentEntry.id}: ${currentEntry.lemma} (${currentEntry.partOfSpeech})`);
            const lemmaForm = currentEntry.lemma;
            if (!(currentEntry.forms as any[]).some((f: any) => f.writtenForm === lemmaForm)) {
              currentEntry.forms.push({
                id: `${currentEntry.id}-lemma`,
                writtenForm: lemmaForm,
                script: attributes.script || '',
                tag: '',
              });
            }
          }
          break;
        case 'form':
          if (currentEntry) {
            currentEntry.forms.push({
              id: attributes.id || '',
              writtenForm: attributes.writtenform || attributes.writtenForm || '',
              script: attributes.script || '',
              tag: attributes.tag || '',
            });
          }
          break;
        case 'sense':
          currentSense = {
            id: attributes.id || 'unknown-sense',
            word: currentEntry?.id || 'unknown',
            synset: attributes.synset || 'unknown-synset',
            counts: [],
            examples: [],
            tags: [],
          };
          break;
        case 'synset':
          currentSynset = {
            id: attributes.id || 'unknown-synset',
            partOfSpeech: (attributes.partofspeech || attributes.partOfSpeech || 'n') as PartOfSpeech,
            definitions: [],
            examples: [],
            relations: [],
            language: currentLexicon?.language || 'en',
            lexicon: currentLexicon?.id || 'unknown',
            members: [],
            senses: [],
          };
          if (attributes.ili) {
            (currentSynset as any).ili = attributes.ili;
          }
          break;
        case 'definition':
          if (currentSynset) {
            currentSynset.definitions.push({
              id: attributes.id || '',
              language: attributes.language || currentLexicon?.language || 'en',
              text: '',
              source: attributes.source || '',
            });
          }
          break;
        case 'synsetrelation':
          if (currentSynset) {
            currentSynset.relations.push({
              id: attributes.id || '',
              type: attributes.reltype || attributes.type || 'unknown',
              target: attributes.target || '',
              source: attributes.source || '',
            });
          }
          break;
        case 'example':
          currentExample = {
            id: attributes.id || '',
            language: attributes.language || currentLexicon?.language || 'en',
            text: '',
            source: attributes.source || '',
          };
          break;
      }
    });

    parser.on('text', (text: string) => {
      if (currentSynset?.definitions.length) {
        const lastDef = currentSynset.definitions[currentSynset.definitions.length - 1];
        if (lastDef && lastDef.text === '') {
          lastDef.text = text.trim();
        }
      }
      if (currentExample && currentExample.text === '') {
        currentExample.text = text.trim();
      }
    });

    parser.on('closetag', (name: string) => {
      const tag = name.toLowerCase();
      switch (tag) {
        case 'lexicalentry':
          if (currentEntry && currentLexicon) {
            currentLexicon.entries.push(currentEntry);
            words.push(currentEntry);
            if (debug) console.log(`[DEBUG] Added entry to lexicon: ${currentEntry.id}`);
            currentEntry = null;
          }
          break;
        case 'sense':
          if (currentSense && currentEntry) {
            currentEntry.senses.push(currentSense);
            senses.push(currentSense);
            if (!synsetToSenses.has(currentSense.synset)) {
              synsetToSenses.set(currentSense.synset, []);
            }
            synsetToSenses.get(currentSense.synset)!.push(currentSense);
            if (debug) console.log(`[DEBUG] Added sense to entry: ${currentSense.id}`);
            currentSense = null;
          }
          break;
        case 'synset':
          if (currentSynset && currentLexicon) {
            const synsetSenses = synsetToSenses.get(currentSynset.id) || [];
            currentSynset.senses = synsetSenses.map(s => s.id);
            currentSynset.members = synsetSenses.map(s => s.word);
            currentLexicon.synsets.push(currentSynset);
            synsets.push(currentSynset);
            if (debug) console.log(`[DEBUG] Added synset to lexicon: ${currentSynset.id}`);
            currentSynset = null;
          }
          break;
        case 'lexicon':
          if (currentLexicon) {
            lexicons.push(currentLexicon);
            if (debug) console.log(`[DEBUG] Added lexicon: ${currentLexicon.id}`);
            currentLexicon = null;
          }
          break;
        case 'lexicalresource':
          break;
        case 'example':
          if (currentExample) {
            if (currentSynset) {
              currentSynset.examples.push(currentExample);
            } else if (currentSense) {
              currentSense.examples.push(currentExample);
            }
            currentExample = null;
          }
          break;
      }
    });

    parser.on('end', () => {
      if (debug) console.log(`[DEBUG] Stream ended, completing parsing`);
      if (options.progress) {
        options.progress(1.0);
      }
      resolve({
        lmfVersion: version,
        lexicons,
        synsets,
        words,
        senses,
      });
    });

    parser.on('error', (error: Error) => {
      if (debug) console.log(`[DEBUG] Parser error:`, error);
      reject(new Error(`XML parsing error: ${error.message}`));
    });

    const stream = createReadStream(filePath, { encoding: 'utf8' });
    if (debug) console.log(`[DEBUG] Created read stream for ${filePath}`);
    stream.pipe(parser);

    stream.on('error', (error: Error) => {
      if (debug) console.log(`[DEBUG] Stream error:`, error);
      reject(new Error(`File stream error: ${error.message}`));
    });
  });
}

/**
 * Parse LMF XML content into TypeScript data structures.
 * (Legacy method - kept for compatibility)
 * 
 * @param xmlContent - XML content as string
 * @param options - Parsing options
 * @returns Parsed LMF document
 */
export function parseLMFXML(
  xmlContent: string, 
  options: LMFLoadOptions = {}
): LMFDocument {
  const { debug = false } = options;
  
  if (debug) console.log(`[DEBUG] parseLMFXML() starting with ${xmlContent.length.toLocaleString()} characters`);
  
  // Configure XML parser for LMF format
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false, // Don't parse attribute values to preserve version strings
    parseTagValue: false,
    trimValues: true,
  });

  if (debug) console.log(`[DEBUG] Parsing XML with fast-xml-parser...`);
  const parseStartTime = Date.now();
  const parsed = parser.parse(xmlContent);
  const parseTime = Date.now() - parseStartTime;
  if (debug) console.log(`[DEBUG] XML parser completed in ${parseTime}ms`);
  
  const lexicalResource = parsed.LexicalResource;

  if (!lexicalResource) {
    throw new Error('Invalid LMF file: missing LexicalResource element');
  }

  // Extract LMF version
  const lmfVersion = lexicalResource['@_lmfVersion'] || '1.0';
  if (debug) console.log(`[DEBUG] LMF version: ${lmfVersion}`);
  
  if (!SUPPORTED_VERSIONS.has(lmfVersion)) {
    throw new Error(`Unsupported LMF version: ${lmfVersion}`);
  }

  const lexicons: Lexicon[] = [];
  const synsets: Synset[] = [];
  const words: Word[] = [];
  const senses: Sense[] = [];

  // Parse lexicons
  const lexiconElements = Array.isArray(lexicalResource.Lexicon) 
    ? lexicalResource.Lexicon 
    : [lexicalResource.Lexicon];

  if (debug) console.log(`[DEBUG] Processing ${lexiconElements.length} lexicon(s)...`);
  
  for (let i = 0; i < lexiconElements.length; i++) {
    const lexiconElem = lexiconElements[i];
    if (!lexiconElem) continue;

    if (debug) console.log(`[DEBUG] Processing lexicon ${i + 1}/${lexiconElements.length}: ${lexiconElem['@_id'] || 'unknown'}`);

    const lexicon: Lexicon = {
      id: lexiconElem['@_id'] || 'unknown',
      label: lexiconElem['@_label'] || 'Unknown Lexicon',
      language: lexiconElem['@_language'] || 'en',
      version: lexiconElem['@_version'] || '1.0',
      email: lexiconElem['@_email'] || '',
      license: lexiconElem['@_license'] || '',
      url: lexiconElem['@_url'] || '',
      citation: lexiconElem['@_citation'] || '',
      logo: lexiconElem['@_logo'] || '',
    };

    lexicons.push(lexicon);

    // Parse lexical entries (words)
    const entries = Array.isArray(lexiconElem.LexicalEntry) 
      ? lexiconElem.LexicalEntry 
      : [lexiconElem.LexicalEntry];

    if (debug) console.log(`[DEBUG] Processing ${entries.length} lexical entries for lexicon ${lexicon.id}...`);

    for (let j = 0; j < entries.length; j++) {
      const entry = entries[j];
      if (!entry) continue;

      if (debug && j % 1000 === 0) {
        console.log(`[DEBUG] Processing entry ${j + 1}/${entries.length} for lexicon ${lexicon.id}`);
      }

      const word: Word = {
        id: entry['@_id'] || 'unknown-word',
        lemma: entry.Lemma?.['@_writtenForm'] || entry['@_id'] || 'unknown',
        partOfSpeech: (entry.Lemma?.['@_partOfSpeech'] || 'n') as any,
        language: lexicon.language,
        lexicon: lexicon.id,
        forms: [],
        tags: [],
        pronunciations: [],
        counts: [],
      };

      // Parse forms
      if (entry.Form) {
        const forms = Array.isArray(entry.Form) ? entry.Form : [entry.Form];
        for (const form of forms) {
          if (!form) continue;
          word.forms.push({
            id: form['@_id'] || '',
            writtenForm: form['@_writtenForm'] || '',
            script: form['@_script'] || '',
            tag: form['@_tag'] || '',
          });
        }
      }

      words.push(word);

      // Parse senses
      if (entry.Sense) {
        const senseElements = Array.isArray(entry.Sense) ? entry.Sense : [entry.Sense];
        for (const senseElem of senseElements) {
          if (!senseElem) continue;

          const sense: Sense = {
            id: senseElem['@_id'] || 'unknown-sense',
            word: word.id,
            synset: senseElem['@_synset'] || 'unknown-synset',
            counts: [],
            examples: [],
            tags: [],
          };

          senses.push(sense);
        }
      }
    }

    if (debug) console.log(`[DEBUG] Completed processing ${words.length} words and ${senses.length} senses for lexicon ${lexicon.id}`);

    // Parse synsets
    if (lexiconElem.Synset) {
      const synsetElements = Array.isArray(lexiconElem.Synset) 
        ? lexiconElem.Synset 
        : [lexiconElem.Synset];

      if (debug) console.log(`[DEBUG] Processing ${synsetElements.length} synsets for lexicon ${lexicon.id}...`);

      for (let k = 0; k < synsetElements.length; k++) {
        const synsetElem = synsetElements[k];
        if (!synsetElem) continue;

        if (debug && k % 1000 === 0) {
          console.log(`[DEBUG] Processing synset ${k + 1}/${synsetElements.length} for lexicon ${lexicon.id}`);
        }

        const synset: Synset = {
          id: synsetElem['@_id'] || 'unknown-synset',
          partOfSpeech: (synsetElem['@_partOfSpeech'] || 'n') as any,
          definitions: [],
          examples: [],
          relations: [],
          language: lexicon.language,
          lexicon: lexicon.id,
          members: [],
          senses: [],
        };

        // Parse definitions
        if (synsetElem.Definition) {
          const definitions = Array.isArray(synsetElem.Definition) 
            ? synsetElem.Definition 
            : [synsetElem.Definition];

          for (const def of definitions) {
            if (!def) continue;
            synset.definitions.push({
              id: def['@_id'] || '',
              language: def['@_language'] || lexicon.language,
              text: def['#text'] || '',
              source: def['@_source'] || '',
            });
          }
        }

        // Parse relations
        if (synsetElem.SynsetRelation) {
          const relations = Array.isArray(synsetElem.SynsetRelation) 
            ? synsetElem.SynsetRelation 
            : [synsetElem.SynsetRelation];

          for (const rel of relations) {
            if (!rel) continue;
            synset.relations.push({
              id: rel['@_id'] || '',
              type: rel['@_relType'] || 'unknown',
              target: rel['@_target'] || '',
              source: rel['@_source'] || '',
            });
          }
        }

        // Find senses that belong to this synset
        const synsetSenses = senses.filter(s => s.synset === synset.id);
        synset.senses = synsetSenses.map(s => s.id);
        synset.members = synsetSenses.map(s => s.word);

        synsets.push(synset);
      }
    }
  }

  if (debug) console.log(`[DEBUG] parseLMFXML() completed. Final counts: ${lexicons.length} lexicons, ${words.length} words, ${synsets.length} synsets, ${senses.length} senses`);

  if (options.progress) {
    options.progress(1.0);
  }

  return {
    lmfVersion,
    lexicons,
    synsets,
    words,
    senses,
  };
}

/**
 * Create a minimal LMF document for testing.
 * 
 * @returns Minimal LMF document
 */
export function createMinimalLMF(): LMFDocument {
  return {
    lmfVersion: '1.0',
    lexicons: [
      {
        id: 'test-en',
        label: 'Test English Lexicon',
        language: 'en',
        version: '1.0',
        email: '',
        license: '',
        url: '',
        citation: '',
        logo: '',
      }
    ],
    synsets: [
      {
        id: 'test-en-0001-n',
        partOfSpeech: 'n',
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      }
    ],
    words: [
      {
        id: 'test-en-example-n',
        lemma: 'example',
        partOfSpeech: 'n',
        language: 'en',
        lexicon: 'test-en',
        forms: [],
        tags: [],
        pronunciations: [],
        counts: [],
      }
    ],
    senses: [
      {
        id: 'test-en-example-n-0001-01',
        word: 'test-en-example-n',
        synset: 'test-en-0001-n',
        counts: [],
        examples: [],
        tags: [],
      }
    ],
  };
} 
