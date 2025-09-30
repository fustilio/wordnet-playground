import type { Database } from '../../../types/database.js';
import type { LMFDocument, Word, Synset, Sense } from 'wn-ts-core';

/**
 * Prepare lexicon data for insertion from LMF document
 */
export function prepareLexiconData(
  lmfDocument: LMFDocument,
  projectIdWithVersion: string
): Database["lexicons"][] {
  const lexicons = lmfDocument.lexicons || [];
  
  return lexicons.map((lexicon: any) => ({
    id: projectIdWithVersion, // Use full package ID for consistency
    label: lexicon.label,
    language: lexicon.language ?? null, // Convert undefined to null
    license: lexicon.license ?? null,
    version: lexicon.version ?? null,
    email: lexicon.email || null,
    url: lexicon.url ?? null, // Use nullish coalescing to ensure we always have a value
    citation: lexicon.citation || null,
    logo: lexicon.logo || null,
    requires: null, // Add missing requires field
    metadata: null,
  }));
}

/**
 * Prepare word data for insertion from LMF document
 */
export function prepareWordData(
  lmfDocument: LMFDocument,
  projectIdWithVersion: string
): Database["words"][] {
  const lexicons = lmfDocument.lexicons || [];
  
  return (lmfDocument.words || []).map((word: Word) => ({
    id: word.id,
    lemma: word.lemma,
    pos: word.pos ?? "n",
    language: word.language || lexicons[0]?.language || "en",
    lexicon: projectIdWithVersion, // Always use full package ID for consistency
  }));
}

/**
 * Prepare synset data for insertion from LMF document
 */
export function prepareSynsetData(
  lmfDocument: LMFDocument,
  projectIdWithVersion: string
): Database["synsets"][] {
  const lexicons = lmfDocument.lexicons || [];
  
  return (lmfDocument.synsets || []).map((synset: Synset) => ({
    id: synset.id,
    ili: synset.ili || null,
    pos: synset.pos ?? "n",
    language: synset.language || lexicons[0]?.language || "en",
    lexicon: projectIdWithVersion, // Always use full package ID for consistency
  }));
}

/**
 * Prepare sense data for insertion from LMF document
 */
export function prepareSenseData(
  lmfDocument: LMFDocument,
  validWordIds: Set<string>,
  validSynsetIds: Set<string>
): Database["senses"][] {
  const allSenses = lmfDocument.senses || [];
  
  // Filter out invalid senses to maintain data integrity
  const validSenses = allSenses.filter(
    (sense) =>
      validWordIds.has(sense.wordId) && validSynsetIds.has(sense.synsetId)
  );

  return validSenses.map((sense: Sense) => ({
    id: sense.id,
    word_id: sense.wordId,
    synset_id: sense.synsetId,
    source: sense.source || null,
    sensekey: sense.sensekey || null,
    adjposition: sense.adjposition || null,
    subcategory: sense.subcategory || null,
    domain: sense.domain || null,
    register: sense.register || null,
  }));
}

/**
 * Prepare definition data for insertion from LMF document
 */
export function prepareDefinitionData(
  lmfDocument: LMFDocument
): Database["definitions"][] {
  return (lmfDocument.synsets || []).flatMap((synset: Synset) => {
    return (synset.definitions || []).map((def: any, i: number) => {
      const text = def.text || "";
      // The text can be a string with embedded markup. Strip it for plain text.
      const cleanedText =
        typeof text === "string"
          ? text
              .replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
          : "";

      return {
        id: `${synset.id}.def.${def.language || "en"}.${i}`,
        synset_id: synset.id,
        language: def.language || "en",
        text: cleanedText,
      } as Database["definitions"];
    });
  });
}

/**
 * Validate foreign key references before insertion
 */
export function validateForeignKeyReferences(
  dataToInsert: {
    lexicons: Database["lexicons"][];
    words: Database["words"][];
    synsets: Database["synsets"][];
    senses: Database["senses"][];
    definitions: Database["definitions"][];
  },
  logger?: { error: (message: string, data?: any) => void }
): void {
  const { lexicons, words, synsets, senses, definitions } = dataToInsert;
  
  // Validate words reference existing lexicons
  if (words.length > 0) {
    const referencedLexiconIds = new Set(words.map((w) => w.lexicon));
    const insertedLexiconIds = new Set(lexicons.map((l) => l.id));
    const missingLexiconIds = [...referencedLexiconIds].filter(
      (id) => !insertedLexiconIds.has(id)
    );

    if (missingLexiconIds.length > 0) {
      logger?.error(`words reference non-existent lexicons`, {
        missingLexiconIds,
        availableLexiconIds: [...insertedLexiconIds],
        wordCount: words.length,
      });
      throw new Error(
        `Cannot insert words: they reference lexicons that don't exist: ${missingLexiconIds.join(", ")}`
      );
    }
  }

  // Validate synsets reference existing lexicons
  if (synsets.length > 0) {
    const referencedLexiconIds = new Set(synsets.map((s) => s.lexicon));
    const insertedLexiconIds = new Set(lexicons.map((l) => l.id));
    const missingLexiconIds = [...referencedLexiconIds].filter(
      (id) => !insertedLexiconIds.has(id)
    );

    if (missingLexiconIds.length > 0) {
      logger?.error(`synsets reference non-existent lexicons`, {
        missingLexiconIds,
        availableLexiconIds: [...insertedLexiconIds],
        synsetCount: synsets.length,
      });
      throw new Error(
        `Cannot insert synsets: they reference lexicons that don't exist: ${missingLexiconIds.join(", ")}`
      );
    }
  }

  // Validate senses reference existing words and synsets
  if (senses.length > 0) {
    const referencedWordIds = new Set(senses.map((s) => s.word_id));
    const referencedSynsetIds = new Set(senses.map((s) => s.synset_id));
    const insertedWordIds = new Set(words.map((w) => w.id));
    const insertedSynsetIds = new Set(synsets.map((s) => s.id));

    const missingWordIds = [...referencedWordIds].filter(
      (id) => !insertedWordIds.has(id)
    );
    const missingSynsetIds = [...referencedSynsetIds].filter(
      (id) => !insertedSynsetIds.has(id)
    );

    if (missingWordIds.length > 0 || missingSynsetIds.length > 0) {
      logger?.error(`senses reference non-existent words or synsets`, {
        missingWordIds,
        missingSynsetIds,
        availableWordIds: [...insertedWordIds],
        availableSynsetIds: [...insertedSynsetIds],
        senseCount: senses.length,
      });
      throw new Error(
        `Cannot insert senses: they reference non-existent words: ${missingWordIds.join(", ")} or synsets: ${missingSynsetIds.join(", ")}`
      );
    }
  }

  // Validate definitions reference existing synsets
  if (definitions.length > 0) {
    const referencedSynsetIds = new Set(definitions.map((d) => d.synset_id));
    const insertedSynsetIds = new Set(synsets.map((s) => s.id));
    const missingSynsetIds = [...referencedSynsetIds].filter(
      (id) => !insertedSynsetIds.has(id)
    );

    if (missingSynsetIds.length > 0) {
      logger?.error(`definitions reference non-existent synsets`, {
        missingSynsetIds,
        availableSynsetIds: [...insertedSynsetIds],
        definitionCount: definitions.length,
      });
      throw new Error(
        `Cannot insert definitions: they reference non-existent synsets: ${missingSynsetIds.join(", ")}`
      );
    }
  }
}
