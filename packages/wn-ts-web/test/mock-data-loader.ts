import { WebDatabase } from "../src/client/submodules/web-database.js";
import type { WebWordnet } from "../src/client/submodules/web-wordnet.js";
import { DataLoader } from "../src/data-management/index.js";
import { Project } from "../src/project.js";
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('MockDataLoader');

/**
 * A DataLoader for testing purposes that uses mock data as a fallback or directly.
 */
export class MockDataLoader extends DataLoader {
  public mockStatistics: any;
  public mockIntegrity: any;
  public mockDataSource: any;

  constructor(database: WebDatabase, wordnet: WebWordnet) {
    super(database, wordnet);
  }

  getQueryService() {
    return (this as any).config.wordnet.getQueryService();
  }

  get database() {
    return (this as any).config.wordnet.getQueryService().database;
  }

  /**
   * Override downloadAndLoad to provide mock data on failure.
   */
  async downloadAndLoad(
    projectIdWithVersion: string,
    options: any = {}
  ): Promise<void> {
    try {
      // First, attempt to use the real DataLoader's logic
      await super.downloadAndLoad(projectIdWithVersion, options);
    } catch (error) {
      logger.warn(
        `🔴 Real data loading failed, falling back to mock data for ${projectIdWithVersion}. Error: ${error}`
      );
      // If the real download/load fails, use mock data
      await this.loadMockData(projectIdWithVersion);
    }
  }

  /**
   * Directly load mock data without attempting to download.
   */
  public async loadMockData(projectIdWithVersion: string): Promise<void> {
    logger.info(`Inserting mock data for ${projectIdWithVersion}...`);
    
    try {
      const mockData = await this.insertMockLargeDataset(projectIdWithVersion);
      this.mockStatistics = mockData.statistics;
      this.mockIntegrity = mockData.integrity;
      this.mockDataSource = mockData.dataSource;
      logger.success(`Successfully loaded mock large dataset for ${projectIdWithVersion}`);
    } catch (error) {
      logger.error(`Failed to load mock large dataset for ${projectIdWithVersion}:`, error);
      logger.info(`Falling back to sample data for ${projectIdWithVersion}...`);
      await this.insertSampleData(projectIdWithVersion);
      logger.success(`Successfully loaded sample data for ${projectIdWithVersion}`);
    }
    
  }

  /**
   * Get mock statistics for UI display (if available)
   */
  getMockStatistics(): any {
    return this.mockStatistics;
  }

  /**
   * Get mock integrity for UI display (if available)
   */
  getMockIntegrity(): any {
    return this.mockIntegrity;
  }

  /**
   * Get mock data source for UI display (if available)
   */
  getMockDataSource(): any {
    return this.mockDataSource;
  }

  /**
   * Insert sample data for testing when downloads fail
   */
  public async insertSampleData(projectIdWithVersion: string): Promise<void> {
    logger.info(`📝 Inserting sample data for ${projectIdWithVersion}...`);

    try {
      const project = new Project(projectIdWithVersion);
      logger.info(`🔍 Debug: projectId = ${project.id}`);
      logger.info(`🔍 Debug: project =`, project);

      // Use base lexicon ID (without version) for database queries
      const baseLexiconId = project.id.includes(':') ? project.id.split(':')[0] : project.id;

      // Insert sample lexicon using real project data
      try {
        const queryService = this.getQueryService();
        const label =
          project.label || `Sample ${project.id.toUpperCase()}`;
        const language = project.language;
        const license = project.license;

        logger.info(
          `🔍 Debug: Final values - label: "${label}", language: "${language}", license: "${license}"`
        );

        if (queryService) {
          await queryService.insertLexicon({
            id: baseLexiconId,
            label: label,
            language: language,
            license: license,
            version: project.version ?? "",
          });
        } else {
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO lexicons (id, label, language, license) VALUES (?, ?, ?, ?)",
            [baseLexiconId, label, language, license]
          );
        }
        logger.success(
          `✅ Sample lexicon inserted for ${baseLexiconId}`
        );
      } catch (error) {
        logger.warn(
          `✅ Lexicon ${projectIdWithVersion} already exists or insertion failed: ${error instanceof Error ? error.message : String(error)}`
        );
        // Continue with data insertion even if lexicon already exists
      }

      // Insert sample words
      const sampleWords = [
        ["happy", "a", "happy.a.01"],
        ["run", "v", "run.v.01"],
        ["book", "n", "book.n.01"],
        ["quickly", "r", "quickly.r.01"],
        ["water", "n", "water.n.01"],
        ["computer", "n", "computer.n.01"], // Add computer for tests
        ["information", "n", "information.n.01"], // Add information for tests
      ];

      for (const [lemma, pos, synsetId] of sampleWords) {
        try {
          // Insert word with correct ID format for senses query
          const wordId = `${lemma}-${pos}-1`;
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO words (id, lemma, pos, language, lexicon) VALUES (?, ?, ?, ?, ?)",
            [wordId, lemma, pos, "en", baseLexiconId] // Use base lexicon ID
          );

          // Insert synset with ILI identifier
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO synsets (id, pos, language, lexicon, ili) VALUES (?, ?, ?, ?, ?)",
            [synsetId, pos, "en", baseLexiconId, `i-${synsetId}`] // Use base lexicon ID and add ILI
          );

          // Insert sense
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO senses (id, word_id, synset_id, source, sensekey, adjposition, subcategory, domain, register) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [`${wordId}.sense.1`, wordId, synsetId, null, null, null, null, null, null]
          );

