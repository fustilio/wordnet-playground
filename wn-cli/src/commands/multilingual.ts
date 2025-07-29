import { Command } from "commander";
import { lexicons as getInstalledLexicons } from "wn-ts";
import { colors } from "./utils/colors.js";
import { resolveLexicon } from "../utils/lexicon-helpers.js";
import { getBestDefinition } from "../utils/wordnet-helpers.js";
import { getWordnetInstance } from "../wordnet-singleton.js";

function registerMultilingualCommands(program: Command) {
  const multilingual = program
    .command("multilingual")
    .description("Cross-language linking and analysis")
    .argument("[word]", "Word to analyze across languages")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Source lexicon", "oewn")
    .option("-t, --target <target>", "Target language (e.g., fr, es, de)")
    .option("--time", "Show timing information")
    .option("-v, --verbose", "Show detailed information")
    .option("--json", "Output in JSON format")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        console.log(colors.yellow("Tip: Provide a word to analyze across languages."));
        console.log(colors.yellow("Example: wn-cli multilingual \"computer\" n --target fr"));
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
            console.log(colors.yellow(`Cannot find multilingual data for "${word}".`));
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
        
        let targetLexiconId: string | null = null;
        if (options.target) {
          const allInstalledLexicons = await getInstalledLexicons();
          const targetLexicon = allInstalledLexicons.find(
            (l) => l.language === options.target,
          );
          if (targetLexicon) {
            targetLexiconId = targetLexicon.id;
          }
        }
        
        if (!options.json) {
          console.log(colors.bold(`🌍 Multilingual Analysis for "${word}"`));
          if (options.target) {
            console.log(colors.gray(`Target language: ${options.target}`));
          }
        }
        
        // Get synsets for the word
        const senses = await wn.senses(word, options.pos);
        const synsetIds = [...new Set(senses.map(s => s.synset))];
        const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
        const synsets = synsetResults.filter(s => !!s);
        
        if (options.json) {
          const output = {
            word: word,
            sourceLexicon: options.lexicon,
            targetLanguage: options.target,
            pos: options.pos,
            count: synsets.length,
            synsets: synsets,
            timing: options.time ? Date.now() - startTime : undefined
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          if (synsets.length === 0) {
            console.log(colors.yellow(`No synsets found for "${word}" in '${options.lexicon}'.`));
            console.log(colors.yellow(`\n💡 Tip: If searching for a non-English word, specify its lexicon with --lexicon.`));
            console.log(colors.yellow(`   Example: wn-cli multilingual "${word}" --lexicon <source-lexicon>`));
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
          }
          
          console.log(colors.green(`Found ${synsets.length} synsets:`));
          
          for (let i = 0; i < synsets.length; i++) {
            const synset = synsets[i];
            const members = synset.members?.length ? synset.members.map((m: string) => m.replace(new RegExp(`^${synset.lexicon}-`), '').replace(/^w_/, '').replace(/-[a-z]$/, '')).join(', ') : word;
            const pos = synset.partOfSpeech || options.pos || "?";
            
            let displayMembers = members;
            if (options.target && targetLexiconId && synset.ili) {
              const iliResults = await wn.ili(synset.ili);
              const iliSynsets = Array.isArray(iliResults)
                ? iliResults
                : iliResults
                ? [iliResults]
                : [];

              const targetSynsets = iliSynsets.filter(
                (s: any) =>
                  s &&
                  s.lexicon &&
                  s.lexicon.startsWith(targetLexiconId!.split(":")[0]),
              );

              if (targetSynsets.length > 0) {
                const lemmas = new Set<string>();
                for (const ts of targetSynsets) {
                  const fullTargetSynset = await wn.synset(ts.id);
                  if (fullTargetSynset && fullTargetSynset.members) {
                    fullTargetSynset.members.forEach((m: string) =>
                      lemmas.add(
                        m
                          .replace(
                            new RegExp(`^${fullTargetSynset.lexicon}-`),
                            "",
                          )
                          .replace(/^w_/, "")
                          .replace(/-[a-z]$/, ""),
                      ),
                    );
                  }
                }
                if (lemmas.size > 0) {
                  displayMembers = Array.from(lemmas).join(", ");
                }
              }
            }

            console.log(`\n${colors.cyan(`Synset ${i + 1}:`)} ${colors.bold(displayMembers)} (${pos})`);
            console.log(`   ${colors.bold("ID:")} ${synset.id}`);
            
            if (synset.ili) {
              console.log(`   ${colors.bold("ILI:")} ${synset.ili}`);
              const definition = await getBestDefinition(synset);
              console.log(`   ${colors.bold("Definition:")} ${definition}`);
              if (definition.startsWith("No definition")) {
                console.log(`   ${colors.yellow("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0")}`);
              }
            } else {
              console.log(`   ${colors.bold("ILI:")} No ILI mapping available`);
              console.log(`   ${colors.bold("Definition:")} ${colors.yellow("No definition available.")}`);
            }
            
            // Show relations
            if (options.verbose && synset.relations && synset.relations.length > 0) {
              console.log(`   ${colors.bold("Relations:")}`);
              synset.relations.forEach((rel: any, j: number) => {
                console.log(`     ${j + 1}. ${rel.type}: ${rel.target}`);
              });
            }
          }
          
          // Cross-language analysis
          if (options.target) {
            console.log(colors.green(`\n🌍 Cross-Language Analysis:`));
            console.log(`   ${colors.bold("Source:")} ${options.lexicon} (${word})`);
            console.log(`   ${colors.bold("Target:")} ${options.target}`);
            console.log(`   ${colors.bold("ILI Coverage:")} ${synsets.filter(s => s.ili).length}/${synsets.length} synsets have ILI mappings`);
            
            // Show ILI statistics
            const ilis = await wn.ilis();
            console.log(`   ${colors.bold("Total ILI entries:")} ${ilis.length}`);
            
            if (options.verbose) {
              console.log(`   ${colors.bold("Sample ILI entries:")}`);
              ilis.slice(0, 3).forEach((ili, i) => {
                const definition = ili.definition ? ili.definition.substring(0, 60) + '...' : 'No definition';
                console.log(`     ${i + 1}. ${colors.cyan(ili.id)}: ${definition}`);
              });
            }
          }
          
          // Multilingual tips
          console.log(colors.green(`\n💡 Multilingual Tips:`));
          console.log(`   • Use --target to specify a target language`);
          console.log(`   • Use --verbose to see detailed information`);
          console.log(`   • ILI mappings enable cross-language concept linking`);
          
          if (options.time) {
            console.log(colors.gray(`\nQuery completed in ${Date.now() - startTime}ms`));
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to analyze "${word}" across languages:`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the lexicon is installed: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading the lexicon: wn-cli data download oewn:2024"));
        throw error;
      }
    });

  return multilingual;
}

export default registerMultilingualCommands; 
