import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import ViewHeader from '../../../src/components/shared/ViewHeader.tsx';

describe('ViewHeader', () => {
  it('renders with title', () => {
    const { lastFrame } = render(
      <ViewHeader title="Test View" />
    );

    expect(lastFrame()).toContain('Test View');
  });

  it('renders with lexicon and language', () => {
    const { lastFrame } = render(
      <ViewHeader 
        title="🔍 Word Search" 
        lexicon="oewn" 
        language="en" 
      />
    );

    expect(lastFrame()).toContain('🔍 Word Search');
    expect(lastFrame()).toContain('Lexicon:');
    expect(lastFrame()).toContain('Language:');
  });

  it('renders without lexicon and language', () => {
    const { lastFrame } = render(
      <ViewHeader title="Test View" />
    );

    expect(lastFrame()).toContain('Test View');
    expect(lastFrame()).not.toContain('Lexicon:');
    expect(lastFrame()).not.toContain('Language:');
  });
}); 