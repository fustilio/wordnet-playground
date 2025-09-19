import { vi, beforeEach, afterEach } from "vitest";
import {
  buildProgram,
  capturedCommandPath,
  capturedArgs,
} from "../../src/cli.js";
import { config } from "wn-ts";
import conf from "../../src/config-manager.js";
import { closeWordnetInstance } from "../../src/wordnet-singleton.js";
import { logUserInteraction } from "../../src/utils/user-logger.js";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { format } from "util";

// Set a global timeout for all tests in this suite, as file operations can be slow.
vi.setConfig({
  testTimeout: 120000,
});

let currentTestDir: string;

// This setup runs before each test in every file
beforeEach(() => {
  // Each test gets its own data directory and config to prevent test interference
  currentTestDir = join(tmpdir(), `wn-cli-test-${Date.now()}-${Math.random()}`);
  mkdirSync(currentTestDir, { recursive: true });

  // Set config for the test runner process
  config.dataDirectory = currentTestDir;

  // Set config for the CLI process that will be spawned by runCommand.
  // This ensures the CLI reads from the same isolated directory.
  // We cast to `any` to bypass the `readonly` property check, which is a
  // necessary backdoor for isolated testing.
  (conf as any).path = join(currentTestDir, "config.json");
  conf.clear();
  conf.set("dataDirectory", currentTestDir);
});

// This teardown runs after each test in every file
afterEach(async () => {
  // Ensure the database connection is closed to release file locks
  await closeWordnetInstance();

  // Add a small delay for file handles to be released on Windows
  await new Promise(resolve => setTimeout(resolve, 100));

  // Clean up the test directory
  if (currentTestDir && existsSync(currentTestDir)) {
    try {
      rmSync(currentTestDir, { recursive: true, force: true });
    } catch (error) {
      // On Windows, file locks can sometimes prevent cleanup.
      // We'll log the error but not fail the test suite for it.
      console.warn(`Could not clean up test directory: ${currentTestDir}`, error);
    }
  }
});

// Helper function to run a command and capture output
export async function runCommand(
  argv: string[],
  options: { log?: boolean } = {}
) {
  const { log = true } = options;
  // Set a large terminal width to prevent line wrapping in help output
  process.env.COLUMNS = "200";
  // Disable colors for testing to get clean output
  process.env.NO_COLOR = "1";

  // Mock process.argv and pass the isolated config path to the spawned process
  const originalArgv = process.argv;
  process.argv = ["node", "cli.js", "--config", conf.path, ...argv];

  // Mock process.exit to prevent tests from exiting and to capture exit code
  const mockExit = vi
    .spyOn(process, "exit")
    .mockImplementation((() => {}) as (code?: number) => never);

  const { program } = buildProgram();

  // Capture ALL stdout and stderr
  const stdout: string[] = [];
  const stderr: string[] = [];
  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(str => {
    stdout.push(str.toString());
    return true;
  });
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(str => {
    stderr.push(str.toString());
    return true;
  });

  const logSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
    stdout.push(format(...args) + "\n");
  });

  // Also mock console.info for commands that use it for output (like export)
  const infoSpy = vi.spyOn(console, "info").mockImplementation((...args) => {
    stdout.push(format(...args) + "\n");
  });

  const errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
    const message = format(...args);
    // Commander's exitOverride can log an error message before throwing.
    // We want to suppress this for help display to keep stderr clean for tests.
    if (message.includes("(outputHelp)")) {
      return;
    }
    stderr.push(message + "\n");
  });

  let capturedError: Error | null = null;
  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error) {
    // Commander throws an error when help is displayed, which is expected behavior
    // with exitOverride. We can safely ignore it.
    if (error instanceof Error && (error as any).code !== 'commander.helpDisplayed') {
      capturedError = error;
    }
  }

  // Restore mocks BEFORE logging
  stdoutSpy.mockRestore();
  stderrSpy.mockRestore();
  logSpy.mockRestore();
  infoSpy.mockRestore();
  errorSpy.mockRestore();
  mockExit.mockRestore();
  process.argv = originalArgv;
  delete process.env.COLUMNS;
  delete process.env.NO_COLOR;
  
  const stdoutStr = stdout.join("");
  const stderrStr = stderr.join("");

  if (conf.get("enableUsageLogging") && log && capturedCommandPath) {
    logUserInteraction(
      capturedCommandPath,
      capturedArgs,
      stdoutStr + stderrStr
    );
  }

  // Log for manual sanity checks if needed
  if (process.env.DEBUG_TESTS) {
    console.log(`\n--- Test Run: wn-cli ${argv.join(" ")} ---`);
    if (stdoutStr) {
      console.log("--- STDOUT ---\n" + stdoutStr);
    }
    if (stderrStr) {
      console.log("--- STDERR ---\n" + stderrStr);
    }
    if (capturedError) {
      console.log("--- ERROR ---");
      console.log(capturedError);
    }
    console.log("-----------------------------------------\n");
  }

  return {
    stdout: stdoutStr,
    stderr: stderrStr,
    error: capturedError,
  };
}
