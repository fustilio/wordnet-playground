import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XMLIntrospector } from '../src/XMLIntrospector';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, statSync } from 'fs';
import { runCommand } from '../src/cli';

const tempDir = join(__dirname, 'temp_streaming_test');

describe('_analyzeStructureStreaming', () => {
  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should correctly analyze a simple XML file using streaming', async () => {
    const introspector = new XMLIntrospector();
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <child id="1">value1</child>
  <child id="2">
    <grandchild/>
  </child>
</root>`;
    const filePath = join(tempDir, 'simple.xml');
    writeFileSync(filePath, xmlContent);

    // The method is private, so we need to cast to any to access it for testing.
    const structure = await (introspector as any)._analyzeStructureStreaming(filePath);

    expect(structure.rootElement).toBe('root');
    expect(structure.totalElements).toBe(4);
    expect(structure.maxDepth).toBe(2);
    expect(structure.elementTypes.size).toBe(3);
    
    const rootInfo = structure.elementTypes.get('root');
    expect(rootInfo).toBeDefined();
    expect(rootInfo?.count).toBe(1);
    expect(Array.from(rootInfo!.children)).toEqual(['child']);

    const childInfo = structure.elementTypes.get('child');
    expect(childInfo).toBeDefined();
    expect(childInfo?.count).toBe(2);
    expect(Array.from(childInfo!.attributes)).toEqual(['id']);
    expect(Array.from(childInfo!.children)).toEqual(['grandchild']);

    const grandchildInfo = structure.elementTypes.get('grandchild');
    expect(grandchildInfo).toBeDefined();
    expect(grandchildInfo?.count).toBe(1);
  });

  it('should handle XML with namespaces in attributes', async () => {
    const introspector = new XMLIntrospector();
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <rdf:Description rdf:about="http://example.com">
    <dc:title>Example</dc:title>
  </rdf:Description>
</rdf:RDF>`;
    const filePath = join(tempDir, 'namespaces.xml');
    writeFileSync(filePath, xmlContent);

    const structure = await (introspector as any)._analyzeStructureStreaming(filePath);

    expect(structure.rootElement).toBe('rdf:RDF');
    expect(structure.namespaces.size).toBe(2);
    expect(structure.namespaces.get('xmlns:rdf')).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    expect(structure.namespaces.get('xmlns:dc')).toBe('http://purl.org/dc/elements/1.1/');
    expect(structure.totalElements).toBe(3);

    const descriptionInfo = structure.elementTypes.get('rdf:Description');
    expect(descriptionInfo).toBeDefined();
    expect(Array.from(descriptionInfo!.attributes)).toContain('rdf:about');
    expect(Array.from(descriptionInfo!.children)).toContain('dc:title');
  });
});

describe('CLI command execution via test runner', () => {
  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should run the schema command on a sample file without errors', async () => {
    // This test will help determine if the error is in the code logic
    // or related to the build/execution environment of `node dist/cli.js`.
    const sampleInputPath = join(process.cwd(), 'data', 'output', 'oewn-sample.xml');
    const outputPath = join(tempDir, 'cli-test.xsd');

    // Mock process.exit and console.error to prevent test runner from stopping
    // and to check if they were called.
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand({
      command: 'schema',
      input: sampleInputPath,
      output: outputPath,
    } as any);

    // Verify that no errors were thrown that would cause an exit.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();

    // Verify that the output file was created and is a valid XSD.
    expect(existsSync(outputPath)).toBe(true);
    const xsdContent = readFileSync(outputPath, 'utf8');
    expect(xsdContent).toContain('<xs:schema');
    expect(xsdContent).toContain('name="LexicalResource"'); // Check for a key element

    // Restore mocks
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should process a large XML file (omw-fr.xml) without crashing', async () => {
    const largeFilePath = join(process.cwd(), 'data', 'input', 'omw-fr.xml');
    if (!existsSync(largeFilePath)) {
      console.warn('⚠️ Large file test skipped: omw-fr.xml not found.');
      return;
    }

    const stats = statSync(largeFilePath);
    // Limit test size in CI environments
    if (stats.size > 25 * 1024 * 1024) { 
        console.warn(`⚠️ Large file test skipped: omw-fr.xml is too large for CI (${(stats.size / 1024 / 1024).toFixed(1)}MB).`);
        return;
    }

    const introspector = new XMLIntrospector();
    // The method is private, so we need to cast to any to access it for testing.
    const structure = await (introspector as any)._analyzeStructureStreaming(largeFilePath);

    expect(structure.rootElement).toBe('LexicalResource');
    expect(structure.totalElements).toBeGreaterThan(100000); 
    expect(structure.elementTypes.has('LexicalEntry')).toBe(true);
    expect(structure.elementTypes.has('Synset')).toBe(true);
  }, 60000); // Increase timeout for this test
});
