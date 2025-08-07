import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import App from '../../src/App';
import { useWordNet } from '../../src/hooks/useWordNet';

vi.mock('../../src/hooks/useWordNet');

describe('Simple Demo Data Test', () => {
  it('should display statistics when data is loaded', async () => {
    vi.mocked(useWordNet).mockReturnValue({
      statistics: {
        totalWords: 123456,
        totalSynsets: 117659,
        totalSenses: 206941,
        totalRelations: 400000,
        totalDefinitions: 180000,
        languages: ['en'],
        partsOfSpeech: ['n', 'v', 'a', 'r'],
        dataSize: 50 * 1024 * 1024,
        lastUpdated: new Date().toISOString(),
        source: 'Mock Data Source'
      },
      loading: false,
      isInitializing: false,
      error: null,
      loadedPackages: ['oewn:2024'],
      // Provide mock functions for all APIs used by the App
      loadPackageData: vi.fn(),
      loadDemoData: vi.fn(),
      queryWords: vi.fn().mockResolvedValue([]),
      querySynsets: vi.fn().mockResolvedValue([]),
      unloadData: vi.fn(),
      clearCacheAndUnload: vi.fn(),
      getCacheInfo: vi.fn().mockResolvedValue({}),
      availablePackages: [],
      wordnet: null,
      dataLoader: null,
      integrity: {
        isValid: true,
        checksum: 'mock-checksum',
        fileSize: 123456,
        compressionType: 'mock-compression',
        format: 'mock-format',
        errors: [],
        warnings: [],
        qualityScore: 100
      },
      dataSource: {
        id: 'mock-id',
        name: 'Mock Data Source',
        version: '1.0',
        url: 'http://mock.url',
        description: 'Mock data source for testing',
        lastChecked: new Date().toISOString(),
        status: 'available'
      },
      progress: 1,
      progressStage: 'Complete',
    });

    const { getByText } = render(<App />);
    
    const statsElement = getByText(/Total Words/i);
    await expect.element(statsElement).toBeInTheDocument();

    // The App component likely formats the number with commas
    const wordsCount = getByText(/123,456/);
    await expect.element(wordsCount).toBeInTheDocument();
  });

  it('should display a loading indicator when initializing', async () => {
    vi.mocked(useWordNet).mockReturnValue({
      statistics: null,
      loading: true,
      isInitializing: true,
      error: null,
      loadedPackages: [],
      loadPackageData: vi.fn(),
      loadDemoData: vi.fn(),
      queryWords: vi.fn().mockResolvedValue([]),
      querySynsets: vi.fn().mockResolvedValue([]),
      unloadData: vi.fn(),
      clearCacheAndUnload: vi.fn(),
      getCacheInfo: vi.fn().mockResolvedValue({}),
      availablePackages: [],
      wordnet: null,
      dataLoader: null,
      integrity: null,
      dataSource: null,
      progress: 0,
      progressStage: 'Initializing...',
    });

    const { getByText } = render(<App />);

    const loadingElement = getByText(/Initializing.../i);
    await expect.element(loadingElement).toBeInTheDocument();
  });
});
