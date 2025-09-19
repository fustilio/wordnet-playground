import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import Settings from '../../src/components/Settings.tsx';

describe('Settings Component', () => {
  const mockProps = {
    lexicon: 'oewn',
    language: 'en',
    onSetLexicon: vi.fn(),
    onSetLanguage: vi.fn(),
    onExit: vi.fn(),
    availableLexicons: ['oewn', 'wn31'],
    availableLanguages: ['en', 'es'],
    lexiconNames: { 'oewn': 'OEWN', 'wn31': 'WordNet 3.1' },
    languageNames: { 'en': 'English', 'es': 'Spanish' }
  };

  it('renders correctly with initial props', () => {
    const { lastFrame } = render(<Settings {...mockProps} />);
    const output = lastFrame();
    
    expect(output).toContain('⚙️ Settings');
    expect(output).toContain('Lexicon:');
    expect(output).toContain('Language:');
  });

  it('renders with correct lexicon and language options', () => {
    const { lastFrame } = render(<Settings {...mockProps} />);
    const output = lastFrame();
    
    expect(output).toContain('OEWN');
    expect(output).toContain('English');
  });
});
