import { describe, it, expect, beforeEach } from "vitest";
import { FormatProcessor, ContentTypeDetector, GzipHandler, XzHandler, TarHandler } from "../index.js";

describe("FormatProcessor", () => {
  let processor: FormatProcessor;

  beforeEach(() => {
    processor = new FormatProcessor();
  });

  it("should be created with all handlers", () => {
    const stats = processor.getProcessingStats();
    expect(stats.handlers.contentTypeDetector).toBe(true);
    expect(stats.handlers.gzipHandler).toBe(true);
    expect(stats.handlers.xzHandler).toBe(true);
    expect(stats.handlers.tarHandler).toBe(true);
  });

  it("should detect uncompressed XML data", async () => {
    const xmlData = `<?xml version="1.0"?><LexicalResource><lexicon id="test"/></LexicalResource>`;
    const buffer = new TextEncoder().encode(xmlData).buffer as ArrayBuffer;
    
    const result = await processor.processData(buffer, { projectId: "test:1.0" });
    
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("lmf");
    expect(result.xmlContent).toContain("<LexicalResource");
  });
});

describe("ContentTypeDetector", () => {
  let detector: ContentTypeDetector;

  beforeEach(() => {
    detector = new ContentTypeDetector();
  });

  it("should detect LMF XML content", () => {
    const content = `<?xml version="1.0"?><LexicalResource><lexicon id="test"/></LexicalResource>`;
    const analysis = detector.detectContentType(content, "test:1.0");
    
    expect(analysis.type).toBe("lmf");
    expect(analysis.confidence).toBe("high");
    expect(analysis.indicators.hasXMLContent).toBe(true);
  });

  it("should detect tar archive content", () => {
    const content = "ustar  \x00test.xml\x00";
    const analysis = detector.detectContentType(content, "omw-fr:1.4");
    
    expect(analysis.type).toBe("tar");
    expect(analysis.confidence).toBe("high");
    expect(analysis.indicators.hasTarHeader).toBe(true);
  });
});

describe("GzipHandler", () => {
  let handler: GzipHandler;

  beforeEach(() => {
    handler = new GzipHandler();
  });

  it("should detect gzip magic numbers", () => {
    const data = new Uint8Array([0x1f, 0x8b, 0x08, 0x00]);
    expect(handler.isGzipCompressed(data)).toBe(true);
  });

  it("should not detect non-gzip data", () => {
    const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(handler.isGzipCompressed(data)).toBe(false);
  });
});

describe("XzHandler", () => {
  let handler: XzHandler;

  beforeEach(() => {
    handler = new XzHandler();
  });

  it("should detect XZ magic numbers", () => {
    const data = new Uint8Array([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]);
    expect(handler.isXzCompressed(data)).toBe(true);
  });

  it("should not detect non-XZ data", () => {
    const data = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
    expect(handler.isXzCompressed(data)).toBe(false);
  });
});

describe("TarHandler", () => {
  let handler: TarHandler;

  beforeEach(() => {
    handler = new TarHandler();
  });

  it("should detect tar archive content", () => {
    const content = "ustar  \x00test.xml\x00";
    expect(handler.isTarArchive(content)).toBe(true);
  });

  it("should not detect non-tar content", () => {
    const content = "<?xml version='1.0'?><LexicalResource></LexicalResource>";
    expect(handler.isTarArchive(content)).toBe(false);
  });
});
