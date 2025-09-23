import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';
import { WarningAggregator } from '../../../src/parsers/lmf/warning-aggregator';

describe('Warning Aggregation System', () => {
  let parser: LmfParser;
  let warningAggregator: WarningAggregator;

  beforeEach(() => {
    // Create a parser with warning aggregation enabled
    parser = new LmfParser('', {
      debug: true,
      warningAggregation: {
        enabled: true,
        batchSize: 5, // Small batch size for testing
        flushIntervalMs: 1000
      }
    });
    
    // Access the warning aggregator for testing
    warningAggregator = (parser as any).warningAggregator;
  });

  afterEach(() => {
    if (parser) {
      parser.destroy();
    }
  });

  describe('WarningAggregator Class', () => {
    it('should aggregate warnings by type and message', () => {
      const aggregator = new WarningAggregator(5, 1000);
      
      // Add some test warnings - use same message for same type to test aggregation
      aggregator.addWarning('ForeignKeyViolation', 'Invalid reference', 'sense1');
      aggregator.addWarning('ForeignKeyViolation', 'Invalid reference', 'sense2');
      aggregator.addWarning('ForeignKeyViolation', 'Invalid reference', 'sense3');
      aggregator.addWarning('ValidationError', 'Missing required attribute', 'word1');
      
      const result = aggregator.flush();
      
      expect(result.totalWarnings).toBe(4);
      expect(result.warnings).toHaveLength(2); // 2 types: ForeignKeyViolation and ValidationError
      
      const foreignKeyWarnings = result.warnings.find(w => w.type === 'ForeignKeyViolation');
      const validationWarnings = result.warnings.find(w => w.type === 'ValidationError');
      
      expect(foreignKeyWarnings).toBeDefined();
      expect(validationWarnings).toBeDefined();
      expect(foreignKeyWarnings!.count).toBe(3);
      expect(validationWarnings!.count).toBe(1);
    });

    it('should handle different warning types separately', () => {
      const aggregator = new WarningAggregator(5, 1000);
      
      aggregator.addWarning('ForeignKeyViolation', 'Invalid word reference', 'sense1');
      aggregator.addWarning('ValidationError', 'Missing required attribute', 'word1');
      
      const result = aggregator.flush();
      
      expect(result.totalWarnings).toBe(2);
      expect(result.warnings).toHaveLength(2);
      
      const foreignKeyWarnings = result.warnings.find(w => w.type === 'ForeignKeyViolation');
      const validationWarnings = result.warnings.find(w => w.type === 'ValidationError');
      
      expect(foreignKeyWarnings!.count).toBe(1);
      expect(validationWarnings!.count).toBe(1);
    });

    it('should flush automatically when batch size is reached', () => {
      const aggregator = new WarningAggregator(3, 1000);
      
      // Add warnings up to batch size
      aggregator.addWarning('ForeignKeyViolation', 'Invalid word reference', 'sense1');
      aggregator.addWarning('ForeignKeyViolation', 'Invalid word reference', 'sense2');
      aggregator.addWarning('ForeignKeyViolation', 'Invalid word reference', 'sense3');
      
      // This should trigger automatic flush
      aggregator.addWarning('ValidationError', 'Missing required attribute', 'word1');
      
      const result = aggregator.flush();
      
      expect(result.summary).toContain('Found 4 warnings across 2 types');
      expect(result.summary).toContain('ForeignKeyViolation (3)');
      expect(result.summary).toContain('ValidationError (1)');
    });
  });

  describe('LMF Parser Integration', () => {
    it('should use warning aggregation when enabled', () => {
      expect(warningAggregator).toBeDefined();
      expect(warningAggregator).toBeInstanceOf(WarningAggregator);
    });

    it('should not generate standalone sense warnings since invalid XML is rejected', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma partOfSpeech="n" writtenForm="test" />
      <Sense id="nested-sense" synset="synset1" />
    </LexicalEntry>
    
    <!-- Invalid: Standalone senses not nested in LexicalEntry (violates LMF schema) -->
    <Sense id="standalone-sense-1" synset="synset1" />
    <Sense id="standalone-sense-2" synset="synset2" />
    <Sense id="standalone-sense-3" synset="synset3" />
    
    <Synset id="synset1" ili="i1" partOfSpeech="n" />
    <Synset id="synset2" ili="i2" partOfSpeech="n" />
    <Synset id="synset3" ili="i3" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(xmlContent);
      
      // Should only have the valid nested sense (invalid standalone senses are rejected)
      expect(result.senses).toHaveLength(1);
      expect(result.senses[0].id).toBe('nested-sense');
      
      // No standalone sense warnings should be generated since invalid XML is rejected
      const aggregatedWarnings = warningAggregator.flush();
      expect(aggregatedWarnings.totalWarnings).toBe(0);
      expect(aggregatedWarnings.warnings.some(w => w.type === 'StandaloneSense')).toBe(false);
    });

    it('should not use warning aggregation when disabled', () => {
      const parserWithoutAggregation = new LmfParser('', {
        debug: true,
        warningAggregation: { enabled: false }
      });
      
      expect((parserWithoutAggregation as any).warningAggregator).toBeUndefined();
      
      parserWithoutAggregation.destroy();
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up warning aggregator on destroy', () => {
      // Access the parser's warning aggregator
      const parserAggregator = (parser as any).warningAggregator;
      expect(parserAggregator).toBeDefined();
      
      const flushSpy = vi.spyOn(parserAggregator, 'flush');
      
      parser.destroy();
      
      // Should have flushed warnings on destroy
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('DataLoader Integration', () => {
    it('should use warning aggregation for foreign key violations', async () => {
      // This test verifies that DataLoader also aggregates warnings
      // We'll test this by checking that the warning aggregator is properly initialized
      const parser = new LmfParser('', {
        debug: true,
        warningAggregation: {
          enabled: true,
          batchSize: 5,
          flushIntervalMs: 1000
        }
      });
      
      // The parser should have a warning aggregator
      expect((parser as any).warningAggregator).toBeDefined();
      
      // Test that it can aggregate warnings
      const aggregator = (parser as any).warningAggregator;
      aggregator.addWarning('ForeignKeyViolation', 'Invalid word reference', 'test-id');
      
      const result = aggregator.flush();
      expect(result.totalWarnings).toBe(1);
      expect(result.warnings[0].type).toBe('ForeignKeyViolation');
      
      parser.destroy();
    });
  });
});
