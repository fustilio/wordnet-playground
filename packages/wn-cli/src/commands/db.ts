import { Command } from "commander";
import { join } from "path";
import { homedir } from "os";
import {
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  readFileSync,
} from "fs";
import { colors } from "./utils/colors.js";
import conf from "../config-manager.js";
import { getLogPath } from "../utils/user-logger.js";
import { isDatabaseLocked } from "wn-ts";

class DatabaseCLI {
  private cacheDir = join(homedir(), ".wn_ts_data");
  private demoDirs = [
    ".wn_multilingual_basic_demo",
    ".wn_kitchen_sink_demo",
    ".wn_demo",
    ".wn_data",
    ".wn_test_e2e",
  ];

  async status(options: { verbose?: boolean }) {
    console.log(colors.bold("🔍 Database Status Report"));
    console.log(colors.dim("========================\n"));
    // Check main cache
    console.log(colors.cyan("📁 Main Cache Directory:"));
    console.log(`   Path: ${this.cacheDir}`);
    const exists = existsSync(this.cacheDir);
    console.log(`   Exists: ${exists ? colors.green("✅") : colors.red("❌")}`);
    if (exists) {
      const stats = statSync(this.cacheDir);
      console.log(
        `   Size: ${this.formatBytes(this.getDirSize(this.cacheDir))}`
      );
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    }
    // Check demo directories
    console.log(colors.cyan("\n📁 Demo Directories:"));
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      const exists = existsSync(demoPath);
      console.log(
        `   ${dir}: ${exists ? colors.green("✅") : colors.red("❌")}`
      );
      if (exists) {
        const size = this.getDirSize(demoPath);
        const stats = statSync(demoPath);
        console.log(`     Size: ${this.formatBytes(size)}`);
        console.log(`     Modified: ${stats.mtime.toLocaleString()}`);
        // Check for database files
        const dbFiles = this.findDatabaseFiles(demoPath);
        if (dbFiles.length > 0) {
          console.log(`     Database files: ${dbFiles.length}`);
          for (const file of dbFiles) {
            const filePath = join(demoPath, file);
            const fileStats = statSync(filePath);
            const isLocked = file.endsWith("-journal");
            console.log(
              `       ${file}: ${this.formatBytes(fileStats.size)} ${
                isLocked ? colors.yellow("🔒") : ""
              }`
            );
          }
        }
      }
    }
    // Check for locked databases
    const lockedFiles = this.findLockedDatabases();
    if (lockedFiles.length > 0) {
      console.log(colors.yellow("\n🔒 Locked Database Files:"));
      for (const file of lockedFiles) {
        console.log(`   ${file}`);
      }
    } else {
      console.log(colors.green("\n✅ No locked database files found"));
    }
    if (options.verbose) {
      console.log(colors.cyan("\n📊 Detailed Statistics:"));
      console.log(`   Total demo directories: ${this.demoDirs.length}`);
      console.log(`   Locked files found: ${lockedFiles.length}`);
      console.log(`   Main cache exists: ${existsSync(this.cacheDir)}`);
    }
  }

  async cache() {
    console.log(colors.bold("📚 Cache Contents"));
    console.log(colors.dim("=================\n"));
    if (!existsSync(this.cacheDir)) {
      console.log(colors.yellow("Cache directory does not exist."));
      console.log(
        colors.yellow(
          "Tip: Download a project to create the cache directory. e.g., `wn-cli data download oewn:2024`"
        )
      );
      return;
    }
    const contents = this.getCacheContents(this.cacheDir);
    console.log(colors.cyan(`📁 Cache Directory: ${this.cacheDir}`));
    console.log(`📊 Total Size: ${this.formatBytes(contents.totalSize)}`);
    console.log(`📄 Files: ${contents.files.length}\n`);
    for (const file of contents.files) {
      console.log(`   ${file.name}: ${this.formatBytes(file.size)}`);
    }
  }

  async clean(options: { dryRun?: boolean }) {
    console.log(colors.bold("🧹 Cleaning Cache"));
    console.log(colors.dim("================\n"));
    let totalCleaned = 0;
    let totalSize = 0;
    // Clean demo directories
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      if (existsSync(demoPath)) {
        const size = this.getDirSize(demoPath);
        const prefix = options.dryRun ? colors.yellow("[DRY RUN] ") : "";
        console.log(
          `🗑️  ${prefix}Removing: ${dir} (${this.formatBytes(size)})`
        );
        if (!options.dryRun) {
          try {
            this.removeDirectory(demoPath);
            totalCleaned++;
            totalSize += size;
            console.log(`   ${colors.green("✅")} Removed: ${dir}`);
          } catch (error) {
            console.log(`   ${colors.red("❌")} Failed to remove: ${dir}`);
          }
        } else {
          totalCleaned++;
          totalSize += size;
          console.log(`   ${colors.yellow("[DRY RUN]")} Would remove: ${dir}`);
        }
      }
    }
    console.log(colors.cyan(`\n📊 Cleanup Summary:`));
    console.log(
      `   Directories ${
        options.dryRun ? "that would be " : ""
      }removed: ${totalCleaned}`
    );
    console.log(
      `   Total size ${
        options.dryRun ? "that would be " : ""
      }freed: ${this.formatBytes(totalSize)}`
    );
  }

  private getDirSize(dirPath: string): number {
    if (!existsSync(dirPath)) return 0;
    let size = 0;
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      if (stats.isDirectory()) {
        size += this.getDirSize(itemPath);
      } else {
        size += stats.size;
      }
    }
    return size;
  }

  private findDatabaseFiles(dirPath: string): string[] {
    if (!existsSync(dirPath)) return [];
    const files: string[] = [];
    const items = readdirSync(dirPath);
    for (const item of items) {
      if (item.endsWith(".db") || item.endsWith(".db-journal")) {
        files.push(item);
      }
    }
    return files;
  }

  private findLockedDatabases(): string[] {
    const lockedFiles: string[] = [];
    for (const dir of this.demoDirs) {
      const demoPath = join(homedir(), dir);
      if (existsSync(demoPath)) {
        const dbFiles = this.findDatabaseFiles(demoPath);
        for (const file of dbFiles) {
          if (file.endsWith("-journal")) {
            lockedFiles.push(join(demoPath, file));
          }
        }
      }
    }
    return lockedFiles;
  }

  private getCacheContents(dirPath: string): {
    files: Array<{ name: string; size: number }>;
    totalSize: number;
  } {
    const files: Array<{ name: string; size: number }> = [];
    let totalSize = 0;
    if (!existsSync(dirPath)) {
      return { files, totalSize };
    }
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      if (stats.isFile()) {
        files.push({ name: item, size: stats.size });
        totalSize += stats.size;
      }
    }
    return { files, totalSize };
  }

  private removeDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) return;
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = statSync(itemPath);
      if (stats.isDirectory()) {
        this.removeDirectory(itemPath);
      } else {
        unlinkSync(itemPath);
      }
    }
    rmdirSync(dirPath);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

