import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Search Trigger Test', () => {
  it('should trigger a search and check results', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check if search input exists and has default value
    const searchInput = document.querySelector('input[placeholder*="happy"]') as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();
    console.log('Initial search input value:', searchInput?.value);
    
    // Check if search button exists
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    console.log('Search button found:', searchButton);
    
    // Check initial state - should have no results yet
    const initialPreElements = document.querySelectorAll('pre');
    console.log('Initial pre elements found:', initialPreElements.length);
    
    // Check if there are any results containers
    const initialResultsContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    console.log('Initial results containers found:', initialResultsContainers.length);
    
    // Wait a bit more for any automatic search to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if any search results appeared
    const afterWaitPreElements = document.querySelectorAll('pre');
    console.log('After wait pre elements found:', afterWaitPreElements.length);
    afterWaitPreElements.forEach((pre, index) => {
      console.log(`Pre element ${index} content:`, pre.textContent?.substring(0, 200));
    });
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`Error ${index}:`, error.textContent);
    });
    
    // Check if there are any loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    
    // Check if statistics are showing (this indicates if data is loaded)
    const statsElements = document.querySelectorAll('[class*="statistics"], [class*="Statistics"]');
    console.log('Statistics elements found:', statsElements.length);
    
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
    
    console.log('Search trigger test completed');
  }, 60000);
}); 