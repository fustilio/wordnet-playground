import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Data Loading Debug Test', () => {
  it('should test data loading with detailed logging', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Check if there are any console errors or network issues
    console.log('🔍 Checking for data loading issues...');
    
    // Check if statistics are showing
    const statsElements = document.querySelectorAll('[class*="statistics"], [class*="Statistics"]');
    console.log('📊 Statistics elements found:', statsElements.length);
    
    // Check the actual statistics text
    const allElements = document.querySelectorAll('*');
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
    
    // Check if there are any package loading indicators
    const packageElements = document.querySelectorAll('*');
    const packageTexts: string[] = [];
    packageElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('oewn') || text.includes('package') || text.includes('Package'))) {
        packageTexts.push(text);
      }
    });
    console.log('📦 Package-related texts found:', packageTexts);
    
    // Check if there are any network-related elements
    const networkElements = document.querySelectorAll('*');
    const networkTexts: string[] = [];
    networkElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('download') || text.includes('Download') || text.includes('network') || text.includes('Network'))) {
        networkTexts.push(text);
      }
    });
    console.log('🌐 Network-related texts found:', networkTexts);
    
    // Check if there are any status indicators
    const statusElements = document.querySelectorAll('*');
    const statusTexts: string[] = [];
    statusElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('status') || text.includes('Status') || text.includes('ready') || text.includes('Ready'))) {
        statusTexts.push(text);
      }
    });
    console.log('📋 Status-related texts found:', statusTexts);
    
    console.log('🔍 Data loading debug check completed');
  }, 60000);
}); 