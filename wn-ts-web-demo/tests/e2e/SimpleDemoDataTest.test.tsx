import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../src/App';

describe('Simple Demo Data Test', () => {
  it('should load demo data and display statistics', async () => {
    render(<App />);
    
    // Wait for the data to be loaded automatically by the useWordNet hook
    const statsElement = page.getByText(/Total Words/i);
    await expect.element(statsElement).toBeInTheDocument({ timeout: 60000 });

    const wordsCount = page.getByText(/[1-9]\d{3,}/); // Look for a number > 1000
    await expect.element(wordsCount).toBeInTheDocument();
  }, 60000);
});
