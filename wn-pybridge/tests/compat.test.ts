import { describe, it, expect, beforeEach } from 'vitest';
import { WnBridge } from '../src/index.js';

describe('WnBridge Compat Tests', () => {
  let bridge: WnBridge;

  beforeEach(async () => {
    bridge = new WnBridge();
    await bridge.init();
  });

  it('should escape a sense key for XML IDs', async () => {
    const escaped = await bridge.compat.escapeSensekey('ceramic%3:01:00::');
    expect(escaped).toBe('ceramic__3.01.00..');
  });

  it('should unescape a sense key from XML ID format', async () => {
    const unescaped = await bridge.compat.unescapeSensekey('ceramic__3.01.00..');
    expect(unescaped).toBe('ceramic%3:01:00::');
  });

  it('should create a sense key getter for a lexicon', async () => {
    const getter = await bridge.compat.createSenseKeyGetter('oewn:2024');
    expect(getter).toBeDefined();
    expect(typeof getter).toBe('function');
  });

  it('should create a sense getter for a lexicon', async () => {
    const getter = await bridge.compat.createSenseGetter('oewn:2024');
    expect(getter).toBeDefined();
    expect(typeof getter).toBe('function');
  });

  it('should get sense key from a sense', async () => {
    // Get a sense from the wordnet
    const senses = await bridge.senses('entity');
    if (senses.length > 0) {
      const senseKey = await bridge.compat.getSenseKey(senses[0], 'oewn:2024');
      expect(senseKey).toBeDefined();
      expect(typeof senseKey).toBe('string');
    }
  });

  it('should get sense from a sense key', async () => {
    // Test with a known sense key
    const sense = await bridge.compat.getSense('entity%1:03:00::', 'oewn:2024');
    expect(sense).toBeDefined();
  });
}); 