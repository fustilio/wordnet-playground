// Try to import xml-introspect, but make it optional
let XMLIntrospector: any;
let StreamingXMLIntrospector: any;
let XMLAnalyzer: any;
let XSDGenerator: any;
let XMLValidator: any;
let SampleGenerator: any;
let XMLFakerGenerator: any;

// Import shared LMF version utilities
import { extractLMFVersion, extractDTDVersion } from '../lmf/version-utils.js';

try {
  const xmlIntrospect = require('xml-introspect');
  XMLIntrospector = xmlIntrospect.XMLIntrospector;
  StreamingXMLIntrospector = xmlIntrospect.StreamingXMLIntrospector;
  XMLAnalyzer = xmlIntrospect.XMLAnalyzer;
  XSDGenerator = xmlIntrospect.XSDGenerator;
  XMLValidator = xmlIntrospect.XMLValidator;
  SampleGenerator = xmlIntrospect.SampleGenerator;
  XMLFakerGenerator = xmlIntrospect.XMLFakerGenerator;
} catch (error) {
  // xml-introspect not available
  XMLIntrospector = null;
  StreamingXMLIntrospector = null;
  XMLAnalyzer = null;
  XSDGenerator = null;
  XMLValidator = null;
  SampleGenerator = null;
  XMLFakerGenerator = null;
}

// Browser-safe file reading - only available in Node.js environment
let readFile: typeof import('fs/promises').readFile;
try {
  // Only import fs/promises in Node.js environment
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined') {
    readFile = require('fs/promises').readFile;
  }
} catch (error) {
  // fs/promises not available (browser environment)
  readFile = undefined as any;
}

export interface XMLAnalysisResult {
  totalSynsets: number;
  synsetsWithILI: number;
  synsetsWithEmptyILI: number;
  synsetsWithoutILI: number;
  iliCoveragePercentage: number;
  uniqueILIs: string[];
  iliDistribution: Record<string, number>;
  partOfSpeechDistribution: Record<string, number>;
  synsetSizeDistribution: Record<number, number>;
  totalWords: number;
  totalSenses: number;
  totalLexicons: number;
  hasGlobalInformation: boolean;
  hasLexiconMetadata: boolean;
  lmfVersion?: string;
  dtdVersion?: string;
  schemaValidation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface ILIAnalysis {
  validILIs: string[];
  emptyILIs: string[];
  missingILIs: string[];
  duplicateILIs: string[];
  iliFormatValidation: {
    valid: string[];
    invalid: string[];
  };
}

/**
 * Analyze an LMF XML file to extract statistics and validate data integrity
 * This function works in both Node.js and browser environments
 * Now leverages xml-introspect XMLAnalyzer for comprehensive analysis
 */
export async function analyzeLMFXML(filePathOrContent: string): Promise<XMLAnalysisResult> {
  let xmlContent: string;
  
  // Check if we're in a browser environment or if the input looks like XML content
  if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
    // Browser environment or XML content provided directly
    xmlContent = filePathOrContent;
  } else {
    // Node.js environment with file path
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    xmlContent = await readFile(filePathOrContent, 'utf-8');
  }
  
  // Try to use xml-introspect XMLAnalyzer for comprehensive analysis
  if (XMLAnalyzer) {
    try {
      const analyzer = new XMLAnalyzer();
      const analysis = await analyzer.analyzeString(xmlContent);
      
      // Convert xml-introspect analysis to our format
      const result = convertXMLIntrospectAnalysis(analysis, xmlContent);
      return result;
    } catch (error) {
      console.warn('xml-introspect XMLAnalyzer failed, falling back to regex analysis:', error);
    }
  }
  
  // Fallback to regex-based analysis if xml-introspect is not available or fails
  return analyzeLMFXMLWithRegex(xmlContent, filePathOrContent);
}

/**
 * Fallback analysis using regex patterns (original implementation)
 */
