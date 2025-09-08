import { FormatProcessor } from "@fustilio/data-loader";
import type { 
  WordNetProcessingResult, 
  WordNetProcessingOptions, 
  WordNetContentType 
} from "./types.js";
import { WordNetContentDetector } from "./wordnet-content-detector.js";
import { getWordNetDataSource, isValidWordNetProject } from "./data-sources.js";

/**
 * WordNet-specific data processor
 * This extends the generic FormatProcessor with WordNet domain knowledge
 */
export class WordNetProcessor {
  private formatProcessor: FormatProcessor;
  private contentDetector: WordNetContentDetector;

  constructor() {
    this.formatProcessor = new FormatProcessor();
    this.contentDetector = new WordNetContentDetector();
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
      // Validate project ID
      if (!isValidWordNetProject(options.projectId)) {
        throw new Error(`Invalid WordNet project ID: ${options.projectId}`);
      }

      // Get data source information
      const dataSource = getWordNetDataSource(options.projectId);
      if (!dataSource) {
        throw new Error(`WordNet data source not found: ${options.projectId}`);
      }

      // Process data using generic format processor
      const formatResult = await this.formatProcessor.processData(data, {
        projectId: options.projectId,
        enableTarExtraction: options.enableTarExtraction ?? true
      });

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
