import { describe, it, expect } from 'vitest';
import { runCommand } from './test-helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

describe('Main CLI Tests', () => {
  it('should show help text with --help', async () => {
    const { stdout, stderr } = await runCommand(['--help']);
    expect(stdout).toContain('WordNet CLI - Interactive TUI and scriptable commands');
    expect(stderr).toBe('');
  });

  it("should show version with --version", async () => {
    const { stdout, stderr } = await runCommand(["--version"]);
    expect(stdout.trim()).toBe(pkg.version);
    expect(stderr).toBe("");
  });

  it("should show an error for an unknown command", async () => {
    const { stdout, stderr } = await runCommand(["unknown-command"]);
    expect(stderr).toContain("error: unknown command 'unknown-command'");
    expect(stdout).toBe("");
  });

});