function registerDbCommands(program: Command) {
  const cli = new DatabaseCLI();
  const db = program
    .command("db")
    .description("Database and cache management commands")
    .action((_options, command) => {
      command.help();
    })
    .addHelpText(
      "after",
      `\nExamples:\n  $ wn-cli db status\n  $ wn-cli db cache\n  $ wn-cli db clean --dry-run`
    );
  db.command("status")
    .description("Show database status, including lock state, cache, and installed lexicons.")
    .option("--verbose", "Show detailed status information")
    .action(async (options) => {
      await cli.status(options);
      // Add lock status check here
      const isLocked = isDatabaseLocked();
      if (isLocked) {
        console.log("  • Locked: Yes (another process may be using the database)");
        console.log("    - Tip: Close other CLI/TUI windows or wait a few seconds.");
        console.log("    - On Windows, file handles may take longer to release.");
      } else {
        console.log("  • Locked: No");
      }
    });
  db.command("cache")
    .description("Show cache contents and file sizes")
    .action(async () => {
      await cli.cache();
    });
  db.command("clean")
    .description("Clean up cache directories to free space")
    .option("--dry-run", "Show what would be cleaned without actually doing it")
    .action(async (options) => {
      await cli.clean(options);
    });

  db.command("logs")
    .description("Show, manage, and dump user interaction logs")
    .option("--tail <n>", "Show the last N log entries")
    .option("--clear", "Clear all logs")
    .option("--path", "Show the path to the log file")
    .action(async (options) => {
      if (!(conf.get("enableUsageLogging") as boolean)) {
        console.log(colors.yellow("Usage logging is not enabled."));
        console.log(
          colors.yellow(
            "Tip: Enable it with `wn-cli config --set enableUsageLogging=true`"
          )
        );
        return;
      }

      const logPath = getLogPath();

      if (options.path) {
        console.log(`Log file path: ${logPath}`);
        return;
      }

      if (options.clear) {
        if (existsSync(logPath)) {
          try {
            unlinkSync(logPath);
            console.log(colors.green("✅ Logs cleared successfully."));
          } catch (error) {
            console.error(colors.red("❌ Failed to clear logs:"), error);
          }
        } else {
          console.log(colors.yellow("No log file to clear."));
        }
        return;
      }

      if (!existsSync(logPath)) {
        console.log(colors.yellow("Log file is empty or does not exist."));
        return;
      }

      const content = readFileSync(logPath, "utf-8");
      if (!content.trim()) {
        console.log(colors.yellow("Log file is empty."));
        return;
      }

      console.log(colors.bold("📋 User Interaction Logs:"));
      console.log(colors.dim("======================="));

      if (options.tail) {
        const entries = content.trim().split("\n---\n");
        const numEntries = parseInt(options.tail, 10);
        if (isNaN(numEntries) || numEntries <= 0) {
          console.error(
            colors.red("Invalid number for --tail. Must be a positive integer.")
          );
          return;
        }
        const lastEntries = entries.slice(-numEntries);
        console.log(lastEntries.join("\n---\n"));
      } else {
        console.log(content);
      }
    });
}

export default registerDbCommands;
