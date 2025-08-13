import pako from 'pako';
import { describe, it, expect, vi, beforeEach, test } from 'vitest';

const packageUrl = "https://en-word.net/static/english-wordnet-2024.xml.gz";
describe("load data", () => {
  test("pako", async ()=>{
    try {
      const data =  await fetch("https://google.com")

    console.log("data", data.status, data.statusText)

    expect(data.status).toBe(200)

    // const pakoPack = pako.gzip("hello world");
    // console.log("deflated", pakoPack.length, pakoPack.slice(0, 100));

    // const pakoUnpacked = pako.inflate(pakoPack, { to: "string" });
    // console.log("unpacked", pakoUnpacked.length, pakoUnpacked);

    //   expect(pakoUnpacked).toBe("hello world");
    } catch (e) {
      console.error(e);
      console.error(e.message)
      expect(false).toBe(true)
    }
    
  });
});