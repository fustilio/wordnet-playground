import { python } from 'pythonia';
import { Similarity } from './similarity.js';
import { Morphy } from './morphy.js';
import { InformationContent } from './ic.js';
import { Validation } from './validate.js';
import { Export } from './export.js';
import { Download } from './download.js';
import { Constants } from './constants.js';
import { LMF } from './lmf.js';
import { Taxonomy } from './taxonomy.js';
import { Compat } from './compat.js';

// Re-export all modules for convenience
export { Similarity } from './similarity.js';
export { Morphy } from './morphy.js';
export { InformationContent } from './ic.js';
export { Validation } from './validate.js';
export { Export } from './export.js';
export { Download } from './download.js';
export { Constants } from './constants.js';
export { LMF } from './lmf.js';
export { Taxonomy } from './taxonomy.js';
export { Compat } from './compat.js';

export interface WnBridgeOptions {
  dataDirectory?: string;
  logLevel?: string;
}

export interface Lexicon {
  id: string;
  label: string;
  language: string;
  version: string;
  license?: string;
}

export interface Word {
  id: string;
  pos: string;
  lemma: string;
  lexicon: string;
}

export interface Sense {
  id: string;
  synset: string;
  word: string;
  pos: string;
  lexicon: string;
}

export interface Synset {
  id: string;
  pos: string;
  lexicon: string;
}

export interface Project {
  id: string;
  label: string;
  version: string;
  type: string;
  language?: string;
  license?: string;
}

export interface QueryOptions {
  pos?: string;
  lexicon?: string;
  lang?: string;
}

export class WnDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnDatabaseError';
  }
}

export class WnProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnProjectError';
  }
}

export class WnBridge {
  private pythonWnModule: any = null;
  private pythonWn: any = null;
  private initialized = false;
  private options: WnBridgeOptions;
  
  // Module instances
  public similarity: Similarity;
  public morphy: Morphy;
  public ic: InformationContent;
  public validation: Validation;
  public export: Export;
  public download: Download;
  public constants: Constants;
  public lmf: LMF;
  public taxonomy: Taxonomy;
  public compat: Compat;

  constructor(options: WnBridgeOptions = {}) {
    this.options = {
      ...options,
      logLevel: options.logLevel || 'info',
    };
    
    // Initialize module instances
    this.similarity = new Similarity(this);
    this.morphy = new Morphy(this);
    this.ic = new InformationContent(this);
    this.validation = new Validation(this);
    this.export = new Export(this);
    this.download = new Download();
    this.constants = new Constants();
    this.lmf = new LMF(this);
    this.taxonomy = new Taxonomy(this);
    this.compat = new Compat(this);
  }

