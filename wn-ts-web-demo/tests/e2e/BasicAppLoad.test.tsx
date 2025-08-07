import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Basic App Load Test', () => {
  it('should load the app and display basic elements', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check that basic elements are present
    const titleElement = getByText(/WordNet TypeScript Demo/i);
    await expect.element(titleElement).toBeInTheDocument();
    
    console.log('App loaded successfully');
  }, 60000);

  it('should display database statistics section', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check that statistics section is present
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    
    console.log('Database statistics section found');
  }, 60000);

  it('should display OPFS status section', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check that OPFS section is present
    const opfsElement = getByText(/OPFS Status/i);
    await expect.element(opfsElement).toBeInTheDocument();
    
    console.log('OPFS status section found');
  }, 60000);
}); 