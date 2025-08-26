import { createScopedLogger } from "utils/logger";
import { ContentTypeDetector, type ContentType } from "./content-type-detector.js";
import { GzipHandler } from "./gzip-handler.js";
import { XzHandler } from "./xz-handler.js";
import { TarHandler } from "./tar-handler.js";

export interface FormatProcessingResult {
  success: boolean;
  xmlContent?: string;
  error?: string;
  contentType: ContentType;
  confidence: "high" | "medium" | "low";
  processingSteps: string[];
  totalProcessingTime: number;
  originalSize: number;
  finalSize: number;
}

export interface FormatProcessingOptions {
  projectId: string;
  forceType?: ContentType;
  enableTarExtraction?: boolean;
}

/**
 * Main processor that handles all file format detection and processing
 */
export class FormatProcessor {
  private logger = createScopedLogger("FormatProcessor", "trace");
  private contentTypeDetector: ContentTypeDetector;
  private gzipHandler: GzipHandler;
  private xzHandler: XzHandler;
  private tarHandler: TarHandler;

  constructor() {
    this.contentTypeDetector = new ContentTypeDetector();
    this.gzipHandler = new GzipHandler();
    this.xzHandler = new XzHandler();
    this.tarHandler = new TarHandler();
  }

  /**
   * Process downloaded data through the complete format detection and extraction pipeline
   */
  async processData(
    data: ArrayBuffer,
    options: FormatProcessingOptions
  ): Promise<FormatProcessingResult> {
    const startTime = Date.now();
    const originalSize = data.byteLength;
    const processingSteps: string[] = [];
    
    this.logger.debug(`🔍 Debug processData: Received ${data.byteLength} bytes`);
    this.logger.debug(`🔍 Debug processData: First 16 bytes:`, {
      bytes: Array.from(new Uint8Array(data).slice(0, 16))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" "),
    });

