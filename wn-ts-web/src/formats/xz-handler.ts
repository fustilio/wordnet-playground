import { XzReadableStream } from "xz-decompress";
import { createScopedLogger } from "utils/logger";

export interface XzDecompressionResult {
  success: boolean;
  data?: string; // Make optional to handle error cases
  binaryData?: Uint8Array; // Add binary data for tar archives
  originalSize: number;
  decompressedSize: number;
  processingTime: number;
  error?: string;
}

/**
 * Handles XZ decompression of downloaded data
 */
export class XzHandler {
  private logger = createScopedLogger("XzHandler", "trace");

  /**
   * Check if data appears to be XZ compressed
   */
  isXzCompressed(data: Uint8Array): boolean {
    // Check for XZ magic numbers: 0xfd 0x37 0x7a 0x58 0x5a 0x00
    return (
      data.length >= 6 &&
      data[0] === 0xfd &&
      data[1] === 0x37 &&
      data[2] === 0x7a &&
      data[3] === 0x58 &&
      data[4] === 0x5a &&
      data[5] === 0x00
    );
  }

  /**
   * Decompress XZ data with detailed logging and error handling
   */
  async decompress(data: Uint8Array): Promise<XzDecompressionResult> {
    const startTime = Date.now();
    const originalSize = data.length;

    this.logger.debug(
      `🔍 Debug: XZ magic numbers detected: ${data[0].toString(16).padStart(2, "0")} ${data[1].toString(16).padStart(2, "0")} ${data[2].toString(16).padStart(2, "0")} ${data[3].toString(16).padStart(2, "0")} ${data[4].toString(16).padStart(2, "0")} ${data[5].toString(16).padStart(2, "0")}`
    );

    try {
      this.logger.debug(`🔍 Debug: Starting XZ decompression...`);


      // Get both text and binary data to handle tar archives properly
      // Create separate streams/responses to avoid "body stream already read" error
      const textStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
      const binaryStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
      
      const [textData, binaryData] = await Promise.all([
        new Response(new XzReadableStream(textStream)).text(),
        new Response(new XzReadableStream(binaryStream)).arrayBuffer()
      ]);

      this.logger.debug(
        `🔍 Debug: XZ decompression completed: ${textData.length} bytes`
      );

      let xmlText: string;
      if (typeof textData === "string") {
        xmlText = textData;
      } else {
        xmlText = new TextDecoder().decode(textData);
      }

      this.logger.debug(
        `📊 Decompressed XZ data: ${data.length} bytes -> ${xmlText.length} characters`
      );
      this.logger.debug(`🔍 Debug: First 200 chars after XZ decompression:`, {
        chars: xmlText.substring(0, 200),
      });
      this.logger.debug(`🔍 Debug: Last 200 chars after XZ decompression:`, {
        chars: xmlText.substring(Math.max(0, xmlText.length - 200)),
      });

      // Additional logging for debugging: show first few lines
      const firstFewLines = xmlText
        .split("\n")
        .slice(0, 5)
        .map((line, i) => `Line ${i + 1}: ${line.substring(0, 100)}`);
      this.logger.debug(`🔍 Debug: First 5 lines after XZ decompression:`, {
        lines: firstFewLines,
      });

      // Check if this is a tar archive after XZ decompression
      const isTarArchive = xmlText.includes("ustar") ||
        xmlText.includes("PaxHeader") ||
        xmlText.includes("GlobalHeader");

      if (isTarArchive) {
        this.logger.info(
          `🔍 Detected tar archive after XZ decompression, preserving binary data for proper extraction`
        );
        // Return binary data for tar extraction to avoid corruption
        return {
          success: true,
          data: xmlText,
          binaryData: new Uint8Array(binaryData),
          originalSize,
          decompressedSize: xmlText.length,
          processingTime: Date.now() - startTime
        };
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        data: xmlText,
        originalSize,
        decompressedSize: xmlText.length,
        processingTime
      };

    } catch (err) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      this.logger.error("❌ Failed to decompress XZ data:", {
        error: err instanceof Error ? err.message : String(err),
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        originalSize,
        decompressedSize: 0,
        processingTime
      };
    }
  }
}
