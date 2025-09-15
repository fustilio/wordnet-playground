#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { 
  parseWordNetIndex, 
  analyzeAllWordNetUrls, 
  categorizeWordNetUrls,
  type WordNetArchiveInfo 
} from '../src/utils/wordnet-analyzer.js';

/**
 * Script to analyze all WordNet URLs from index.toml using xml-introspect
 * This helps understand the structure of different WordNet archives
 */

async function main() {
  console.log('🔍 Analyzing WordNet URLs from index.toml...\n');
  
  // Read the index.toml file
  const indexPath = join(process.cwd(), 'src', 'index.toml');
  const tomlContent = readFileSync(indexPath, 'utf-8');
  
  // Parse the TOML content
  const entries = parseWordNetIndex(tomlContent);
  console.log(`📊 Found ${entries.length} WordNet entries\n`);
  
  // Categorize URLs by expected structure
  const categories = categorizeWordNetUrls(entries);
  console.log('📋 URL Categories:');
  console.log(`  Single XML: ${categories.singleXml.length} URLs`);
  console.log(`  Multi-language: ${categories.multiLanguage.length} URLs`);
  console.log(`  Language-specific: ${categories.languageSpecific.length} URLs`);
  console.log(`  Unknown: ${categories.unknown.length} URLs\n`);
  
  // Analyze all URLs
  const analysisResults = await analyzeAllWordNetUrls(entries);
  
  // Generate summary report
  const summary = generateSummaryReport(analysisResults);
  console.log('\n📈 Analysis Summary:');
  console.log(summary);
  
  // Generate detailed report
  const detailedReport = generateDetailedReport(analysisResults);
  const reportPath = join(process.cwd(), 'wordnet-analysis-report.json');
  writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Generate recommendations
  const recommendations = generateRecommendations(analysisResults);
  console.log('\n💡 Recommendations:');
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
}

function generateSummaryReport(results: WordNetArchiveInfo[]): string {
  const typeCounts = results.reduce((acc, result) => {
    acc[result.type] = (acc[result.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalXmlFiles = results.reduce((sum, result) => sum + result.xmlFiles.length, 0);
  const totalLanguages = new Set(results.flatMap(result => result.languages)).size;
  const avgCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length;
  
  return `
  Archive Types:
    Single XML: ${typeCounts['single-xml'] || 0}
    Multi-language: ${typeCounts['multi-language'] || 0}
    Language-specific: ${typeCounts['language-specific'] || 0}
    Unknown: ${typeCounts['unknown'] || 0}
  
  Content Statistics:
    Total XML files: ${totalXmlFiles}
    Unique languages: ${totalLanguages}
    Average compression ratio: ${avgCompressionRatio.toFixed(2)}x
  
  Size Statistics:
    Total compressed size: ${formatBytes(results.reduce((sum, result) => sum + result.compressedSize, 0))}
    Total uncompressed size: ${formatBytes(results.reduce((sum, result) => sum + result.totalSize, 0))}`;
}

function generateDetailedReport(results: WordNetArchiveInfo[]): any {
  return {
    timestamp: new Date().toISOString(),
    totalArchives: results.length,
    summary: {
      byType: results.reduce((acc, result) => {
        acc[result.type] = (acc[result.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalXmlFiles: results.reduce((sum, result) => sum + result.xmlFiles.length, 0),
      uniqueLanguages: [...new Set(results.flatMap(result => result.languages))],
      totalCompressedSize: results.reduce((sum, result) => sum + result.compressedSize, 0),
      totalUncompressedSize: results.reduce((sum, result) => sum + result.totalSize, 0)
    },
    archives: results.map(result => ({
      url: result.url,
      type: result.type,
      languages: result.languages,
      xmlFiles: result.xmlFiles,
      size: {
        compressed: result.compressedSize,
        uncompressed: result.totalSize,
        compressionRatio: result.compressionRatio
      },
      structure: result.structure
    }))
  };
}

function generateRecommendations(results: WordNetArchiveInfo[]): string[] {
  const recommendations: string[] = [];
  
  // Check for unknown types
  const unknownCount = results.filter(r => r.type === 'unknown').length;
  if (unknownCount > 0) {
    recommendations.push(`Investigate ${unknownCount} archives with unknown structure`);
  }
  
  // Check for multi-language archives
  const multiLangCount = results.filter(r => r.type === 'multi-language').length;
  if (multiLangCount > 0) {
    recommendations.push(`Handle ${multiLangCount} multi-language archives with proper language detection`);
  }
  
  // Check for compression efficiency
  const lowCompression = results.filter(r => r.compressionRatio < 2).length;
  if (lowCompression > 0) {
    recommendations.push(`Consider recompressing ${lowCompression} archives with low compression ratios`);
  }
  
  // Check for large archives
  const largeArchives = results.filter(r => r.compressedSize > 100 * 1024 * 1024).length; // 100MB
  if (largeArchives > 0) {
    recommendations.push(`Implement streaming for ${largeArchives} large archives (>100MB)`);
  }
  
  // Check for single XML files
  const singleXmlCount = results.filter(r => r.type === 'single-xml').length;
  if (singleXmlCount > 0) {
    recommendations.push(`Optimize loading for ${singleXmlCount} single-XML archives`);
  }
  
  return recommendations;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the analysis
main().catch(console.error);
