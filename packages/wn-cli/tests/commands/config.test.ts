import { describe, it, expect } from "vitest";
import { runCommand } from "./test-helper.js";

describe("config command tests", () => {
  it("config command without options shows current config", async () => {
    const { stdout, stderr } = await runCommand(["config"]);
    expect(stdout).toContain("Current Configuration:");
    expect(stdout).toContain("Data Directory:");
    expect(stdout).toContain("Allow Multithreading: false");
    expect(stderr).toBe("");
  });

  it("config --set changes a configuration value", async () => {
    const { stdout, stderr } = await runCommand([
      "config",
      "--set",
      "allowMultithreading=true",
    ]);
    expect(stdout).toContain("✅ Set allowMultithreading = true");
    expect(stderr).toBe("");

    // Verify it was actually set
    const { stdout: stdout2 } = await runCommand(["config"]);
    expect(stdout2).toContain("Allow Multithreading: true");
  });

  it("config --get retrieves a specific value", async () => {
    await runCommand(["config", "--set", "allowMultithreading=true"]);
    const { stdout, stderr } = await runCommand([
      "config",
      "--get",
      "allowMultithreading",
    ]);
    expect(stdout.trim()).toBe("allowMultithreading = true");
    expect(stderr).toBe("");
  });

  it("config --reset restores default values", async () => {
    // Set a non-default value first
    await runCommand(["config", "--set", "allowMultithreading=true"]);
    const { stdout: stdoutSet } = await runCommand(["config"]);
    expect(stdoutSet).toContain("Allow Multithreading: true");

    // Now reset it
    const { stdout: stdoutReset, stderr } = await runCommand([
      "config",
      "--reset",
      "--force",
    ]);
    expect(stdoutReset).toContain("✅ Configuration reset to defaults.");
    expect(stderr).toBe("");

    // Verify it's back to default
    const { stdout: stdoutFinal } = await runCommand(["config"]);
    expect(stdoutFinal).toContain("Allow Multithreading: false");
  });

  it("config --reset without --force shows a warning", async () => {
    const { stdout, stderr } = await runCommand(["config", "--reset"]);
    expect(stdout).toContain(
      "⚠️  This will reset all configuration to defaults."
    );
    expect(stdout).toContain("Use --force to proceed.");
    expect(stderr).toBe("");
  });
});
