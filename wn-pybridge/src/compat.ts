import { python } from 'pythonia';
import { WnBridge } from './index.js';

export class Compat {
  private bridge: WnBridge;
  private pythonSensekey: any = null;

  constructor(bridge: WnBridge) {
    this.bridge = bridge;
  }

  private async ensureSensekeyInitialized(): Promise<void> {
    if (!this.pythonSensekey) {
      this.pythonSensekey = await python('wn.compat.sensekey');
    }
  }

  /**
   * Escape a sense key to make it valid for XML IDs
   */
  async escapeSensekey(senseKey: string, flavor: string = 'oewn'): Promise<string> {
    await this.ensureSensekeyInitialized();
    return await this.pythonSensekey.escape(senseKey, flavor);
  }

  /**
   * Unescape a sense key from XML ID format back to original form
   */
  async unescapeSensekey(escapedKey: string, flavor: string = 'oewn'): Promise<string> {
    await this.ensureSensekeyInitialized();
    return await this.pythonSensekey.unescape(escapedKey, flavor);
  }

  /**
   * Create a function to get sense keys from senses
   */
  async createSenseKeyGetter(lexicon: string): Promise<any> {
    await this.ensureSensekeyInitialized();
    return await this.pythonSensekey.sense_key_getter(lexicon);
  }

  /**
   * Create a function to get senses from sense keys
   */
  async createSenseGetter(lexicon: string, wordnet?: any): Promise<any> {
    await this.ensureSensekeyInitialized();
    if (wordnet) {
      return await this.pythonSensekey.sense_getter(lexicon, wordnet);
    } else {
      return await this.pythonSensekey.sense_getter(lexicon);
    }
  }

  /**
   * Get sense key from a sense using the appropriate getter
   */
  async getSenseKey(sense: any, lexicon: string): Promise<string | null> {
    const getter = await this.createSenseKeyGetter(lexicon);
    const pythonSense = await this.bridge.getPythonSense(sense.id);
    return await getter(pythonSense);
  }

  /**
   * Get sense from a sense key using the appropriate getter
   */
  async getSense(senseKey: string, lexicon: string): Promise<any | null> {
    const getter = await this.createSenseGetter(lexicon);
    return await getter(senseKey);
  }
} 