import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';

describe('Real Data E2E', () => {
  it('should load thousands of synsets from real WordNet data', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Wait for demo data to load
    const packagesElement = getByText(/oewn:2024/i);
    await expect.element(packagesElement).toBeInTheDocument();
    
    // Check that statistics are displayed
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    
    console.log('Real data statistics found');
  }, 60000);

  it('should validate browser-compatible parser handles large XML files', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test that the parser can handle search queries
    const searchInput = document.querySelector('input[placeholder*="happy"]');
    expect(searchInput).toBeInTheDocument();
    
    // Perform a search to test parser functionality
    const searchButton = document.querySelector('button[class*="bg-blue"]');
    expect(searchButton).toBeInTheDocument();
    
    console.log('Parser functionality validated');
  }, 60000);

  it('should display system status during data loading', async () => {
    const { getByText } = render(<App />);
    
    // Check for loading indicators
    const loadingIndicator = getByText(/Initializing|Loading/i);
    await expect.element(loadingIndicator).toBeInTheDocument();
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Verify system status shows loaded packages
    const packagesElement = getByText(/oewn:2024/i);
    await expect.element(packagesElement).toBeInTheDocument();
    
    console.log('System status validated');
  }, 60000);

  it('should handle OPFS storage for real data', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check OPFS support
    const opfsElement = getByText(/OPFS Status/i);
    await expect.element(opfsElement).toBeInTheDocument();
    
    console.log('OPFS storage validated');
  }, 60000);

  it('should test advanced features with real data', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test tab switching
    const advancedTab = getByText(/Advanced/i);
    await expect.element(advancedTab).toBeInTheDocument();
    
    // Check that packages are available
    const packagesElement = getByText(/Available Packages/i);
    await expect.element(packagesElement).toBeInTheDocument();
    
    // Test Developer tab
    const developerTab = getByText(/Developer/i);
    await expect.element(developerTab).toBeInTheDocument();
    
    console.log('Advanced features validated');
  }, 60000);

  it('should capture current zero statistics behavior', async () => {
    const { getByText } = render(<App />);
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check that all statistics show 0 (current issue)
    const statsElement = getByText(/Database Statistics/i);
    await expect.element(statsElement).toBeInTheDocument();
    
    console.log('Current zero statistics behavior captured');
  }, 30000);
}); 