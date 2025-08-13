// wordnetWorker: runs wn-ts-web in a dedicated worker (sqlite-wasm + OPFS live here)
import { expose } from 'comlink';
import { createWordNetInstance, getAvailableProjects } from 'wn-ts-web';

let wordnet: any = null;
let dataLoader: any = null;

async function ensureReady() {
  if (wordnet && dataLoader) return;
  const created = await createWordNetInstance();
  wordnet = created.wordnet;
  dataLoader = created.dataLoader;
}

const api = {
  async init() {
    await ensureReady();
    // Open/create OPFS-backed DB in worker (handled inside wn-ts-web)
    // Return initial state
    const projects = getAvailableProjects();
    const stats = await api.getLexiconStatistics();
    return {
      available: projects,
      loaded: stats.map((s: any) => s.lexiconId),
    };
  },

  async getLexiconStatistics() {
    await ensureReady();
    return await wordnet.getLexiconStatistics();
  },

  async refreshPackages() {
    const stats = await api.getLexiconStatistics();
    return stats.map((s: any) => s.lexiconId);
  },

  async loadPackageData(projectIdWithVersion: string, onProgress?: (p: number) => void) {
    await ensureReady();
    await dataLoader.downloadAndLoad(projectIdWithVersion, { progress: (p: number) => onProgress?.(p) });
    const stats = await api.getLexiconStatistics();
    return {
      loaded: stats.map((s: any) => s.lexiconId),
      stats,
    };
  },

  async clearAllData() {
    await ensureReady();
    await dataLoader.clearAllData();
    return true;
  },

  async searchWords(form: string, language?: string) {
    await ensureReady();
    const qs = wordnet.getQueryService();
    return await qs.getWords({ form, language, searchAllForms: true });
  },

  async searchSynsets(form: string, language?: string) {
    await ensureReady();
    const qs = wordnet.getQueryService();
    return await qs.getSynsets({ form, language, searchAllForms: true });
  },
};

expose(api);