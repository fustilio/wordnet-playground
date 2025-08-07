import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('React Data Load Test', () => {
  it('should check if data loading is happening in the React app', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 30000));
    
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
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('❌ Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`❌ Error ${index}:`, error.textContent);
    });
    
    // Check if there are any status messages
    const statusElements = document.querySelectorAll('*');
    const statusTexts: string[] = [];
    statusElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Loading') || text.includes('loading') || text.includes('Progress') || text.includes('progress'))) {
        statusTexts.push(text);
      }
    });
    console.log('📋 Status texts found:', statusTexts);
    
    // Check if there are any package-related messages
    const packageElements = document.querySelectorAll('*');
    const packageTexts: string[] = [];
    packageElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('package') || text.includes('Package'))) {
        packageTexts.push(text);
      }
    });
    console.log('📦 Package texts found:', packageTexts);
    
    // Check if there are any network-related messages
    const networkElements = document.querySelectorAll('*');
    const networkTexts: string[] = [];
    networkElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('download') || text.includes('Download') || text.includes('network') || text.includes('Network'))) {
        networkTexts.push(text);
      }
    });
    console.log('🌐 Network texts found:', networkTexts);
    
    // Check if there are any console messages by looking for any text that might indicate data loading
    const allElements = document.querySelectorAll('*');
    const allTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && text.length > 0) {
        allTexts.push(text);
      }
    });
    console.log('📄 All texts found (first 10):', allTexts.slice(0, 10));
    
    console.log('🔍 React data load check completed');
  }, 60000);
}); 