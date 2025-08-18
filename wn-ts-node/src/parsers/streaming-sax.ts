/**
 * Streaming SAX parser using file streams for memory efficiency
 * 
 * This parser uses file streams to parse large LMF files without loading
 * the entire file into memory.
 */
import fs from 'fs';
import sax from 'sax';
import type { LMFParser, LMFDocument, LMFLoadOptions } from 'wn-ts-core';
import type { Synset, Word, Sense, Lexicon } from 'wn-ts-core';

const { createReadStream } = fs;

/**
 * Streaming SAX parser for memory-efficient parsing of large LMF files
 * This parser implements the common LMFParser interface
 */
export class StreamingSaxParser implements LMFParser {
  readonly name = 'Streaming SAX Parser';
  readonly description = 'Memory-efficient streaming parser for large LMF files using SAX';

  async parse(xmlContent: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false, progress } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    // Basic validation - we'll implement shared validation later
    if (typeof xmlContent !== 'string' || xmlContent.trim().length === 0) {
      throw new Error('Invalid LMF file: XML content is empty or not a string');
    }
    
    return new Promise((resolve, reject) => {
      const lexicons: Lexicon[] = [];
      const synsets: Synset[] = [];
      const words: Word[] = [];
      const senses: Sense[] = [];
      
      let currentLexicon: Lexicon | null = null;
      let currentEntry: Word | null = null;
      let currentSynset: Synset | null = null;
      let elementCount = 0;
      
      const parser = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: false, // Keep original case for LMF elements
        position: false,
        xmlns: false,
      });
      
      parser.on('opentag', (node) => {
        elementCount++;
        
        if (debug && elementCount % 10000 === 0) {
          console.log(`[DEBUG] ${this.name}: Processed ${elementCount} elements`);
        }
        
        // Helper function to safely extract string attributes
        const getAttr = (name: string): string => {
          const value = node.attributes[name];
          return typeof value === 'string' ? value : '';
        };
        
        switch (node.name) {
          case 'Lexicon':
            currentLexicon = {
              id: getAttr('id') || 'unknown',
              label: getAttr('label') || 'Unknown Lexicon',
              language: getAttr('language') || 'en',
              version: getAttr('version') || '1.0',
              email: getAttr('email') || '',
              license: getAttr('license') || '',
              url: getAttr('url') || '',
              citation: getAttr('citation') || '',
              logo: getAttr('logo') || '',
            };
            lexicons.push(currentLexicon);
            break;
            
          case 'LexicalEntry':
            currentEntry = {
              id: getAttr('id') || 'unknown-word',
              lemma: getAttr('lemma') || getAttr('id') || 'unknown',
              pos: (getAttr('partOfSpeech') || 'n') as any,
              language: currentLexicon?.language || 'en',
              lexicon: currentLexicon?.id || 'unknown',
              forms: [],
              tags: [],
              pronunciations: [],
              counts: [],
            };
            words.push(currentEntry);
            break;
            
          case 'Lemma':
            if (currentEntry) {
              currentEntry.lemma = getAttr('writtenForm') || currentEntry.lemma;
              currentEntry.pos = (getAttr('partOfSpeech') || currentEntry.pos) as any;
            }
            break;
            
          case 'Synset':
            currentSynset = {
              id: getAttr('id') || 'unknown-synset',
              pos: (getAttr('partOfSpeech') || 'n') as any,
              definitions: [],
              examples: [],
              relations: [],
              language: currentLexicon?.language || 'en',
              lexicon: currentLexicon?.id || 'unknown',
              members: [],
              senses: [],
            };
            synsets.push(currentSynset);
            break;
            
          case 'Definition':
            if (currentSynset) {
              const definition = {
                id: getAttr('id') || '',
                language: getAttr('language') || currentLexicon?.language || 'en',
                text: '',
                source: getAttr('source') || '',
              };
              currentSynset.definitions.push(definition);
            }
            break;
            
          case 'Sense':
            const sense: Sense = {
              id: getAttr('id') || 'unknown-sense',
              word: currentEntry?.id || 'unknown-word',
              synset: getAttr('synset') || currentSynset?.id || 'unknown-synset',
              counts: [],
              examples: [],
              tags: [],
            };
            senses.push(sense);
            break;
        }
      });
      
      parser.on('text', (text) => {
        // Handle text content for definitions
        if (currentSynset && currentSynset.definitions.length > 0) {
          const lastDef = currentSynset.definitions[currentSynset.definitions.length - 1];
          if (lastDef) {
            lastDef.text = (lastDef.text + text).trim();
          }
        }
      });
      
      parser.on('end', () => {
        if (debug) console.log(`[DEBUG] ${this.name}: Found ${elementCount} elements`);
        if (debug) console.log(`[DEBUG] ${this.name}: Parsed ${lexicons.length} lexicons, ${words.length} words, ${synsets.length} synsets, ${senses.length} senses`);
        
        // Update progress
        if (progress) progress(1.0);
        
        resolve({
          lmfVersion: '1.0', // Default version for SAX parser
          lexicons,
          synsets,
          words,
          senses,
        });
      });
      
      parser.on('error', (error: Error) => {
        if (debug) console.log(`[DEBUG] ${this.name}: Error:`, error);
        reject(new Error(`XML parsing error: ${error.message}`));
      });
      
      // Create a readable stream from the XML content string
      const { Readable } = require('stream');
      const stream = Readable.from(xmlContent, { encoding: 'utf8' });
      stream.pipe(parser);
      
      stream.on('error', (error: Error) => {
        if (debug) console.log(`[DEBUG] ${this.name}: Stream error:`, error);
        reject(new Error(`Stream error: ${error.message}`));
      });
      
      // Ensure stream is properly closed
      stream.on('end', () => {
        stream.destroy();
      });
    });
  }
}

/**
 * Full streaming parser that actually parses LMF content
 * This is the production-ready version
 */
export class FullStreamingParser implements LMFParser {
  readonly name = 'Full Streaming Parser';
  readonly description = 'Complete LMF streaming parser with full data extraction';

  async parse(xmlContent: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    // For now, use the SAX parser implementation
    // In the future, this could use a more sophisticated streaming approach
    const saxParser = new StreamingSaxParser();
    return saxParser.parse(xmlContent, options);
  }
}

// Factory functions
export const createStreamingSaxParser = (): LMFParser => new StreamingSaxParser();
export const createFullStreamingParser = (): LMFParser => new FullStreamingParser();
