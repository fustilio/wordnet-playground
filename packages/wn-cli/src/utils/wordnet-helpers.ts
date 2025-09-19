import { Wordnet, ili, synset as wnSynset } from "wn-ts";
import type { PartOfSpeech } from "wn-ts";
import { colors } from "../commands/utils/colors.js";

export interface WordResult {
  lemma: string;
  partOfSpeech: string;
  id: string;
  language?: string;
  lexicon?: string;
}

export interface SynsetResult {
  id: string;
  definitions: Array<{ text: string }>;
  members: string[];
  relations?: any[];
  ili?: string;
  partOfSpeech?: PartOfSpeech;
}

export interface SenseResult {
  id: string;
  synset: string;
}

export class WordNetHelper {
  private wn: Wordnet;
  private lexicon: string;

  constructor(lexicon = "oewn") {
    this.wn = new Wordnet(lexicon);
    this.lexicon = lexicon;
  }

  async searchWords(
    word: string,
    pos?: PartOfSpeech,
    language?: string
  ): Promise<WordResult[]> {
    try {
      const words = await this.wn.words(word, pos);
      let results = words.map((w: any) => ({
        lemma: w.lemma,
        partOfSpeech: w.partOfSpeech,
        id: w.id,
        language: w.language,
        lexicon: w.lexicon,
      }));
      if (language) {
        results = results.filter((w) => w.language === language);
      }
      return results;
    } catch (error) {
      console.error("WordNet search error:", error);
      return [];
    }
  }

  async searchSynsets(
    word: string,
    pos?: PartOfSpeech
  ): Promise<SynsetResult[]> {
    try {
      const synsets = await this.wn.synsets(word, pos);
      return synsets.map((s: any) => ({
        id: s.id,
        definitions: s.definitions || [],
        members: s.members || [],
        relations: s.relations || [],
        ili: s.ili,
        partOfSpeech: s.partOfSpeech,
      }));
    } catch (error) {
      console.error("WordNet synset search error:", error);
      return [];
    }
  }

  async getSynset(id: string): Promise<SynsetResult | null> {
    try {
      const synset = await wnSynset(id, { lexicon: this.lexicon });
      if (!synset) return null;

      return {
        id: synset.id,
        definitions: synset.definitions || [],
        members: synset.members || [],
        relations: synset.relations || [],
        ili: synset.ili,
        partOfSpeech: synset.partOfSpeech,
      };
    } catch (error) {
      console.error("WordNet getSynset error:", error);
      return null;
    }
  }

  async getIli(iliId: string): Promise<any> {
    try {
      return await this.wn.ili(iliId);
    } catch (error) {
      console.error("ILI lookup error:", error);
      return null;
    }
  }

  async searchSenses(word: string, pos?: PartOfSpeech): Promise<SenseResult[]> {
    try {
      const senses = await this.wn.senses(word, pos);
      return senses.map((s: any) => ({
        id: s.id,
        synset: s.synset,
      }));
    } catch (error) {
      console.error("WordNet sense search error:", error);
      return [];
    }
  }
}

export async function getBestDefinition(synset: any): Promise<string> {
  // First try the current synset's definitions
  if (synset.definitions && synset.definitions.length > 0) {
    return synset.definitions[0].text;
  }

  // If no definition in current lexicon, try to get English definition via ILI
  if (synset.ili) {
    try {
      // Try to get English definition from ILI
      const iliEntry = await ili(synset.ili);
      if (iliEntry && iliEntry.definition) {
        return iliEntry.definition;
      }
    } catch (e) {
      // Ignore ILI lookup errors
    }
  }

  // Provide helpful fallback message
  if (synset.ili) {
    const tip = colors.gray(
      "(An English definition may be available via the ILI mapping)"
    );
    return `${colors.yellow(
      "No definition available in this lexicon."
    )} ${tip}`;
  }

  return colors.yellow("No definition available in this lexicon.");
}
