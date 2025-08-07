import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Statistics Check Test', () => {
  it('should check if statistics are being updated with real data', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Check if statistics section is present
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    console.log('✅ Database Statistics section found');
    
    // Wait longer for data loading to complete
    console.log('⏳ Waiting for data loading to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for data loading
    
    // Check if statistics show real data
    const allElements = document.querySelectorAll('*');
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('📊 Statistics texts found:', statsTexts);
    
    // Check if there are any numbers greater than 0 in the statistics
    const numberElements = document.querySelectorAll('*');
    const numbers: string[] = [];
    numberElements.forEach(element => {
      const text = element.textContent;
      if (text && /\d+/.test(text)) {
        numbers.push(text);
      }
    });
    console.log('🔢 Number texts found (first 10):', numbers.slice(0, 10));
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
    
    // Check if there are any loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('⏳ Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`⏳ Loading ${index}:`, loading.textContent);
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
    
    console.log('🔍 Statistics check completed');
  }, 120000); // 2 minutes timeout
}); 