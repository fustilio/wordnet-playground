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
    versions: z.record(z.string(), ProjectVersionSchema),
  }),
]);

const IndexDataSchema = z.record(z.string(),ProjectDataSchema);

// Base (built-in) index parsed once
const baseIndexData = IndexDataSchema.parse(indexData);

// Runtime-extensible custom index overlay
let customIndexData: Record<string, z.infer<typeof ProjectDataSchema>> = {};

function deepMergeProjectData(
  existing: z.infer<typeof ProjectDataSchema>,
  incoming: z.infer<typeof ProjectDataSchema>
): z.infer<typeof ProjectDataSchema> {
  if ("error" in incoming) return incoming;
  if ("error" in existing) return incoming;

  // Merge shallow props and merge versions record
  const merged: any = { ...existing, ...incoming };
  merged.versions = { ...(existing as any).versions, ...(incoming as any).versions };
  return merged;
}

function getMergedIndex(): Record<string, z.infer<typeof ProjectDataSchema>> {
  const merged: Record<string, z.infer<typeof ProjectDataSchema>> = {
    ...baseIndexData,
  };
  for (const [projectId, data] of Object.entries(customIndexData)) {
    if (!(projectId in merged)) {
      merged[projectId] = data;
    } else {
      merged[projectId] = deepMergeProjectData(merged[projectId], data);
    }
  }
  return merged;
}

export type ProjectData = z.infer<typeof ProjectDataSchema>;

export class Project {
  public readonly id: string;
  public readonly version: string | null;
  public readonly projectIdWithVersion: string;

  private readonly _projectData: ProjectData;
  private readonly projectVersionData:
    | z.infer<typeof ProjectVersionSchema>
    | undefined;

  constructor(projectIdWithVersion: string) {
    this.projectIdWithVersion = projectIdWithVersion;
    const [id, version] = projectIdWithVersion.split(":");
    this.id = id;
    this.version = version?.trim() || null;

    const index = getMergedIndex();
    if (!(this.id in index)) {
      throw new Error(`Project with ID '${this.id}' not found in index.`);
    }
    this._projectData = index[this.id as keyof typeof index];

    if ("error" in this._projectData) {
      throw new Error(this._projectData.error);
    }

    if (this.version) {
      if (!(this.version in this._projectData.versions)) {
        throw new Error(
          `Version '${this.version}' not found for project '${this.id}'.`
        );
      }

      this.projectVersionData = this._projectData.versions[this.version];

      if ('error' in  this.projectVersionData) {
        throw new Error(this.projectVersionData.error)
      }
    }
  }

  static from(idWithVersion: string): Project {
    return new Project(idWithVersion);
  }

  /**
   * Extend the in-memory index with additional entries.
   * Existing projects are shallow-merged; version maps are merged with incoming taking precedence.
   */
  static extendIndex(indexLike: Record<string, unknown>): void {
    const parsed = IndexDataSchema.parse(indexLike);
    for (const [projectId, data] of Object.entries(parsed)) {
      const existing = customIndexData[projectId];
      if (!existing) {
        customIndexData[projectId] = data;
      } else {
        customIndexData[projectId] = deepMergeProjectData(existing, data);
      }
    }
  }

  /**
   * Extend the index by fetching a remote JSON file compatible with the index schema.
   */
  static async extendIndexFromUrl(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch index from ${url}: ${res.status} ${res.statusText}`);
    const json = await res.json();
    Project.extendIndex(json);
  }

  /**
   * Clear all custom index overlays, reverting to the built-in index only.
   */
  static clearCustomIndex(): void {
    customIndexData = {};
  }

  /**
   * Get the current merged index (built-in plus any custom overlays).
   */
  static getIndex(): Record<string, z.infer<typeof ProjectDataSchema>> {
    return getMergedIndex();
  }

  getUrls(): string[] {
    if (!this.version) {
      if ("error" in this._projectData) throw new Error(this._projectData.error);
      throw new Error(
        `No version specified for project '${this.id}'. Available versions: ${Object.keys(
          this._projectData.versions
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
    if ("error" in this._projectData) {
      throw new Error(this._projectData.error);
    }
    return this._projectData.label || `Project ${this.id.toUpperCase()}`;
  }

  getLanguage(): string {
    if ("error" in this._projectData) {
      throw new Error(this._projectData.error);
    }
    return this._projectData.language || "en";
  }

  getLicense(): string {
    if ("error" in this._projectData) {
      throw new Error(this._projectData.error);
    }
    return (
      this._projectData.license || "https://creativecommons.org/licenses/by/4.0/"
    );
  }

  getCitation(): string {
    return `${this.getLabel()} ${this.version}.`;
  }

  get type(): string | undefined {
    if ("error" in this._projectData) {
      throw new Error(this._projectData.error);
    }
    return this._projectData.type;
  }

  get projectData(): ProjectData {
    return this._projectData;
  }
}
