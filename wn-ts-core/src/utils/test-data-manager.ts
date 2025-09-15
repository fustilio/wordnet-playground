import { join } from 'path';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { constants } from 'fs';
import {
  analyzeLMFXML,
  generateSampleXML,
  generateRealisticXML,
  generateXSDFromXML,
  validateXMLAgainstXSD,
  analyzeLMFXMLComprehensive
} from './xml-analyzer.js';
import { isCompressedURL } from './url.js';

export interface TestDataConfig {
  outputDir: string;
  maxElements?: number;
  maxDepth?: number;
  includeAttributes?: boolean;
  includeText?: boolean;
  validateAgainstXSD?: boolean;
  generateRealistic?: boolean;
  generateSamples?: boolean;
}

export interface WordNetDataSource {
  id: string;
  name: string;
  language: string;
  version: string;
  url: string;
  format: 'xml' | 'tar' | 'tar.gz' | 'tar.xz';
  description: string;
  size?: string;
  lastUpdated?: string;
}

export interface TestDataResult {
  success: boolean;
  projectId: string;
  analysis?: any;
  sampleXml?: string;
  realisticXml?: string;
  xsdSchema?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  error?: string;
}

export interface URLValidationResult {
  url: string;
  accessible: boolean;
  contentType?: string;
  contentLength?: number;
  isValidXML?: boolean;
  analysis?: any;
  error?: string;
}

/**
 * Test Data Manager for WordNet projects
 * Uses xml-introspect to validate URLs and generate representative test data
 */
export class TestDataManager {
  private config: TestDataConfig;
  private dataSources: WordNetDataSource[] = [];

  constructor(config: TestDataConfig) {
    this.config = {
      maxElements: 50,
      maxDepth: 5,
      includeAttributes: true,
      includeText: true,
      validateAgainstXSD: true,
      generateRealistic: true,
      generateSamples: true,
      ...config
    };
  }

  /**
   * Add a WordNet data source to validate and generate test data for
   */
  addDataSource(source: WordNetDataSource): void {
    this.dataSources.push(source);
  }

  /**
   * Add multiple data sources at once
   */
  addDataSources(sources: WordNetDataSource[]): void {
    this.dataSources.push(...sources);
  }

