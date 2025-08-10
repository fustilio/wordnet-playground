import { describe, it, expect } from "vitest";
import { Project } from "../src/project.js";

describe("Project", () => {
  it("should parse project ID and version correctly", () => {
    const project = new Project("oewn:2024");
    expect(project.id).toBe("oewn");
    expect(project.version).toBe("2024");
    expect(project.projectIdWithVersion).toBe("oewn:2024");
  });

  it("should get project metadata", () => {
    const project = new Project("oewn:2024");
    expect(project.getLabel()).toBe("Open English WordNet");
    expect(project.getLanguage()).toBe("en");
  });

  it("should get project URLs", () => {
    const project = new Project("oewn:2024");
    const urls = project.getUrls();
    expect(urls).toContain(
      "https://en-word.net/static/english-wordnet-2024.xml.gz"
    );
    expect(urls).toContain(
      "https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz"
    );
  });

  it("should handle projects with errors", () => {
    expect(() => new Project("pwn:3.0")).toThrow(
      "'pwn:3.0' is no longer indexed; use 'omw-en:1.4' instead (https://github.com/goodmami/wn#changes-to-the-index)"
    );
  });

  it("should handle versions with errors", () => {
    expect(() => new Project("ewn:2021")).toThrow(
      "Use 'oewn' as the ID from version 2021 ('oewn:2021')"
    );
  });

  it("should throw for invalid project ID", () => {
    expect(() => new Project("invalid-project:1.0")).toThrow(
      "Project with ID 'invalid-project' not found in index."
    );
  });

  it("should throw for invalid version", () => {
    expect(() => new Project("oewn:invalid-version")).toThrow(
      "Version 'invalid-version' not found for project 'oewn'."
    );
  });

  describe("runtime index extension", () => {
    it("should allow extending the project index at runtime", () => {
      // Ensure clean state
      Project.clearCustomIndex();

      // Extend with a custom project (similar to the demo index)
      Project.extendIndex({
        "th-en-sample": {
          type: "bilingual",
          label: "Thai–English Sample Lexicon",
          language: "th",
          license: "https://creativecommons.org/licenses/by/4.0/",
          versions: {
            "1.0": {
              url: "http://localhost:5173/lexicons/th-en-sample.xml.gz",
            },
          },
        },
      });

      const project = new Project("th-en-sample:1.0");
      expect(project.getLabel()).toBe("Thai–English Sample Lexicon");
      expect(project.getLanguage()).toBe("th");
      const urls = project.getUrls();
      expect(urls).toContain(
        "http://localhost:5173/lexicons/th-en-sample.xml.gz"
      );

      // Cleanup
      Project.clearCustomIndex();
    });

    it("should merge versions when extending an existing project", () => {
      // Ensure clean state
      Project.clearCustomIndex();

      // Add a new version to an existing base project
      Project.extendIndex({
        oewn: {
          label: "Open English WordNet",
          language: "en",
          versions: {
            "2025": {
              url: "https://example.com/english-wordnet-2025.xml.gz",
            },
          },
        },
      });

      const extended = new Project("oewn:2025");
      expect(extended.getLabel()).toBe("Open English WordNet");
      expect(extended.getLanguage()).toBe("en");
      expect(extended.getUrls()).toContain(
        "https://example.com/english-wordnet-2025.xml.gz"
      );

      // Base versions must still work (from built-in index)
      const base = new Project("oewn:2024");
      const baseUrls = base.getUrls();
      expect(baseUrls.length).toBeGreaterThan(0);

      // Cleanup
      Project.clearCustomIndex();
    });

    it("should revert to base index after clearing custom overlays", () => {
      // Ensure clean state
      Project.clearCustomIndex();

      Project.extendIndex({
        customwn: {
          label: "Custom WordNet",
          language: "en",
          versions: { "1.0": { url: "https://example.com/custom.xml.gz" } },
        },
      });

      // Works while custom overlay is present
      const custom = new Project("customwn:1.0");
      expect(custom.getUrls()).toContain("https://example.com/custom.xml.gz");

      // Clear and ensure it disappears
      Project.clearCustomIndex();
      expect(() => new Project("customwn:1.0")).toThrow(
        "Project with ID 'customwn' not found in index."
      );
    });
  });
});
