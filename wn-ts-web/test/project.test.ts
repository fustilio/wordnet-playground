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
});
