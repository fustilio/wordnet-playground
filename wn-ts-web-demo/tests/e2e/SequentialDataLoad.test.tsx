import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Sequential Data Load Test', () => {
  test.sequential('should check app initialization', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if the app loads successfully
    const titleElement = getByText(/WordNet TypeScript Demo/i);
    await expect.element(titleElement).toBeInTheDocument();
    console.log('✅ App loads successfully');
    
    // Check if statistics section is present
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    console.log('✅ Database Statistics section found');
    
    // Check if OPFS status is present
    const opfsElement = getByText(/OPFS Status/i);
    await expect.element(opfsElement).toBeInTheDocument();
    console.log('✅ OPFS Status section found');
  }, 30000);

  test.sequential('should check initial state before data loading', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check initial statistics
    const allElements = document.querySelectorAll('*');
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('📊 Initial statistics texts found:', statsTexts);
    
    // Check if there are any loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`⏳ Loading ${index}:`, loading.textContent);
    });
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
  }, 30000);

  test.sequential('should wait for data loading to start', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Wait for data loading to start
    console.log('⏳ Waiting for data loading to start...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check if there are any loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`⏳ Loading ${index}:`, loading.textContent);
    });
    
    // Check if there are any progress indicators
    const progressElements = document.querySelectorAll('[class*="progress"], [class*="Progress"]');
    console.log('📈 Progress elements found:', progressElements.length);
    progressElements.forEach((progress, index) => {
      console.log(`📈 Progress ${index}:`, progress.textContent);
    });
    
    // Check if there are any status messages
    const statusElements = document.querySelectorAll('*');
    const statusTexts: string[] = [];
    statusElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Loading') || text.includes('loading') || text.includes('Progress') || text.includes('progress') || text.includes('Demo') || text.includes('demo'))) {
        statusTexts.push(text);
      }
    });
    console.log('📋 Status texts found:', statusTexts);
  }, 30000);

  test.sequential('should wait for data loading to complete', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Wait for data loading to complete
    console.log('⏳ Waiting for data loading to complete...');
    await new Promise(resolve => setTimeout(resolve, 45000)); // Wait 45 seconds for data loading
    
    // Check if there are any loading indicators (should be gone)
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`⏳ Loading ${index}:`, loading.textContent);
    });
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
  }, 60000);

  test.sequential('should check final statistics after data loading', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Wait for data loading to complete
    console.log('⏳ Waiting for data loading to complete...');
    await new Promise(resolve => setTimeout(resolve, 45000)); // Wait 45 seconds for data loading
    
    // Check final statistics
    const allElements = document.querySelectorAll('*');
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('📊 Final statistics texts found:', statsTexts);
    
    // Check if there are any large numbers (indicating real data)
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
    
    // Check if there are any package-related terms
    const packageTerms: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('2024') || text.includes('Open English'))) {
        packageTerms.push(text);
      }
    });
    console.log('📦 Package terms found:', packageTerms);
    
    // Check if there are any console-like messages
    const consoleMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('🚀') || text.includes('📊') || text.includes('📦') || text.includes('✅') || text.includes('❌'))) {
        consoleMessages.push(text);
      }
    });
    console.log('💬 Console messages found:', consoleMessages);
    
    // If we found large numbers, that's a good sign
    if (largeNumbers.length > 0) {
      console.log('✅ Found large numbers, indicating real data is loaded');
    } else {
      console.log('❌ No large numbers found, data might not be loaded');
    }
  }, 60000);
}); 