    try {
      const view = new Uint8Array(data);
      let xmlText: string;
      let contentType: ContentType = "unknown";
      let confidence: "high" | "medium" | "low" = "low";

      // Step 1: Check for XZ compression
      if (this.xzHandler.isXzCompressed(view)) {
        processingSteps.push("XZ decompression");
        this.logger.debug(`🔍 Debug: XZ magic numbers detected`);
        
        const xzResult = await this.xzHandler.decompress(view);
        if (!xzResult.success) {
          throw new Error(`XZ decompression failed: ${xzResult.error}`);
        }
        
        xmlText = xzResult.data!;
        processingSteps.push(`XZ decompression completed (${xzResult.decompressedSize} chars)`);
        
        // Check if decompressed content is a tar archive
        if (this.tarHandler.isTarArchive(xmlText)) {
          processingSteps.push("Tar archive detection after XZ");
          this.logger.info(`🔍 Detected tar archive after XZ decompression, will extract to find LMF files`);
          
          // Store the binary data for tar extraction to avoid corruption
          if (xzResult.binaryData) {
            this.logger.debug(`🔍 Binary data available from XZ decompression for tar extraction`);
            // Store binary data for later use in tar extraction
            (data as any).__xzBinaryData = xzResult.binaryData;
          }
        }
      }
      // Step 2: Check for gzip compression
      else if (this.gzipHandler.isGzipCompressed(view)) {
        processingSteps.push("Gzip decompression");
        this.logger.debug(`🔍 Debug: Gzip magic numbers detected`);
        
        const gzipResult = await this.gzipHandler.decompress(view);
        if (!gzipResult.success) {
          throw new Error(`Gzip decompression failed: ${gzipResult.error}`);
        }
        
        xmlText = gzipResult.data!;
        processingSteps.push(`Gzip decompression completed (${gzipResult.decompressedSize} chars)`);
        
        // Check if decompressed content is a tar archive
        if (this.tarHandler.isTarArchive(xmlText)) {
          processingSteps.push("Tar archive detection after gzip");
          this.logger.info(`🔍 Detected tar archive after gzip decompression, will extract to find LMF files`);
          
          // Store the binary data for tar extraction to avoid corruption
          if (gzipResult.binaryData) {
            this.logger.debug(`🔍 Binary data available from gzip decompression for tar extraction`);
            // Store binary data for later use in tar extraction
            (data as any).__gzipBinaryData = gzipResult.binaryData;
          }
        }
      }
      // Step 3: Data is not compressed
      else {
        processingSteps.push("No compression detected");
        xmlText = new TextDecoder().decode(data);
        this.logger.debug(`📊 Data is not compressed: ${data.byteLength} bytes -> ${xmlText.length} characters`);
        processingSteps.push(`Text decoding completed (${xmlText.length} chars)`);
      }

      // Step 4: Content type detection
      processingSteps.push("Content type detection");
      const contentAnalysis = this.contentTypeDetector.detectContentType(xmlText, options.projectId);
      contentType = contentAnalysis.type;
      confidence = contentAnalysis.confidence;
      
      this.logger.debug(`🔍 Content analysis for ${options.projectId}:`, {
        contentLength: xmlText.length,
        first100Chars: xmlText.substring(0, 100),
        last100Chars: xmlText.substring(Math.max(0, xmlText.length - 100)),
        containsXML: contentAnalysis.indicators.hasXMLContent,
        containsTabs: contentAnalysis.indicators.hasTabs,
        containsUstar: contentAnalysis.indicators.hasTarHeader,
      });

      // Step 5: Handle tar archives if detected
      if (contentType === "tar" && options.enableTarExtraction !== false) {
        processingSteps.push("Tar archive extraction");
        
        // Special case: OEWN packages are gzip-compressed XML, not tar archives
        if (
          options.projectId.startsWith("oewn:") ||
          options.projectId.startsWith("ewn:")
        ) {
          this.logger.warn(`⚠️ OEWN package ${options.projectId} detected as tar, but should be XML. Overriding detection.`);
          this.logger.info(`🔄 Forcing file type to 'lmf' for OEWN package`);
          contentType = "lmf";
          confidence = "high";
          processingSteps.push("OEWN package type override");
        } else {
          this.logger.info(`📦 Detected tar archive, extracting to find LMF files...`);
          
          try {
            // For tar archives, we need to work with the original binary data
            // Check if we have the original decompressed data available
            if (view && (view[0] === 0x75 && view[1] === 0x73 && view[2] === 0x74 && view[3] === 0x61 && view[4] === 0x72)) {
              // This is a tar file, use the original binary data
              this.logger.debug(`🔍 Using original binary data for tar extraction`);
              const tarResult = await this.tarHandler.extractTarArchive(data);
              
              if (!tarResult.success) {
                throw new Error(`Tar extraction failed: ${tarResult.error}`);
              }
              
              this.logger.info(`✅ Successfully extracted LMF file from tar archive`);
              xmlText = tarResult.xmlContent!;
              contentType = "lmf";
              confidence = "high";
              processingSteps.push(`Tar extraction completed (${tarResult.extractedFiles.length} files)`);
            } else if ((data as any).__xzBinaryData) {
              // Use the binary data stored from XZ decompression
              this.logger.debug(`🔍 Using binary data from XZ decompression for tar extraction`);
              const binaryData = (data as any).__xzBinaryData as Uint8Array;
              // Convert to ArrayBuffer to avoid SharedArrayBuffer issues
              const arrayBuffer = binaryData.slice().buffer;
              const tarResult = await this.tarHandler.extractTarArchive(arrayBuffer);
              
              if (!tarResult.success) {
                throw new Error(`Tar extraction failed: ${tarResult.error}`);
              }
              
              this.logger.info(`✅ Successfully extracted LMF file from tar archive using XZ binary data`);
              xmlText = tarResult.xmlContent!;
              contentType = "lmf";
              confidence = "high";
              processingSteps.push(`Tar extraction from XZ binary data completed (${tarResult.extractedFiles.length} files)`);
            } else if ((data as any).__gzipBinaryData) {
              // Use the binary data stored from gzip decompression
              this.logger.debug(`🔍 Using binary data from gzip decompression for tar extraction`);
              const binaryData = (data as any).__gzipBinaryData as Uint8Array;
              // Convert to ArrayBuffer to avoid SharedArrayBuffer issues
              const arrayBuffer = binaryData.slice().buffer;
              const tarResult = await this.tarHandler.extractTarArchive(arrayBuffer);
              
              if (!tarResult.success) {
                throw new Error(`Tar extraction failed: ${tarResult.error}`);
              }
              
              this.logger.info(`✅ Successfully extracted LMF file from tar archive using gzip binary data`);
              xmlText = tarResult.xmlContent!;
              contentType = "lmf";
              confidence = "high";
              processingSteps.push(`Tar extraction from gzip binary data completed (${tarResult.extractedFiles.length} files)`);
            } else {
              // No binary data available - this should not happen with our improved decompression handling
              this.logger.error(`❌ Tar archive detected but no binary data available for extraction`);
              this.logger.error(`❌ This indicates a bug in the decompression pipeline`);
              throw new Error(`Cannot extract tar archive: no binary data available. This is a system error.`);
            }
          } catch (error) {
            const errorMessage = `❌ Failed to extract tar archive for ${options.projectId}: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage);
            throw error;
          }
        }
      }

      // Step 6: Final validation
      processingSteps.push("Final content validation");
      
      // Check for empty content
      if (xmlText.length === 0) {
        this.logger.error(`❌ CRITICAL: Decompressed content is empty (0 characters)!`);
        throw new Error("Decompressed content is empty - file may be corrupted or download failed");
      }

      // Content type-specific validation
      if (contentType === "lmf" || contentType === "xml") {
        // Check for LMF XML content
        if (!xmlText.includes("<LexicalResource")) {
          this.logger.error(`❌ CRITICAL: Decompressed XML does not contain LexicalResource element!`);
          this.logger.error(`❌ XML length: ${xmlText.length}`);
          this.logger.error(`❌ First 500 chars:`, xmlText.substring(0, 500));
          this.logger.error(`❌ Last 500 chars:`, xmlText.substring(Math.max(0, xmlText.length - 500)));
          throw new Error("Decompressed XML does not contain LexicalResource element - file may be corrupted");
        }
        
        this.logger.debug(`✅ XML content verification passed - LexicalResource element found`);
        processingSteps.push("XML validation passed");
      } else if (contentType === "tsv" || contentType === "ili") {
        // For TSV/ILI content, validate tab separators and structure
        if (!xmlText.includes("\t")) {
          this.logger.error(`❌ CRITICAL: TSV/ILI content does not contain tab separators!`);
          this.logger.error(`❌ Content length: ${xmlText.length}`);
          this.logger.error(`❌ First 500 chars:`, xmlText.substring(0, 500));
          throw new Error("TSV/ILI content does not contain tab separators - file may be corrupted");
        }
        
        this.logger.debug(`✅ TSV/ILI content verification passed - tab separators found`);
        processingSteps.push("TSV/ILI validation passed");
      } else if (contentType === "tar") {
        // For tar content, basic validation that it's not empty
        this.logger.debug(`✅ Tar content verification passed - content is not empty`);
        processingSteps.push("Tar validation passed");
      } else {
        // For unknown content types, just log that we're proceeding
        this.logger.warn(`⚠️ Unknown content type '${contentType}', proceeding without specific validation`);
        processingSteps.push("Unknown content type - no validation");
      }

      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;

      return {
        success: true,
        xmlContent: xmlText,
        contentType,
        confidence,
        processingSteps,
        totalProcessingTime,
        originalSize,
        finalSize: xmlText.length
      };

    } catch (error) {
      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;

      this.logger.error(`❌ Format processing failed:`, {
        error: error instanceof Error ? error.message : String(error),
        projectId: options.projectId,
        originalSize,
        processingSteps
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        contentType: "unknown",
        confidence: "low",
        processingSteps,
        totalProcessingTime,
        originalSize,
        finalSize: 0
      };
    }
  }

  /**
   * Get processing statistics for debugging
   */
  getProcessingStats(): {
    handlers: {
      contentTypeDetector: boolean;
      gzipHandler: boolean;
      xzHandler: boolean;
      tarHandler: boolean;
    };
  } {
    return {
      handlers: {
        contentTypeDetector: !!this.contentTypeDetector,
        gzipHandler: !!this.gzipHandler,
        xzHandler: !!this.xzHandler,
        tarHandler: !!this.tarHandler,
      }
    };
  }
}
