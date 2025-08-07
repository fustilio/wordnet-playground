import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Simple Demo Data Test', () => {
  it('should display statistics when data is loaded', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check that statistics are displayed
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    
    // Verify that we have statistics (even if they're zero)
    console.log('Demo data statistics element found');
  }, 30000);

  it('should display a loading indicator when initializing', async () => {
    const { getByText } = render(<App />);
    
    // Check for loading indicators
    const loadingIndicator = getByText(/Initializing|Loading/i);
    await expect.element(loadingIndicator).toBeInTheDocument();
  }, 30000);

  it('should show loaded packages', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check that loaded packages are displayed
    const packagesElement = getByText(/oewn:2024/i);
    await expect.element(packagesElement).toBeInTheDocument();
  }, 30000);
});
