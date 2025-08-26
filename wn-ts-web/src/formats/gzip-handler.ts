import pako from "pako";
import { createScopedLogger } from "utils/logger";

export interface GzipDecompressionResult {
  success: boolean;
  data?: string;
  binaryData?: Uint8Array; // Add binary data for tar archives
  error?: string;
  originalSize: number;
  decompressedSize: number;
  processingTime: number;
}

/**
 * Handles gzip decompression of downloaded data
 */
export class GzipHandler {
  private logger = createScopedLogger("GzipHandler", "trace");

  /**
   * Check if data appears to be gzip compressed
   */
  isGzipCompressed(data: Uint8Array): boolean {
    return data.length > 2 && data[0] === 0x1f && data[1] === 0x8b;
  }

  /**
   * Decompress gzip data with detailed logging and error handling
   */
  async decompress(data: Uint8Array): Promise<GzipDecompressionResult> {
    const startTime = Date.now();
    const originalSize = data.length;

    this.logger.debug(`🔍 Debug: Gzip magic numbers detected: ${data[0].toString(16).padStart(2, "0")} ${data[1].toString(16).padStart(2, "0")}`);
    this.logger.debug(`🔍 Debug: Starting gzip decompression with pako...`);
    this.logger.debug(`🔍 Debug: Input data length: ${data.length} bytes`);
    this.logger.debug(`🔍 Debug: Input data type: ${typeof data}`);
    this.logger.debug(`🔍 Debug: Input data constructor: ${data.constructor.name}`);

    try {
      // Use pako for gzip decompression
      let workingView = data;
      this.logger.debug(`🔍 Debug: Checking for trailing byte...`);

      if (data[data.length - 1] === 0x3b) {
        this.logger.warn("🔍 Debug: Removing last byte (0x3b)");
        workingView = data.slice(0, -1);
        this.logger.debug(`🔍 Debug: Working view length after slice: ${workingView.length} bytes`);
      } else {
        this.logger.debug(`🔍 Debug: No trailing byte removal needed, last byte: 0x${data[data.length - 1].toString(16).padStart(2, "0")}`);
      }

      this.logger.debug(`🔍 Debug: About to call pako.inflate()...`);
      this.logger.debug(`🔍 Debug: Working view first 16 bytes:`, {
        bytes: Array.from(workingView.slice(0, 16))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      });
      this.logger.debug(`🔍 Debug: Working view last 16 bytes:`, {
        bytes: Array.from(workingView.slice(-16))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      });

      const inflateStartTime = Date.now();
      this.logger.debug(`🔍 Debug: pako.inflate() call started at ${inflateStartTime}`);

      // 🚨 TIMEOUT PROTECTION: Prevent hanging during decompression
      const decompressed = await this.logger.withTimeout(
        "pako.inflate()",
        async () => {
          return pako.inflate(workingView);
        },
        30000,
        2000
      ); // 30 second timeout, progress every 2 seconds

      const inflateEndTime = Date.now();
      this.logger.debug(`🔍 Debug: pako.inflate() completed in ${inflateEndTime - inflateStartTime}ms`);
      this.logger.debug(`🔍 Debug: Decompression result type: ${typeof decompressed}`);
      this.logger.debug(`🔍 Debug: Decompression result constructor: ${decompressed.constructor.name}`);
      this.logger.debug(`🔍 Debug: Decompression result length: ${decompressed.length} bytes`);

      this.logger.debug("🔍 Debug: Decompressed data sample:", {
        sample: Array.from(decompressed.slice(0, 100)),
      });
      this.logger.debug(`🔍 Debug: Decompression completed: ${decompressed.length} bytes`);

      this.logger.debug(`🔍 Debug: About to decode with TextDecoder...`);
      const decodeStartTime = Date.now();

      // 🚨 TIMEOUT PROTECTION: Prevent hanging during TextDecoder
      const xmlText = await this.logger.withTimeout(
        "TextDecoder.decode()",
        async () => {
          return new TextDecoder().decode(decompressed);
        },
        15000,
        1000
      ); // 15 second timeout, progress every 1 second

      const decodeEndTime = Date.now();
      this.logger.debug(`🔍 Debug: TextDecoder completed in ${decodeEndTime - decodeStartTime}ms`);
      this.logger.debug(`🔍 Debug: Decoded text length: ${xmlText.length} characters`);

      this.logger.debug(`📊 Decompressed gzipped data: ${decompressed.length} bytes -> ${xmlText.length} characters`);
      this.logger.debug(`🔍 Debug: First 200 chars after decompression:`, {
        chars: xmlText.substring(0, 200),
      });
      this.logger.debug(`🔍 Debug: Last 200 chars after decompression:`, {
        chars: xmlText.substring(Math.max(0, xmlText.length - 200)),
      });

      // Additional logging for debugging: show first few lines
      const firstFewLines = xmlText
        .split("\n")
        .slice(0, 5)
        .map((line, i) => `Line ${i + 1}: ${line.substring(0, 100)}`);
      this.logger.debug(`🔍 Debug: First 5 lines after gzip decompression:`, {
        lines: firstFewLines,
      });

      // Check if this is a tar archive after gzip decompression
      const isTarArchive = xmlText.includes("ustar") ||
        xmlText.includes("PaxHeader") ||
        xmlText.includes("GlobalHeader");

      if (isTarArchive) {
        this.logger.info(`🔍 Detected tar archive after gzip decompression, preserving binary data for proper extraction`);
        // Return binary data for tar extraction to avoid corruption
        return {
          success: true,
          data: xmlText,
          binaryData: decompressed,
          originalSize,
          decompressedSize: xmlText.length,
          processingTime: Date.now() - startTime
        };
      }

      // Yield to UI thread after decompression to prevent freezing
      this.logger.debug(`🔍 Debug: Yielding to UI thread...`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      this.logger.debug(`🔍 Debug: UI thread yield completed`);

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

      this.logger.error("❌ Failed to decompress gzipped data:", {
        error: err instanceof Error ? err.message : String(err),
      });
      this.logger.error("❌ Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : "No stack trace",
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
