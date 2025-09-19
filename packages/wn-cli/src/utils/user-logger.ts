import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import conf from "../config-manager.js";
import { colors } from "../commands/utils/colors.js";

export function getLogPath(): string {
  // Place log file in the same directory as the config file
  const configDir = dirname(conf.path);
  const logDir = join(configDir, "logs");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return join(logDir, "user-activity.log");
}

export function logInitializationMessage() {
  if (conf.get("enableUsageLogging") as boolean) {
    const logPath = getLogPath();
    // Log to stderr to avoid being captured in command output logs
    console.error(
      colors.dim(
        `[Logging enabled. User interactions will be saved to: ${logPath}]`
      )
    );
  }
}

export function logUserInteraction(
  commandPath: string,
  args: string[],
  output: string
) {
  if (conf.get("enableUsageLogging") as boolean) {
    const logPath = getLogPath();
    const timestamp = new Date().toISOString();
    const commandLine = `wn-cli ${commandPath} ${args.join(" ")}`.trim();

    // Sanitize output to remove ANSI color codes for cleaner logs
    const cleanOutput = output.replace(
      // eslint-disable-next-line no-control-regex
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ""
    );

    const logEntry = `\n---\nTimestamp: ${timestamp}\nCommand: ${commandLine}\nOutput:\n${cleanOutput.trim()}\n---\n`;

    try {
      appendFileSync(logPath, logEntry);
    } catch (error) {
      // Don't crash the app if logging fails, and don't bother the user with it.
    }
  }
}
