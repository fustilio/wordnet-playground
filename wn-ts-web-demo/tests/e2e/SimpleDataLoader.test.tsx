import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import { SimpleDataLoader } from '../../src/components/SimpleDataLoader';

describe('Simple Data Loader Test', () => {
  test.sequential('should load data and display statistics in React component', async () => {
    const { getByText } = render(<SimpleDataLoader />);
    
    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if loading state is shown
    const loadingElement = getByText(/Loading WordNet Data/i);
    await expect.element(loadingElement).toBeInTheDocument();
    console.log('✅ Loading state displayed');
    
    // Wait for data loading to complete
    console.log('⏳ Waiting for data loading to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for data loading
    
    // Check if success state is shown
    const successElement = getByText(/WordNet Data Loaded Successfully/i);
    await expect.element(successElement).toBeInTheDocument();
    console.log('✅ Success state displayed');
    
    // Check if statistics are displayed
    const wordsElement = getByText(/Words/i);
    await expect.element(wordsElement).toBeInTheDocument();
    console.log('✅ Words statistics displayed');
    
    const synsetsElement = getByText(/Synsets/i);
    await expect.element(synsetsElement).toBeInTheDocument();
    console.log('✅ Synsets statistics displayed');
    
    const sensesElement = getByText(/Senses/i);
    await expect.element(sensesElement).toBeInTheDocument();
    console.log('✅ Senses statistics displayed');
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
    
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
    
    // If we found large numbers, that's a good sign
    if (largeNumbers.length > 0) {
      console.log('✅ Found large numbers, indicating real data is loaded');
    } else {
      console.log('❌ No large numbers found, data might not be loaded');
    }
    
    console.log('✅ Simple data loader test completed successfully!');
  }, 120000); // 2 minutes timeout
}); 