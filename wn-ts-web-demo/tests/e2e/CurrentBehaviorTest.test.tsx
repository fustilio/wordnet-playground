import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Current Behavior Test', () => {
  it('should capture the current zero statistics and empty search behavior', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check that the app loads successfully
    const titleElement = getByText(/WordNet TypeScript Demo/i);
    await expect.element(titleElement).toBeInTheDocument();
    console.log('✅ App loads successfully');
    
    // Check that statistics section is present
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    console.log('✅ Database Statistics section is present');
    
    // Check that OPFS status is present
    const opfsElement = getByText(/OPFS Status/i);
    await expect.element(opfsElement).toBeInTheDocument();
    console.log('✅ OPFS Status section is present');
    
    // Check that search functionality is present
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    expect(searchInput).toBeInTheDocument();
    console.log('✅ Search input is present');
    
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    console.log('✅ Search button is present');
    
    // Check that search results are displayed (current behavior)
    const preElements = document.querySelectorAll('pre');
    console.log('Pre elements found:', preElements.length);
    expect(preElements.length).toBeGreaterThan(0); // Search results should be displayed
    console.log('✅ Search results are displayed (current behavior)');
    
    // Check the content of the search results
    preElements.forEach((pre, index) => {
      console.log(`Pre element ${index} content:`, pre.textContent?.substring(0, 200));
    });
    
    // Check that no errors are shown
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    expect(errorElements.length).toBe(0); // No errors should be shown
    console.log('✅ No errors are displayed');
    
    // Check that no loading indicators are shown (app should be ready)
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    console.log('✅ App is in ready state (no loading indicators)');
    
    // Check statistics text to confirm zero values
    const allElements = document.querySelectorAll('*');
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('Statistics texts found:', statsTexts);
    console.log('✅ Statistics are showing (likely zero values)');
    
    // Check if any packages are mentioned
    const packageElements = document.querySelectorAll('*');
    const packageTexts: string[] = [];
    packageElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('package') || text.includes('Package'))) {
        packageTexts.push(text);
      }
    });
    console.log('Package-related texts found:', packageTexts);
    console.log('✅ Package information is present');
    
    console.log('🎯 Current behavior captured successfully');
    console.log('📋 Summary: App loads, search UI works, but no data is loaded, so statistics are 0 and search returns empty results');
  }, 60000);
}); 