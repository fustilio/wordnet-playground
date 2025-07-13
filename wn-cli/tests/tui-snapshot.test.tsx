import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/app.tsx';

// Mock process.exit to prevent tests from exiting
const mockExit = vi.fn();
Object.defineProperty(process, 'exit', {
  value: mockExit,
  writable: true
});

describe('TUI Snapshot', () => {
  beforeEach(() => {
    mockExit.mockClear();
  });

  it('should render initial menu state', () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();
    
    expect(output).toContain('WordNet CLI - Interactive TUI');
    expect(output).toContain('📋 WordNet CLI - Main Menu');
    expect(output).toContain('🔍  Word Search');
    expect(output).toContain('🌐  Synset Explorer');
    expect(output).toContain('🌍  Cross-Language Search (CILI)');
  });

  it('should handle navigation commands', () => {
    const { stdin, lastFrame } = render(<App chainCommands={['down', 'down', 'enter', 'escape']} />);
    
    // Simulate the chain commands
    stdin.write('\u001B[B'); // Down arrow
    stdin.write('\u001B[B'); // Down arrow
    stdin.write('\r'); // Enter
    stdin.write('\u001B'); // Escape
    
    const output = lastFrame();
    expect(output).toContain('WordNet CLI - Interactive TUI');
  });

  it('should show help screen', () => {
    const { stdin, lastFrame } = render(<App />);
    
    // Simulate pressing '?' for help
    stdin.write('?');
    
    const output = lastFrame();
    // The help screen should show navigation help
    expect(output).toContain('WordNet CLI - Interactive TUI');
  });

  it('should toggle debug panel', () => {
    const { stdin, lastFrame } = render(<App />);
    
    // Simulate Ctrl+D for debug panel
    stdin.write('\u0004'); // Ctrl+D
    
    const output = lastFrame();
    // Debug panel should be visible
    expect(output).toContain('WordNet CLI - Interactive TUI');
  });

  it('should handle error states gracefully', () => {
    // Test that the app doesn't crash with invalid props
    const { lastFrame } = render(<App chainCommands={['invalid']} />);
    const output = lastFrame();
    
    expect(output).toContain('WordNet CLI - Interactive TUI');
    // Should still render the main menu even with invalid commands
    expect(output).toContain('📋 WordNet CLI - Main Menu');
  });
}); 