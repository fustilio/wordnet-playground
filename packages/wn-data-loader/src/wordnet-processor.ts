import { FormatProcessor } from "@fustilio/data-loader";
import type { 
  WordNetProcessingResult, 
  WordNetProcessingOptions, 
  WordNetContentType,
  WordNetDataSource,
  WordNetDataSourceRegistry
} from "./types.js";
import { WordNetContentDetector } from "./wordnet-content-detector.js";
import { getWordNetDataSource, isValidWordNetProject, WORDNET_DATA_SOURCES } from "./data-sources.js";

/**
 * WordNet-specific data processor
 * This extends the generic FormatProcessor with WordNet domain knowledge
 */
export class WordNetProcessor {
  private formatProcessor: FormatProcessor;
  private contentDetector: WordNetContentDetector;
  private dataSources: WordNetDataSourceRegistry;

  constructor(dataSources?: WordNetDataSourceRegistry) {
    this.formatProcessor = new FormatProcessor();
    this.contentDetector = new WordNetContentDetector();
    this.dataSources = dataSources || WORDNET_DATA_SOURCES;
  }

  /**
   * Decompress gzipped data
   */
  private async decompressGzip(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Use the browser's built-in DecompressionStream API
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      // Write the compressed data
      await writer.write(data);
      await writer.close();
      
      // Read the decompressed data
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    } else {
      // Fallback: try to use pako if available
      throw new Error('Gzip decompression not supported in this environment. DecompressionStream API not available.');
    }
  }

  /**
   * Process WordNet data with domain-specific logic
   */
  async processWordNetData(
    data: ArrayBuffer,
    options: WordNetProcessingOptions
  ): Promise<WordNetProcessingResult> {
    const startTime = Date.now();
    const originalSize = data.byteLength;

    try {
      // Validate project ID using instance data sources
      if (!(options.projectId in this.dataSources)) {
        throw new Error(`Invalid WordNet project ID: ${options.projectId}`);
      }

      // Get data source information
      const dataSource = this.dataSources[options.projectId];
      if (!dataSource) {
        throw new Error(`WordNet data source not found: ${options.projectId}`);
      }

      // Process data using generic format processor
      // For .xml.gz files, handle decompression directly since they're just gzipped XML
      let formatResult;
      if (dataSource.format === 'xml.gz' || dataSource.format === 'gz') {
        // Handle gzipped XML files directly
        try {
          // Decompress the gzipped data
          const decompressedData = await this.decompressGzip(data);
          
          // Create a mock format result for XML content
          formatResult = {
            success: true,
            projectId: options.projectId,
            contentType: "xml" as WordNetContentType,
            confidence: "high",
            data: decompressedData,
            processingSteps: ["gzip decompression", "XML content detection"],
            metadata: {
              originalSize: data.byteLength,
              decompressedSize: decompressedData.byteLength,
              compressionRatio: (data.byteLength / decompressedData.byteLength).toFixed(2)
            }
          };
        } catch (error) {
          formatResult = {
            success: false,
            projectId: options.projectId,
            contentType: "unknown" as WordNetContentType,
            confidence: "low",
            error: `Failed to decompress gzipped data: ${error}`,
            processingSteps: ["gzip decompression failed"]
          };
        }
      } else {
        // Use the generic format processor for other formats
        const shouldEnableTarExtraction = options.enableTarExtraction ?? 
          (dataSource.format !== 'xml.gz' && dataSource.format !== 'gz');
        
        formatResult = await this.formatProcessor.processData(data, {
          projectId: options.projectId,
          enableTarExtraction: shouldEnableTarExtraction
        });
      }

      if (!formatResult.success) {
        return {
          success: false,
          projectId: options.projectId,
          language: dataSource.language,
          version: dataSource.version,
          contentType: "unknown",
          confidence: "low",
          error: formatResult.error,
          processingSteps: [...formatResult.processingSteps, "WordNet processing failed"],
          totalProcessingTime: Date.now() - startTime,
          originalSize,
          finalSize: 0
        };
      }

      // Apply WordNet-specific content detection
      const wordnetDetection = this.contentDetector.detectWordNetContentType(
        formatResult.xmlContent!,
        options.projectId
      );

      // Use WordNet-specific content type
      const finalContentType = wordnetDetection.type;

      // Extract WordNet metadata if requested
      let wordnetMetadata;
      if (options.extractMetadata) {
        wordnetMetadata = this.contentDetector.extractWordNetMetadata(
          formatResult.xmlContent!,
          options.projectId
        );
      }

      // Validate LMF structure if requested
      if (options.validateLMF && wordnetDetection.type === "lmf") {
        const validation = this.contentDetector.validateLMFStructure(formatResult.xmlContent!);
        if (!validation.isValid) {
          console.warn("LMF validation failed:", validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.warn("LMF validation warnings:", validation.warnings);
        }
      }

      return {
        success: true,
        projectId: options.projectId,
        language: dataSource.language,
        version: dataSource.version,
        contentType: finalContentType,
        confidence: wordnetDetection.confidence,
        xmlContent: formatResult.xmlContent,
        processingSteps: [
          ...formatResult.processingSteps,
          "WordNet content detection",
          ...(options.extractMetadata ? ["WordNet metadata extraction"] : []),
          ...(options.validateLMF ? ["LMF structure validation"] : [])
        ],
        totalProcessingTime: Date.now() - startTime,
        originalSize,
        finalSize: formatResult.finalSize,
        extractedFiles: formatResult.extractedXmlFiles,
        wordnetMetadata
      };

    } catch (error) {
      return {
        success: false,
        projectId: options.projectId,
        language: "unknown",
        version: "unknown",
        contentType: "unknown",
        confidence: "low",
        error: error instanceof Error ? error.message : String(error),
        processingSteps: ["WordNet processing failed"],
        totalProcessingTime: Date.now() - startTime,
        originalSize,
        finalSize: 0
      };
    }
  }

  /**
   * Download and process WordNet data from URL
   */
  async downloadAndProcessWordNet(
    projectId: string,
    options: Omit<WordNetProcessingOptions, 'projectId'> = {}
  ): Promise<WordNetProcessingResult> {
    const dataSource = getWordNetDataSource(projectId);
    if (!dataSource) {
      throw new Error(`WordNet data source not found: ${projectId}`);
    }

    try {
      // Download data
      const response = await fetch(dataSource.url);
      if (!response.ok) {
        throw new Error(`Failed to download data: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Process data
      return await this.processWordNetData(arrayBuffer, {
        projectId,
        ...options
      });

    } catch (error) {
      return {
        success: false,
        projectId,
        language: dataSource.language,
        version: dataSource.version,
        contentType: "unknown",
        confidence: "low",
        error: error instanceof Error ? error.message : String(error),
        processingSteps: ["Download failed"],
        totalProcessingTime: 0,
        originalSize: 0,
        finalSize: 0
      };
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      formatProcessor: this.formatProcessor.getProcessingStats(),
      wordnetDetector: !!this.contentDetector
    };
  }
}
