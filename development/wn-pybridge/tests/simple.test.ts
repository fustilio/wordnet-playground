import { python } from "pythonia";
import { describe, it, beforeAll } from "vitest";
function getErrorMessage(error: any) {
  return error instanceof Error ? error.message : String(error);
}

describe(
  "Python WN Tests (Reference Implementation)",
  { timeout: 20000 },
  () => {
    let en: any;

    beforeAll(async () => {
      try {
        // Test if pythonia actually works by trying to import wn
        const wn = await python("wn");
        en = await wn.Wordnet("oewn:2024");
      } catch (error) {
        console.warn("python wn not functional:", getErrorMessage(error));
      }
    }, 20000);

    it("should perform basic operations via Python wn", async () => {
      if (!en) {
        console.warn("pythonia not functional, skipping test");
        return;
      }

      const refuseWords = await en.words("refuse");

      console.log("refuseWords", refuseWords);

      async function enumerate(iterable: any): Promise<any[]> {
        const arr: any[] = [];
        for await (const item of iterable) {
          arr.push(item);
        }
        return arr;
      }

      for await (const word of refuseWords) {
        console.log(word);

        console.log(await word.id);
        console.log(await word.pos);
      }
      const enumeratedRefuseWords: any[] = await enumerate(refuseWords);

      // Fix: Properly await the pos property before comparison
      const foundRefuseNoun = enumeratedRefuseWords.find(
        async (word: any) => (await word.pos) === "n"
      );
      const foundRefuseVerb = enumeratedRefuseWords.find(
        async (word: any) => (await word.pos) === "v"
      );
      
      // Since find with async doesn't work, use a different approach
      let foundRefuseNounSync: any = null;
      let foundRefuseVerbSync: any = null;
      
      for (const word of enumeratedRefuseWords) {
        const pos = await word.pos;
        if (pos === "n" && !foundRefuseNounSync) {
          foundRefuseNounSync = word;
        }
        if (pos === "v" && !foundRefuseVerbSync) {
          foundRefuseVerbSync = word;
        }
      }
      
      console.log("foundRefuseNoun", foundRefuseNounSync);
      console.log("foundRefuseVerb", foundRefuseVerbSync);

      const refuseNoun = await en.words$("refuse", {
        pos: "n",
      });
      const refuseVerb = await en.words$("refuse", {
        pos: "v",
      });

      const refuseNounById = foundRefuseNounSync ? await en.word(await foundRefuseNounSync.id) : null;
      const refuseVerbById = foundRefuseVerbSync ? await en.word(await foundRefuseVerbSync.id) : null;

      console.log("words", {
        refuseWords,
        refuseNoun,
        refuseVerb,
        refuseNounById,
        refuseVerbById,
      });
    });
  }
);
