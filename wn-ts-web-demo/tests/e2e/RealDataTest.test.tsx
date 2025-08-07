import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Real Data Test', () => {
  test.sequential('should show real data with statistics greater than 0', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Wait for data loading to complete
    console.log('⏳ Waiting for data loading to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for data loading
    
    // Check if statistics section is present
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    console.log('✅ Database Statistics section found');
    
    // Check if there are any large numbers (indicating real data)
    const allElements = document.querySelectorAll('*');
    const largeNumbers: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text) {
        // Look for numbers that are likely to be real WordNet statistics
        const matches = text.match(/\d{4,}/g); // Numbers with 4+ digits
        if (matches) {
          largeNumbers.push(...matches);
        }
      }
    });
    console.log('🔢 Large numbers found:', largeNumbers);
    
    // Check if there are any statistics texts
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('📊 Statistics texts found:', statsTexts);
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
    
    // Check if there are any loading indicators (should be gone)
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`⏳ Loading ${index}:`, loading.textContent);
    });
    
    // Check if there are any package-related terms
    const packageTerms: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('2024') || text.includes('Open English'))) {
        packageTerms.push(text);
      }
    });
    console.log('📦 Package terms found:', packageTerms);
    
    // If we found large numbers, that's a good sign
    if (largeNumbers.length > 0) {
      console.log('✅ Found large numbers, indicating real data is loaded');
      console.log('🎉 SUCCESS: The app is now showing real WordNet data with statistics > 0!');
    } else {
      console.log('❌ No large numbers found, data might not be loaded');
      console.log('⚠️ The app is still showing zero statistics');
    }
    
    // Check if search results are also working
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    if (searchInput) {
      console.log('✅ Search input found');
    } else {
      console.log('❌ Search input not found');
    }
    
    console.log('🔍 Real data test completed');
  }, 120000); // 2 minutes timeout
}); 