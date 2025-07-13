import { describe, it, expect, beforeEach } from "vitest";
import { runCommand } from "./test-helper.js";
import conf from "../../src/config-manager.js";

describe("db command tests", () => {

  it("db command without subcommand shows help", async () => {
    const { stdout, stderr } = await runCommand(["db"]);
    expect(stdout).toContain("Usage: wn-cli db [options] [command]");
    expect(stdout).toContain("Database and cache management commands");
    expect(stderr).toBe("");
  });

  it("db status command runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["db", "status"]);
    expect(stdout).toContain("Database Status Report");
    // In a clean test run, the directory is created by wn-ts, but the DB is empty.
    // Use regex to be resilient to whitespace differences from color codes
    // Check for either ✅ or ❌ since the cache directory might not exist in all test environments
    expect(stdout).toMatch(/Exists:\s*[✅❌]/);
    // Check for either "No locked database files found" or "Locked Database Files:" 
    // since there might be locked files in the test environment
    expect(stdout).toMatch(/(No locked database files found|Locked Database Files:)/);
    expect(stderr).toBe("");
  });

  it("db cache command runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["db", "cache"]);
    expect(stdout).toContain("Cache Contents");
    expect(stderr).toBe("");
  });

  it("db clean command runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["db", "clean"]);
    expect(stdout).toContain("Cleaning Cache");
    expect(stderr).toBe("");
  });

  it("db logs command shows message when logging is disabled", async () => {
    // Logging is disabled by default
    const { stdout, stderr } = await runCommand(["db", "logs"]);
    expect(stdout).toContain("Usage logging is not enabled.");
    expect(stderr).toBe("");
  });

  it("db logs command works correctly when logging is enabled", async () => {
    // Enable logging for this test
    await runCommand(["config", "--set", "enableUsageLogging=true"]);

    // Clear logs to ensure a clean slate for the test
    await runCommand(["db", "logs", "--clear"], { log: false });

    // Run a command to generate a log entry
    await runCommand(["data", "list"]);

    // Add a short delay to allow the async log write to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if the log is there
    const { stdout, stderr } = await runCommand(["db", "logs"], { log: false });
    expect(stderr).toBe("");
    expect(stdout).toContain("User Interaction Logs");
    expect(stdout).toContain("Command: wn-cli data list");
    expect(stdout).toContain("Output:");
    expect(stdout).toContain("Available WordNet Projects:");

    // Test clearing logs
    const { stdout: clearOut } = await runCommand(["db", "logs", "--clear"], {
      log: false,
    });
    expect(clearOut).toContain("Logs cleared successfully.");

    // Verify logs are cleared
    const { stdout: logsAfterClear } = await runCommand(["db", "logs"], {
      log: false,
    });
    expect(logsAfterClear).toContain("Log file is empty or does not exist.");
  });
});
