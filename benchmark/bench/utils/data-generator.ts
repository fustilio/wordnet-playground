import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

export interface LMFDataConfig {
  numWords: number;
  numSynsets: number;
  numRelations: number;
  includeExamples: boolean;
  includeDefinitions: boolean;
}

export class LMFDataGenerator {
  private cache = new Map<string, string>();

  async generateLMF(config: LMFDataConfig, name: string): Promise<string> {
    const cacheKey = `${name}-${JSON.stringify(config)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const testDir = join(tmpdir(), 'wordnet-benchmark-data');
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
    
    const filePath = join(testDir, `${name}-${config.numWords}-${config.numSynsets}.xml`);

    if (existsSync(filePath)) {
      this.cache.set(cacheKey, filePath);
      return filePath;
    }

    const xmlContent = this.generateXMLContent(config);
    await writeFile(filePath, xmlContent);
    
    this.cache.set(cacheKey, filePath);
    return filePath;
  }

  private generateXMLContent(config: LMFDataConfig): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource lmfVersion="1.0">
  <Lexicon id="benchmark-lexicon" label="Benchmark Lexicon" language="en" version="1.0" email="" license="" url="" citation="" logo="">`;

    // Generate synsets first
    for (let i = 0; i < config.numSynsets; i++) {
      xml += `\n    <Synset id="bench-synset-${i}" ili="i${i.toString().padStart(8, '0')}" partOfSpeech="n">`;
      if (config.includeDefinitions) {
        xml += `\n      <Definition language="en">Definition for benchmark synset ${i}</Definition>`;
      }
      if (config.includeExamples) {
        xml += `\n      <Example language="en">Example sentence for synset ${i}</Example>`;
      }
      xml += `\n    </Synset>`;
    }

    // Generate words and senses
    for (let i = 0; i < config.numWords; i++) {
      const synsetId = i % config.numSynsets;
      xml += `\n    <LexicalEntry id="bench-word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="bench-sense-${i}" synset="bench-synset-${synsetId}"/>`;
      if (config.includeExamples) {
        xml += `\n      <Example language="en">Example for word ${i}</Example>`;
      }
      xml += `\n    </LexicalEntry>`;
    }

    xml += `\n  </Lexicon>
</LexicalResource>`;

    return xml;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Predefined configurations for common benchmark scenarios
export const BENCHMARK_CONFIGS = {
  tiny: { numWords: 1, numSynsets: 1, numRelations: 0, includeExamples: false, includeDefinitions: false },
  small: { numWords: 10, numSynsets: 10, numRelations: 5, includeExamples: true, includeDefinitions: true },
  medium: { numWords: 100, numSynsets: 100, numRelations: 50, includeExamples: true, includeDefinitions: true },
  large: { numWords: 1000, numSynsets: 1000, numRelations: 500, includeExamples: true, includeDefinitions: true },
  huge: { numWords: 10000, numSynsets: 10000, numRelations: 5000, includeExamples: false, includeDefinitions: true },
} as const; 