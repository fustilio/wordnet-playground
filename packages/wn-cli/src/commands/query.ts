import { Command } from "commander";
import { ili } from "wn-ts";
import { colors } from "./utils/colors.js";
import { resolveLexicon } from "../utils/lexicon-helpers.js";
import { getBestDefinition } from "../utils/wordnet-helpers.js";
import { getWordnetInstance } from "../wordnet-singleton.js";

function registerQueryCommands(program: Command) {
  const query = program
    .command("query")
    .description("Query WordNet data")
    .action((_options, command) => {
      command.help();
    })
    .addHelpText(
      "after",
      `\nExamples:
  $ wn-cli query word "happy" --pos a
  $ wn-cli query word "happy" --json
  $ wn-cli query synset "computer" --pos n
  $ wn-cli query word "happy,joy,glad" --batch
  $ wn-cli query synonyms "happy" --pos a
  $ wn-cli query explain "happy" --pos a
  $ wn-cli query explore "car" --pos n`
    );

  // Word query
  query
    .command("word")
    .description("Search for words")
    .argument("[word]", "Word to look up (or comma-separated list for batch)")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Lexicon to query", "oewn")
    .option("-v, --verbose", "Show detailed information")
    .option("--batch", "Process multiple words (comma-separated)")
    .option("--time", "Show timing information")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        console.log(colors.yellow("Tip: Provide a word to look up."));
        console.log(colors.yellow("Examples:"));
        console.log(colors.yellow("  $ wn-cli query word \"happy\" a"));
        console.log(colors.yellow("  $ wn-cli query word \"happy,joy,glad\" --batch"));
        return;
      }
      
      const startTime = Date.now();
      
      // Get global options from parent command
      const globalOptions = query.parent?.opts() || {};
      const useJson = globalOptions.json || options.json;
      
      try {
        const lexiconResult = await resolveLexicon(options.lexicon);
        if (!lexiconResult.lexicon) {
          if (lexiconResult.suggestions.length > 0) {
            const bestGuess = lexiconResult.suggestions[0];
            console.log(colors.yellow(`⚠️  Could not find lexicon '${options.lexicon}'. Using '${bestGuess}' instead.`));
            options.lexicon = bestGuess;
          } else {
            console.log(colors.yellow(`Cannot find word "${word}".`));
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
        
        if (options.batch) {
          const words = word.split(",").map((w: string) => w.trim());
          if (!useJson) {
            console.log(colors.bold(`🔍 Batch querying ${words.length} words in ${options.lexicon}...`));
          }
          
          const results: Array<{word: string, results?: any[], error?: string}> = [];
          for (const w of words) {
            try {
              const wordResults = await wn.words(w, options.pos);
              results.push({ word: w, results: wordResults });
            } catch (error) {
              results.push({ word: w, error: error instanceof Error ? error.message : String(error) });
            }
          }
          
          if (useJson) {
            console.log(JSON.stringify(results, null, 2));
          } else {
            results.forEach((result, _) => {
              if (result.error) {
                console.log(colors.red(`❌ ${result.word}: ${result.error}`));
              } else {
                console.log(colors.green(`✅ ${result.word}: ${result.results?.length || 0} results`));
                if (options.verbose && result.results) {
                  result.results.forEach((w: any, j: number) => {
                    console.log(`   ${j + 1}. ${colors.cyan(w.lemma)} (${w.partOfSpeech})`);
                    // Always show definition if available
                    if (w.definitions && w.definitions.length > 0) {
                      console.log(`     Definition: ${w.definitions[0].text}`);
                    } else {
                      console.log(`     Definition: No definition available.`);
                    }
                  });
                }
              }
            });
          }
        } else {
          if (!useJson) {
            console.log(colors.bold(`🔍 Querying "${word}" in ${options.lexicon}...`));
          }
          const words = await wn.words(word, options.pos);
          
          if (useJson) {
            const output = {
              query: word,
              lexicon: options.lexicon,
              pos: options.pos,
              count: words.length,
              results: words,
              timing: options.time ? Date.now() - startTime : undefined
            };
            console.log(JSON.stringify(output, null, 2));
          } else {
            if (words.length === 0) {
              console.log(colors.yellow(`No words found for "${word}"`));
              console.log(colors.yellow("\n💡 Tip: Check the spelling, try a different part of speech, or another lexicon."));
                          if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
            }
          
            console.log(colors.green(`Found ${words.length} words:`));
            for (let i = 0; i < words.length; i++) {
              const w = words[i];
              const prefix = options.verbose ? `${i + 1}. ` : "• ";
              console.log(`   ${prefix}${colors.cyan(w.lemma)} (${w.partOfSpeech})`);
              
              // Always show definition by fetching synset
              try {
                const senses = await wn.senses(w.lemma, w.partOfSpeech);
                const synsetIds = [...new Set(senses.map(s => s.synset))];
                const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
                const synsets = synsetResults.filter(s => !!s);
                if (synsets.length > 0) {
                  const definition = await getBestDefinition(synsets[0]);
                  console.log(`     Definition: ${definition}`);
                  if (definition.startsWith("No definition")) {
                    console.log(`     ${colors.yellow("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0")}`);
                  }
                } else {
                  console.log(`     Definition: ${colors.yellow("No definition available in this lexicon.")}`);
                }
              } catch (e) {
                console.log(`     Definition: ${colors.yellow("No definition available in this lexicon.")}`);
              }
              
              if (options.verbose) {
                console.log(`     ID: ${w.id}`);
                console.log(`     Language: ${w.language}`);
                console.log(`     Lexicon: ${w.lexicon}`);
              }
              
            }
            
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to query "${word}":`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the lexicon is installed: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading the lexicon: wn-cli data download oewn:2024"));
        console.log(colors.yellow("  • Check network connection for downloads"));
        throw error;
      }
    });


  // Learning command for language learners
  query
    .command("explain")
    .description("Learning mode - simplified explanations for language learners")
    .argument("[word]", "Word to learn about")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Lexicon to query", "oewn")
    .option("--time", "Show timing information")
    .option("-v, --verbose", "Show technical details (IDs, etc.)")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        console.log(colors.yellow("Tip: Provide a word to learn about."));
        console.log(colors.yellow("Examples:"));
        console.log(colors.yellow("  $ wn-cli query explain \"happy\" a"));
        console.log(colors.yellow("  $ wn-cli query explain \"computer\" n --simple"));
        return;
      }
      
      const startTime = Date.now();
      
      // Get global options from parent command
      const globalOptions = query.parent?.opts() || {};
      const useJson = globalOptions.json || options.json;
      
      try {
        const lexiconResult = await resolveLexicon(options.lexicon);
        if (!lexiconResult.lexicon) {
          if (lexiconResult.suggestions.length > 0) {
            const bestGuess = lexiconResult.suggestions[0];
            console.log(colors.yellow(`⚠️  Could not find lexicon '${options.lexicon}'. Using '${bestGuess}' instead.`));
            options.lexicon = bestGuess;
          } else {
            console.log(colors.yellow(`Cannot explain "${word}".`));
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
        
        if (!useJson) {
          console.log(colors.bold(`📚 Learning about "${word}" in ${options.lexicon}...`));
        }
        
        // Get synsets for the word
        const senses = await wn.senses(word, options.pos);
        const synsetIds = [...new Set(senses.map(s => s.synset))];
        const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
        const synsets = synsetResults.filter(s => !!s);
        
        if (useJson) {
          const output = {
            word: word,
            lexicon: options.lexicon,
            pos: options.pos,
            synsets: synsets,
            learning_mode: true,
            timing: options.time ? Date.now() - startTime : undefined
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          if (synsets.length === 0) {
            console.log(colors.yellow(`No information found for "${word}"`));
            console.log(colors.yellow("\n💡 Tip: Try a different part of speech or check the spelling."));
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
          }
          
          console.log(colors.green(`📖 Meanings for "${word}":`));
          
          for (let i = 0; i < synsets.length; i++) {
            const synset = synsets[i];
            const members = synset.members?.length ? synset.members.map((m: string) => m.replace(new RegExp(`^${synset.lexicon}-`), '').replace(/^w_/, '').replace(/-[a-z]$/, '')).join(', ') : word;
            const definition = await getBestDefinition(synset);
            const pos = synset.partOfSpeech || options.pos || "?";
            
            console.log(`\n${colors.cyan(`Meaning ${i + 1}:`)} ${colors.bold(members)} (${pos})`);
            console.log(`   Definition: ${definition}`);
            if (definition.startsWith("No definition")) {
              console.log(`   ${colors.yellow("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0")}`);
            }
            
            if (options.verbose) {
              console.log(`   ID: ${synset.id}`);
            }
          }
          
          if (options.time) {
            console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to get learning information for "${word}":`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the lexicon is installed: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading the lexicon: wn-cli data download oewn:2024"));
        throw error;
      }
    });

  // Synset query
  query
    .command("synset")
    .alias("explore")
    .description("Search for synsets")
    .argument("[word]", "Word to look up")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Lexicon to query", "oewn")
    .option("-v, --verbose", "Show detailed information")
    .option("--time", "Show timing information")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        console.log(colors.yellow("Tip: Provide a word to look up."));
        console.log(colors.yellow("Example: wn-cli query synset \"computer\" n"));
        return;
      }
      
      const startTime = Date.now();
      
      // Get global options from parent command
      const globalOptions = query.parent?.opts() || {};
      const useJson = globalOptions.json || options.json;
      
      try {
        const lexiconResult = await resolveLexicon(options.lexicon);
        if (!lexiconResult.lexicon) {
          if (lexiconResult.suggestions.length > 0) {
            const bestGuess = lexiconResult.suggestions[0];
            console.log(colors.yellow(`⚠️  Could not find lexicon '${options.lexicon}'. Using '${bestGuess}' instead.`));
            options.lexicon = bestGuess;
          } else {
            console.log(colors.yellow(`Cannot find synsets for "${word}".`));
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
        
        if (!useJson) {
          console.log(colors.bold(`🔍 Querying synsets for "${word}" in ${options.lexicon}...`));
        }
        const senses = await wn.senses(word, options.pos);
        const synsetIds = [...new Set(senses.map(s => s.synset))];
        const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
        const synsets = synsetResults.filter(s => !!s);
        
        if (useJson) {
          const output = {
            query: word,
            lexicon: options.lexicon,
            pos: options.pos,
            count: synsets.length,
            results: synsets,
            timing: options.time ? Date.now() - startTime : undefined
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          if (synsets.length === 0) {
            console.log(colors.yellow(`No synsets found for "${word}"`));
            console.log(colors.yellow("\n💡 Tip: Check the spelling or try a different part of speech."));
            if (options.time) {
              console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
            }
            return;
          }
          
          console.log(colors.green(`Found ${synsets.length} synsets:`));
          for (let i = 0; i < synsets.length; i++) {
            const s = synsets[i];
            const prefix = options.verbose ? `${i + 1}. ` : "• ";
            console.log(`   ${prefix}${colors.cyan(s.id)}`);
            const definition = await getBestDefinition(s);
            console.log(`     Definition: ${definition}`);
            if (definition.startsWith("No definition")) {
              console.log(`     ${colors.yellow("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0")}`);
            }
            console.log(`     Members: ${s.members.join(", ")}`);
            
            if (options.verbose && s.relations && s.relations.length > 0) {
              console.log(`     Relations: ${s.relations.length} found`);
            }
          }
          
          if (options.time) {
            console.log(colors.gray(`Query completed in ${Date.now() - startTime}ms`));
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to query synsets for "${word}":`), error);
        console.log(colors.yellow("Troubleshooting tips:"));
        console.log(colors.yellow("  • Check if the lexicon is installed: wn-cli db status"));
        console.log(colors.yellow("  • Try downloading the lexicon: wn-cli data download oewn:2024"));
        throw error;
      }
    });

  // Writing assistance command
  query
    .command("synonyms")
    .description("Writing assistance - find synonyms and related words")
    .argument("[word]", "Word to find alternatives for")
    .argument("[pos]", "Part of speech (n, v, a, r)")
    .option("-p, --pos <pos>", "Part of speech (n, v, a, r)")
    .option("-l, --lexicon <lexicon>", "Lexicon to query", "oewn")
    .option("-v, --verbose", "Show technical details (IDs, etc.)")
    .option("--time", "Show timing information")
    .action(async (word, pos, options) => {
      options.pos = pos || options.pos;
      if (!word) {
        console.log(colors.red("Error: No word specified."));
        return;
      }

      const startTime = Date.now();
      const globalOptions = query.parent?.opts() || {};
      const useJson = globalOptions.json || options.json;

      try {
        const lexiconResult = await resolveLexicon(options.lexicon);
        if (!lexiconResult.lexicon) {
          if (lexiconResult.suggestions.length > 0) {
            const bestGuess = lexiconResult.suggestions[0];
            if (!useJson) console.log(colors.yellow(`⚠️  Could not find lexicon '${options.lexicon}'. Using '${bestGuess}' instead.`));
            options.lexicon = bestGuess;
          } else {
            if (!useJson) console.log(colors.yellow(`No alternatives found for "${word}".`));
            return;
          }
        } else {
          options.lexicon = lexiconResult.lexicon;
        }
        
        const wn = getWordnetInstance(options.lexicon);
        const senses = await wn.senses(word, options.pos);
        const synsetIds = [...new Set(senses.map(s => s.synset))];
        const synsetResults = await Promise.all(synsetIds.map(id => wn.synset(id)));
        const synsets = synsetResults.filter(s => !!s);

        if (useJson) {
          const results = await Promise.all(synsets.map(async (s) => ({
            id: s.id,
            definition: await getBestDefinition(s),
            members: s.members,
          })));
          const output = {
              word: word,
              lexicon: options.lexicon,
              pos: options.pos,
              synsets: results,
              timing: options.time ? Date.now() - startTime : undefined,
          };
          console.log(JSON.stringify(output, null, 2));
          return;
        }
        
        console.log(colors.bold(`✍️  Alternatives for "${word}":`));

        if (synsets.length === 0) {
          console.log(colors.yellow(`\nNo alternatives found for "${word}"`));
          return;
        }

        for (const synset of synsets) {
          const members = synset.members
            .map((m: string) => m.replace(new RegExp(`^${synset.lexicon}-`), '').replace(/^w_/, '').replace(/-[a-z]$/, ''))
            .filter(m => m.toLowerCase() !== word.toLowerCase());
          
          if (members.length > 0) {
            const definition = await getBestDefinition(synset);
            console.log(`\n${colors.cyan(`Meaning: ${definition}`)}`);
            if (definition.startsWith("No definition")) {
              console.log(colors.yellow(`💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0`));
            }
            console.log(`   ${colors.yellow(members.join(", "))}`);
            if (options.verbose) {
                console.log(`   ${colors.gray("ID:")} ${synset.id}`);
            }
          }
        }

        if (options.time) {
          console.log(colors.gray(`\nQuery completed in ${Date.now() - startTime}ms`));
        }

      } catch (error) {
        console.error(colors.red(`❌ Failed to get alternatives for "${word}":`), error);
        throw error;
      }
    });
}

export default registerQueryCommands;
