import { Command } from "commander";
import {
  download,
  add,
  remove,
  export as exportData,
  getProjects,
  lexicons as getInstalledLexicons,
} from "wn-ts";
import { colors } from "./utils/colors.js";
import { ProgressIndicator } from "./utils/progress.js";
import {
  getWordnetInstance,
  closeWordnetInstance,
} from "../wordnet-singleton.js";

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
  $ wn-cli data add my-lexicon.xml
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
        const downloadOptions: any = { force: options.force };
        const progress = new ProgressIndicator();
        if (options.progress) {
          downloadOptions.progress = (p: number) => {
            if (!options.quiet) {
              progress.start(`Downloading ${project}: ${Math.round(p * 100)}%`);
            }
          };
        }
        const downloadedPath = await download(project, downloadOptions);
        if (options.progress) {
          progress.stop(`Successfully downloaded ${project}`);
        } else if (!options.quiet) {
          console.log(colors.green(`✅ Successfully downloaded ${project}`));
        }

        if (downloadedPath) {
          if (!options.quiet) {
            console.log(colors.bold(`\n➕ Adding project to database...`));
          }
          const addProgress = new ProgressIndicator();
          const addOptions: any = { force: true };

          if (options.progress) {
            addOptions.progress = (p: number) => {
              if (!options.quiet) {
                addProgress.start(
                  `Adding to database: ${Math.round(p * 100)}%`
                );
              }
            };
          }

          await add(downloadedPath, addOptions);

          if (options.progress) {
            addProgress.stop(`Successfully added ${project} to database.`);
          } else if (!options.quiet) {
            console.log(
              colors.green(`✅ Successfully added ${project} to database.`)
            );
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
        const { lexicons: installedLexicons } = await import("wn-ts");
        const installed = await installedLexicons();
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

        // Must close the database connection before removing files
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
}

export default registerDataCommands;
