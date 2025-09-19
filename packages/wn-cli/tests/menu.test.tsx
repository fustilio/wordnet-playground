import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import Menu from '../src/components/Menu.tsx';

describe('Menu Component', () => {
  it('renders menu items with icons', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(<Menu onSelect={onSelect} />);
    const output = lastFrame();
    
    expect(output).toContain('📋 WordNet CLI - Main Menu');
    expect(output).toContain('🔍  Word Search');
    expect(output).toContain('🌐  Synset Explorer');
    expect(output).toContain('🌍  Cross-Language Search (CILI)');
    expect(output).toContain('✍️   Writing Assistance');
  });

  it('shows category badges', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(<Menu onSelect={onSelect} />);
    const output = lastFrame();
    
    // Check that categories are shown
    expect(output).toContain('Available Features');
  });

  it('renders navigation help', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(<Menu onSelect={onSelect} />);
    const output = lastFrame();
    
    expect(output).toContain('↑↓: Navigate');
    expect(output).toContain('Enter: Select');
    expect(output).toContain('Exit'); // Look for just "Exit" since it's split across lines
  });
}); 