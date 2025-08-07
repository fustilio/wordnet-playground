import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Data Loading Test', () => {
  it('should check if data is being loaded and why statistics are zero', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check if statistics are showing
    const statsElements = document.querySelectorAll('[class*="statistics"], [class*="Statistics"]');
    console.log('Statistics elements found:', statsElements.length);
    
    // Check the actual statistics text
    const allElements = document.querySelectorAll('*');
    const statsTexts: string[] = [];
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('Words:') || text.includes('Synsets:') || text.includes('Senses:'))) {
        statsTexts.push(text);
      }
    });
    console.log('Statistics texts found:', statsTexts);
    
    // Check if there are any loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    loadingElements.forEach((loading, index) => {
      console.log(`Loading ${index}:`, loading.textContent);
    });
    
    // Check if there are any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    errorElements.forEach((error, index) => {
      console.log(`Error ${index}:`, error.textContent);
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
    console.log('Package-related texts found:', packageTexts);
    
    // Check if there are any database-related elements
    const dbElements = document.querySelectorAll('*');
    const dbTexts: string[] = [];
    dbElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('database') || text.includes('Database') || text.includes('SQLite'))) {
        dbTexts.push(text);
      }
    });
    console.log('Database-related texts found:', dbTexts);
    
    // Check if there are any status indicators
    const statusElements = document.querySelectorAll('*');
    const statusTexts: string[] = [];
    statusElements.forEach(element => {
      const text = element.textContent;
      if (text && (text.includes('status') || text.includes('Status') || text.includes('ready') || text.includes('Ready'))) {
        statusTexts.push(text);
      }
    });
    console.log('Status-related texts found:', statusTexts);
    
    console.log('Data loading check completed');
  }, 60000);
}); 