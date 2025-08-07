import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Search Debug Test', () => {
  it('should debug search functionality step by step', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check if search input exists
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    expect(searchInput).toBeInTheDocument();
    console.log('Search input found:', searchInput);
    
    // Check if search button exists
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    console.log('Search button found:', searchButton);
    
    // Check if there's any pre element (search results)
    const preElements = document.querySelectorAll('pre');
    console.log('Pre elements found:', preElements.length);
    preElements.forEach((pre, index) => {
      console.log(`Pre element ${index}:`, pre.textContent?.substring(0, 100));
    });
    
    // Check if there are any results containers
    const resultsContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    console.log('Results containers found:', resultsContainers.length);
    
    // Check the current state of the search input
    if (searchInput) {
      console.log('Search input value:', (searchInput as HTMLInputElement).value);
      console.log('Search input placeholder:', searchInput.getAttribute('placeholder'));
    }
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`Error element ${index}:`, error.textContent);
    });
    
    // Check console for any errors
    console.log('App state check completed');
  }, 60000);

  it('should check if wordnet instance is available', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check if the app shows any loading or error states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    
    // Check if statistics are showing
    const statsElements = document.querySelectorAll('[class*="statistics"], [class*="Statistics"]');
    console.log('Statistics elements found:', statsElements.length);
    
    // Check if there are any network or initialization errors in the console
    console.log('WordNet instance check completed');
  }, 60000);
}); 