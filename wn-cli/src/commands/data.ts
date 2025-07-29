import { Command } from "commander";
import {
  download,
  add,
  remove,
  export as exportData,
  getProjects,
  lexicons as getInstalledLexicons,
  isDatabaseLocked,
} from "wn-ts";
import { colors } from "./utils/colors.js";
import {
  getWordnetInstance,
  closeWordnetInstance,
} from "../wordnet-singleton.js";
import { ProgressIndicator } from "./utils/progress.js";

function registerDbUnlockCommand(program: Command) {
  program
    .command('db:unlock')
    .description('Check if the database is locked and suggest remedies if so')
    .action(() => {
      if (isDatabaseLocked()) {
        console.error(colors.red('❌ Database is locked.'));
        console.log(colors.yellow('• Wait a few seconds and try again.'));
        console.log(colors.yellow('• Ensure no other CLI, GUI, or test is using the database.'));
        if (process.platform === 'win32') {
          console.log(colors.yellow('• If the problem persists, try restarting your computer (Windows file locks can be sticky).'));
        }
      } else {
        console.log(colors.green('✅ Database is not locked.'));
      }
    });
}

function registerDataCommands(program: Command) {
  const data = program
    .command("data")
    .description("Data management commands")
    .action((_options, command) => {
      command.help();
    })
    .addHelpText(
      "after",
      `\nExamples:
  $ wn-cli data download oewn:2024 --progress
  $ wn-cli data list
  $ wn-cli data export --format json --output data.json`
    );

  // List
  data
    .command("list")
    .description("List available WordNet projects and their installation status")
    .option("-l, --limit <number>", "Limit number of projects shown", "20")
    .option("-s, --search <term>", "Search for projects containing term")
    .option(
      "-v, --verbose",
      "Show detailed project information (description, URL)"
    )
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      try {
        getWordnetInstance();
        const projects = getProjects();
        const limit = parseInt(options.limit || "20");

        let installedLexicons: any[] = [];
        try {
          installedLexicons = await getInstalledLexicons();
        } catch (error) {
          // If DB not initialized, assume no lexicons are installed.
        }
        const installedIds = new Set(installedLexicons.map((l) => l.id));

        let filteredProjects = projects;
        if (options.search) {
          const searchTerm = options.search.toLowerCase();
          filteredProjects = projects.filter(
            (p: any) =>
              p.id.toLowerCase().includes(searchTerm) ||
              p.label.toLowerCase().includes(searchTerm) ||
              (p.description &&
                p.description.toLowerCase().includes(searchTerm))
          );
        }

        const projectList = filteredProjects.map((p: any) => {
          const isInstalled =
            installedIds.has(p.id) ||
            Array.from(installedIds).some((installedId: string) =>
              installedId.startsWith(`${p.id}-`)
            );
          const installedInfo = installedLexicons.find(
            (l) => l.id === p.id || l.id.startsWith(`${p.id}-`)
          );

          let versionInfo = installedInfo?.version || null;
          if (!isInstalled && p.versions) {
            const availableVersions = Object.keys(p.versions);
            if (availableVersions.length > 0) {
              versionInfo = availableVersions.join(", ");
            }
          }

          return {
            ...p,
            status: isInstalled ? "installed" : "available",
            version: versionInfo || "-",
          };
        });

        if (options.json) {
          console.log(JSON.stringify(projectList.slice(0, limit), null, 2));
          return;
        }

        console.log(colors.bold("Available WordNet Projects:"));
        console.log(colors.dim("=========================="));

        if (projectList.length === 0) {
          if (options.search) {
            console.log(
              colors.yellow(`No projects found matching "${options.search}"`)
            );
            console.log(
              colors.yellow(
                "Tip: Try a different search term or run without --search to see all projects."
              )
            );
          } else {
            console.log(colors.yellow("No projects found."));
          }
          return;
        }

        // Table layout
        const maxIdLength = Math.max(
          ...projectList.map((p) => (p && p.id ? p.id.length : 0)),
          2
        );
        const maxLabelLength = Math.max(
          ...projectList.map((p) => (p && p.label ? p.label.length : 0)),
          5
        );
        const maxVersionLength = Math.max(
          ...projectList.map((p) => (p && p.version ? p.version.length : 0)),
          7 // "Version".length
        );

        const header = [
          "ID".padEnd(maxIdLength),
          "Label".padEnd(maxLabelLength),
          "Status".padEnd(12),
          "Version".padEnd(maxVersionLength),
        ].join(" | ");

        console.log(colors.bold(header));
        console.log(colors.dim("-".repeat(header.length)));

        projectList.slice(0, limit).forEach((project: any) => {
          if (!project || !project.id) return;
          const statusColor =
            project.status === "installed" ? colors.green : colors.yellow;
          const statusIcon = project.status === "installed" ? "✅" : "📦";

          const row = [
            colors.cyan((project.id || "").padEnd(maxIdLength)),
            (project.label || "").padEnd(maxLabelLength),
            statusColor((statusIcon + " " + project.status).padEnd(12)),
            (project.version || "-").padEnd(maxVersionLength),
          ].join(" | ");
          console.log(row);

          if (options.verbose) {
            if (project.description) {
              console.log(`     ${colors.dim(project.description)}`);
            }
            if (project.url) {
              console.log(`     URL: ${project.url}`);
            }
          }
        });

        if (filteredProjects.length > limit) {
          console.log(
            colors.dim(
              `\n... and ${filteredProjects.length - limit} more projects`
            )
          );
        }

        const installedCount = projectList.filter(
          (p) => p.status === "installed"
        ).length;
        const availableCount = projectList.filter(
          (p) => p.status === "available"
        ).length;
        console.log(colors.dim("-".repeat(header.length)));
        console.log(
          colors.bold(
            `Summary: ${installedCount} installed, ${availableCount} available`
          )
        );
        if (availableCount > 0) {
          console.log(
            colors.yellow(
              `\n💡 Tip: Use 'wn-cli data download <project-id:version>' to install available projects.`
            )
          );
        }
      } catch (error) {
        console.error(colors.red("❌ Failed to list projects:"), error);
        throw error;
      }
    });

  // Download
  data
    .command("download")
    .description("Download WordNet projects")
    .argument("[project]", "Project identifier (e.g., oewn:2024, wn31:3.1)")
    .option("-f, --force", "Force re-download even if already exists")
    .option("-p, --progress", "Show detailed progress information")
    .option("-q, --quiet", "Suppress output except errors")
    .option("--dry-run", "Show what would be done without modifying the database")
    .action(async (project, options) => {
      if (!project) {
        console.log(colors.red("Error: No project specified."));
        console.log(
          colors.yellow("Tip: Run `wn-cli data list` to see available projects.")
        );
        return;
      }
      try {
        if (!options.quiet) {
          console.log(colors.bold(`📥 Downloading ${project}...`));
        }
        // NOTE: The progress bar for downloads is disabled as it contributes to
        // shutdown instability on Windows with native addons.
        const downloadOptions: any = { force: options.force };
        const downloadedPath = await download(project, downloadOptions);

        if (!options.quiet) {
          console.log(colors.green(`✅ Successfully downloaded ${project}`));
        }

        if (downloadedPath) {
          if (!options.quiet) {
            console.log(colors.bold(`\n➕ Adding project to database...`));
          }

          await closeWordnetInstance();

          if (options.force) {
            const [projectIdClean] = project.split(":");
            if (options.dryRun) {
              if (!options.quiet) {
                console.log(
                  colors.yellow(
                    `\n[DRY RUN] Would remove existing data for ${projectIdClean} due to --force flag.`
                  )
                );
              }
            } else {
              try {
                if (!options.quiet) {
                  console.log(
                    colors.yellow(
                      `\n♻️  Removing existing data for ${projectIdClean} due to --force flag...`
                    )
                  );
                }
                await remove(projectIdClean);
              } catch (error: any) {
                if (error.message.includes("not found")) {
                  // It's ok if it doesn't exist, we are adding it.
                } else {
                  console.error(
                    colors.red(
                      `❌ Could not remove lexicon ${projectIdClean}: ${error.message}`
                    )
                  );
                  throw error;
                }
              }
            }
          }

          // --- DB LOCK CHECK ---
          if (!options.dryRun && isDatabaseLocked()) {
            console.error(colors.red('❌ Database is locked. Please close any other process using the database and try again.'));
            console.log(colors.yellow('• Wait a few seconds and try again.'));
            console.log(colors.yellow('• Ensure no other CLI, GUI, or test is using the database.'));
            if (process.platform === 'win32') {
              console.log(colors.yellow('• If the problem persists, try restarting your computer (Windows file locks can be sticky).'));
            }
            process.exit(1);
          }
          // --- END DB LOCK CHECK ---

          const addOptions: any = {
            force: options.force,
            dryRun: options.dryRun,
          };
          const wasUpdate = await add(downloadedPath, addOptions);

          if (options.dryRun) {
            console.log(
              colors.bold("\n✅ Dry run complete. No changes were made.")
            );
            return;
          }

          if (!options.quiet) {
            if (wasUpdate) {
              console.log(
                colors.green(`✅ Successfully updated ${project} in database.`)
              );
            } else {
              console.log(
                colors.green(`✅ Successfully added ${project} to database.`)
              );
            }
          }
          console.log(
            colors.bold(
              `\n🎉 Project ${project} is now installed and ready to use.`
            )
          );
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to download ${project}:`), error);
        throw error;
      }
    });

  // Add
  data
    .command("add")
    .description("Add a lexicon from a file to the database")
    .argument("<file>", "Path to the lexicon file (XML/LMF format)")
    .option("-f, --force", "Force re-add even if already exists")
    .option("--dry-run", "Show what would be done without modifying the database")
    .action(async (file, options) => {
      try {
        if (!options.quiet) {
          console.log(colors.bold(`➕ Adding lexicon from ${file}...`));
        }

        await closeWordnetInstance();

        if (options.force) {
          if (options.dryRun) {
            if (!options.quiet) {
              console.log(
                colors.yellow(
                  `\n[DRY RUN] Would remove existing data due to --force flag.`
                )
              );
            }
          } else {
            try {
              if (!options.quiet) {
                console.log(
                  colors.yellow(
                    `\n♻️  Removing existing data due to --force flag...`
                  )
                );
              }
              // Extract lexicon ID from file path or content
              const path = require('path');
              const lexiconId = path.basename(file, path.extname(file));
              await remove(lexiconId);
            } catch (error: any) {
              if (error.message.includes("not found")) {
                // It's ok if it doesn't exist, we are adding it.
              } else {
                console.error(
                  colors.red(
                    `❌ Could not remove existing lexicon: ${error.message}`
                  )
                );
                throw error;
              }
            }
          }
        }

        // --- DB LOCK CHECK ---
        if (!options.dryRun && isDatabaseLocked()) {
          console.error(colors.red('❌ Database is locked. Please close any other process using the database and try again.'));
          console.log(colors.yellow('• Wait a few seconds and try again.'));
          console.log(colors.yellow('• Ensure no other CLI, GUI, or test is using the database.'));
          if (process.platform === 'win32') {
            console.log(colors.yellow('• If the problem persists, try restarting your computer (Windows file locks can be sticky).'));
          }
          process.exit(1);
        }
        // --- END DB LOCK CHECK ---

        const addOptions: any = {
          force: options.force,
          dryRun: options.dryRun,
        };
        const wasUpdate = await add(file, addOptions);

        if (options.dryRun) {
          console.log(
            colors.bold("\n✅ Dry run complete. No changes were made.")
          );
          return;
        }

        if (!options.quiet) {
          if (wasUpdate) {
            console.log(
              colors.green(`✅ Successfully updated lexicon in database.`)
            );
          } else {
            console.log(
              colors.green(`✅ Successfully added lexicon to database.`)
            );
          }
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to add lexicon from ${file}:`), error);
        throw error;
      }
    });

  // Export
  data
    .command("export")
    .description("Export data from the database")
    .option("-f, --format <format>", "Export format (json, xml, csv)", "json")
    .option("-o, --output <file>", "Output file path")
    .option(
      "-i, --include <lexicons>",
      "Comma-separated list of lexicons to include"
    )
    .option(
      "-e, --exclude <lexicons>",
      "Comma-separated list of lexicons to exclude"
    )
    .option("-p, --progress", "Show progress information")
    .action(async (options) => {
      try {
        const include = options.include
          ? options.include.split(",")
          : undefined;
        const exclude = options.exclude
          ? options.exclude.split(",")
          : undefined;

        // Check if there's anything to export
        const installed = await getInstalledLexicons();
        if (installed.length === 0) {
          console.log(colors.yellow("No lexicons installed. Nothing to export."));
          console.log(colors.yellow("Tip: Use `wn-cli data download <project>` to install data first."));
          return;
        }

        getWordnetInstance("*");

        console.log(
          colors.bold(`📤 Exporting data in ${options.format} format...`)
        );
        const exportOptions: any = { format: options.format || "json" };
        if (options.output) exportOptions.output = options.output;
        if (include) exportOptions.include = include;
        if (exclude) exportOptions.exclude = exclude;
        const progress = new ProgressIndicator();
        if (options.progress) {
          exportOptions.progress = (p: number) => {
            progress.start(`Exporting: ${Math.round(p * 100)}%`);
          };
        }
        await exportData(exportOptions);
        if (options.progress) {
          progress.stop("Successfully exported data");
        } else {
          console.log(colors.green(`✅ Successfully exported data`));
        }
      } catch (error) {
        console.error(colors.red(`❌ Failed to export data:`), error);
        throw error;
      }
    });

  // Remove
  data
    .command("remove")
    .description("Remove an installed lexicon from the database")
    .argument("<lexiconId>", "ID of the lexicon to remove (e.g., oewn)")
    .option("-f, --force", "Force removal without confirmation")
    .action(async (lexiconId, options) => {
      try {
        if (!options.force) {
          console.log(
            colors.yellow(
              "Warning: This is a destructive action. Use the --force flag to confirm removal."
            )
          );
          return;
        }

        // This is a destructive operation. We must close the DB connection before
        // deleting files.
        await closeWordnetInstance();

        await remove(lexiconId);
        console.log(`✅ Successfully removed ${lexiconId}`);
      } catch (error) {
        console.error(
          colors.red(`❌ Failed to remove lexicon "${lexiconId}":`),
          error
        );
        throw error;
      }
    });
  registerDbUnlockCommand(program);
}

export default registerDataCommands;
