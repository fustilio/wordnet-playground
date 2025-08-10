import { DataLoader, type DataLoadOptions } from "../src/data-loader.js";
import { Project } from "../src/project.js";
import type { WebDatabase } from "../src/web-database.js";
import type { WebWordnet } from "../src/web-wordnet.js";

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

  /**
   * Override downloadAndLoad to provide mock data on failure.
   */
  async downloadAndLoad(
    projectIdWithVersion: string,
    options: DataLoadOptions = {}
  ): Promise<void> {
    try {
      // First, attempt to use the real DataLoader's logic
      await super.downloadAndLoad(projectIdWithVersion, options);
    } catch (error) {
      console.warn(
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
    console.log(`📝 [MOCK] Inserting mock data for ${projectIdWithVersion}...`);
    try {
      const mockData = await this.insertMockLargeDataset(projectIdWithVersion);
      this.mockStatistics = mockData.statistics;
      this.mockIntegrity = mockData.integrity;
      this.mockDataSource = mockData.dataSource;
      console.log(
        `✅ Successfully loaded mock large dataset for ${projectIdWithVersion}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to load mock large dataset for ${projectIdWithVersion}:`,
        error
      );
      console.log(
        `📝 Falling back to sample data for ${projectIdWithVersion}...`
      );
      await this.insertSampleData(projectIdWithVersion);
      console.log(
        `✅ Successfully loaded sample data for ${projectIdWithVersion}`
      );
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
    console.log(`📝 Inserting sample data for ${projectIdWithVersion}...`);

    try {
      const project = Project.from(projectIdWithVersion);
      console.log(`🔍 Debug: projectId = ${project.id}`);
      console.log(`🔍 Debug: project =`, project);

      // Insert sample lexicon using real project data
      try {
        const queryService = this.getQueryService();
        const label =
          project.getLabel() || `Sample ${project.id.toUpperCase()}`;
        const language = project.getLanguage();
        const license = project.getLicense();

        console.log(
          `🔍 Debug: Final values - label: "${label}", language: "${language}", license: "${license}"`
        );

        if (queryService) {
          await queryService.insertLexicon({
            id: project.projectIdWithVersion,
            label: label,
            language: language,
            license: license,
          });
        } else {
          this.database.run(
            "INSERT OR REPLACE INTO lexicons (id, label, language, license) VALUES (?, ?, ?, ?)",
            [project.projectIdWithVersion, label, language, license]
          );
        }
        console.log(
          `✅ Sample lexicon inserted for ${project.projectIdWithVersion}`
        );
      } catch (error) {
        console.log(
          `✅ Lexicon ${projectIdWithVersion} already exists or insertion failed: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }

      // Insert sample words
      const sampleWords = [
        ["happy", "a", "happy.a.01"],
        ["run", "v", "run.v.01"],
        ["book", "n", "book.n.01"],
        ["quickly", "r", "quickly.r.01"],
        ["water", "n", "water.n.01"],
      ];

      for (const [lemma, pos, synsetId] of sampleWords) {
        try {
          // Insert word
          const wordId = `${lemma}.${pos}.01`;
          this.database.run(
            "INSERT OR REPLACE INTO words (id, lemma, part_of_speech, language, lexicon) VALUES (?, ?, ?, ?, ?)",
            [wordId, lemma, pos, "en", projectIdWithVersion]
          );

          // Insert synset
          this.database.run(
            "INSERT OR REPLACE INTO synsets (id, part_of_speech, language, lexicon) VALUES (?, ?, ?, ?)",
            [synsetId, pos, "en", projectIdWithVersion]
          );

          // Insert sense
          this.database.run(
            "INSERT OR REPLACE INTO senses (id, word_id, synset_id) VALUES (?, ?, ?)",
            [`${wordId}.01`, wordId, synsetId]
          );

          // Insert definition
          this.database.run(
            "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
            [`${synsetId}.def.en`, synsetId, "en", `Definition of ${lemma}`]
          );
        } catch (error) {
          console.error(`❌ Failed to insert sample word ${lemma}:`, error);
        }
      }

      // Insert sample synsets
      const sampleSynsets = [
        ["happy.a.01", "a"],
        ["run.v.01", "v"],
        ["book.n.01", "n"],
        ["quickly.r.01", "r"],
        ["water.n.01", "n"],
      ];

      for (const [synsetId, pos] of sampleSynsets) {
        this.database.run(
          "INSERT OR REPLACE INTO synsets (id, part_of_speech, language, lexicon) VALUES (?, ?, ?, ?)",
          [synsetId, pos, "en", projectIdWithVersion]
        );
      }

      // Insert sample senses
      const sampleSenses = [
        ["happy.a.01.sense.1", "happy.a.01", "happy.a.01"],
        ["run.v.01.sense.1", "run.v.01", "run.v.01"],
        ["book.n.01.sense.1", "book.n.01", "book.n.01"],
        ["quickly.r.01.sense.1", "quickly.r.01", "quickly.r.01"],
        ["water.n.01.sense.1", "water.n.01", "water.n.01"],
      ];

      for (const [senseId, wordId, synsetId] of sampleSenses) {
        this.database.run(
          "INSERT OR REPLACE INTO senses (id, word_id, synset_id) VALUES (?, ?, ?)",
          [senseId, wordId, synsetId]
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
      ];

      for (const [defId, synsetId, lang, text] of sampleDefinitions) {
        this.database.run(
          "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
          [defId, synsetId, lang, text]
        );
      }

      console.log(`✅ Sample data inserted for ${projectIdWithVersion}`);
    } catch (error) {
      console.error(
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
    console.log(
      `📝 Inserting mock large dataset for ${projectIdWithVersion}...`
    );

    try {
      const project = Project.from(projectIdWithVersion);
      console.log(`🔍 Debug Mock: projectId = ${project.id}`);
      console.log(`🔍 Debug Mock: project =`, project);

      // Insert lexicon using real project data
      try {
        const queryService = this.getQueryService();
        const label =
          project.getLabel() || `Mock Large ${project.id.toUpperCase()}`;
        const language = project.getLanguage();
        const license = project.getLicense();

        console.log(
          `🔍 Debug Mock: Final values - label: "${label}", language: "${language}", license: "${license}"`
        );

        if (queryService) {
          await queryService.insertLexicon({
            id: project.id,
            label: label,
            language: language,
            license: license,
          });
        } else {
          this.database.run(
            "INSERT OR REPLACE INTO lexicons (id, label, language, license) VALUES (?, ?, ?, ?)",
            [project.id, label, language, license]
          );
        }
      } catch (error) {
        // If insertion fails, lexicon might already exist
        console.log(
          `✅ Lexicon ${projectIdWithVersion} already exists, skipping insertion`
        );
        // Return mock statistics for existing data
        return {
          statistics: {
            totalWords: 1000,
            totalSynsets: 500,
            totalSenses: 1000,
            totalRelations: 0,
            totalDefinitions: 500,
            languages: ["en"],
            partsOfSpeech: ["n", "v", "a", "r"],
            dataSize: 50000,
            lastUpdated: new Date().toISOString(),
            source: "Existing Mock Dataset",
          },
          integrity: {
            isValid: true,
            checksum: "existing-mock-checksum",
            fileSize: 50000,
            compressionType: "none",
            format: "mock",
            errors: [],
            warnings: [],
          },
          dataSource: {
            type: "mock",
            url: "existing-data",
            lastUpdated: new Date().toISOString(),
            size: 50000,
          },
        };
      }

      // Generate thousands of words and synsets
      const wordCount = 5000;
      const synsetCount = 3000;

      console.log(
        `📊 Generating ${wordCount} words and ${synsetCount} synsets...`
      );

      // Common English words for realistic testing
      const commonWords = [
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "water", "run", "happy", "book", "quickly", "computer", "internet", "technology", "science", "art", "music", "food", "travel", "education", "business", "health", "family", "friend", "love", "life", "world", "country", "city", "home", "school", "work", "play",
      ];

      const partsOfSpeech = ["n", "v", "a", "r"]; // noun, verb, adjective, adverb

      // Insert words using correct schema
      for (let i = 0; i < wordCount; i++) {
        const word = commonWords[i % commonWords.length];
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const wordId = `${word}.${pos}.${Math.floor(i / commonWords.length) + 1}`;

        this.database.run(
          "INSERT OR REPLACE INTO words (id, lemma, part_of_speech, language, lexicon) VALUES (?, ?, ?, ?, ?)",
          [wordId, word, pos, "en", project.id]
        );
      }

      // Insert synsets using correct schema
      for (let i = 0; i < synsetCount; i++) {
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const synsetId = `synset.${pos}.${i + 1}`;

        this.database.run(
          "INSERT OR REPLACE INTO synsets (id, part_of_speech, language, lexicon) VALUES (?, ?, ?, ?)",
          [synsetId, pos, "en", project.id]
        );
      }

      // Insert senses (connect words to synsets) using correct schema
      for (let i = 0; i < wordCount; i++) {
        const word = commonWords[i % commonWords.length];
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const wordId = `${word}.${pos}.${Math.floor(i / commonWords.length) + 1}`;
        const synsetId = `synset.${pos}.${(i % synsetCount) + 1}`;
        const senseId = `${wordId}.sense.${i + 1}`;

        this.database.run(
          "INSERT OR REPLACE INTO senses (id, word_id, synset_id) VALUES (?, ?, ?)",
          [senseId, wordId, synsetId]
        );
      }

      // Insert some definitions
      for (let i = 0; i < Math.min(synsetCount, 1000); i++) {
        const pos = partsOfSpeech[i % partsOfSpeech.length];
        const synsetId = `synset.${pos}.${i + 1}`;
        const definitionId = `def.${synsetId}`;
        const definition = `Mock definition for synset ${i + 1} (${pos})`;

        this.database.run(
          "INSERT OR REPLACE INTO definitions (id, synset_id, language, text) VALUES (?, ?, ?, ?)",
          [definitionId, synsetId, "en", definition]
        );
      }

      console.log(
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
      console.error("Failed to insert mock large dataset:", error);
      throw error;
    }
  }
}
