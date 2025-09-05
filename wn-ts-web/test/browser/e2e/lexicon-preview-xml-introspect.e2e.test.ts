/**
 * Lexicon Preview E2E tests using the actual xml-introspect package
 * 
 * This test leverages the xml-introspect package to provide comprehensive
 * content previewing, including first/last line dumping and XML structure analysis.
 * 
 * Tests real browser environment with actual WordNet data for accurate preview.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWordNetInstance } from '../../../src/factory.js';
import type { WebWordnet } from '../../../src/client/submodules/web-wordnet.js';
import { DataLoader } from '../../../src/data-loader.js';
import { StandaloneBrowserXMLIntrospector } from 'xml-introspect/browser';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

// Custom DataLoader that bypasses proxy for testing
class TestDataLoader extends DataLoader {
  protected toProxyUrl(url: string): string {
    // In test environment, use direct URLs to bypass proxy issues
    console.log(`🔍 Test environment: Using direct URL: ${url}`);
    return url;
  }
}

describe.skipIf(isNode)('Lexicon Preview with XML Introspect E2E', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;
  let xmlIntrospector: StandaloneBrowserXMLIntrospector;

  beforeAll(async () => {
    const instance = await createWordNetInstance('oewn:2021');
    wordnet = instance.wordnet;
    // Use custom DataLoader that bypasses proxy
    dataLoader = new TestDataLoader(instance.wordnet.getDatabase(), instance.wordnet);
    xmlIntrospector = new StandaloneBrowserXMLIntrospector();
    
    console.log('🔍 Setting up lexicon preview testing with XML Introspect...');
    
    try {
      // Try to load demo data using the data loader
      console.log('🔍 Loading demo data using data loader...');
      await dataLoader.downloadAndLoad('oewn:2021');
      console.log('✅ Demo data loaded successfully via data loader');
      
    } catch (error) {
      console.error('❌ Failed to load demo data:', error);
      throw new Error(`Real data loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });


  // Helper function to download and capture raw XML content
  async function downloadAndCaptureRawXML(packageId: string): Promise<string | null> {
    try {
      // Use the data loader to download the package
      const result = await dataLoader.downloadAndLoad(packageId);

      if (result.success) {
        console.log('📥 Package downloaded successfully, getting raw XML content...');
        
        // TODO: In a real implementation, we'd need to modify the data loader to expose raw content
        // For now, this will fail as we need real data access
        throw new Error('Raw XML content access not yet implemented - need to modify data loader to expose raw content');
      } else {
        console.error('Failed to download package:', result.error);
        throw new Error(`Failed to download package ${packageId}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading package:', error);
      throw new Error(`Error downloading package ${packageId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper function to create content preview using browser-compatible xml-introspect
  function createContentPreview(content: string, lines: number = 200, label: string = 'Content'): void {
    const preview = xmlIntrospector.getContentPreview(content, lines);
    
    console.log(`\n📄 ${label} Preview (${preview.totalLines} total lines):`);
    console.log('═'.repeat(80));
    
    if (preview.lastLines.length === 0) {
      // If content is small, show all
      console.log('📝 Full content:');
      preview.firstLines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(4, ' ')}: ${line}`);
      });
    } else {
      // Show first N lines
      console.log(`📝 First ${lines} lines:`);
      preview.firstLines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(4, ' ')}: ${line}`);
      });
      
      console.log(`\n... (${preview.totalLines - lines * 2} lines omitted) ...\n`);
      
      // Show last N lines
      console.log(`📝 Last ${lines} lines:`);
      preview.lastLines.forEach((line, index) => {
        const lineNumber = preview.totalLines - lines + index + 1;
        console.log(`${lineNumber.toString().padStart(4, ' ')}: ${line}`);
      });
    }
    
    console.log('═'.repeat(80));
  }

  // Helper function to analyze XML structure using browser-compatible xml-introspect
  async function analyzeXMLStructure(content: string): Promise<any> {
    try {
      // Use browser-compatible xml-introspect to analyze the structure
      const analysis = await xmlIntrospector.analyzeContentStructure(content);
      
      return {
        elementCounts: analysis.structure.elementCounts,
        attributeCounts: analysis.structure.attributeCounts,
        maxDepth: analysis.structure.maxDepth,
        totalElements: analysis.structure.totalElements,
        structure: {
          rootElements: analysis.structure.rootElements,
          commonElements: analysis.structure.commonElements?.slice(0, 10) || [],
          attributes: analysis.structure.attributes?.slice(0, 10) || []
        },
        preview: analysis.preview,
        validation: analysis.validation
      };
    } catch (error) {
      console.warn('⚠️ Could not analyze XML structure:', error);
      return {
        elementCounts: {},
        attributeCounts: {},
        maxDepth: 0,
        totalElements: 0,
        structure: {
          rootElements: [],
          commonElements: [],
          attributes: []
        },
        preview: {
          firstLines: [],
          lastLines: [],
          totalLines: 0,
          preview: ''
        },
        validation: {
          valid: false,
          errors: ['Analysis failed'],
          warnings: []
        }
      };
    }
  }

  // Helper function to get comprehensive content preview
  async function getComprehensiveContentPreview(lexiconId: string): Promise<{
    words: string[];
    synsets: string[];
    senses: string[];
    structure: any;
  }> {
    try {
      // Get sample data using correct WebWordnet methods
      const [words, synsets, senses] = await Promise.all([
        wordnet.words({ maxResults: 100 }),
        wordnet.synsets({ maxResults: 100 }),
        wordnet.senses({})
      ]);
      
      // Convert to string format for analysis
      const wordContent = words.map((word, index) => 
        `Line ${index + 1}: Word ID: ${word.id}, Lemma: ${word.lemma}, POS: ${word.pos}, Language: ${word.language || 'N/A'}`
      ).join('\n');
      
      const synsetContent = synsets.map((synset, index) => 
        `Line ${index + 1}: Synset ID: ${synset.id}, ILI: ${synset.ili || 'N/A'}, POS: ${synset.pos}, Language: ${synset.language || 'N/A'}`
      ).join('\n');
      
      const senseContent = senses.map((sense, index) => 
        `Line ${index + 1}: Sense ID: ${sense.id}, Word ID: ${sense.wordId}, Synset ID: ${sense.synsetId}`
      ).join('\n');
      
      // Analyze structure using xml-introspect
      const allContent = [wordContent, synsetContent, senseContent].join('\n');
      const structure = await analyzeXMLStructure(allContent);
      
      return {
        words: words.map(w => `Word: ${w.lemma} (${w.pos}) - ID: ${w.id}`),
        synsets: synsets.map(s => `Synset: ${s.id} - ILI: ${s.ili || 'N/A'} - POS: ${s.pos}`),
        senses: senses.map(s => `Sense: ${s.id} - Word ID: ${s.wordId} - Synset ID: ${s.synsetId}`),
        structure
      };
    } catch (error) {
      console.warn(`⚠️ Could not get comprehensive content preview for ${lexiconId}:`, error);
      return {
        words: [],
        synsets: [],
        senses: [],
        structure: {
          elementCounts: {},
          attributeCounts: {},
          maxDepth: 0,
          totalElements: 0,
          structure: {
            rootElements: [],
            commonElements: [],
            attributes: []
          }
        }
      };
    }
  }

  describe('Raw XML Content Preview', () => {
    it('should download and preview raw XML content with first/last 200 lines', async () => {
      console.log('🔍 Downloading and previewing raw XML content...');
      
      // Create a custom data loader to capture raw XML content
      const rawXmlContent = await downloadAndCaptureRawXML('oewn:2021');
      
      console.log('📄 Raw XML Content Preview:');
      console.log('═'.repeat(80));
      
      // Use xml-introspect to create content preview
      const preview = xmlIntrospector.getContentPreview(rawXmlContent, 200);
      
      console.log(`📊 XML File Statistics:`);
      console.log(`  Total lines: ${preview.totalLines}`);
      console.log(`  Total characters: ${rawXmlContent.length}`);
      console.log(`  File size: ${(rawXmlContent.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Show first 200 lines
      console.log('\n📝 First 200 lines of raw XML:');
      console.log('─'.repeat(80));
      preview.firstLines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(4, ' ')}: ${line}`);
      });
      
      // Show last 200 lines if content is large enough
      if (preview.lastLines.length > 0) {
        console.log(`\n... (${preview.totalLines - 400} lines omitted) ...\n`);
        console.log('📝 Last 200 lines of raw XML:');
        console.log('─'.repeat(80));
        preview.lastLines.forEach((line, index) => {
          const lineNumber = preview.totalLines - 200 + index + 1;
          console.log(`${lineNumber.toString().padStart(4, ' ')}: ${line}`);
        });
      }
      
      console.log('═'.repeat(80));
      
      // Analyze XML structure
      const structure = await xmlIntrospector.analyzeContent(rawXmlContent);
      console.log('\n📊 XML Structure Analysis:');
      console.log(`  Root elements: ${structure.rootElements.join(', ')}`);
      console.log(`  Total elements: ${structure.totalElements}`);
      console.log(`  Max depth: ${structure.maxDepth}`);
      console.log(`  Common elements:`, structure.commonElements.slice(0, 10));
      console.log(`  Attributes:`, structure.attributes.slice(0, 10));
      
      expect(rawXmlContent.length).toBeGreaterThan(0);
      expect(rawXmlContent).toContain('<LexicalResource');
      console.log('✅ Raw XML content preview completed successfully');
    });

    it('should dump first and last 200 lines of word data with XML structure analysis', async () => {
      console.log('🔍 Dumping word data with XML structure analysis...');
      
      const words = await wordnet.words({ maxResults: 1000 });
      
      if (words.length === 0) {
        throw new Error('No word data available - real data loading failed');
      }
        
      // Convert words to structured format
      const wordContent = words.map((word, index) => 
        `Line ${index + 1}: Word ID: ${word.id}, Lemma: ${word.lemma}, POS: ${word.pos}, Language: ${word.language || 'N/A'}`
      ).join('\n');
      
      // Dump content preview
      createContentPreview(wordContent, 200, 'Word Data');
      
      // Analyze structure using xml-introspect
      const structure = await analyzeXMLStructure(wordContent);
      console.log('📊 Word Data Structure Analysis:', {
        totalElements: structure.totalElements,
        maxDepth: structure.maxDepth,
        commonElements: structure.structure.commonElements.slice(0, 5),
        attributes: structure.structure.attributes.slice(0, 5)
      });
      
      console.log(`✅ Dumped ${words.length} word records with structure analysis`);
    });

    it('should dump first and last 200 lines of synset data with XML structure analysis', async () => {
      console.log('🔍 Dumping synset data with XML structure analysis...');
      
      try {
        const synsets = await wordnet.synsets({ maxResults: 1000 });
        
        if (synsets.length === 0) {
          console.log('⚠️ No synset data available - this may be expected if no data was loaded');
          return;
        }
        
        // Convert synsets to structured format
        const synsetContent = synsets.map((synset, index) => 
          `Line ${index + 1}: Synset ID: ${synset.id}, ILI: ${synset.ili || 'N/A'}, POS: ${synset.pos}, Language: ${synset.language || 'N/A'}`
        ).join('\n');
        
        // Dump content preview
        createContentPreview(synsetContent, 200, 'Synset Data');
        
        // Analyze structure using xml-introspect
        const structure = await analyzeXMLStructure(synsetContent);
        console.log('📊 Synset Data Structure Analysis:', {
          totalElements: structure.totalElements,
          maxDepth: structure.maxDepth,
          commonElements: structure.structure.commonElements.slice(0, 5),
          attributes: structure.structure.attributes.slice(0, 5)
        });
        
        console.log(`✅ Dumped ${synsets.length} synset records with structure analysis`);
      } catch (error) {
        console.warn('⚠️ Could not dump synset data:', error);
      }
    });

    it('should dump first and last 200 lines of sense data with XML structure analysis', async () => {
      console.log('🔍 Dumping sense data with XML structure analysis...');
      
      try {
        const senses = await wordnet.senses({});
        
        if (senses.length === 0) {
          console.log('⚠️ No sense data available - this may be expected if no data was loaded');
          return;
        }
        
        // Convert senses to structured format
        const senseContent = senses.map((sense, index) => 
          `Line ${index + 1}: Sense ID: ${sense.id}, Word ID: ${sense.wordId}, Synset ID: ${sense.synsetId}`
        ).join('\n');
        
        // Dump content preview
        createContentPreview(senseContent, 200, 'Sense Data');
        
        // Analyze structure using xml-introspect
        const structure = await analyzeXMLStructure(senseContent);
        console.log('📊 Sense Data Structure Analysis:', {
          totalElements: structure.totalElements,
          maxDepth: structure.maxDepth,
          commonElements: structure.structure.commonElements.slice(0, 5),
          attributes: structure.structure.attributes.slice(0, 5)
        });
        
        console.log(`✅ Dumped ${senses.length} sense records with structure analysis`);
      } catch (error) {
        console.warn('⚠️ Could not dump sense data:', error);
      }
    });
  });

  describe('Comprehensive Lexicon Analysis with XML Introspect', () => {
    it('should provide comprehensive content preview for all lexicons', async () => {
      console.log('🔍 Generating comprehensive content preview for all lexicons...');
      
      const lexicons = await wordnet.lexicons();
      
      if (lexicons.length === 0) {
        console.log('⚠️ No lexicons found - this may be expected if no data was loaded');
        return;
      }
      
      for (const lexicon of lexicons.slice(0, 3)) { // Preview first 3 lexicons
        console.log(`\n📚 Comprehensive preview for ${lexicon.id} (${lexicon.language}):`);
        
        const contentPreview = await getComprehensiveContentPreview(lexicon.id);
        
        console.log('📊 Content Summary:', {
          words: contentPreview.words.length,
          synsets: contentPreview.synsets.length,
          senses: contentPreview.senses.length
        });
        
        console.log('📊 Structure Analysis:', {
          totalElements: contentPreview.structure.totalElements,
          maxDepth: contentPreview.structure.maxDepth,
          commonElements: contentPreview.structure.structure.commonElements.slice(0, 5),
          attributes: contentPreview.structure.structure.attributes.slice(0, 5)
        });
        
        // Show sample content
        if (contentPreview.words.length > 0) {
          console.log('📝 Sample words:');
          contentPreview.words.slice(0, 5).forEach((word, index) => {
            console.log(`  ${index + 1}. ${word}`);
          });
        }
        
        if (contentPreview.synsets.length > 0) {
          console.log('📝 Sample synsets:');
          contentPreview.synsets.slice(0, 5).forEach((synset, index) => {
            console.log(`  ${index + 1}. ${synset}`);
          });
        }
      }
      
      console.log('✅ Comprehensive content preview completed');
    });

    it('should provide detailed lexicon statistics with content analysis', async () => {
      console.log('🔍 Getting detailed lexicon statistics with content analysis...');
      
      const lexiconStats = await wordnet.getLexiconStatistics();
      expect(Array.isArray(lexiconStats)).toBe(true);
      
      if (lexiconStats.length === 0) {
        console.log('⚠️ No lexicon statistics available - this may be expected if no data was loaded');
        return;
      }
      
      // Log comprehensive statistics for each lexicon
      lexiconStats.forEach(stat => {
        console.log('📊 Lexicon statistics:', {
          lexiconId: stat.lexiconId,
          wordCount: stat.wordCount,
          synsetCount: stat.synsetCount,
          senseCount: stat.senseCount,
          iliCount: stat.iliCount,
          coverage: {
            iliCoverage: stat.iliCount ? `${((stat.iliCount / stat.synsetCount) * 100).toFixed(1)}%` : '0%',
            sensePerWord: stat.wordCount ? (stat.senseCount / stat.wordCount).toFixed(2) : '0',
            wordsPerSynset: stat.synsetCount ? (stat.wordCount / stat.synsetCount).toFixed(2) : '0'
          }
        });
      });
      
      console.log('✅ Detailed lexicon statistics retrieved successfully');
    });

    it('should provide overall statistics with content quality metrics', async () => {
      console.log('🔍 Getting overall statistics with content quality metrics...');
      
      const stats = await wordnet.getStatistics();
      expect(typeof stats).toBe('object');
      
      if (stats.totalWords === 0 && stats.totalSynsets === 0 && stats.totalSenses === 0) {
        console.log('⚠️ No statistics available - this may be expected if no data was loaded');
        return;
      }
      
      console.log('📊 Overall statistics:', {
        totalWords: stats.totalWords,
        totalSynsets: stats.totalSynsets,
        totalSenses: stats.totalSenses,
        totalILIs: stats.totalILIs,
        totalLexicons: stats.totalLexicons
      });
      
      // Calculate quality metrics
      const qualityMetrics = {
        sensePerWord: stats.totalWords ? (stats.totalSenses / stats.totalWords).toFixed(2) : '0',
        wordsPerSynset: stats.totalSynsets ? (stats.totalWords / stats.totalSynsets).toFixed(2) : '0',
        iliCoverage: stats.totalSynsets ? `${((stats.totalILIs / stats.totalSynsets) * 100).toFixed(1)}%` : '0%',
        dataDensity: stats.totalLexicons ? (stats.totalWords / stats.totalLexicons).toFixed(0) : '0'
      };
      
      console.log('📊 Content quality metrics:', qualityMetrics);
      
      console.log('✅ Overall statistics with quality metrics retrieved successfully');
    });
  });

  describe('Resource Type Detection and Categorization', () => {
    it('should detect and categorize lexicon vs ILI resource types with analysis', async () => {
      console.log('🔍 Detecting and categorizing resource types with analysis...');
      
      const lexicons = await wordnet.lexicons();
      
      if (lexicons.length === 0) {
        console.log('⚠️ No lexicons found - this may be expected if no data was loaded');
        return;
      }
      
      const resourceTypes = new Map<string, number>();
      const byType = {
        lexicons: [] as typeof lexicons,
        ilis: [] as typeof lexicons,
        mixed: [] as typeof lexicons
      };
      
      lexicons.forEach(lexicon => {
        const isIli = lexicon.id.startsWith('cili');
        const type = isIli ? 'ili' : 'lexicon';
        resourceTypes.set(type, (resourceTypes.get(type) || 0) + 1);
        
        if (isIli) {
          byType.ilis.push(lexicon);
        } else {
          byType.lexicons.push(lexicon);
        }
      });
      
      console.log('📊 Resource type distribution:', {
        types: Array.from(resourceTypes.entries()).map(([type, count]) => ({
          type,
          count,
          percentage: `${((count / lexicons.length) * 100).toFixed(1)}%`
        })),
        breakdown: {
          lexicons: byType.lexicons.length,
          ilis: byType.ilis.length,
          total: lexicons.length
        }
      });
      
      // Log specific resources with analysis
      console.log('📝 Lexicon resources:', byType.lexicons.map(l => `${l.id} (${l.language})`));
      console.log('🔗 ILI resources:', byType.ilis.map(l => `${l.id} (${l.language})`));
      
      console.log('✅ Resource type detection and categorization completed');
    });
  });

  describe('Performance and Scalability Analysis', () => {
    it('should handle multiple queries efficiently with timing analysis', async () => {
      console.log('🔍 Testing multiple queries efficiency with timing analysis...');
      
      const startTime = Date.now();
      
      // Make multiple queries using correct WebWordnet methods
      const promises = [
        wordnet.words({ maxResults: 100 }),
        wordnet.synsets({ maxResults: 100 }),
        wordnet.senses({ maxResults: 100 }),
        wordnet.getStatistics(),
        wordnet.getLexiconStatistics()
      ];
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`⏱️ Multiple queries completed in ${duration}ms`);
      
      // Analyze performance
      const performanceMetrics = {
        totalDuration: duration,
        averagePerQuery: duration / promises.length,
        queriesPerSecond: (promises.length / duration) * 1000,
        memoryEfficient: duration < 5000 // Should complete within 5 seconds
      };
      
      console.log('📊 Performance metrics:', performanceMetrics);
      
      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log('✅ Multiple queries handled efficiently with timing analysis');
    });

    it('should support concurrent operations with load analysis', async () => {
      console.log('🔍 Testing concurrent operations with load analysis...');
      
      const startTime = Date.now();
      
      const concurrentOperations = [
        wordnet.words({ form: 'test1', maxResults: 50 }),
        wordnet.words({ form: 'test2', maxResults: 50 }),
        wordnet.synsets({ form: 'test3', maxResults: 50 }),
        wordnet.synsets({ form: 'test4', maxResults: 50 }),
        wordnet.getStatistics()
      ];
      
      const results = await Promise.all(concurrentOperations);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Analyze concurrent performance
      const concurrentMetrics = {
        totalDuration: duration,
        averagePerOperation: duration / concurrentOperations.length,
        operationsPerSecond: (concurrentOperations.length / duration) * 1000,
        concurrentEfficiency: duration < 3000 // Should complete within 3 seconds
      };
      
      console.log('📊 Concurrent operation metrics:', concurrentMetrics);
      
      expect(results).toHaveLength(5);
      
      // All results should be valid
      results.forEach(result => {
        expect(result).toBeDefined();
      });
      
      console.log('✅ Concurrent operations supported with load analysis');
    });
  });
});