async function analyzeLMFXMLWithRegex(xmlContent: string, filePathOrContent: string): Promise<XMLAnalysisResult> {
  // Extract basic statistics using regex patterns
  const synsetMatches = xmlContent.match(/<Synset[^>]*>/g) || [];
  const wordMatches = xmlContent.match(/<LexicalEntry[^>]*>/g) || [];
  const senseMatches = xmlContent.match(/<Sense[^>]*>/g) || [];
  const lexiconMatches = xmlContent.match(/<Lexicon[^>]*>/g) || [];
  
  // Analyze ILI coverage
  const iliAnalysis = analyzeILICoverage(xmlContent);
  
  // Analyze part of speech distribution
  const posDistribution = analyzePartOfSpeechDistribution(xmlContent);
  
  // Analyze synset sizes
  const sizeDistribution = analyzeSynsetSizeDistribution(xmlContent);
  
  // Check for metadata elements
  const hasGlobalInformation = xmlContent.includes('<GlobalInformation>');
  const hasLexiconMetadata = xmlContent.includes('dc:subject') || xmlContent.includes('dc:creator');
  
  // Extract LMF version information using shared utilities
  const lmfVersion = extractLMFVersion(xmlContent);
  const dtdVersion = extractDTDVersion(xmlContent);
  
  // Use xml-introspect for schema validation if available
  let schemaValidation;
  try {
    schemaValidation = await validateWithXMLIntrospect(filePathOrContent, xmlContent);
  } catch (error) {
    // If xml-introspect fails, fall back to basic validation
    schemaValidation = validateLMFStructure(xmlContent);
  }
  
  const totalSynsets = synsetMatches.length;
  const synsetsWithILI = iliAnalysis.validILIs.length;
  const synsetsWithEmptyILI = iliAnalysis.emptyILIs.length;
  const synsetsWithoutILI = iliAnalysis.missingILIs.length;
  const iliCoveragePercentage = totalSynsets > 0 ? (synsetsWithILI / totalSynsets) * 100 : 0;
  
  const result: XMLAnalysisResult = {
    totalSynsets,
    synsetsWithILI,
    synsetsWithEmptyILI,
    synsetsWithoutILI,
    iliCoveragePercentage,
    uniqueILIs: iliAnalysis.validILIs,
    iliDistribution: countOccurrences(iliAnalysis.validILIs),
    partOfSpeechDistribution: posDistribution,
    synsetSizeDistribution: sizeDistribution,
    totalWords: wordMatches.length,
    totalSenses: senseMatches.length,
    totalLexicons: lexiconMatches.length,
    hasGlobalInformation,
    hasLexiconMetadata,
    schemaValidation
  };
  
  // Only add optional properties if they have values
  if (lmfVersion !== undefined) {
    result.lmfVersion = lmfVersion;
  }
  if (dtdVersion !== undefined) {
    result.dtdVersion = dtdVersion;
  }
  
  return result;
}

/**
 * Convert xml-introspect analysis result to our XMLAnalysisResult format
 */
