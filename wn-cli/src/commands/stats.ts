import { Command } from "commander";
import { getWordnetInstance } from "../wordnet-singleton.js";
import { colors } from "./utils/colors.js";

function registerStatsCommands(program: Command) {
  const stats = program
    .command("stats")
    .description("Database statistics and analysis")
    .option("-l, --lexicon <lexicon>", "Lexicon to analyze", "*")
    .option("--quality", "Show data quality metrics")
    .option("--pos-distribution", "Show part-of-speech distribution")
    .option("--time", "Show timing information")
    .option("-v, --verbose", "Show detailed information")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      const startTime = Date.now();
      
      try {
        const wn = getWordnetInstance(options.lexicon);
        
        if (!options.json) {
          console.log(colors.bold(`📊 Database Statistics for ${options.lexicon}`));
        }
        
        // Get overall statistics
        const stats = await wn.getStatistics();
        const qualityMetrics = await wn.getDataQualityMetrics();
        
        if (options.json) {
          const output: any = {
            lexicon: options.lexicon,
            statistics: stats,
            qualityMetrics: qualityMetrics,
            timing: options.time ? Date.now() - startTime : undefined
          };
          
          if (options.posDistribution) {
            const posDist = await wn.getPartOfSpeechDistribution();
            output.posDistribution = posDist;
          }
          
          console.log(JSON.stringify(output, null, 2));
        } else {
          console.log(colors.green(`📊 Overall Statistics:`));
          console.log(`  📝 Total words: ${colors.cyan(stats.totalWords.toLocaleString())}`);
          console.log(`  📚 Total synsets: ${colors.cyan(stats.totalSynsets.toLocaleString())}`);
          console.log(`  🎯 Total senses: ${colors.cyan(stats.totalSenses.toLocaleString())}`);
          console.log(`  🌍 Total ILI entries: ${colors.cyan(stats.totalILIs.toLocaleString())}`);
          console.log(`  📖 Total lexicons: ${colors.cyan(stats.totalLexicons.toLocaleString())}`);
          
          if (options.quality) {
            console.log(colors.green(`\n📊 Data Quality Metrics:`));
            console.log(`  🌍 ILI coverage: ${colors.cyan(qualityMetrics.iliCoveragePercentage.toFixed(2))}%`);
            console.log(`  📝 Synsets with ILI: ${colors.cyan(qualityMetrics.synsetsWithILI.toLocaleString())}`);
            console.log(`  ❌ Synsets without ILI: ${colors.cyan(qualityMetrics.synsetsWithoutILI.toLocaleString())}`);
            console.log(`  📚 Synsets with definitions: ${colors.cyan(qualityMetrics.synsetsWithDefinitions.toLocaleString())}`);
            console.log(`  🚫 Empty synsets: ${colors.cyan(qualityMetrics.emptySynsets.toLocaleString())}`);
          }
          
          if (options.posDistribution) {
            console.log(colors.green(`\n📊 Part-of-Speech Distribution:`));
            const posDist = await wn.getPartOfSpeechDistribution();
            Object.entries(posDist)
              .sort(([,a], [,b]) => b - a)
              .forEach(([pos, count]) => {
                const posName = {
                  n: "Nouns",
                  v: "Verbs", 
                  a: "Adjectives",
                  r: "Adverbs"
                }[pos] || pos;
                console.log(`  ${posName}: ${colors.cyan(count.toLocaleString())}`);
              });
          }
          
          if (options.time) {
            console.log(colors.gray(`\nQuery completed in ${Date.now() - startTime}ms`));
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to get statistics:`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the database is initialized: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading data: wn-cli data download oewn:2024"));
        throw error;
      }
    });

  return stats;
}

export default registerStatsCommands; 
