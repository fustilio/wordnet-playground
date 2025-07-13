import { Command } from "commander";
import { colors } from "./utils/colors.js";
import { getBestDefinition } from "../utils/wordnet-helpers.js";
import { resolveLexicon } from "../utils/lexicon-helpers.js";
import { getWordnetInstance } from "../wordnet-singleton.js";

function registerDisambiguationCommands(program: Command) {
  const disambiguation = program
    .command("disambiguation")
    .description("Word sense disambiguation and analysis")
    .argument("[word]", "Word to disambiguate")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Lexicon to query", "oewn")
    .option("-c, --context <context>", "Context for disambiguation")
    .option("--include-examples", "Include example sentences")
    .option("--time", "Show timing information")
    .option("-v, --verbose", "Show detailed information")
    .option("--json", "Output in JSON format")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        console.log(colors.yellow("Tip: Provide a word to disambiguate."));
        console.log(colors.yellow("Example: wn-cli disambiguation \"bank\" n"));
        return;
      }
      
      const startTime = Date.now();
      
      try {
        const lexiconResult = await resolveLexicon(options.lexicon);
        if (!lexiconResult.lexicon) {
          if (lexiconResult.suggestions.length > 0) {
            const bestGuess = lexiconResult.suggestions[0];
            console.log(colors.yellow(`⚠️  Could not find lexicon '${options.lexicon}'. Using '${bestGuess}' instead.`));
            options.lexicon = bestGuess;
          } else {
            console.log(colors.yellow(`Cannot find any senses for "${word}".`));
            console.log(colors.yellow(`\n💡 Tip: No lexicons are installed. Use 'wn-cli data download <project>' to get started.`));
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
          }
        } else {
          options.lexicon = lexiconResult.lexicon;
        }
        const wn = getWordnetInstance(options.lexicon);
        
        if (!options.json) {
          console.log(colors.bold(`🎯 Word Sense Disambiguation for "${word}"`));
          if (options.context) {
            console.log(colors.gray(`Context: "${options.context}"`));
          }
        }
        
        const senses = await wn.senses(word, options.pos);
        const synsetIds = [...new Set(senses.map(s => s.synset))];
        const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
        const synsets = synsetResults.filter(s => !!s);
        
        if (options.json) {
          const output = {
            word: word,
            context: options.context,
            lexicon: options.lexicon,
            pos: options.pos,
            count: synsets.length,
            synsets: synsets,
            timing: options.time ? Date.now() - startTime : undefined
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          if (synsets.length === 0) {
            console.log(colors.yellow(`No synsets found for "${word}"`));
            console.log(colors.yellow("\n💡 Tip: Try a different part of speech with --pos or check the spelling."));
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
          }
          
          console.log(colors.green(`Found ${synsets.length} senses:`));
          
          for (let i = 0; i < synsets.length; i++) {
            const synset = synsets[i];
            const members = synset.members?.length ? synset.members.map((m: string) => m.replace(/^oewn-/, '').replace(/-[a-z]$/, '')).join(', ') : word;
            const pos = synset.partOfSpeech || options.pos || "?";
            
            console.log(`\n${colors.cyan(`Sense ${i + 1}:`)} ${colors.bold(members)} (${pos})`);
            console.log(`   ${colors.bold("ID:")} ${synset.id}`);
            
            // Show definition
            const definition = await getBestDefinition(synset);
            console.log(`   ${colors.bold("Definition:")} ${definition}`);
            if (definition.startsWith("No definition")) {
              console.log(`   ${colors.yellow("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0")}`);
            }
            
            // Show examples
            if (options.includeExamples && synset.examples && synset.examples.length > 0) {
              console.log(`   ${colors.bold("Examples:")}`);
              synset.examples.forEach((example: any, j: number) => {
                console.log(`     ${j + 1}. ${example.text || example}`);
              });
            }
            
            // Show ILI information
            if (options.verbose && synset.ili) {
              console.log(`   ${colors.bold("ILI:")} ${synset.ili}`);
            }
          }
          
          // Disambiguation guidance
          if (synsets.length > 1) {
            console.log(colors.green(`\n💡 Disambiguation Tips:`));
            console.log(`   • Use --pos to filter by part of speech`);
            console.log(`   • Use --context to provide context for better disambiguation`);
            console.log(`   • Use --include-examples to see usage examples`);
          }
          
          if (options.time) {
            console.log(colors.gray(`\nQuery completed in ${Date.now() - startTime}ms`));
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to disambiguate "${word}":`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the lexicon is installed: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading the lexicon: wn-cli data download oewn:2024"));
        throw error;
      }
    });

  return disambiguation;
}

export default registerDisambiguationCommands; 