function convertXMLIntrospectAnalysis(analysis: any, xmlContent: string): XMLAnalysisResult {
  // Extract WordNet-specific analysis from the general XML analysis
  const iliAnalysis = analyzeILICoverage(xmlContent);
  const posDistribution = analyzePartOfSpeechDistribution(xmlContent);
  const sizeDistribution = analyzeSynsetSizeDistribution(xmlContent);
  
  // Use xml-introspect data where available, fallback to regex for WordNet-specific elements
  const synsetMatches = xmlContent.match(/<Synset[^>]*>/g) || [];
  const wordMatches = xmlContent.match(/<LexicalEntry[^>]*>/g) || [];
  const senseMatches = xmlContent.match(/<Sense[^>]*>/g) || [];
  const lexiconMatches = xmlContent.match(/<Lexicon[^>]*>/g) || [];
  
  const totalSynsets = synsetMatches.length;
  const synsetsWithILI = iliAnalysis.validILIs.length;
  const synsetsWithEmptyILI = iliAnalysis.emptyILIs.length;
  const synsetsWithoutILI = iliAnalysis.missingILIs.length;
  const iliCoveragePercentage = totalSynsets > 0 ? (synsetsWithILI / totalSynsets) * 100 : 0;
  
  // Check for metadata elements
  const hasGlobalInformation = xmlContent.includes('<GlobalInformation>');
  const hasLexiconMetadata = xmlContent.includes('dc:subject') || xmlContent.includes('dc:creator');
  
  // Extract LMF version information using shared utilities
  const lmfVersion = extractLMFVersion(xmlContent);
  const dtdVersion = extractDTDVersion(xmlContent);
  
  const result: XMLAnalysisResult = {
    totalSynsets,
    synsetsWithILI,
    synsetsWithEmptyILI,
    synsetsWithoutILI,
    iliCoveragePercentage,
    uniqueILIs: iliAnalysis.validILIs,
    iliDistribution: countOccurrences(iliAnalysis.validILIs),
    partOfSpeechDistribution: posDistribution,
    synsetSizeDistribution: sizeDistribution,
    totalWords: wordMatches.length,
    totalSenses: senseMatches.length,
    totalLexicons: lexiconMatches.length,
    hasGlobalInformation,
    hasLexiconMetadata,
    schemaValidation: {
      isValid: analysis.isValid || true,
      errors: analysis.errors || [],
      warnings: analysis.warnings || []
    }
  };
  
  // Only add optional properties if they have values
  if (lmfVersion !== undefined) {
    result.lmfVersion = lmfVersion;
  }
  if (dtdVersion !== undefined) {
    result.dtdVersion = dtdVersion;
  }
  
  return result;
}

/**
 * Browser-safe version that only accepts XML content as string
 * This is the recommended function for browser environments
 */
export async function analyzeLMFXMLContent(xmlContent: string): Promise<XMLAnalysisResult> {
  return analyzeLMFXML(xmlContent);
}

/**
 * Generate XSD schema from XML using xml-introspect
 */
export async function generateXSDFromXML(filePathOrContent: string, options?: {
  namespace?: string;
  targetNamespace?: string;
  elementFormDefault?: 'qualified' | 'unqualified';
}): Promise<string> {
  if (!XSDGenerator) {
    throw new Error('xml-introspect XSDGenerator not available');
  }

  const generator = new XSDGenerator();
  
  // Check if we're in a browser environment or if the input looks like XML content
  if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
    // Browser environment or XML content provided directly
    return await generator.generateFromString(filePathOrContent, options);
  } else {
    // Node.js environment with file path
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    return await generator.generateFromFile(filePathOrContent, options);
  }
}

/**
 * Generate sample XML from input using xml-introspect
 */
export async function generateSampleXML(filePathOrContent: string, options?: {
  maxElements?: number;
  maxDepth?: number;
  includeAttributes?: boolean;
  includeText?: boolean;
}): Promise<string> {
  if (!SampleGenerator) {
    throw new Error('xml-introspect SampleGenerator not available');
  }

  const generator = new SampleGenerator();
  
  // Check if we're in a browser environment or if the input looks like XML content
  if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
    // Browser environment or XML content provided directly
    return await generator.generateFromString(filePathOrContent, options);
  } else {
    // Node.js environment with file path
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    return await generator.generateFromFile(filePathOrContent, options);
  }
}

/**
 * Generate realistic XML using Faker with xml-introspect
 */
export async function generateRealisticXML(filePathOrContent: string, options?: {
  count?: number;
  locale?: string;
  seed?: number;
  preserveStructure?: boolean;
}): Promise<string> {
  if (!XMLFakerGenerator) {
    throw new Error('xml-introspect XMLFakerGenerator not available');
  }

  const generator = new XMLFakerGenerator();
  
  // Check if we're in a browser environment or if the input looks like XML content
  if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
    // Browser environment or XML content provided directly
    return await generator.generateFromString(filePathOrContent, options);
  } else {
    // Node.js environment with file path
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    return await generator.generateFromFile(filePathOrContent, options);
  }
}

