import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Real Data Check Test', () => {
  it('should check for real data by looking for specific patterns', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Wait longer for data loading to complete
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for data loading
    
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
    
    // Check if there are any specific WordNet-related terms
    const wordnetTerms: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('synset') || text.includes('lemma') || text.includes('sense') || text.includes('definition'))) {
        wordnetTerms.push(text);
      }
    });
    console.log('📚 WordNet terms found:', wordnetTerms);
    
    // Check if there are any package-related terms
    const packageTerms: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('2024') || text.includes('Open English'))) {
        packageTerms.push(text);
      }
    });
    console.log('📦 Package terms found:', packageTerms);
    
    // Check if there are any loading or status messages
    const statusMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Loading') || text.includes('loading') || text.includes('Progress') || text.includes('progress') || text.includes('Demo') || text.includes('demo'))) {
        statusMessages.push(text);
      }
    });
    console.log('📋 Status messages found:', statusMessages);
    
    // Check if there are any error messages
    const errorMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed'))) {
        errorMessages.push(text);
      }
    });
    console.log('❌ Error messages found:', errorMessages);
    
    // Check if there are any network-related messages
    const networkMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('download') || text.includes('Download') || text.includes('network') || text.includes('Network') || text.includes('fetch') || text.includes('Fetch'))) {
        networkMessages.push(text);
      }
    });
    console.log('🌐 Network messages found:', networkMessages);
    
    // Check if there are any console-like messages
    const consoleMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('🚀') || text.includes('📊') || text.includes('📦') || text.includes('✅') || text.includes('❌'))) {
        consoleMessages.push(text);
      }
    });
    console.log('💬 Console messages found:', consoleMessages);
    
    // Check if there are any statistics-related messages
    const statsMessages: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:') || text.includes('totalWords') || text.includes('totalSynsets'))) {
        statsMessages.push(text);
      }
    });
    console.log('📊 Stats messages found:', statsMessages);
    
    console.log('🔍 Real data check completed');
    
    // If we found large numbers, that's a good sign
    if (largeNumbers.length > 0) {
      console.log('✅ Found large numbers, indicating real data might be loaded');
    } else {
      console.log('❌ No large numbers found, data might not be loaded');
    }
  }, 120000); // 2 minutes timeout
}); 