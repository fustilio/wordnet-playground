import indexData from "./index.json" assert { type: "json" };
import { z } from "zod";

const ProjectVersionSchema = z.union([
  z.object({
    url: z.union([z.string(), z.array(z.string())]),
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

const IndexDataSchema = z.record(z.string(), ProjectDataSchema);

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
  const merged = { ...existing, ...incoming };
  merged.versions = {
    ...existing.versions,
    ...incoming.versions,
  };
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
  #id: string;
  #version: string | null;
  #projectIdWithVersion: string;

  #projectData: ProjectData;
  #projectVersionData:
    | z.infer<typeof ProjectVersionSchema>
    | undefined;

  get id(): string {
    return this.#id;
  }

  get version(): string | null {
    return this.#version;
  }

  get projectIdWithVersion(): string {
    return this.#projectIdWithVersion;
  }

  // Public getter for projectData
  get data(): ProjectData {
    return this.#projectData;
  }

  constructor(projectIdWithVersion: string) {
    this.#projectIdWithVersion = projectIdWithVersion;
    const [id, version] = projectIdWithVersion.split(":");
    this.#id = id;
    this.#version = version?.trim() || null;

    const index = getMergedIndex();
    if (!(this.#id in index)) {
      throw new Error(`Project with ID '${this.#id}' not found in index.`);
    }
    this.#projectData = index[this.#id as keyof typeof index];

    if ("error" in this.#projectData) {
      throw new Error(this.#projectData.error);
    }

    if (this.#version) {
      if (!(this.#version in this.#projectData.versions)) {
        throw new Error(
          `Version '${this.#version}' not found for project '${this.#id}'.`
        );
      }

      this.#projectVersionData = this.#projectData.versions[this.#version];

      if ("error" in this.#projectVersionData) {
        throw new Error(this.#projectVersionData.error);
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
    if (!res.ok)
      throw new Error(
        `Failed to fetch index from ${url}: ${res.status} ${res.statusText}`
      );
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

  get urls(): string[] {
    if (!this.#version) {
      if ("error" in this.#projectData)
        throw new Error(this.#projectData.error);
      throw new Error(
        `No version specified for project '${this.#id}'. Available versions: ${Object.keys(
          this.#projectData.versions
        ).join(", ")}`
      );
    }
    if (!this.#projectVersionData) {
      // Should not be reached due to constructor checks, but for type safety
      throw new Error("Project version data not available.");
    }
    if ("error" in this.#projectVersionData) {
      throw new Error(this.#projectVersionData.error);
    }

    // Handle both string and array URL formats
    let urlStrings: string[];
    if (typeof this.#projectVersionData.url === 'string') {
      // Legacy format: split by whitespace and newlines, then clean up each URL
      urlStrings = this.#projectVersionData.url
        .split(/\s+/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
    } else {
      // New format: already an array of URLs
      urlStrings = this.#projectVersionData.url;
    }

    // Validate URLs and filter out invalid ones
    const validUrls = urlStrings.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        // Invalid URL format
        return false;
      }
    });

    return validUrls;
  }

  /**
   * Get the primary (first) URL for this project version.
   * Useful when you need a single URL to start with.
   */
  get primaryUrl(): string {
    const urls = this.urls;
    if (urls.length === 0) {
      throw new Error(
        `No valid URLs found for project '${this.#id}' version '${this.#version}'`
      );
    }
    return urls[0];
  }

  /**
   * Check if this project version has multiple URLs available.
   * Useful for implementing fallback logic in the data loader.
   */
  get hasMultipleUrls(): boolean {
    return this.urls.length > 1;
  }

  /**
   * Get detailed information about the URLs for this project version.
   * Useful for debugging and understanding URL parsing.
   */
  get urlInfo(): {
    urls: string[];
    count: number;
    raw: string | string[];
    hasMultipleUrls: boolean;
    primaryUrl: string;
  } {
    if (!this.version) {
      if ("error" in this.#projectData)
        throw new Error(this.#projectData.error);
      throw new Error(
        `No version specified for project '${this.#id}'. Available versions: ${Object.keys(
          this.#projectData.versions
        ).join(", ")}`
      );
    }
    if (!this.#projectVersionData) {
      throw new Error("Project version data not available.");
    }
    if ("error" in this.#projectVersionData) {
      throw new Error(this.#projectVersionData.error);
    }

    const urls = this.urls;
    return {
      urls,
      count: urls.length,
      raw: this.#projectVersionData.url,
      hasMultipleUrls: urls.length > 1,
      primaryUrl: urls.length > 0 ? urls[0] : "",
    };
  }

  /**
   * Get fallback URLs for known broken packages.
   * This provides working alternatives when the main URLs fail.
   */
  get fallbackUrls(): string[] {
    const fallbacks: Record<string, string[]> = {};

    const key = `${this.#id}:${this.#version}`;
    return fallbacks[key] || [];
  }

  /**
   * Get all available URLs including fallbacks.
   * Useful for the data loader to try multiple sources.
   */
  get allUrls(): string[] {
    const primaryUrls = this.urls;
    const fallbackUrls = this.fallbackUrls;
    return [...primaryUrls, ...fallbackUrls];
  }

  get error(): string | undefined {
    if (this.#projectVersionData && "error" in this.#projectVersionData) {
      return this.#projectVersionData.error;
    }
    return undefined;
  }

  get label(): string {
    if ("error" in this.#projectData) {
      throw new Error(this.#projectData.error);
    }
    return this.#projectData.label || `Project ${this.#id.toUpperCase()}`;
  }

  get language(): string {
    if ("error" in this.#projectData) {
      throw new Error(this.#projectData.error);
    }
    return this.#projectData.language || "en";
  }

  get license(): string {
    if ("error" in this.#projectData) {
      throw new Error(this.#projectData.error);
    }
    return (
      this.#projectData.license ||
      "https://creativecommons.org/licenses/by/4.0/"
    );
  }

  get citation(): string {
    return `${this.label} ${this.#version}.`;
  }

  get type(): string | undefined {
    if ("error" in this.#projectData) {
      throw new Error(this.#projectData.error);
    }
    return this.#projectData.type;
  }
}
