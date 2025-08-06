import indexData from "./index.json" assert { type: "json" };
import { z } from "zod";

const ProjectVersionSchema = z.union([
  z.object({
    url: z.string(),
  }),
  z.object({
    error: z.string(),
  }),
]);

const ProjectDataSchema = z.union([
  z.object({
    error: z.string(),
  }),
  z.object({
    type: z.string().optional(),
    label: z.string().optional(),
    language: z.string().optional(),
    license: z.string().optional(),
    versions: z.record(ProjectVersionSchema),
  }),
]);

const IndexDataSchema = z.record(ProjectDataSchema);

const parsedIndexData = IndexDataSchema.parse(indexData);

type ProjectData = z.infer<typeof ProjectDataSchema>;

export class Project {
  public readonly id: string;
  public readonly version: string | null;
  public readonly projectIdWithVersion: string;

  private readonly projectData: ProjectData;
  private readonly projectVersionData:
    | z.infer<typeof ProjectVersionSchema>
    | undefined;

  constructor(projectIdWithVersion: string) {
    this.projectIdWithVersion = projectIdWithVersion;
    const [id, version] = projectIdWithVersion.split(":");
    this.id = id;
    this.version = version?.trim() || null;

    if (!(this.id in parsedIndexData)) {
      throw new Error(`Project with ID '${this.id}' not found in index.`);
    }
    this.projectData = parsedIndexData[this.id as keyof typeof parsedIndexData];

    if ("error" in this.projectData) {
      throw new Error(this.projectData.error);
    }

    if (this.version) {
      if (!(this.version in this.projectData.versions)) {
        throw new Error(
          `Version '${this.version}' not found for project '${this.id}'.`
        );
      }

      this.projectVersionData = this.projectData.versions[this.version];
      if ("error" in this.projectVersionData) {
        throw new Error(this.projectVersionData.error);
      }
    }
  }

  static from(idWithVersion: string): Project {
    return new Project(idWithVersion);
  }

  getUrls(): string[] {
    if (!this.version) {
      if ("error" in this.projectData) throw new Error(this.projectData.error);
      throw new Error(
        `No version specified for project '${this.id}'. Available versions: ${Object.keys(
          this.projectData.versions
        ).join(", ")}`
      );
    }
    if (!this.projectVersionData) {
      // Should not be reached due to constructor checks, but for type safety
      throw new Error("Project version data not available.");
    }
    if ("error" in this.projectVersionData) {
      throw new Error(this.projectVersionData.error);
    }
    return this.projectVersionData.url.split(/\s+/).filter(Boolean);
  }

  getError(): string | undefined {
    if (this.projectVersionData && "error" in this.projectVersionData) {
      return this.projectVersionData.error;
    }
    return undefined;
  }

  getLabel(): string {
    if ("error" in this.projectData) {
      throw new Error(this.projectData.error);
    }
    return this.projectData.label || `Project ${this.id.toUpperCase()}`;
  }

  getLanguage(): string {
    if ("error" in this.projectData) {
      throw new Error(this.projectData.error);
    }
    return this.projectData.language || "en";
  }

  getLicense(): string {
    if ("error" in this.projectData) {
      throw new Error(this.projectData.error);
    }
    return (
      this.projectData.license || "https://creativecommons.org/licenses/by/4.0/"
    );
  }

  getCitation(): string {
    return `${this.getLabel()} ${this.version}.`;
  }
}



if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  

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
}
