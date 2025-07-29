#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { Command, Option } from "commander";
import { colors } from "./commands/utils/colors.js";
import App from "./app.js";
import registerDataCommands from "./commands/data.js";
import registerQueryCommands from "./commands/query.js";
import registerStatsCommands from "./commands/stats.js";
import registerDisambiguationCommands from "./commands/disambiguation.js";
import registerMultilingualCommands from "./commands/multilingual.js";
import registerDbCommands from "./commands/db.js";
import registerConfigCommand from "./commands/config.js";
import registerLayoutTestCommand from "./commands/layout-test.js";
import registerLexiconsCommand from "./commands/lexicons.js";
import registerBrowserCommands from "./commands/browser.js";
import { applyStoredConfig } from "./config-manager.js";
import {
  logUserInteraction,
  logInitializationMessage,
} from "./utils/user-logger.js";
import conf from "./config-manager.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

export let capturedCommandPath = "";
export let capturedArgs: string[] = [];

export function buildProgram() {
  // Allow tests to override the config path via a hidden CLI flag.
  // This must be processed before any other config logic.
  const configIndex = process.argv.indexOf("--config");
  if (configIndex > -1 && process.argv[configIndex + 1]) {
    // This is a test-only backdoor to point the CLI to a temporary config file.
    // We cast to `any` to bypass the `readonly` property check.
    (conf as any).path = process.argv[configIndex + 1];
  }

  // Apply stored configuration on startup
  applyStoredConfig();

  // Check for --tui flag before setting up the program
  const hasTuiFlag = process.argv.includes("--tui");

  // Parse --chain flag
  let chain: string[] = [];
  const chainIndex = process.argv.indexOf("--chain");
  if (chainIndex !== -1) {
    // Everything after --chain is part of the chain until the next flag or end
    for (let i = chainIndex + 1; i < process.argv.length; i++) {
      if (process.argv[i].startsWith("--")) break;
      chain.push(process.argv[i]);
    }
  }

  // Parse --snapshot flag
  const snapshotEnabled = process.argv.includes("--snapshot");

  const program = new Command();

  // Add global hooks for CLI mode only
  if (!hasTuiFlag) {
    program.hook("preAction", (_thisCommand, actionCommand) => {
      // Reset captured variables for each action
      capturedCommandPath = "";
      capturedArgs = [];

      // Build the command path
      const commandPath: string[] = [];
      let current: Command | null = actionCommand;
      while (current && current.parent) {
        commandPath.unshift(current.name());
        current = current.parent;
      }

      // Don't log the top-level command itself if no subcommand is given
      if (commandPath.length > 0) {
        capturedCommandPath = commandPath.join(" ");
        capturedArgs = actionCommand.args;
      }
    });
  }

  // Configure program with best practices from commander guide
  program
    .name("wn-cli")
    .description("WordNet CLI - Interactive TUI and scriptable commands for WordNet data exploration")
    .version(packageJson.version)
    .addOption(new Option("--config <path>", "Specify a custom config file path").hideHelp())
    .option("--tui", "Launch the interactive Text User Interface")
    .option(
      "--chain <commands...>",
      "Chain commands for TUI automation (e.g., 'down enter q')",
    )
    .option("--snapshot", "Enable snapshot mode for testing")
    .option("--json", "Output in JSON format for scripting")
    .option("--plain", "Output in plain, line-based text for scripting")
    .option("--no-color", "Disable color output")
    .option("-v, --verbose", "Verbose output")
    .option("-q, --quiet", "Quiet output (suppress non-essential messages)")
    .addHelpText(
      "after",
      `
Examples:
  $ wn-cli --tui                    # Launch interactive TUI
  $ wn-cli --tui --chain "down enter q"  # Automated TUI flow
  $ wn-cli query word "happy"       # Search for a word
  $ wn-cli query word "happy" --json # Machine-readable output
  $ wn-cli query synset "computer" n # Search for synsets
  $ wn-cli disambiguation "bank" n   # Word sense disambiguation
  $ wn-cli multilingual "computer" --target fr # Cross-language analysis
  $ wn-cli stats --quality          # Database statistics
  $ wn-cli data download oewn:2024  # Download and add WordNet data
  $ wn-cli data export --format csv # Export data for analysis
  $ wn-cli db status                # Check database status
  $ wn-cli data list                # List available projects
  $ wn-cli --help                   # Show full help

Common Workflows:
  # For researchers: Download and export data
  $ wn-cli data download oewn:2024 --progress
  $ wn-cli data export --format json --output research-data.json
  $ wn-cli stats --quality

  # For developers: Get machine-readable output
  $ wn-cli query word "happy" --json | jq '.[0].synsets'
  $ wn-cli disambiguation "bank" --json

  # For content writers: Find synonyms and alternatives
  $ wn-cli query synonyms "happy" --pos a

  # For language learners: Cross-language analysis
  $ wn-cli multilingual "computer" --target fr

  # For system administrators: Check and maintain
  $ wn-cli db status --verbose
  $ wn-cli db clean --dry-run

Interactive TUI Features:
  • Word Search: Find words and definitions
  • Synset Explorer: Explore semantic relations
  • Sense Browser: Browse word senses
  • Cross-Language Search: Multi-language search using CILI
  • Writing Assistant: Find synonyms and alternatives
  • Learning Mode: Simplified definitions for language learning
  • Settings: Configure lexicon and language preferences
  • Data Manager: Download and manage WordNet data

Chainable Automation:
  $ wn-cli --tui --chain "down down enter hello enter q"
  $ wn-cli --tui --chain "down enter up right q"

For more information, visit: https://github.com/your-repo/wn-cli
		`,
    );

  // Enable exit override for testing (prevents process.exit in tests)
  if (process.env.NODE_ENV === "test") {
    program.exitOverride();
  }

  // Register scriptable commands with global options
  registerDataCommands(program);
  registerQueryCommands(program);
  registerStatsCommands(program);
  registerDisambiguationCommands(program);
  registerMultilingualCommands(program);
  registerDbCommands(program);
  registerConfigCommand(program);
  registerLayoutTestCommand(program);
  registerLexiconsCommand(program);
  registerBrowserCommands(program);


  return { program, hasTuiFlag, chain, snapshotEnabled };
}

