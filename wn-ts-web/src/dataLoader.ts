// wn-ts-web/src/dataLoader.ts
// Dynamic loader for browser-optimized WordNet data files (multilingual aware)

const dataCache: Record<string, any> = {};

async function fetchJson(url: string): Promise<any> {
  if (dataCache[url]) return dataCache[url];
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const data = await resp.json();
  dataCache[url] = data;
  return data;
}

export async function getIndex(pos: string, lexicon: string = 'oewn'): Promise<Record<string, string>> {
  return fetchJson(`/data/${lexicon}/index.${pos}.json`);
}

export async function getData(pos: string, lexicon: string = 'oewn'): Promise<Record<string, string>> {
  return fetchJson(`/data/${lexicon}/data.${pos}.json`);
} 