          // Insert definition
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
            [`${synsetId}.def.en`, synsetId, "en", `Definition of ${lemma}`]
          );
        } catch (error) {
          logger.error(`❌ Failed to insert sample word ${lemma}:`, error);
        }
      }

      // Check if synsets table exists and has correct schema
      try {
        const tableInfo = await (this as any).config.wordnet.getQueryService().query("PRAGMA table_info(synsets)");
        
        // Also check if the table exists at all
        const tableExists = await (this as any).config.wordnet.getQueryService().query("SELECT name FROM sqlite_master WHERE type='table' AND name='synsets'");
        
        // Check all tables
        const allTables = await (this as any).config.wordnet.getQueryService().query("SELECT name FROM sqlite_master WHERE type='table'");
      } catch (error) {
        console.error(`❌ Failed to get table info:`, error);
      }

      // Insert sample synsets
      const sampleSynsets = [
        ["happy.a.01", "a"],
        ["run.v.01", "v"],
        ["book.n.01", "n"],
        ["quickly.r.01", "r"],
        ["water.n.01", "n"],
        ["computer.n.01", "n"], // Add computer synset
        ["information.n.01", "n"], // Add information synset
      ];

      for (const [synsetId, pos] of sampleSynsets) {
        try {
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO synsets (id, pos, language, lexicon, ili) VALUES (?, ?, ?, ?, ?)",
            [synsetId, pos, "en", baseLexiconId, `i-${synsetId}`] // Use base lexicon ID and add ILI
          );
        } catch (error) {
          console.error(`❌ Failed to insert synset ${synsetId}:`, error);
          throw error;
        }
      }

      // Insert sample senses
      const sampleSenses = [
        ["happy-a-1.sense.1", "happy-a-1", "happy.a.01"],
        ["run-v-1.sense.1", "run-v-1", "run.v.01"],
        ["book-n-1.sense.1", "book-n-1", "book.n.01"],
        ["quickly-r-1.sense.1", "quickly-r-1", "quickly.r.01"],
        ["water-n-1.sense.1", "water-n-1", "water.n.01"],
        ["computer-n-1.sense.1", "computer-n-1", "computer.n.01"], // Add computer sense
        ["information-n-1.sense.1", "information-n-1", "information.n.01"], // Add information sense
      ];

      for (const [senseId, wordId, synsetId] of sampleSenses) {
        await (this as any).config.wordnet.getQueryService().query(
          "INSERT OR REPLACE INTO senses (id, word_id, synset_id, source, sensekey, adjposition, subcategory, domain, register) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [senseId, wordId, synsetId, null, null, null, null, null, null]
        );
      }

      // Insert sample definitions
      const sampleDefinitions = [
        [
          "happy.a.01.def.1",
          "happy.a.01",
          "en",
          "enjoying or showing or marked by joy or pleasure",
        ],
        [
          "run.v.01.def.1",
          "run.v.01",
          "en",
          "move fast by using one's feet, with one foot off the ground at any given time",
        ],
        [
          "book.n.01.def.1",
          "book.n.01",
          "en",
          "a written work or composition that has been published",
        ],
        ["quickly.r.01.def.1", "quickly.r.01", "en", "with rapid movements"],
        [
          "water.n.01.def.1",
          "water.n.01",
          "en",
          "binary compound that occurs at room temperature as a clear colorless odorless tasteless liquid",
        ],
        [
          "computer.n.01.def.1",
          "computer.n.01",
          "en",
          "a machine for performing calculations automatically",
        ],
        [
          "information.n.01.def.1",
          "information.n.01",
          "en",
          "a message received and understood",
        ],
      ];

      for (const [defId, synsetId, lang, text] of sampleDefinitions) {
        await (this as any).config.wordnet.getQueryService().query(
          "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
          [defId, synsetId, lang, text]
        );
      }

      logger.success(`✅ Sample data inserted for ${projectIdWithVersion}`);
    } catch (error) {
      logger.error(
        `❌ Failed to insert sample data for ${projectIdWithVersion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate a large mock dataset for testing purposes
   */
  public async insertMockLargeDataset(projectIdWithVersion: string): Promise<{
    statistics: any;
    integrity: any;
    dataSource: any;
  }> {
    logger.info(
      `📝 Inserting mock large dataset for ${projectIdWithVersion}...`
    );

    try {
      const project = new Project(projectIdWithVersion);
      logger.info(`🔍 Debug Mock: projectId = ${project.id}`);
      logger.info(`🔍 Debug Mock: project =`, project);

      // Insert lexicon using real project data
      try {
        const queryService = this.getQueryService();
        const label =
          project.label || `Mock Large ${project.id.toUpperCase()}`;
        const language = project.language;
        const license = project.license;

        logger.info(
          `🔍 Debug Mock: Final values - label: "${label}", language: "${language}", license: "${license}"`
        );

        if (queryService) {
          await queryService.insertLexicon({
            id: project.id,
            label: label,
            language: language,
            license: license,
            version: project.version ?? "",
          });
        } else {
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO lexicons (id, label, language, license) VALUES (?, ?, ?, ?)",
            [project.id, label, language, license]
          );
        }
      } catch (error) {
        // If insertion fails, lexicon might already exist, but we still need to insert data
        logger.info(
          `✅ Lexicon ${projectIdWithVersion} already exists, continuing with data insertion`
        );
      }

      // Generate thousands of words and synsets
      const wordCount = 5000;
      const synsetCount = 3000;

      logger.info(
        `📊 Generating ${wordCount} words and ${synsetCount} synsets...`
      );

      logger.info(`🔍 [MockDataLoader] Database available: ${!!this.database}`);
      logger.info(`🔍 [MockDataLoader] Database type: ${typeof this.database}`);

      // Common English words for realistic testing
      const commonWords = [
        "the",
        "be",
        "to",
        "of",
        "and",
        "a",
        "in",
        "that",
        "have",
        "I",
        "it",
        "for",
        "not",
        "on",
        "with",
        "he",
        "as",
        "you",
        "do",
        "at",
        "this",
        "but",
        "his",
        "by",
        "from",
        "they",
        "we",
        "say",
        "her",
        "she",
        "or",
        "an",
        "will",
        "my",
        "one",
        "all",
        "would",
        "there",
        "their",
        "what",
        "so",
        "up",
        "out",
        "if",
        "about",
        "who",
        "get",
        "which",
        "go",
        "me",
        "when",
        "make",
        "can",
        "like",
        "time",
        "no",
        "just",
        "him",
        "know",
        "take",
        "people",
        "into",
        "year",
        "your",
        "good",
        "some",
        "could",
        "them",
        "see",
        "other",
        "than",
        "then",
        "now",
        "look",
        "only",
        "come",
        "its",
        "over",
        "think",
        "also",
        "back",
        "after",
        "use",
        "two",
        "how",
        "our",
        "work",
        "first",
        "well",
        "way",
        "even",
        "new",
        "want",
        "because",
        "any",
        "these",
        "give",
        "day",
        "most",
        "us",
        "water",
        "run",
        "happy",
        "book",
        "quickly",
        "computer",
        "internet",
        "technology",
        "science",
        "art",
        "music",
        "food",
        "travel",
        "education",
        "business",
        "health",
        "family",
        "friend",
        "love",
        "life",
        "world",
        "country",
        "city",
        "home",
        "school",
        "work",
        "play",
      ];

      const partsOfSpeech = ["n", "v", "a", "r"]; // noun, verb, adjective, adverb

      // Insert words using correct schema
      logger.info(`📝 Inserting ${wordCount} words...`);
      logger.info(`🔍 [MockDataLoader] About to insert words into database`);
      for (let i = 0; i < wordCount; i++) {
        const word = commonWords[i % commonWords.length];
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const wordId = `${word}.${pos}.${Math.floor(i / commonWords.length) + 1}`;

        try {
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO words (id, lemma, pos, language, lexicon) VALUES (?, ?, ?, ?, ?)",
            [wordId, word, pos, "en", project.id]
          );
        } catch (error) {
          logger.error(`❌ [MockDataLoader] Error inserting word ${wordId}:`, error);
        }
      }
      logger.info(`🔍 [MockDataLoader] Finished inserting words`);

      // Insert synsets using correct schema
      for (let i = 0; i < synsetCount; i++) {
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const synsetId = `synset.${pos}.${i + 1}`;

        await (this as any).config.wordnet.getQueryService().query(
          "INSERT OR REPLACE INTO synsets (id, pos, language, lexicon, ili) VALUES (?, ?, ?, ?, ?)",
          [synsetId, pos, "en", project.id, `i-${synsetId}`]
        );
      }

      // Insert senses (connect words to synsets) using correct schema
      logger.info(`🔗 Inserting ${wordCount} senses...`);
      for (let i = 0; i < wordCount; i++) {
        const word = commonWords[i % commonWords.length];
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const wordId = `${word}.${pos}.${Math.floor(i / commonWords.length) + 1}`;
        const synsetId = `synset.${pos}.${(i % synsetCount) + 1}`;
        const senseId = `${wordId}.sense.${i + 1}`;

        try {
          await (this as any).config.wordnet.getQueryService().query(
            "INSERT OR REPLACE INTO senses (id, word_id, synset_id, source, sensekey, adjposition, subcategory, domain, register) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [senseId, wordId, synsetId, null, null, null, null, null, null]
          );
          if (i < 5) { // Log first 5 sense insertions for debugging
          }
        } catch (error) {
          logger.error(`❌ [MockDataLoader] Error inserting sense ${senseId}:`, error);
        }
      }
      
      // Ensure 'computer' gets senses by adding them explicitly
      // Since we can't query the database directly, we'll create senses for the computer words we know exist
      try {
        // We know computer appears at position 445 in the commonWords array
        // and the large dataset creates words for the first 5000 iterations
        // So computer words will have IDs like computer.a.4, computer.n.2, etc.
        // We need to find the actual positions where computer words are generated
        const computerWordPositions = [];
        for (let i = 0; i < wordCount; i++) {
          const word = commonWords[i % commonWords.length];
          if (word === 'computer') {
            const pos = partsOfSpeech[i % partsOfSpeech.length];
            const wordId = `${word}.${pos}.${Math.floor(i / commonWords.length) + 1}`;
            computerWordPositions.push({ wordId, pos, index: i });
          }
        }
        
        
        for (let i = 0; i < computerWordPositions.length; i++) {
          const { wordId, pos, index } = computerWordPositions[i];
          // Use the same synset mapping logic as the main sense generation
          const synsetId = `synset.${pos}.${(index % synsetCount) + 1}`;
          const senseId = `${wordId}.sense.1`;
          
          try {
            await (this as any).config.wordnet.getQueryService().query(
              "INSERT OR REPLACE INTO senses (id, word_id, synset_id, source, sensekey, adjposition, subcategory, domain, register) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [senseId, wordId, synsetId, null, null, null, null, null, null]
            );
          } catch (error) {
            logger.error(`❌ [MockDataLoader] Error inserting computer sense ${senseId}:`, error);
          }
        }
      } catch (error) {
        logger.error(`❌ [MockDataLoader] Error adding computer senses:`, error);
      }
      
      logger.info(`🔗 Finished inserting senses`);

      // Insert definitions for all synsets
      for (let i = 0; i < synsetCount; i++) {
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const synsetId = `synset.${pos}.${i + 1}`;
        const definitionId = `def.${synsetId}`;
        const definition = `Mock definition for synset ${i + 1} (${pos})`;

        await (this as any).config.wordnet.getQueryService().query(
          "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
          [definitionId, synsetId, "en", definition]
        );
      }

      // Insert ILI entries for all synsets that have ILI identifiers
      for (let i = 0; i < synsetCount; i++) {
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const synsetId = `synset.${pos}.${i + 1}`;
        const iliId = `i-${synsetId}`;

        await (this as any).config.wordnet.getQueryService().query(
          "INSERT OR REPLACE INTO ilis (id, definition, status) VALUES (?, ?, ?)",
          [iliId, `Mock ILI definition for ${synsetId}`, "standard"]
        );
      }

      logger.success(
        `✅ Mock large dataset inserted for ${projectIdWithVersion}: ${wordCount} words, ${synsetCount} synsets`
      );

      // Return statistics, integrity, and dataSource for UI display
      return {
        statistics: {
          totalWords: wordCount,
          totalSynsets: synsetCount,
          totalSenses: wordCount,
          totalRelations: 0,
          totalDefinitions: Math.min(synsetCount, 1000),
          languages: ["en"],
          partsOfSpeech: ["n", "v", "a", "r"],
          dataSize: wordCount * 100 + synsetCount * 200, // Mock data size
          lastUpdated: new Date().toISOString(),
          source: "Mock Dataset",
        },
        integrity: {
          isValid: true,
          checksum: "mock-checksum-12345",
          fileSize: wordCount * 100 + synsetCount * 200,
          compressionType: "none",
          format: "mock",
          errors: [],
          warnings: [],
          qualityScore: 95,
        },
        dataSource: {
          id: project.id,
          name: `Mock Large ${project.id.toUpperCase()}`,
          version: project.version || "2024",
          url: "mock://internal/dataset",
          description: "Large mock dataset for testing purposes",
          lastChecked: new Date().toISOString(),
          status: "available" as const,
        },
      };
    } catch (error) {
      logger.error("Failed to insert mock large dataset:", error);
      throw error;
    }
  }
}
