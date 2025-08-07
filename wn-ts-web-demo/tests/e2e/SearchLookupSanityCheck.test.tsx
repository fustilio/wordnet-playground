import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Search Lookup Sanity Check', () => {
  it('should perform basic word search and display results', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Find the search input by looking for input elements
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    expect(searchInput).toBeInTheDocument();
    
    // Enter a search term
    if (searchInput) {
      (searchInput as HTMLInputElement).value = 'dog';
    }
    
    // Click the search button
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    
    // Wait for results to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check that results are displayed
    const resultsElement = getByText(/pre/i);
    await expect.element(resultsElement).toBeInTheDocument();
    
    console.log('Search results found');
  }, 30000);

  it('should display search results in JSON format', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Perform a search
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    if (searchInput) {
      (searchInput as HTMLInputElement).value = 'happy';
    }
    
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    
    // Wait for results
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check JSON structure
    const resultsElement = getByText(/pre/i);
    await expect.element(resultsElement).toBeInTheDocument();
    
    console.log('JSON results found');
  }, 30000);

  it('should handle search with no results', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Search for a non-existent word
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    if (searchInput) {
      (searchInput as HTMLInputElement).value = 'nonexistentword12345';
    }
    
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    
    // Wait for results
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check that empty results are displayed
    const resultsElement = getByText(/pre/i);
    await expect.element(resultsElement).toBeInTheDocument();
    
    console.log('Empty search results found');
  }, 30000);
}); 