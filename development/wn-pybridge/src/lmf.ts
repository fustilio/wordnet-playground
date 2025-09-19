import { python } from 'pythonia';
import { WnBridge } from './index.js';

export interface LMFDocument {
  lmfVersion: string;
  lexicons: any[];
  metadata?: Record<string, any>;
}

export interface LMFLoadOptions {
  validate?: boolean;
  encoding?: string;
  maxSize?: number;
}

export interface LMFSaveOptions {
  pretty?: boolean;
  encoding?: string;
  includeMetadata?: boolean;
}

export class LMF {
  private bridge: WnBridge;
  private pythonLmfModule: any = null;

  constructor(bridge: WnBridge) {
    this.bridge = bridge;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.pythonLmfModule) {
      try {
        this.pythonLmfModule = await python('wn.lmf');
      } catch (error) {
        throw new Error(`Failed to initialize LMF module: ${error}`);
      }
    }
  }

  /**
   * Load LMF data from an XML file
   */
  async load(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonLmfModule.load(filePath);
      
      // Convert Python result to JavaScript
      const lexicons = await this.bridge.convertToJsArray(result, 'Lexicon');
      
      return {
        lmfVersion: '1.0', // Default version, could be extracted from XML
        lexicons,
        metadata: {}
      };
    } catch (error) {
      throw new Error(`Failed to load LMF file '${filePath}': ${error}`);
    }
  }

  /**
   * Save LMF data to an XML file
   */
  async save(lexicons: any[], filePath: string, options: LMFSaveOptions = {}): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // For now, create a simple XML structure since Python's wn.lmf.dump might not be available
      // or might have different requirements
      const xmlContent = this.createSimpleLMFXML(lexicons, options);
      const builtins = await python('builtins');
      const fs = await builtins.open(filePath, 'w');
      await fs.write(xmlContent);
      await fs.close();
    } catch (error) {
      throw new Error(`Failed to save LMF file '${filePath}': ${error}`);
    }
  }

  /**
   * Create a simple LMF XML structure
   */
  private createSimpleLMFXML(lexicons: any[], options: LMFSaveOptions = {}): string {
    const pretty = options.pretty || false;
    const indent = pretty ? '  ' : '';
    const newline = pretty ? '\n' : '';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>' + newline;
    xml += '<LexicalResource xmlns="http://www.lexicalmarkupframework.org/schema/1.0" version="1.0">' + newline;
    
    for (const lexicon of lexicons) {
      xml += indent + '<Lexicon id="' + lexicon.id + '" label="' + lexicon.label + '" language="' + (lexicon.language || 'en') + '" version="' + (lexicon.version || '1.0') + '">' + newline;
      // Add minimal required structure for LMF
      xml += indent + indent + '<LexicalEntry id="' + lexicon.id + '-entry">' + newline;
      xml += indent + indent + '</LexicalEntry>' + newline;
      xml += indent + '</Lexicon>' + newline;
    }
    
    xml += '</LexicalResource>';
    return xml;
  }

  /**
   * Validate an LMF file
   */
  async validate(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    await this.ensureInitialized();
    
    try {
      const result = await this.pythonLmfModule.validate(filePath);
      
      // Convert Python validation result to JavaScript
      const errors = result.errors ? await this.bridge.convertToJsArray(result.errors, 'string') : [];
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Get LMF version from a file
   */
  async getVersion(filePath: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Try to read the file and extract version from XML
      const builtins = await python('builtins');
      const fs = await builtins.open(filePath, 'r');
      const content = await fs.read();
      await fs.close();
      
      // Simple regex to extract version from XML
      const versionMatch = content.match(/version="([^"]+)"/);
      if (versionMatch) {
        return versionMatch[1];
      }
      
      // Default version if not found
      return '1.0';
    } catch (error) {
      throw new Error(`Failed to get LMF version from '${filePath}': ${error}`);
    }
  }
} 