/**
 * Validate XML against XSD schema using xml-introspect
 */
export async function validateXMLAgainstXSD(xmlPathOrContent: string, xsdPathOrContent: string): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  if (!XMLValidator) {
    throw new Error('xml-introspect XMLValidator not available');
  }

  const validator = new XMLValidator();
  
  // Check if we're in a browser environment or if the input looks like XML content
  const isBrowser = (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || 
                   xmlPathOrContent.trim().startsWith('<');
  
  if (isBrowser) {
    // Browser environment or XML content provided directly
    return await validator.validateString(xmlPathOrContent, xsdPathOrContent);
  } else {
    // Node.js environment with file paths
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    return await validator.validateFiles(xmlPathOrContent, xsdPathOrContent);
  }
}

/**
 * Enhanced XML analysis using full xml-introspect capabilities
 * This provides more comprehensive analysis than the basic regex-based approach
 */
export async function analyzeLMFXMLEnhanced(filePathOrContent: string): Promise<XMLAnalysisResult> {
  if (!XMLIntrospector && !XMLAnalyzer) {
    // Fall back to basic analysis if xml-introspect is not available
    return analyzeLMFXML(filePathOrContent);
  }

  try {
    let xmlContent: string;
    
    // Check if we're in a browser environment or if the input looks like XML content
    if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
      // Browser environment or XML content provided directly
      xmlContent = filePathOrContent;
    } else {
      // Node.js environment with file path
      if (!readFile) {
        throw new Error('File reading not available in browser environment. Please provide XML content directly.');
      }
      xmlContent = await readFile(filePathOrContent, 'utf-8');
    }
    
    // Use XMLIntrospector for comprehensive analysis if available
    if (XMLIntrospector) {
      try {
        const introspector = new XMLIntrospector();
        const structure = await introspector.analyzeStructureFromString(xmlContent);
        
        // Convert to our format with enhanced data from xml-introspect
        const result = convertXMLIntrospectStructure(structure, xmlContent);
        return result;
      } catch (error) {
        console.warn('XMLIntrospector failed, trying XMLAnalyzer:', error);
      }
    }
    
    // Fallback to XMLAnalyzer if available
    if (XMLAnalyzer) {
      const analyzer = new XMLAnalyzer();
      const analysis = await analyzer.analyzeString(xmlContent);
      return convertXMLIntrospectAnalysis(analysis, xmlContent);
    }
    
    // Final fallback to regex-based analysis
    return analyzeLMFXMLWithRegex(xmlContent, filePathOrContent);
    
  } catch (error) {
    // If enhanced analysis fails, fall back to basic analysis
    console.warn('Enhanced analysis failed, falling back to basic analysis:', error);
    return analyzeLMFXML(filePathOrContent);
  }
}

/**
 * Convert XMLIntrospector structure analysis to our XMLAnalysisResult format
 */