// Parse and decide what to do
if (process.env.NODE_ENV !== "test") {
  (async () => {
    const { program, hasTuiFlag, chain, snapshotEnabled } = buildProgram();

    // If --tui flag is provided, launch TUI immediately
    if (hasTuiFlag) {
      render(<App chainCommands={chain} snapshotEnabled={snapshotEnabled} />);
      return;
    }

    const loggingEnabled = conf.get("enableUsageLogging") as boolean;
    const outputBuffer: string[] = [];
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;

    if (loggingEnabled) {
      logInitializationMessage();
      const capture = (chunk: any) => {
        outputBuffer.push(chunk.toString());
      };
      // Re-typing to satisfy TypeScript, as we are calling with the original arguments
      process.stdout.write = ((chunk: any, ...args: any[]) => {
        capture(chunk);
        return originalStdoutWrite.call(process.stdout, chunk, ...args);
      }) as typeof process.stdout.write;
      process.stderr.write = ((chunk: any, ...args: any[]) => {
        capture(chunk);
        return originalStderrWrite.call(process.stderr, chunk, ...args);
      }) as typeof process.stderr.write;
    }

    let executionError: Error | null = null;
    try {
      // Otherwise, parse arguments normally. Commander will show help by default
      // if no arguments are provided.
      await program.parseAsync(process.argv);
    } catch (error) {
      if (error instanceof Error) {
        // Don't treat "help displayed" as an error that needs logging
        if ((error as any).code !== "commander.helpDisplayed") {
          executionError = error;
        }
      } else {
        executionError = new Error(String(error));
      }
    } finally {
      if (loggingEnabled) {
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
        if (capturedCommandPath) {
          await logUserInteraction(
            capturedCommandPath,
            capturedArgs,
            outputBuffer.join("")
          );
        }
      }
    }

    if (executionError) {
      console.error(colors.red("\n❌ An error occurred:"), executionError.message);
      if (process.env.NODE_ENV === "development" && executionError.stack) {
        console.error(colors.dim(executionError.stack));
      }
      process.exit(1);
    }

    // On successful execution, allow the process to exit naturally.
    // This gives any asynchronous operations (like writing logs) and native
    // modules (like the database driver) a chance to clean up gracefully.
    // An explicit process.exit() can be too abrupt on some platforms (e.g., Windows),
    // causing fatal errors if resources are not released properly.
  })();
}
