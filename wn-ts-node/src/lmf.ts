import fs from 'fs';
import fsPromises from 'fs/promises';
import sax from 'sax';
import type { Synset, Word, Sense, Lexicon, PartOfSpeech, LMFDocument, LMFLoadOptions } from 'wn-ts-core';

const { readFile, stat } = fsPromises;
const { createReadStream } = fs;

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
  
  // Extract version from DOCTYPE - search entire content
  let version = '1.0';
  const match = content.match(DOCTYPE_PATTERN);
  if (match?.[1]) {
    const schemaUrl = match[1];
    if (debug) console.log(`[DEBUG] Found DOCTYPE with schema: ${schemaUrl}`);
    
    // First try to match against supported versions
    let foundSupported = false;
    for (const [ver, url] of Object.entries(SCHEMAS)) {
      if (url === schemaUrl) {
        version = ver;
        foundSupported = true;
        if (debug) console.log(`[DEBUG] Matched schema URL to supported version: ${version}`);
        break;
      }
    }
    
    // If no supported version found, extract version from URL
    if (!foundSupported) {
      const versionMatch = schemaUrl.match(/WN-LMF-([0-9]+\.[0-9]+)\.dtd$/);
      if (versionMatch && versionMatch[1]) {
        version = versionMatch[1];
        if (debug) console.log(`[DEBUG] Extracted unsupported version from schema URL: ${version}`);
      }
    }
  } else {
    if (debug) console.log(`[DEBUG] No DOCTYPE pattern found, using default version: ${version}`);
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
    
    if (debug) console.log(`[DEBUG] Quick scan returned version: ${version}`);
    if (debug) console.log(`[DEBUG] Supported versions: ${Array.from(SUPPORTED_VERSIONS).join(', ')}`);
    if (debug) console.log(`[DEBUG] Version ${version} supported: ${SUPPORTED_VERSIONS.has(version)}`);
    
    // Validate version immediately after quickScan
    if (!SUPPORTED_VERSIONS.has(version)) {
      if (debug) console.log(`[DEBUG] Throwing error for unsupported version: ${version}`);
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
  const { debug = false, progress } = options;

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
      if (progress && elementCount - lastProgressUpdate > 1000) {
        const progressValue = Math.min(elementCount / totalElements, 0.95);
        progress(progressValue);
        lastProgressUpdate = elementCount;
      }
    };

    parser.on('opentag', (node: sax.Tag) => {
      elementCount++;
      updateProgress();

      const { attributes } = node;
      const name = node.name.toLowerCase();

      // Add more detailed debugging for large elements that might be causing issues
      if (debug && (elementCount % 10000 === 0 || ['lexicalresource', 'lexicon', 'lexicalentry'].includes(name))) {
        console.log(`[DEBUG] Processing tag: ${name} (element #${elementCount})`);
      }
      
      // Add specific debugging for elements that might be very large
      if (debug && ['synset', 'lexicalentry'].includes(name) && elementCount % 5000 === 0) {
        console.log(`[DEBUG] Processing ${name} #${elementCount} - current progress: ${Math.round((elementCount / totalElements) * 100)}%`);
      }

      switch (name) {
        case 'lexicalresource':
          if (debug) console.log(`[DEBUG] Starting to parse LexicalResource (version: ${version})`);
          break;
        case 'lexicon':
          currentLexicon = {
            id: attributes.id || '',
            label: attributes.label || '',
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
        case 'lexiconextension':
          currentLexicon = {
            id: attributes.id || '',
            label: attributes.label || '',
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
          if (debug) console.log(`[DEBUG] Processing lexicon extension: ${currentLexicon.id}`);
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
            currentEntry.pos = (attributes.partofspeech || attributes.partOfSpeech || 'n') as PartOfSpeech;
            if (debug) console.log(`[DEBUG] Set lemma for word ${currentEntry.id}: ${currentEntry.lemma} (${currentEntry.pos})`);
            // Don't automatically add lemma as a form - lemma and forms are separate in LMF
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
            pos: (attributes.partofspeech || attributes.partOfSpeech || 'n') as PartOfSpeech,
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
              type: attributes.reltype || attributes.relType || attributes.type || 'unknown',
              target: attributes.target || '',
              source: attributes.source || '',
            });
          }
          break;
        case 'tag':
          if (currentEntry) {
            currentEntry.tags.push({
              id: attributes.id || '',
              category: attributes.category || '',
              value: '',
            });
          } else if (currentSense) {
            currentSense.tags.push({
              id: attributes.id || '',
              category: attributes.category || '',
              value: '',
            });
          }
          break;
        case 'count':
          if (currentSense) {
            currentSense.counts.push({
              id: attributes.id || '',
              value: 0,
              writtenForm: '',
              pos: 'n' as PartOfSpeech,
            });
          }
          break;
        case 'pronunciation':
          if (currentEntry?.forms.length) {
            const lastForm = currentEntry.forms[currentEntry.forms.length - 1];
            if (lastForm) {
              if (!lastForm.pronunciations) {
                lastForm.pronunciations = [];
              }
              lastForm.pronunciations.push({
                id: attributes.id || '',
                variety: attributes.variety || '',
                text: '',
                source: attributes.source || '',
              });
            }
          }
          break;
        case 'syntacticbehaviour':
          if (currentEntry) {
            currentEntry.frames.push({
              id: attributes.id || '',
              subcategorizationFrame: attributes.subcategorizationframe || attributes.subcategorizationFrame || '',
              source: attributes.source || '',
              senses: attributes.senses || '',
            });
          }
          break;
        case 'senserelation':
          if (currentSense) {
            if (!currentSense.relations) {
              currentSense.relations = [];
            }
            currentSense.relations.push({
              id: attributes.id || '',
              type: attributes.reltype || attributes.relType || attributes.type || 'unknown',
              target: attributes.target || '',
              dc_type: attributes.dctype || attributes.dc_type || '',
            });
          }
          break;
        case 'ilidefinition':
          if (currentSynset) {
            if (!(currentSynset as any).iliDefinitions) {
              (currentSynset as any).iliDefinitions = [];
            }
            (currentSynset as any).iliDefinitions.push({
              id: attributes.id || '',
              text: '',
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
      // Handle ILI Definition text
      if (currentSynset && (currentSynset as any).iliDefinitions?.length) {
        const lastIliDef = (currentSynset as any).iliDefinitions[(currentSynset as any).iliDefinitions.length - 1];
        if (lastIliDef && lastIliDef.text === '') {
          lastIliDef.text = text.trim();
        }
      }
      // Handle Tag text
      if (currentEntry?.tags.length) {
        const lastTag = currentEntry.tags[currentEntry.tags.length - 1];
        if (lastTag && lastTag.value === '') {
          lastTag.value = text.trim();
        }
      }
      if (currentSense?.tags.length) {
        const lastTag = currentSense.tags[currentSense.tags.length - 1];
        if (lastTag && lastTag.value === '') {
          lastTag.value = text.trim();
        }
      }
      // Handle Count text
      if (currentSense?.counts.length) {
        const lastCount = currentSense.counts[currentSense.counts.length - 1];
        if (lastCount && lastCount.writtenForm === '') {
          lastCount.writtenForm = text.trim();
          // Try to parse the count value
          const countValue = parseInt(text.trim());
          if (!isNaN(countValue)) {
            lastCount.value = countValue;
          }
        }
      }
      // Handle Pronunciation text
      if (currentEntry?.forms.length) {
        const lastForm = currentEntry.forms[currentEntry.forms.length - 1];
        if (lastForm?.pronunciations?.length) {
          const lastPron = lastForm.pronunciations[lastForm.pronunciations.length - 1];
          if (lastPron && lastPron.text === '') {
            lastPron.text = text.trim();
          }
        }
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
        case 'lexiconextension':
          if (currentLexicon) {
            lexicons.push(currentLexicon);
            if (debug) console.log(`[DEBUG] Added lexicon extension: ${currentLexicon.id}`);
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
        case 'senserelation':
          // SenseRelation is handled in opentag since it's an empty element
          break;
        case 'synsetrelation':
          // SynsetRelation is handled in opentag since it's an empty element
          break;
        case 'tag':
          // Tag is handled in opentag since it's an empty element
          break;
        case 'count':
          // Count is handled in opentag since it's an empty element
          break;
        case 'ilidefinition':
          // ILIDefinition is handled in opentag since it's an empty element
          break;
        case 'syntacticbehaviour':
          // SyntacticBehaviour is handled in opentag since it's an empty element
          break;
      }
    });

    parser.on('end', () => {
      if (debug) console.log(`[DEBUG] Stream ended, completing parsing`);
      if (progress) {
        progress(1.0);
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