  async init(dataset?: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Import the Python wn module
      this.pythonWnModule = await python('wn');
      
      // Use the specified dataset if provided, otherwise try oewn:2024 first
      if (dataset) {
        // Try different formats for the dataset specification
        const datasetFormats = [
          dataset, // Try as-is first
          dataset.replace(':', '-'), // Try with dash instead of colon
          dataset.split(':')[0], // Try just the ID without version
          'oewn:2024' // Fallback to working dataset
        ];
        
        let success = false;
        for (const format of datasetFormats) {
          try {
            console.log(`Trying dataset format: ${format}`);
            this.pythonWn = await this.pythonWnModule.Wordnet(format);
            console.log(`✅ Successfully initialized with dataset: ${format}`);
            success = true;
            break;
          } catch (error) {
            console.log(`❌ Failed with format '${format}': ${error}`);
            continue;
          }
        }
        
        if (!success) {
          // Final fallback to WordNet without arguments
          console.log('⚠️ Falling back to WordNet() without arguments');
          this.pythonWn = await this.pythonWnModule.WordNet();
        }
      } else {
        // Try to create WordNet instance with oewn:2024 first (like the working simple test)
        try {
          this.pythonWn = await this.pythonWnModule.Wordnet('oewn:2024');
        } catch (error) {
          // Fall back to creating WordNet without arguments
          this.pythonWn = await this.pythonWnModule.WordNet();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      throw new WnDatabaseError(`Failed to initialize Python bridge: ${error}`);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  async lexicons(): Promise<Lexicon[]> {
    await this.ensureInitialized();
    try {
      const result = await this.pythonWn.lexicons();
      return await this.convertToJsArray(result, 'Lexicon');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get lexicons: ${error}`);
    }
  }

  async projects(): Promise<Project[]> {
    await this.ensureInitialized();
    try {
      const result = await this.pythonWnModule.projects();
      return await this.convertToJsArray(result, 'Project');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get projects: ${error}`);
    }
  }

  async synsets(form: string, options: QueryOptions = {}): Promise<Synset[]> {
    await this.ensureInitialized();
    try {
      console.log('[WnBridge.synsets] form:', form, 'options:', options);
      if (this.pythonWn && typeof this.pythonWn.lexicons === 'function') {
        const lexicons = await this.pythonWn.lexicons();
        const lexiconList = [];
        for await (const lex of lexicons) {
          lexiconList.push({
            id: await lex.id,
            label: await lex.label,
            version: await lex.version,
            language: await lex.language
          });
        }
        console.log('[WnBridge.synsets] Available lexicons:', lexiconList);
      }
      // Always call with named arguments
      let result;
      let arr: Synset[] = [];
      if (options && options.pos) {
        for (const posVal of [options.pos, options.pos === 'n' ? 'noun' : options.pos]) {
          try {
            console.log(`[WnBridge.synsets] Trying synsets$({ form, pos: '${posVal}' })`);
            result = await this.pythonWn.synsets$({ form, pos: posVal });
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
              const preview = [];
              let count = 0;
              for await (const item of result) {
                if (count++ < 3) preview.push(item);
              }
              console.log(`[WnBridge.synsets] Raw result preview (first 3) for pos='${posVal}':`, preview);
            } else {
              console.log(`[WnBridge.synsets] Raw result is not iterable for pos='${posVal}':`, result);
            }
            arr = await this.convertToJsArray(result, 'Synset');
            if (arr.length > 0) {
              console.log(`[WnBridge.synsets] Got ${arr.length} synsets with pos='${posVal}'`);
              return arr;
            }
            console.log(`[WnBridge.synsets] No results with pos='${posVal}', trying next`);
          } catch (err) {
            console.error(`[WnBridge.synsets] Exception for pos='${posVal}':`, err);
          }
        }
        console.log('[WnBridge.synsets] No results with named pos, trying without pos');
      }
      // Try calling with just the form as a named argument
      try {
        console.log('[WnBridge.synsets] Trying synsets$({ form })');
        result = await this.pythonWn.synsets$({ form });
        if (result && typeof result[Symbol.asyncIterator] === 'function') {
          const preview = [];
          let count = 0;
          for await (const item of result) {
            if (count++ < 3) preview.push(item);
          }
          console.log(`[WnBridge.synsets] Raw result preview (first 3) for form only:`, preview);
        } else {
          console.log('[WnBridge.synsets] Raw result is not iterable for form only:', result);
        }
        arr = await this.convertToJsArray(result, 'Synset');
        if (arr.length > 0) {
          console.log(`[WnBridge.synsets] Got ${arr.length} synsets with form only`);
          return arr;
        }
        console.log('[WnBridge.synsets] No results with form only, returning empty array');
        return arr;
      } catch (err) {
        console.error('[WnBridge.synsets] Exception for form only:', err);
        return [];
      }
    } catch (error) {
      throw new WnDatabaseError(`Failed to get synsets for '${form}': ${error}`);
    }
  }

  async words(form: string, options: QueryOptions = {}): Promise<Word[]> {
    await this.ensureInitialized();
    try {
      const result = await this.pythonWn.words$(form, options);
      return await this.convertToJsArray(result, 'Word');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get words for '${form}': ${error}`);
    }
  }

  async senses(form: string, options: QueryOptions = {}): Promise<Sense[]> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonWn.senses$(form, options);
      return await this.convertToJsArray(result, 'Sense');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get senses for '${form}': ${error}`);
    }
  }

