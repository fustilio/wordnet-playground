import { Command } from "commander";
import { config as wnTsConfig } from "wn-ts";
import conf, { resetConfig } from "../config-manager.js";
import { colors } from "./utils/colors.js";
import { join, dirname } from "path";

const allowedKeys = ["dataDirectory", "allowMultithreading", "enableUsageLogging"] as const;
type ConfigKey = (typeof allowedKeys)[number];

function registerConfigCommand(program: Command) {
  program
    .command("config")
    .description("Show or modify configuration")
    .option("-s, --set <key=value>", "Set configuration value")
    .option("-g, --get <key>", "Get specific configuration value")
    .option("-r, --reset", "Reset configuration to defaults")
    .option("--force", "Force reset without confirmation")
    .action((options) => {
      if (options.reset) {
        if (!options.force) {
          console.log(
            colors.yellow("⚠️  This will reset all configuration to defaults.")
          );
          console.log("   Use --force to proceed.\n");
          return;
        }
        resetConfig();
        console.log(colors.green("✅ Configuration reset to defaults."));
        return;
      }
      if (options.set) {
        const [key, value] = options.set.split("=");
        if (allowedKeys.includes(key as ConfigKey)) {
          if (key === "allowMultithreading" || key === "enableUsageLogging") {
            const boolValue = value === "true";
            conf.set(key, boolValue);
            if (key === "allowMultithreading") {
              wnTsConfig.allowMultithreading = boolValue; // update current session
            }
            if (key === "enableUsageLogging" && boolValue) {
              const configDir = dirname(conf.path);
              const logPath = join(configDir, "logs", "user-activity.log");
              console.log(
                colors.yellow(
                  `✅ Logging enabled. Logs will be saved to: ${logPath}`
                )
              );
            }
          } else if (key === "dataDirectory") {
            conf.set(key, value);
            wnTsConfig.dataDirectory = value; // update current session
          }
          console.log(colors.green(`✅ Set ${key} = ${value}`));
        } else {
          console.error(colors.red(`❌ Unknown config key: ${key}`));
          console.log(colors.yellow(`Allowed keys: ${allowedKeys.join(", ")}`));
        }
      } else if (options.get) {
        const key = options.get;
        if (allowedKeys.includes(key as ConfigKey)) {
          const val = conf.get(key);
          console.log(`${key} = ${val}`);
        } else {
          console.log(colors.yellow(`Configuration key "${key}" not found`));
          console.log(colors.yellow(`Allowed keys: ${allowedKeys.join(", ")}`));
        }
      } else {
        console.log(colors.bold("Current Configuration:"));
        console.log(colors.dim("====================="));
        console.log(`Data Directory: ${conf.get("dataDirectory")}`);
        console.log(
          `Download Directory: ${wnTsConfig.downloadDirectory || "default"}`
        );
        console.log(`Allow Multithreading: ${conf.get("allowMultithreading")}`);
        console.log(`Enable Usage Logging: ${conf.get("enableUsageLogging")}`);
        console.log(
          colors.yellow(
            "\nTip: Use --set key=value to change a setting, or --get key to view a specific value."
          )
        );
        console.log(colors.yellow(`Allowed keys: ${allowedKeys.join(", ")}`));
      }
    });
}

export default registerConfigCommand;
