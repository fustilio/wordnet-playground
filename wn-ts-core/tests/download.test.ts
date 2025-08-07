import { describe, it, expect } from 'vitest';
import { downloadFile } from '../src/utils/download';

describe('downloadFile', () => {
  it('should throw an error because it is not available in core', async () => {
    await expect(downloadFile('https://example.com/test.txt', 'test.txt')).rejects.toThrow('The `downloadFile` function is not available in this environment. Please use `wn-ts-node`.');
  });
});