function convertXMLIntrospectStructure(structure: any, xmlContent: string): XMLAnalysisResult {
  // Extract WordNet-specific analysis from the general XML analysis
  const iliAnalysis = analyzeILICoverage(xmlContent);
  const posDistribution = analyzePartOfSpeechDistribution(xmlContent);
  const sizeDistribution = analyzeSynsetSizeDistribution(xmlContent);
  
  // Use xml-introspect data where available, fallback to regex for WordNet-specific elements
  const synsetMatches = xmlContent.match(/<Synset[^>]*>/g) || [];
  const wordMatches = xmlContent.match(/<LexicalEntry[^>]*>/g) || [];
  const senseMatches = xmlContent.match(/<Sense[^>]*>/g) || [];
  const lexiconMatches = xmlContent.match(/<Lexicon[^>]*>/g) || [];
  
  const totalSynsets = synsetMatches.length;
  const synsetsWithILI = iliAnalysis.validILIs.length;
  const synsetsWithEmptyILI = iliAnalysis.emptyILIs.length;
  const synsetsWithoutILI = iliAnalysis.missingILIs.length;
  const iliCoveragePercentage = totalSynsets > 0 ? (synsetsWithILI / totalSynsets) * 100 : 0;
  
  // Check for metadata elements
  const hasGlobalInformation = xmlContent.includes('<GlobalInformation>');
  const hasLexiconMetadata = xmlContent.includes('dc:subject') || xmlContent.includes('dc:creator');
  
  // Extract LMF version information using shared utilities
  const lmfVersion = extractLMFVersion(xmlContent);
  const dtdVersion = extractDTDVersion(xmlContent);
  
  const result: XMLAnalysisResult = {
    totalSynsets,
    synsetsWithILI,
    synsetsWithEmptyILI,
    synsetsWithoutILI,
    iliCoveragePercentage,
    uniqueILIs: iliAnalysis.validILIs,
    iliDistribution: countOccurrences(iliAnalysis.validILIs),
    partOfSpeechDistribution: posDistribution,
    synsetSizeDistribution: sizeDistribution,
    totalWords: wordMatches.length,
    totalSenses: senseMatches.length,
    totalLexicons: lexiconMatches.length,
    hasGlobalInformation,
    hasLexiconMetadata,
    schemaValidation: {
      isValid: structure?.isValid || true,
      errors: structure?.errors || [],
      warnings: structure?.warnings || []
    }
  };
  
  // Only add optional properties if they have values
  if (lmfVersion !== undefined) {
    result.lmfVersion = lmfVersion;
  }
  if (dtdVersion !== undefined) {
    result.dtdVersion = dtdVersion;
  }
  
  return result;
}

/**
 * Comprehensive XML analysis using all available xml-introspect capabilities
 * This is the most feature-rich analysis function
 */
export async function analyzeLMFXMLComprehensive(filePathOrContent: string): Promise<{
  analysis: XMLAnalysisResult;
  xsdSchema?: string;
  sampleXML?: string;
  realisticXML?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}> {
  let xmlContent: string;
  
  // Check if we're in a browser environment or if the input looks like XML content
  if ((typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') || filePathOrContent.trim().startsWith('<')) {
    // Browser environment or XML content provided directly
    xmlContent = filePathOrContent;
  } else {
    // Node.js environment with file path
    if (!readFile) {
      throw new Error('File reading not available in browser environment. Please provide XML content directly.');
    }
    xmlContent = await readFile(filePathOrContent, 'utf-8');
  }
  
  // Perform comprehensive analysis
  const analysis = await analyzeLMFXMLEnhanced(xmlContent);
  
  const result: any = { analysis };
  
  // Generate XSD schema if available
  if (XSDGenerator) {
    try {
      const generator = new XSDGenerator();
      result.xsdSchema = await generator.generateFromString(xmlContent, {
        targetNamespace: 'http://globalwordnet.org/ns/wn-lmf/1.4',
        elementFormDefault: 'qualified'
      });
    } catch (error) {
      console.warn('XSD generation failed:', error);
    }
  }
  
  // Generate sample XML if available
  if (SampleGenerator) {
    try {
      const generator = new SampleGenerator();
      result.sampleXML = await generator.generateFromString(xmlContent, {
        maxElements: 100,
        maxDepth: 5,
        includeAttributes: true,
        includeText: true
      });
    } catch (error) {
      console.warn('Sample generation failed:', error);
    }
  }
  
  // Generate realistic XML if available
  if (XMLFakerGenerator) {
    try {
      const generator = new XMLFakerGenerator();
      result.realisticXML = await generator.generateFromString(xmlContent, {
        count: 50,
        locale: 'en',
        preserveStructure: true
      });
    } catch (error) {
      console.warn('Realistic XML generation failed:', error);
    }
  }
  
  // Validate against generated schema if available
  if (result.xsdSchema && XMLValidator) {
    try {
      const validator = new XMLValidator();
      result.validation = await validator.validateString(xmlContent, result.xsdSchema);
    } catch (error) {
      console.warn('Schema validation failed:', error);
    }
  }
  
  return result;
}

/**
 * Use xml-introspect library for advanced schema validation
 */
async function validateWithXMLIntrospect(filePathOrContent: string, xmlContent?: string) {
  if (!XMLIntrospector && !StreamingXMLIntrospector) {
    throw new Error('xml-introspect library not available');
  }
  
  try {
    // Try to use the main XMLIntrospector class first (full features)
    if (XMLIntrospector) {
      const introspector = new XMLIntrospector();
      
      // Check if we have XML content directly or need to read from file
      let structure;
      if (xmlContent) {
        // Use XML content directly (browser environment)
        structure = await introspector.analyzeStructureFromString(xmlContent);
      } else {
        // Use file path (Node.js environment)
        structure = await introspector.analyzeStructure(filePathOrContent);
      }
      
      return {
        isValid: true,
        errors: [],
        warnings: structure ? [] : ['Structure analysis incomplete']
      };
    }
    
    // Fall back to StreamingXMLIntrospector for compatibility
    if (StreamingXMLIntrospector) {
      const introspector = new StreamingXMLIntrospector();
      
      let result;
      if (xmlContent) {
        // Use XML content directly (browser environment)
        result = await introspector.introspectFromString(xmlContent);
      } else {
        // Use file path (Node.js environment)
        result = await introspector.introspect(filePathOrContent);
      }
      
      return {
        isValid: true,
        errors: [],
        warnings: result.warnings || []
      };
    }
    
    throw new Error('No xml-introspect implementation available');
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: []
    };
  }
}

