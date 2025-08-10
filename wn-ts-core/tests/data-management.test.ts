import { describe, it, expect } from 'vitest';
import {
  download,
  loadLexicalResource,
} from '../src/data-management';

describe('Data Management (Database-Agnostic)', () => {
  describe('download', () => {
    it('should throw an error as it is not available in core', async () => {
      await expect(download('nonexistent:1.0')).rejects.toThrow('The `download` function is not available in this environment. Please use `wn-ts-node`.');
    });
  });

  describe('loadLexicalResource', () => {
    it('should throw an error as it is not available in core', async () => {
      await expect(loadLexicalResource('/nonexistent/file.xml')).rejects.toThrow('The `loadLexicalResource` function is not available in this environment. Please use `wn-ts-node`.');
    });
  });
});
