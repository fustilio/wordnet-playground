#!/usr/bin/env node

/**
 * Use Case 4: Database Statistics and Coverage Analysis
 * 
 * Problem: You need to understand the scope and quality of the WordNet database.
 * Solution: Analyze database statistics and content coverage.
 * 
 * Real-world application: Data quality assessment, research planning, system design
 */

import { 
  words, 
  synsets, 
  senses,
  ilis,
  lexicons
} from 'wn-ts';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
📊 Use Case 4: Database Statistics and Coverage Analysis
=======================================================

Problem: You need to understand the scope and quality of the WordNet database.
Solution: Analyze database statistics and content coverage.

Real-world application: Data quality assessment, research planning
`);

async function demonstrateDatabaseStatistics() {
  const wordnet = createWordnet('statistics');
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Example 1: Overall Database Statistics
========================================`);

    // Get overall statistics using Wordnet instance methods
    console.log('\n📊 Database Statistics:');
    
    const allLexicons = await lexicons();
    const allILIs = await ilis();
    const stats = await wordnet.getStatistics();

    console.log(`  📝 Total words: ${stats.totalWords}`);
    console.log(`  📚 Total synsets: ${stats.totalSynsets}`);
    console.log(`  🎯 Total senses: ${stats.totalSenses}`);
    console.log(`  🌍 Total ILI entries: ${stats.totalILIs}`);
    console.log(`  📖 Total lexicons: ${stats.totalLexicons}`);

    console.log(`
🔍 Example 2: Lexicon Breakdown and Analysis
===========================================`);

    // Show lexicon breakdown
    console.log('\n📖 Lexicon Breakdown:');
    allLexicons.forEach(lexicon => {
      console.log(`  • ${lexicon.id}: ${lexicon.label} (v${lexicon.version}, ${lexicon.language})`);
    });

    // Group by language
    const lexiconsByLanguage = {};
    allLexicons.forEach(lexicon => {
      const lang = lexicon.language;
      if (!lexiconsByLanguage[lang]) {
        lexiconsByLanguage[lang] = [];
      }
      lexiconsByLanguage[lang].push(lexicon);
    });

    console.log('\n🌐 Lexicons by Language:');
    Object.entries(lexiconsByLanguage).forEach(([lang, lexicons]) => {
      console.log(`  • ${lang.toUpperCase()}: ${lexicons.length} lexicons`);
      lexicons.forEach(lexicon => {
        console.log(`    - ${lexicon.id}: ${lexicon.label} (v${lexicon.version})`);
      });
    });

    console.log(`
🔍 Example 3: Data Quality Analysis
==================================`);

    // Analyze data quality using Wordnet instance methods
    console.log('\n🔍 Data Quality Analysis:');
    
    const qualityMetrics = await wordnet.getDataQualityMetrics();
    
    console.log(`  🌍 Synsets with ILI: ${qualityMetrics.synsetsWithILI}`);
    console.log(`  ❌ Synsets without ILI: ${qualityMetrics.synsetsWithoutILI}`);
    console.log(`  📊 ILI coverage: ${qualityMetrics.iliCoveragePercentage.toFixed(2)}%`);
    console.log(`  📭 Empty synsets: ${qualityMetrics.emptySynsets}`);
    console.log(`  📝 Synsets with definitions: ${qualityMetrics.synsetsWithDefinitions}`);

    console.log(`
🔍 Example 4: Word Coverage Analysis
===================================`);

    // Analyze word coverage for common words
    const commonWords = ['computer', 'information', 'happy', 'run', 'light', 'bank'];
    
    console.log('\n📝 Word Coverage Analysis:');
    for (const word of commonWords) {
      const wordEntries = await words(word);
      const synsetEntries = await synsets(word);
      
      console.log(`\n🔍 "${word}":`);
      console.log(`  📝 Word forms: ${wordEntries.length}`);
      console.log(`  📚 Synsets: ${synsetEntries.length}`);
      
      if (synsetEntries.length > 0) {
        // Group by part of speech
        const byPOS = {};
        synsetEntries.forEach(synset => {
          const pos = synset.partOfSpeech;
          if (!byPOS[pos]) byPOS[pos] = [];
          byPOS[pos].push(synset);
        });
        
        Object.entries(byPOS).forEach(([pos, synsets]) => {
          console.log(`    ${pos.toUpperCase()}: ${synsets.length} synsets`);
        });
        
        // Show detailed information for the first synset
        const firstSynset = synsetEntries[0];
        await displaySynset(firstSynset, 1);
      }
    }

    console.log(`
🔍 Example 5: Part-of-Speech Distribution
========================================`);

    // Analyze part-of-speech distribution using Wordnet instance methods
    console.log('\n📊 Part-of-Speech Distribution:');
    
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    
    console.log('\n📚 Synsets by Part of Speech:');
    Object.entries(posDistribution).forEach(([pos, count]) => {
      const percentage = ((count / stats.totalSynsets) * 100).toFixed(2);
      console.log(`  • ${(pos || 'undefined').toUpperCase()}: ${count} synsets (${percentage}%)`);
    });

    console.log(`
🔍 Example 6: Synset Size Analysis
=================================`);

    // TODO: Synset size analysis is temporarily disabled due to stack overflow issues
    // with large databases. The getSynsetSizeAnalysis method needs optimization.
    console.log('\n📏 Synset Size Analysis:');
    console.log('  ⚠️  Temporarily disabled due to performance issues with large databases');
    console.log('  📊 This feature will be re-enabled once the underlying method is optimized');
    
    // const sizeAnalysis = await wordnet.getSynsetSizeAnalysis();
    // console.log(`  📊 Average synset size: ${sizeAnalysis.averageSize.toFixed(2)} words`);
    // console.log(`  📈 Largest synset: ${sizeAnalysis.maxSize} words`);
    // console.log(`  📉 Smallest synset: ${sizeAnalysis.minSize} words`);
    
    // // Size distribution (print only the 10 most common sizes)
    // console.log('\n📊 Synset Size Distribution (Top 10 Most Common Sizes):');
    // const sizeDistEntries = Object.entries(sizeAnalysis.sizeDistribution);
    // sizeDistEntries.sort((a, b) => b[1] - a[1]); // Sort by count descending
    // sizeDistEntries.slice(0, 10).forEach(([size, count]) => {
    //   const percentage = ((count / stats.totalSynsets) * 100).toFixed(2);
    //   console.log(`  • ${size} words: ${count} synsets (${percentage}%)`);
    // });

    console.log(`
🔍 Example 7: ILI Database Analysis
==================================`);

    // Analyze ILI database
    console.log('\n🌍 ILI Database Analysis:');
    
    console.log(`📊 Total ILI entries: ${allILIs.length}`);
    
    // Analyze ILI status distribution
    const statusCounts = {};
    allILIs.forEach(entry => {
      const status = entry.status || 'active';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 ILI Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / allILIs.length) * 100).toFixed(2);
      console.log(`  • ${status}: ${count} entries (${percentage}%)`);
    });
    
    // Analyze definitions
    const entriesWithDefs = allILIs.filter(entry => entry.definition);
    console.log(`\n📝 Entries with definitions: ${entriesWithDefs.length} (${((entriesWithDefs.length / allILIs.length) * 100).toFixed(2)}%)`);

    console.log(`
🔍 Example 8: Detailed Synset Content Analysis
=============================================`);

    // Analyze detailed content of synsets
    console.log('\n🔍 Detailed synset content analysis for "bank":');
    
    const bankSynsets = await synsets('bank');
    console.log(`📚 Found ${bankSynsets.length} synsets for "bank"`);
    
    // Group by part of speech
    const bankByPOS = {};
    bankSynsets.forEach(synset => {
      const pos = synset.partOfSpeech;
      if (!bankByPOS[pos]) bankByPOS[pos] = [];
      bankByPOS[pos].push(synset);
    });
    
    Object.entries(bankByPOS).forEach(([pos, synsets]) => {
      console.log(`\n📚 ${pos.toUpperCase()} senses (${synsets.length}):`);
      synsets.forEach(async (synset, index) => {
        await displaySynset(synset, index + 1);
      });
    });

    console.log(`
🎉 Database Statistics Demo Completed!

💡 Key Insights:
   • Database contains extensive lexical data across multiple languages
   • ILI provides comprehensive cross-language concept mapping
   • Synset sizes vary significantly, indicating rich lexical relationships
   • Part-of-speech distribution shows balanced coverage
   • Data quality metrics help assess resource suitability
   • Detailed synset content enables comprehensive analysis

🚀 Practical Applications:
   • Data quality assessment for research projects
   • System design and capacity planning
   • Resource selection for specific applications
   • Academic research and analysis
   • Lexical database development

📊 Final Statistics:
   • Total words: ${stats.totalWords}
   • Total synsets: ${stats.totalSynsets}
   • Total senses: ${stats.totalSenses}
   • Total ILI entries: ${stats.totalILIs}
   • Total lexicons: ${stats.totalLexicons}
   • Languages covered: ${Object.keys(lexiconsByLanguage).length}
   • ILI coverage: ${qualityMetrics.iliCoveragePercentage.toFixed(2)}%
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Database statistics demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the database statistics demo
runDemo(demonstrateDatabaseStatistics, 'Database Statistics Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 
