import { python } from 'pythonia';
import { WnBridge } from './index.js';

export class ProjectManager {
  private pythonProject: any = null;

  constructor(private bridge: WnBridge) {}

  private async ensureInitialized(): Promise<void> {
    if (!this.pythonProject) {
      this.pythonProject = await python('wn.project');
    }
  }

  /**
   * List all available projects
   */
  async projects(): Promise<any[]> {
    await this.ensureInitialized();
    const result = await this.pythonProject.projects();
    return await this.bridge.convertToJsArray(result, 'Project');
  }

  /**
   * Find a specific project by ID
   */
  async find(id: string): Promise<any> {
    await this.ensureInitialized();
    const result = await this.pythonProject.find(id);
    return await this.bridge.convertToJsObject(result, 'Project');
  }

  /**
   * Add a new project from a local LMF file
   */
  async add(id: string, path: string): Promise<void> {
    await this.ensureInitialized();
    await this.pythonProject.add(id, path);
  }

  /**
   * Remove a project by ID
   */
  async remove(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.pythonProject.remove(id);
  }

  /**
   * Search for projects by query
   */
  async search(query: string): Promise<any[]> {
    await this.ensureInitialized();
    const result = await this.pythonProject.search(query);
    return await this.bridge.convertToJsArray(result, 'Project');
  }
} 