  /**
   * Validate that a URL is accessible and contains valid XML
   */
  async validateURL(url: string): Promise<URLValidationResult> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        return {
          url,
          accessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const contentType = response.headers.get('content-type') || 'unknown';
      const contentLength = response.headers.get('content-length');
      
      // Check if this is a compressed file that needs special handling
      const isCompressed = isCompressedURL(url);
      
      if (isCompressed) {
        // For compressed files, we can't easily validate XML without decompression
        // Just check if the file is accessible
        return {
          url,
          accessible: true,
          contentType,
          contentLength: contentLength ? parseInt(contentLength) : 0,
          isValidXML: false, // Unknown without decompression, but not null
          error: 'Compressed file - XML validation requires decompression'
        };
      }
      
      // Try to fetch a small sample to validate XML
      const sampleResponse = await fetch(url, {
        headers: { 'Range': 'bytes=0-1024' }
      });
      
      if (!sampleResponse.ok) {
        // If range request fails, try full request but limit size
        const fullResponse = await fetch(url);
        const text = await fullResponse.text();
        const sample = text.substring(0, 1024);
        
        return await this.validateXMLSample(url, sample, {
          contentType,
          contentLength: contentLength ? parseInt(contentLength) : 0
        });
      }

      const sample = await sampleResponse.text();
      return await this.validateXMLSample(url, sample, {
        contentType,
        contentLength: contentLength ? parseInt(contentLength) : 0
      });

    } catch (error) {
      return {
        url,
        accessible: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate XML sample content
   */
  private async validateXMLSample(
    url: string, 
    sample: string, 
    metadata: { contentType?: string; contentLength?: number }
  ): Promise<URLValidationResult> {
    try {
      // Check if it looks like XML
      const isXML = sample.trim().startsWith('<?xml') || sample.trim().startsWith('<');
      
      if (!isXML) {
        return {
          url,
          accessible: true,
          ...metadata,
          isValidXML: false,
          error: 'Content does not appear to be XML'
        };
      }

      // Try to analyze the XML sample
      let analysis;
      try {
        analysis = await analyzeLMFXML(sample);
      } catch (error) {
        return {
          url,
          accessible: true,
          ...metadata,
          isValidXML: false,
          error: `XML analysis failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      return {
        url,
        accessible: true,
        ...metadata,
        isValidXML: true,
        analysis
      };

    } catch (error) {
      return {
        url,
        accessible: true,
        ...metadata,
        isValidXML: false,
        error: `XML validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate all configured data sources
   */
  async validateAllSources(): Promise<URLValidationResult[]> {
    const results: URLValidationResult[] = [];
    
    for (const source of this.dataSources) {
      console.log(`🔍 Validating ${source.id} (${source.url})`);
      const result = await this.validateURL(source.url);
      results.push(result);
      
      if (result.accessible && result.isValidXML) {
        console.log(`✅ ${source.id}: Valid XML data available`);
      } else {
        console.log(`❌ ${source.id}: ${result.error || 'Invalid or inaccessible'}`);
      }
    }
    
    return results;
  }

  /**
   * Generate test data for a specific project
   */
  async generateTestData(projectId: string, xmlContent: string): Promise<TestDataResult> {
    try {
      console.log(`📊 Generating test data for ${projectId}`);
      
      // Ensure output directory exists
      await this.ensureOutputDirectory(projectId);
      
      const result: TestDataResult = {
        success: true,
        projectId
      };

      // Perform comprehensive analysis
      try {
        result.analysis = await analyzeLMFXMLComprehensive(xmlContent);
        console.log(`✅ Analysis completed for ${projectId}`);
      } catch (error) {
        console.warn(`⚠️ Analysis failed for ${projectId}:`, error);
      }

      // Generate XSD schema
      if (this.config.validateAgainstXSD) {
        try {
          result.xsdSchema = await generateXSDFromXML(xmlContent, {
            targetNamespace: 'http://globalwordnet.org/ns/wn-lmf/1.4',
            elementFormDefault: 'qualified'
          });
          console.log(`✅ XSD schema generated for ${projectId}`);
        } catch (error) {
          console.warn(`⚠️ XSD generation failed for ${projectId}:`, error);
        }
      }

      // Generate sample XML
      if (this.config.generateSamples) {
        try {
          result.sampleXml = await generateSampleXML(xmlContent, {
            maxElements: this.config.maxElements || 50,
            maxDepth: this.config.maxDepth || 5,
            includeAttributes: this.config.includeAttributes || true,
            includeText: this.config.includeText || true
          });
          console.log(`✅ Sample XML generated for ${projectId}`);
        } catch (error) {
          console.warn(`⚠️ Sample generation failed for ${projectId}:`, error);
        }
      }

      // Generate realistic XML
      if (this.config.generateRealistic) {
        try {
          result.realisticXml = await generateRealisticXML(xmlContent, {
            count: 25,
            locale: 'en',
            preserveStructure: true
          });
          console.log(`✅ Realistic XML generated for ${projectId}`);
        } catch (error) {
          console.warn(`⚠️ Realistic XML generation failed for ${projectId}:`, error);
        }
      }

      // Validate against generated schema
      if (result.xsdSchema && result.sampleXml) {
        try {
          result.validation = await validateXMLAgainstXSD(result.sampleXml, result.xsdSchema);
          console.log(`✅ Schema validation completed for ${projectId}`);
        } catch (error) {
          console.warn(`⚠️ Schema validation failed for ${projectId}:`, error);
        }
      }

      // Save generated files
      await this.saveTestData(projectId, result);

      return result;

    } catch (error) {
      return {
        success: false,
        projectId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate test data for all configured sources
   */
  async generateAllTestData(): Promise<TestDataResult[]> {
    const results: TestDataResult[] = [];
    
    for (const source of this.dataSources) {
      try {
        console.log(`📥 Downloading ${source.id} for test data generation`);
        
        // Download the full XML content
        const response = await fetch(source.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${source.url}: ${response.status} ${response.statusText}`);
        }
        
        const xmlContent = await response.text();
        
        // Generate test data
        const result = await this.generateTestData(source.id, xmlContent);
        results.push(result);
        
      } catch (error) {
        console.error(`❌ Failed to generate test data for ${source.id}:`, error);
        results.push({
          success: false,
          projectId: source.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }

  /**
   * Ensure output directory exists for a project
   */
  private async ensureOutputDirectory(projectId: string): Promise<void> {
    const projectDir = join(this.config.outputDir, projectId);
    
    try {
      await access(projectDir, constants.F_OK);
    } catch {
      await mkdir(projectDir, { recursive: true });
    }
  }

  /**
   * Save generated test data to files
   */
  private async saveTestData(projectId: string, result: TestDataResult): Promise<void> {
    const projectDir = join(this.config.outputDir, projectId);
    
    // Save analysis report
    if (result.analysis) {
      const analysisFile = join(projectDir, 'analysis.json');
      await writeFile(analysisFile, JSON.stringify(result.analysis, null, 2));
    }

    // Save XSD schema
    if (result.xsdSchema) {
      const xsdFile = join(projectDir, `${projectId}.xsd`);
      await writeFile(xsdFile, result.xsdSchema);
    }

    // Save sample XML
    if (result.sampleXml) {
      const sampleFile = join(projectDir, 'sample.xml');
      await writeFile(sampleFile, result.sampleXml);
    }

    // Save realistic XML
    if (result.realisticXml) {
      const realisticFile = join(projectDir, 'realistic.xml');
      await writeFile(realisticFile, result.realisticXml);
    }

    // Save validation results
    if (result.validation) {
      const validationFile = join(projectDir, 'validation.json');
      await writeFile(validationFile, JSON.stringify(result.validation, null, 2));
    }

    console.log(`💾 Test data saved for ${projectId} in ${projectDir}`);
  }

  /**
   * Load existing test data
   */
  async loadTestData(projectId: string): Promise<TestDataResult | null> {
    try {
      const projectDir = join(this.config.outputDir, projectId);
      
      const analysisFile = join(projectDir, 'analysis.json');
      const sampleFile = join(projectDir, 'sample.xml');
      const realisticFile = join(projectDir, 'realistic.xml');
      const xsdFile = join(projectDir, `${projectId}.xsd`);
      const validationFile = join(projectDir, 'validation.json');

      const result: TestDataResult = {
        success: true,
        projectId
      };

      // Load analysis
      try {
        const analysisContent = await readFile(analysisFile, 'utf-8');
        result.analysis = JSON.parse(analysisContent);
      } catch {
        // Analysis file doesn't exist or is invalid
      }

      // Load sample XML
      try {
        result.sampleXml = await readFile(sampleFile, 'utf-8');
      } catch {
        // Sample file doesn't exist
      }

      // Load realistic XML
      try {
        result.realisticXml = await readFile(realisticFile, 'utf-8');
      } catch {
        // Realistic file doesn't exist
      }

      // Load XSD schema
      try {
        result.xsdSchema = await readFile(xsdFile, 'utf-8');
      } catch {
        // XSD file doesn't exist
      }

      // Load validation results
      try {
        const validationContent = await readFile(validationFile, 'utf-8');
        result.validation = JSON.parse(validationContent);
      } catch {
        // Validation file doesn't exist
      }

      return result;

    } catch (error) {
      console.error(`Failed to load test data for ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Get list of available test data projects
   */
  async getAvailableProjects(): Promise<string[]> {
    try {
      // This is a simplified implementation - in practice you'd use fs.readdir
      // const files = await readFile(this.config.outputDir, 'utf-8');
      return [];
    } catch {
      return [];
    }
  }
}

/**
 * Default WordNet data sources for testing
 */
export const DEFAULT_WORDNET_SOURCES: WordNetDataSource[] = [
  {
    id: 'test-sample',
    name: 'Test Sample XML',
    language: 'en',
    version: '1.0',
    url: 'https://raw.githubusercontent.com/globalwordnet/english-wordnet/main/english-wordnet-2024.xml',
    format: 'xml',
    description: 'Test sample for validation',
    size: '~50MB',
    lastUpdated: '2024-01-01'
  },
  {
    id: 'oewn:2024',
    name: 'Open English WordNet 2024',
    language: 'en',
    version: '2024',
    url: 'https://en-word.net/static/english-wordnet-2024.xml.gz',
    format: 'tar.gz',
    description: 'Complete English WordNet in LMF format (compressed)',
    size: '~50MB compressed',
    lastUpdated: '2024-01-01'
  },
  {
    id: 'omw-fr:1.4',
    name: 'Open Multilingual Wordnet - French 1.4',
    language: 'fr',
    version: '1.4',
    url: 'https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz',
    format: 'tar.xz',
    description: 'French WordNet in LMF format (compressed)',
    size: '~5MB compressed',
    lastUpdated: '2020-01-01'
  }
];

/**
 * Create a test data manager with default configuration
 * Uses a cache directory that's gitignored to avoid committing large test data
 */
export function createTestDataManager(outputDir: string = './.test-data-cache'): TestDataManager {
  const manager = new TestDataManager({ outputDir });
  manager.addDataSources(DEFAULT_WORDNET_SOURCES);
  return manager;
}
