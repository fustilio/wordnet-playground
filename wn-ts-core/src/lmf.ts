/**
 * LMF (Lexical Markup Framework) loader and parser.
 * 
 * This module provides functionality to load and parse LMF XML files
 * into TypeScript data structures.
 * 
 * For different parser implementations, see the parsers module.
 */

/**
 * LMF (Lexical Markup Framework) parser.
 * 
 * This module provides functionality to parse LMF XML content
 * into TypeScript data structures.
 * 
 * The Node.js-specific file loading and streaming parser functionality
 * has been moved to 'wn-ts-node/src/lmf.ts'.
 */

import { XMLParser } from 'fast-xml-parser';
import type { Synset, Word, Sense, Lexicon } from './types.js';

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
    // Add options to handle large files better
    processEntities: false,
    allowBooleanAttributes: true,
    stopNodes: ['LexicalEntry', 'Synset'] // Stop processing at these nodes to reduce memory
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
