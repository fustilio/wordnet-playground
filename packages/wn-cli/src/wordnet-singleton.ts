import { KyselyWordnet as Wordnet } from "wn-ts-node";
import { config } from "wn-ts-core";

let wn: Wordnet | null = null;
let currentLexicon: string | undefined;
let currentDataDir: string | undefined;

export function getWordnetInstance(lexicon?: string) {
  const targetLexicon = lexicon || "*";
  const targetDataDir = config.dataDirectory;

  if (!wn || currentLexicon !== targetLexicon || currentDataDir !== targetDataDir) {
    wn = new Wordnet(lexicon);
    currentLexicon = targetLexicon;
    currentDataDir = targetDataDir;
  }
  return wn;
}

export async function closeWordnetInstance() {
  if (wn) {
    await wn.close();
    wn = null;
    currentLexicon = undefined;
    currentDataDir = undefined;
  }
}