/**
 * Analyze ILI coverage in the XML content
 */
function analyzeILICoverage(xmlContent: string): ILIAnalysis {
  const synsetRegex = /<Synset[^>]*>/g;
  const iliRegex = /ili="([^"]*)"/;
  
  const validILIs: string[] = [];
  const emptyILIs: string[] = [];
  const missingILIs: string[] = [];
  const duplicateILIs: string[] = [];
  const validFormat: string[] = [];
  const invalidFormat: string[] = [];
  
  let match;
  while ((match = synsetRegex.exec(xmlContent)) !== null) {
    const iliMatch = match[0].match(iliRegex);
    
    if (iliMatch) {
      const iliValue = iliMatch[1];
      
      if (iliValue === '') {
        emptyILIs.push(iliValue);
      } else if (iliValue && isValidILIFormat(iliValue)) {
        validILIs.push(iliValue);
        validFormat.push(iliValue);
      } else if (iliValue) {
        validILIs.push(iliValue); // Still count as present
        invalidFormat.push(iliValue);
      }
    } else {
      missingILIs.push('missing');
    }
  }
  
  // Find duplicate ILIs
  const iliCounts = countOccurrences(validILIs);
  if (iliCounts && Object.keys(iliCounts).length > 0) {
    duplicateILIs.push(...Object.keys(iliCounts).filter(ili => (iliCounts[ili] ?? 0) > 1));
  }
  
  return {
    validILIs,
    emptyILIs,
    missingILIs,
    duplicateILIs,
    iliFormatValidation: {
      valid: validFormat,
      invalid: invalidFormat
    }
  };
}

/**
 * Validate ILI format (should start with 'i' followed by numbers)
 */
function isValidILIFormat(ili: string): boolean {
  return /^i\d+$/.test(ili);
}

/**
 * Analyze part of speech distribution
 */
function analyzePartOfSpeechDistribution(xmlContent: string): Record<string, number> {
  const posRegex = /partOfSpeech="([^"]*)"/g;
  const posCounts: Record<string, number> = {};
  
  let match;
  while ((match = posRegex.exec(xmlContent)) !== null) {
    const pos = match[1];
    if (pos) {
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    }
  }
  
  return posCounts;
}

/**
 * Analyze synset size distribution (number of members)
 */
