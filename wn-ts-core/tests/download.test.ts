import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile, DownloadError } from '../src/utils/download';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock fetch globally
global.fetch = vi.fn();

describe('downloadFile', () => {
  const testDir = join(tmpdir(), 'wn-ts-test-download');
  const testFile = join(testDir, 'test-download.txt');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test file if it exists
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  it('should download a file successfully', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-length': '100' }),
      body: new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const data = encoder.encode('test content');
          controller.enqueue(data);
          controller.close();
        }
      })
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const progressCallback = vi.fn();
    
    await downloadFile('https://example.com/test.txt', testFile, {
      onProgress: progressCallback
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/test.txt', {
      signal: expect.any(AbortSignal)
    });
    expect(progressCallback).toHaveBeenCalled();
  });

  it('should handle download errors', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers()
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    await expect(
      downloadFile('https://example.com/notfound.txt', testFile)
    ).rejects.toThrow(DownloadError);

    await expect(
      downloadFile('https://example.com/notfound.txt', testFile)
    ).rejects.toThrow('Failed to download file: 404 Not Found');
  });

  it('should handle timeout', async () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      })
    );

    await expect(
      downloadFile('https://example.com/slow.txt', testFile, { timeout: 50 })
    ).rejects.toThrow();
  });

  it('should handle null response body', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-length': '100' }),
      body: null
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    await expect(
      downloadFile('https://example.com/test.txt', testFile)
    ).rejects.toThrow('Response body is null');
  });

  it('should work without content-length header', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(), // No content-length
      body: new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const data = encoder.encode('test content');
          controller.enqueue(data);
          controller.close();
        }
      })
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const progressCallback = vi.fn();
    
    await downloadFile('https://example.com/test.txt', testFile, {
      onProgress: progressCallback
    });

    // Should not call progress callback when no content-length
    expect(progressCallback).not.toHaveBeenCalled();
  });

  it('should create destination directory if it does not exist', async () => {
    const nestedDir = join(testDir, 'nested', 'deep');
    const nestedFile = join(nestedDir, 'test.txt');

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-length': '100' }),
      body: new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const data = encoder.encode('test content');
          controller.enqueue(data);
          controller.close();
        }
      })
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    await downloadFile('https://example.com/test.txt', nestedFile);

    expect(existsSync(nestedFile)).toBe(true);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(
      downloadFile('https://example.com/test.txt', testFile)
    ).rejects.toThrow('Network error');
  });
}); 