  async synset(id: string): Promise<Synset | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonWn.synset(id);
      return await this.convertToJsObject(result, 'Synset');
    } catch (error) {
      return null;
    }
  }

  async word(id: string): Promise<Word | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonWn.word(id);
      return await this.convertToJsObject(result, 'Word');
    } catch (error) {
      return null;
    }
  }

  async sense(id: string): Promise<Sense | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonWn.sense(id);
      return await this.convertToJsObject(result, 'Sense');
    } catch (error) {
      return null;
    }
  }

  async add(path: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.pythonWn.add(path);
    } catch (error) {
      throw new WnDatabaseError(`Failed to add resource from '${path}': ${error}`);
    }
  }

  public async convertToJsArray(iterable: any, type: string): Promise<any[]> {
    if (!iterable) return [];
    try {
      const result = [];
      let first = true;
      for await (const item of iterable) {
        if (first) {
          first = false;
        }
        result.push(await this.convertToJsObject(item, type));
      }
      return result;
    } catch (error) {
      return [];
    }
  }

  /**
   * Utility: Extract all enumerable properties from a Python object using await
   */
  private async extractProperties(obj: any): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      try {
        result[key] = await obj[key];
      } catch (e) {
        // Ignore properties that can't be awaited
      }
    }
    return result;
  }

  /**
   * Convert Python object to JS object
   */
  public async convertToJsObject(obj: any, type: string): Promise<any> {
    if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return obj;
    try {
      switch (type) {
        case 'Lexicon':
          try {
            const lexiconObj = {
              id: await obj.id,
              label: await obj.label,
              language: await obj.language,
              version: await obj.version,
              license: await obj.license,
            };
            return lexiconObj;
          } catch (e) {
            return {};
          }
        case 'Word':
          try {
            const wordObj = {
              id: await obj.id,
              pos: await obj.pos,
              lemma: await obj.lemma(),
              lexicon: await obj.lexicon(),
            };
            return wordObj;
          } catch (e) {
            return {};
          }
        case 'Sense':
          try {
            const synsetObj = await obj.synset();
            const senseObj = {
              id: await obj.id,
              synset: synsetObj,
              word: await obj.word(),
              lexicon: await obj.lexicon(),
              pos: await synsetObj.pos,
            };
            return senseObj;
          } catch (e) {
            return {};
          }
        case 'Synset':
          return {
            id: await obj.id,
            pos: await obj.pos,
            lexicon: await obj.lexicon,
          };
        case 'Project':
          return {
            id: await obj.id,
            label: await obj.label,
            version: await obj.version,
            type: await obj.type,
            language: await obj.language,
            license: await obj.license,
          };
        default:
          // No fallback: only support known types
          return {};
      }
    } catch (error) {
      return {};
    }
  }

  /**
   * Convert JavaScript array to Python format
   */
  public async convertToPythonArray(array: any[]): Promise<any> {
    if (!array || !Array.isArray(array)) return [];
    
    try {
      // For now, return the array as-is since Python can handle JSON-like objects
      // In a more sophisticated implementation, we might need to convert to Python objects
      return array;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean up resources
   * Note: Interpreter shutdown should be done via python.exit() if needed.
   */
  async close(): Promise<void> {
    // No-op: interpreter shutdown should be done via python.exit() from pythonia if needed.
  }

  /**
   * Get hypernyms of a synset
   */
  async hypernyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.hypernyms();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get hypernyms for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get hyponyms of a synset
   */
  async hyponyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.hyponyms();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get hyponyms for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get relations of a synset
   */
  async relations(synsetId: string, type?: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = type ? await synset.relations(type) : await synset.relations();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get relations for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get meronyms of a synset
   */
  async meronyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.meronyms();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get meronyms for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get holonyms of a synset
   */
  async holonyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.holonyms();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get holonyms for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get entailments of a synset
   */
  async entailments(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.entailments();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get entailments for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get causes of a synset
   */
  async causes(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const synset = await this.pythonWn.synset(synsetId);
      const result = await synset.causes();
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get causes for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get similar synsets
   */
  async similar(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonWn.similar(synsetId);
      return await this.convertToJsArray(result, 'Synset');
    } catch (error) {
      throw new WnDatabaseError(`Failed to get similar synsets for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get Python Synset proxy object by ID (for internal use by similarity bridge)
   */
  async getPythonSynset(synsetId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.pythonWn.synset(synsetId);
    } catch (error) {
      throw new WnDatabaseError(`Failed to get Python synset for '${synsetId}': ${error}`);
    }
  }

  /**
   * Get the Python WordNet instance for use by modules
   */
  async getPythonWordNet(): Promise<any> {
    await this.ensureInitialized();
    return this.pythonWn;
  }

  /**
   * Get Python Sense instance
   */
  async getPythonSense(senseId: string): Promise<any> {
    await this.ensureInitialized();
    return await this.pythonWn.sense(senseId);
  }
} 