function analyzeSynsetSizeDistribution(xmlContent: string): Record<number, number> {
  const membersRegex = /members="([^"]*)"/g;
  const sizeCounts: Record<number, number> = {};
  
  let match;
  while ((match = membersRegex.exec(xmlContent)) !== null) {
    const members = match[1];
    if (members) {
      const size = members.split(/\s+/).length;
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    }
  }
  
  return sizeCounts;
}


/**
 * Count occurrences of items in an array
 */
function countOccurrences<T>(items: T[]): Record<string, number> {
  return items.reduce((counts, item) => {
    const key = String(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Generate a comprehensive report from XML analysis
 */
export function generateXMLReport(analysis: XMLAnalysisResult): string {
  const report = [
    '=== LMF XML Analysis Report ===',
    '',
    `Total Synsets: ${analysis.totalSynsets}`,
    `Total Words: ${analysis.totalWords}`,
    `Total Senses: ${analysis.totalSenses}`,
    `Total Lexicons: ${analysis.totalLexicons}`,
    '',
    '=== ILI Coverage ===',
    `Synsets with ILI: ${analysis.synsetsWithILI}`,
    `Synsets with empty ILI: ${analysis.synsetsWithEmptyILI}`,
    `Synsets without ILI: ${analysis.synsetsWithoutILI}`,
    `ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`,
    '',
    '=== Part of Speech Distribution ===',
    ...Object.entries(analysis.partOfSpeechDistribution).map(([pos, count]) => 
      `  ${pos}: ${count}`
    ),
    '',
    '=== Synset Size Distribution ===',
    ...Object.entries(analysis.synsetSizeDistribution).map(([size, count]) => 
      `  ${size} members: ${count} synsets`
    ),
    '',
    '=== Metadata ===',
    `Global Information: ${analysis.hasGlobalInformation ? 'Yes' : 'No'}`,
    `Lexicon Metadata: ${analysis.hasLexiconMetadata ? 'Yes' : 'No'}`,
    `LMF Version: ${analysis.lmfVersion || 'Unknown'}`,
    `DTD Version: ${analysis.dtdVersion || 'Unknown'}`,
    '',
    '=== Schema Validation ===',
    `Valid: ${analysis.schemaValidation?.isValid ? 'Yes' : 'No'}`,
    ...(analysis.schemaValidation?.errors || []).map(error => `  Error: ${error}`),
    ...(analysis.schemaValidation?.warnings || []).map(warning => `  Warning: ${warning}`),
    '',
    '=== Unique ILIs ===',
    `Total unique ILIs: ${analysis.uniqueILIs.length}`,
    ...analysis.uniqueILIs.slice(0, 10).map(ili => `  ${ili}`),
    analysis.uniqueILIs.length > 10 ? `  ... and ${analysis.uniqueILIs.length - 10} more` : ''
  ].join('\n');
  
  return report;
}

/**
 * Validate XML structure against expected LMF elements
 */
export function validateLMFStructure(xmlContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for required root element
  if (!xmlContent.includes('<LexicalResource')) {
    errors.push('Missing <LexicalResource> root element');
  }
  
  // Check for at least one lexicon
  if (!xmlContent.includes('<Lexicon')) {
    errors.push('Missing <Lexicon> elements');
  }
  
  // Check for DOCTYPE declaration
  if (!xmlContent.includes('<!DOCTYPE')) {
    warnings.push('Missing DOCTYPE declaration');
  }
  
  // Check for XML declaration
  if (!xmlContent.includes('<?xml')) {
    warnings.push('Missing XML declaration');
  }
  
  // Check for namespace declarations
  if (!xmlContent.includes('xmlns:dc=')) {
    warnings.push('Missing Dublin Core namespace declaration');
  }
  
  // Check for basic structure elements
  const requiredElements = ['<LexicalEntry', '<Lemma', '<Sense', '<Synset'];
  requiredElements.forEach(element => {
    if (!xmlContent.includes(element)) {
      warnings.push(`Missing ${element} elements`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
