import { exec } from 'child_process';
import { promisify } from 'util';
import { parse } from 'smol-toml';
import { isCompressedURL, getURLExtension } from './url.js';

const execAsync = promisify(exec);

export interface WordNetArchiveInfo {
  url: string;
  type: 'single-xml' | 'multi-language' | 'language-specific' | 'unknown';
  languages: string[];
  xmlFiles: string[];
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  structure: {
    hasRootXml: boolean;
    hasLanguageDirectories: boolean;
    xmlFileCount: number;
    languageCount: number;
  };
}

export interface WordNetIndexEntry {
  id: string;
  label: string;
  language: string;
  license: string;
  versions: Record<string, {
    url?: string;
    error?: string;
  }>;
}

/**
 * Analyze a WordNet archive URL to determine its structure and contents
 */
export async function analyzeWordNetArchive(url: string): Promise<WordNetArchiveInfo> {
  const extension = getURLExtension(url);
  const isCompressed = isCompressedURL(url);
  
  if (!isCompressed) {
    return {
      url,
      type: 'unknown',
      languages: [],
      xmlFiles: [],
      totalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      structure: {
        hasRootXml: false,
        hasLanguageDirectories: false,
        xmlFileCount: 0,
        languageCount: 0
      }
    };
  }

  try {
    // Use xml-introspect to analyze the compressed archive
    const { stdout } = await execAsync(`xml-introspect preview "${url}"`);
    const analysis = JSON.parse(stdout);
    
    return analyzeArchiveStructure(url, analysis);
  } catch (error) {
    console.warn(`Failed to analyze archive ${url}:`, error);
    return {
      url,
      type: 'unknown',
      languages: [],
      xmlFiles: [],
      totalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      structure: {
        hasRootXml: false,
        hasLanguageDirectories: false,
        xmlFileCount: 0,
        languageCount: 0
      }
    };
  }
}

/**
 * Analyze the structure of a WordNet archive based on xml-introspect output
 */
function analyzeArchiveStructure(url: string, analysis: any): WordNetArchiveInfo {
  const xmlFiles = findXmlFiles(analysis);
  const languages = extractLanguages(xmlFiles);
  
  // Determine archive type based on structure
  let type: WordNetArchiveInfo['type'] = 'unknown';
  
  if (xmlFiles.length === 1) {
    type = 'single-xml';
  } else if (languages.length > 1) {
    type = 'multi-language';
  } else if (languages.length === 1) {
    type = 'language-specific';
  }
  
  const totalSize = analysis.totalSize || 0;
  const compressedSize = analysis.compressedSize || 0;
  const compressionRatio = compressedSize > 0 ? totalSize / compressedSize : 0;
  
  return {
    url,
    type,
    languages,
    xmlFiles,
    totalSize,
    compressedSize,
    compressionRatio,
    structure: {
      hasRootXml: xmlFiles.some(file => !file.includes('/')),
      hasLanguageDirectories: languages.length > 1,
      xmlFileCount: xmlFiles.length,
      languageCount: languages.length
    }
  };
}

/**
 * Recursively find all XML files in the archive structure
 */
function findXmlFiles(analysis: any, path: string = ''): string[] {
  const xmlFiles: string[] = [];
  
  if (analysis.files) {
    for (const file of analysis.files) {
      const fullPath = path ? `${path}/${file.name}` : file.name;
      if (file.name.endsWith('.xml')) {
        xmlFiles.push(fullPath);
      }
      if (file.files) {
        xmlFiles.push(...findXmlFiles(file, fullPath));
      }
    }
  }
  
  return xmlFiles;
}

/**
 * Extract language codes from XML file paths
 */
