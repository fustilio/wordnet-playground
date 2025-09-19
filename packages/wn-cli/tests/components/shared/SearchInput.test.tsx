import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import SearchInput from '../../../src/components/shared/SearchInput.tsx';

describe('SearchInput Component', () => {
  const mockProps = {
    placeholder: 'Enter search term...',
    onSubmit: vi.fn(),
    loading: false,
  };

  it('renders with placeholder text', () => {
    const { lastFrame } = render(<SearchInput {...mockProps} />);
    expect(lastFrame()).toContain('Enter search term...');
  });

  it('shows loading state', () => {
    const { lastFrame } = render(
      <SearchInput {...mockProps} loading={true} />
    );

    expect(lastFrame()).toContain('Searching...');
  });

  it('renders with error state', () => {
    const { lastFrame } = render(
      <SearchInput {...mockProps} error="Test error" />
    );

    expect(lastFrame()).toContain('Test error');
  });
}); 