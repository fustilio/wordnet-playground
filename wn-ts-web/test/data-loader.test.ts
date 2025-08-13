import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataLoader } from "../src/data-loader.js";
import type { WebDatabase } from "../src/web-database.js";
import type { WebWordnet } from "../src/web-wordnet.js";
import type { KyselyQueryService } from "../src/database/kysely-query-service.js";

// Helper class to expose protected/private methods for testing
class TestDataLoader extends DataLoader {
  public async testInsertBrowserParsedData(
    parsed: any,
    projectIdWithVersion: string
  ): Promise<void> {
    // @ts-expect-error: calling private method for testing
    await this.insertBrowserParsedData(parsed, projectIdWithVersion);
  }

  public async testInsertLMFData(
    lmf: any,
    projectIdWithVersion: string
  ): Promise<void> {
    // @ts-expect-error: calling private method for testing
    await this.insertLMFData(lmf, projectIdWithVersion);
  }

  public async testLoadILI(content: string): Promise<any[]> {
    // @ts-expect-error: calling private method for testing
    return await this.loadILI(content);
  }

  public async testInsertILIData(iliData: any[], projectIdWithVersion: string): Promise<void> {
    // @ts-expect-error: calling private method for testing
    await this.insertILIData(iliData, projectIdWithVersion);
  }
}

// Mock data that simulates the output of the two different parsers
const MOCK_LMF_DOCUMENT = {
  lexicons: [
    {
      id: "test-lexicon:1.0",
      label: "Test Lexicon",
      language: "en",
      version: "1.0",
    },
  ],
  words: [
    {
      id: "w_test_1",
      lemma: "test-word",
      partOfSpeech: "n",
      lexicon: "test-lexicon:1.0",
    },
  ],
  synsets: [
    {
      id: "syn_test_1",
      partOfSpeech: "n",
      lexicon: "test-lexicon:1.0",
      definitions: [
        {
          // Simulate that parseLMFXML returns a string with embedded HTML
          gloss: "This is a <b>mixed content</b> test.",
        },
      ],
    },
  ],
  senses: [
    {
      id: "s_test_1",
      word: "w_test_1",
      synset: "syn_test_1",
    },
  ],
};

const MOCK_BROWSER_PARSED_DATA = {
  LexicalResource: {
    children: [
      {
        name: "Lexicon",
        attributes: {
          id: "test-lexicon:1.0",
          label: "Test Lexicon",
          language: "en",
          version: "1.0",
        },
        children: [
          {
            name: "LexicalEntry",
            attributes: { id: "w_test_1" },
            children: [
              {
                name: "Lemma",
                attributes: { writtenForm: "test-word", partOfSpeech: "n" },
              },
              {
                name: "Sense",
                attributes: { id: "s_test_1", synset: "syn_test_1" },
              },
            ],
          },
          {
            name: "Synset",
            attributes: { id: "syn_test_1", partOfSpeech: "n" },
            children: [
              {
                name: "Definition",
                children: [
                  {
                    name: "gloss",
                    children: [
                      { name: "#text", text: "This is a" },
                      {
                        name: "b",
                        children: [{ name: "#text", text: "mixed content" }],
                      },
                      { name: "#text", text: "test." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("DataLoader Functional Tests", () => {
  let dataLoader: TestDataLoader;
  let mockQueryService: KyselyQueryService;
  let mockWordnet: WebWordnet;
  let mockDatabase: WebDatabase;
  const batchInsertSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryService = {
      batchInsert: batchInsertSpy,
      insertLexicon: vi.fn(),
    } as any;

    mockWordnet = {
      getQueryService: () => mockQueryService,
    } as any;

    mockDatabase = {} as any;

    dataLoader = new TestDataLoader(mockDatabase, mockWordnet);
  });

  describe("insertLMFData", () => {
    it("should correctly process and insert definitions from LMF format", async () => {
      await dataLoader.testInsertLMFData(MOCK_LMF_DOCUMENT, "test-lexicon:1.0");

      const definitionsCall = batchInsertSpy.mock.calls.find(
        (call) => call[0] === "definitions"
      );
      expect(definitionsCall).toBeDefined();

      const definitionsToInsert = definitionsCall?.[1];
      expect(definitionsToInsert).toHaveLength(1);
      expect(definitionsToInsert[0]).toMatchObject({
        synset_id: "syn_test_1",
        text: "This is a mixed content test.",
      });
    });
  });

  describe("insertBrowserParsedData", () => {
    it("should correctly process and insert definitions from browser-parsed format", async () => {
      await dataLoader.testInsertBrowserParsedData(
        MOCK_BROWSER_PARSED_DATA,
        "test-lexicon:1.0"
      );

      const definitionsCall = batchInsertSpy.mock.calls.find(
        (call) => call[0] === "definitions"
      );
      expect(definitionsCall).toBeDefined();

      const definitionsToInsert = definitionsCall?.[1];
      expect(definitionsToInsert).toHaveLength(1);
      expect(definitionsToInsert[0]).toMatchObject({
        synset_id: "syn_test_1",
        text: "This is a mixed content test.",
      });
    });
  });

  describe("ILI functionality", () => {
    it("should correctly parse ILI TSV content", async () => {
      const iliContent = `ILI	Definition
i1	(usually followed by 'to') having the necessary means or skill or know-how or authority to do something
i2	(usually followed by 'to') not having the necessary means or skill or know-how
i3	facing away from the axis of an organ or organism`;

      const result = await dataLoader.testLoadILI(iliContent);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: "i1",
        definition: "(usually followed by 'to') having the necessary means or skill or know-how or authority to do something",
        status: "active"
      });
      expect(result[1]).toMatchObject({
        id: "i2",
        definition: "(usually followed by 'to') not having the necessary means or skill or know-how",
        status: "active"
      });
      expect(result[2]).toMatchObject({
        id: "i3",
        definition: "facing away from the axis of an organ or organism",
        status: "active"
      });
    });

    it("should skip empty or invalid ILI records", async () => {
      const iliContent = `ILI	Definition
i1	(usually followed by 'to') having the necessary means or skill or know-how or authority to do something
		empty record
i2		missing definition
i3	facing away from the axis of an organ or organism`;

      const result = await dataLoader.testLoadILI(iliContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "i1",
        definition: "(usually followed by 'to') having the necessary means or skill or know-how or authority to do something",
        status: "active"
      });
      expect(result[1]).toMatchObject({
        id: "i3",
        definition: "facing away from the axis of an organ or organism",
        status: "active"
      });
    });

    it("should insert ILI data correctly", async () => {
      const iliData = [
        { id: "i1", definition: "test definition 1", status: "active" },
        { id: "i2", definition: "test definition 2", status: "inactive" }
      ];

      await dataLoader.testInsertILIData(iliData, "cili:1.0");

      const ilisCall = batchInsertSpy.mock.calls.find(
        (call) => call[0] === "ilis"
      );
      expect(ilisCall).toBeDefined();

      const ilisToInsert = ilisCall?.[1];
      expect(ilisToInsert).toHaveLength(2);
      expect(ilisToInsert[0]).toMatchObject({
        id: "i1",
        definition: "test definition 1",
        status: "active",
        superseded_by: null,
        note: null,
        meta: null
      });
      expect(ilisToInsert[1]).toMatchObject({
        id: "i2",
        definition: "test definition 2",
        status: "inactive",
        superseded_by: null,
        note: null,
        meta: null
      });
    });
  });
});
