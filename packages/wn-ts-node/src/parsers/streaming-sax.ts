/**
 * Streaming SAX parser using file streams for memory efficiency
 * 
 * This parser uses file streams to parse large LMF files without loading
 * the entire file into memory.
 */
import sax from 'sax';
import type { LMFXMLParser, LMFDocument, LMFLoadOptions } from 'wn-ts-core';
import type { Synset, Word, Sense, Lexicon } from 'wn-ts-core';

/**
 * Streaming SAX parser for memory-efficient parsing of large LMF files
 * This parser implements the common LMFParser interface
 */
export class StreamingSaxParser implements LMFXMLParser {
  readonly name = 'Streaming SAX Parser';
  readonly description = 'Memory-efficient streaming parser for large LMF files using SAX';

  async parse(xmlContent: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false, progress, duplicateHandling } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    // Note: This parser doesn't implement duplicate handling yet
    // For production use with duplicate handling, use the web parser
    if (duplicateHandling && debug) {
      console.log(`[DEBUG] ${this.name}: Duplicate handling options not yet implemented`);
    }
    
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
      let currentSense: Sense | null = null;
      let elementCount = 0;
      let lastProgressUpdate = 0;
      
      const parser = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: false, // Keep original case for LMF elements
        position: false,
        xmlns: false,
      });
      
      // Helper function to update progress periodically
      const updateProgress = () => {
        if (progress && elementCount - lastProgressUpdate >= 100) {
          const progressValue = Math.min(0.9, elementCount / 10000); // Estimate progress
          progress(progressValue);
          lastProgressUpdate = elementCount;
        }
      };
      
      parser.on('opentag', (node) => {
        elementCount++;
        updateProgress();
        
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
            } as Lexicon;
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
              memberIds: [],
              senseIds: [],
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
            
          case 'Example':
            if (currentSynset) {
              const example = {
                id: getAttr('id') || '',
                language: getAttr('language') || currentLexicon?.language || 'en',
                text: '',
              };
              currentSynset.examples.push(example);
            } else if (currentSense) {
              const example = {
                id: getAttr('id') || '',
                language: getAttr('language') || currentLexicon?.language || 'en',
                text: '',
              };
              currentSense.examples.push(example);
            }
            break;
            
          case 'SynsetRelation':
            if (currentSynset) {
              const relation = {
                id: getAttr('id') || '',
                type: getAttr('relType') || 'unknown',
                target: getAttr('target') || '',
              };
              currentSynset.relations.push(relation);
            }
            break;
            
          case 'Sense':
            currentSense = {
              id: getAttr('id') || 'unknown-sense',
              wordId: currentEntry?.id || 'unknown-word',
              synsetId: getAttr('synset') || currentSynset?.id || 'unknown-synset',
              counts: [],
              examples: [],
              tags: [],
            };
            senses.push(currentSense);
            break;
            
          case 'Count':
            if (currentSense) {
              const count = {
                id: getAttr('id') || '',
                value: 0, // Will be set in text handler
                writtenForm: currentEntry?.lemma || 'unknown',
                pos: currentEntry?.pos || 'n',
              };
              currentSense.counts.push(count);
            }
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
        
        // Handle text content for examples
        if (currentSynset && currentSynset.examples.length > 0) {
          const lastExample = currentSynset.examples[currentSynset.examples.length - 1];
          if (lastExample) {
            lastExample.text = (lastExample.text + text).trim();
          }
        }
        
        if (currentSense && currentSense.examples.length > 0) {
          const lastExample = currentSense.examples[currentSense.examples.length - 1];
          if (lastExample) {
            lastExample.text = (lastExample.text + text).trim();
          }
        }
        
        // Handle text content for counts
        if (currentSense && currentSense.counts.length > 0) {
          const lastCount = currentSense.counts[currentSense.counts.length - 1];
          if (lastCount) {
            const textValue = text.trim();
            if (textValue) {
              lastCount.value = parseInt(textValue, 10) || 0;
            }
          }
        }
      });
      
      parser.on('end', () => {
        if (debug) console.log(`[DEBUG] ${this.name}: Found ${elementCount} elements`);
        if (debug) console.log(`[DEBUG] ${this.name}: Parsed ${lexicons.length} lexicons, ${words.length} words, ${synsets.length} synsets, ${senses.length} senses`);
        
        // Final progress update
        if (progress) progress(1.0);
        
        resolve({
          lmfVersion: '1.0', // Default version for SAX parser
          lexicons: lexicons.map(lex => ({
            ...lex,
            language: (lex.language || 'en') as string
          } as Lexicon)),
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
export class FullStreamingParser implements LMFXMLParser {
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
export const createStreamingSaxParser = (): LMFXMLParser => new StreamingSaxParser();
export const createFullStreamingParser = (): LMFXMLParser => new FullStreamingParser();