function extractLanguages(xmlFiles: string[]): string[] {
  const languages = new Set<string>();
  
  for (const file of xmlFiles) {
    // Look for language codes in the path
    const languageMatch = file.match(/([a-z]{2,3})(?:-[A-Z]{2})?\.xml$/i);
    if (languageMatch) {
      languages.add(languageMatch[1].toLowerCase());
    }
    
    // Also check for common language patterns
    const commonLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'et', 'lv', 'lt', 'el', 'tr', 'he', 'ar', 'fa', 'ur', 'hi', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or', 'as', 'ne', 'si', 'my', 'th', 'lo', 'km', 'vi', 'id', 'ms', 'tl', 'zh', 'ja', 'ko', 'ru', 'uk', 'be', 'ka', 'hy', 'az', 'kk', 'ky', 'uz', 'tg', 'mn', 'bo', 'dz', 'ne', 'si', 'my', 'th', 'lo', 'km', 'vi', 'id', 'ms', 'tl', 'zh', 'ja', 'ko'];
    
    for (const lang of commonLanguages) {
      if (file.toLowerCase().includes(`-${lang}.`) || file.toLowerCase().includes(`_${lang}.`)) {
        languages.add(lang);
      }
    }
  }
  
  return Array.from(languages);
}

/**
 * Parse the WordNet index TOML file using smol-toml
 */
export function parseWordNetIndex(tomlContent: string): WordNetIndexEntry[] {
  const parsed = parse(tomlContent) as Record<string, any>;
  const entries: WordNetIndexEntry[] = [];
  
  for (const [id, data] of Object.entries(parsed)) {
    if (typeof data !== 'object' || data === null) continue;
    
    const entry: WordNetIndexEntry = {
      id,
      label: data.label || '',
      language: data.language || '',
      license: data.license || '',
      versions: {}
    };
    
    // Extract versions
    if (data.versions && typeof data.versions === 'object') {
      for (const [version, versionData] of Object.entries(data.versions)) {
        if (typeof versionData === 'object' && versionData !== null) {
          const versionInfo: { url?: string; error?: string } = {};
          
          if (typeof versionData.url === 'string') {
            versionInfo.url = versionData.url;
          }
          if (typeof versionData.error === 'string') {
            versionInfo.error = versionData.error;
          }
          
          entry.versions[version] = versionInfo;
        }
      }
    }
    
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Get all available WordNet URLs from the index
 */
export function getWordNetUrls(entries: WordNetIndexEntry[]): string[] {
  const urls: string[] = [];
  
  for (const entry of entries) {
    for (const version of Object.values(entry.versions)) {
      if (version.url && !version.error) {
        urls.push(version.url);
      }
    }
  }
  
  return urls;
}

/**
 * Categorize WordNet URLs by their expected structure
 */
export function categorizeWordNetUrls(entries: WordNetIndexEntry[]): {
  singleXml: string[];
  multiLanguage: string[];
  languageSpecific: string[];
  unknown: string[];
} {
  const categories = {
    singleXml: [] as string[],
    multiLanguage: [] as string[],
    languageSpecific: [] as string[],
    unknown: [] as string[]
  };
  
  for (const entry of entries) {
    for (const version of Object.values(entry.versions)) {
      if (version.url && !version.error) {
        // Categorize based on entry ID patterns
        if (entry.id === 'oewn') {
          categories.singleXml.push(version.url);
        } else if (entry.id === 'omw') {
          categories.multiLanguage.push(version.url);
        } else if (entry.id.startsWith('omw-')) {
          categories.languageSpecific.push(version.url);
        } else {
          categories.unknown.push(version.url);
        }
      }
    }
  }
  
  return categories;
}

/**
 * Analyze all WordNet URLs in the index
 */
export async function analyzeAllWordNetUrls(entries: WordNetIndexEntry[]): Promise<WordNetArchiveInfo[]> {
  const urls = getWordNetUrls(entries);
  const results: WordNetArchiveInfo[] = [];
  
  console.log(`Analyzing ${urls.length} WordNet URLs...`);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Analyzing: ${url}`);
    
    try {
      const info = await analyzeWordNetArchive(url);
      results.push(info);
      console.log(`  Type: ${info.type}, Languages: ${info.languages.join(', ')}, XML Files: ${info.xmlFiles.length}`);
    } catch (error) {
      console.error(`  Error analyzing ${url}:`, error);
      results.push({
        url,
        type: 'unknown',
        languages: [],
        xmlFiles: [],
        totalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        structure: {
          hasRootXml: false,
          hasLanguageDirectories: false,
          xmlFileCount: 0,
          languageCount: 0
        }
      });
    }
  }
  
  return results;
}
