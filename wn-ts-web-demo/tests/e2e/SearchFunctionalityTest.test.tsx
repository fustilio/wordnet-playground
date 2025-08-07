import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Search Functionality Test', () => {
  it('should check if search results are being generated', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check if the search input has the default value
    const searchInput = document.querySelector('input[placeholder*="happy"]') as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();
    console.log('Search input value:', searchInput?.value);
    
    // Check if there are any search results containers
    const resultsContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    console.log('Results containers found:', resultsContainers.length);
    
    // Check if there are any pre elements (which would contain search results)
    const preElements = document.querySelectorAll('pre');
    console.log('Pre elements found:', preElements.length);
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`Error ${index}:`, error.textContent);
    });
    
    // Check if the search button is clickable
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    console.log('Search button found:', searchButton);
    
    // Check if there are any loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    
    // Check if statistics are showing (this indicates if data is loaded)
    const statsElements = document.querySelectorAll('[class*="statistics"], [class*="Statistics"]');
    console.log('Statistics elements found:', statsElements.length);
    
    // Check if there are any console errors by looking for error-related text
    const errorTextElements = document.querySelectorAll('*');
    const errorTexts: string[] = [];
    errorTextElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('error') || text.includes('Error') || text.includes('failed'))) {
        errorTexts.push(text);
      }
    });
    console.log('Error texts found:', errorTexts);
    
    console.log('Search functionality check completed');
  }, 60000);

  it('should check if wordnet methods are available', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check if the app shows any initialization status
    const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"]');
    console.log('Status elements found:', statusElements.length);
    statusElements.forEach((status, index) => {
      console.log(`Status ${index}:`, status.textContent);
    });
    
    // Check if there are any package loading indicators
    const packageElements = document.querySelectorAll('*');
    const packageTexts: string[] = [];
    packageElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('package') || text.includes('Package'))) {
        packageTexts.push(text);
      }
    });
    console.log('Package-related texts found:', packageTexts);
    
    // Check if there are any database-related elements
    const dbElements = document.querySelectorAll('*');
    const dbTexts: string[] = [];
    dbElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('database') || text.includes('Database') || text.includes('SQLite'))) {
        dbTexts.push(text);
      }
    });
    console.log('Database-related texts found:', dbTexts);
    
    console.log('WordNet methods check completed');
  }, 60000);
}); 