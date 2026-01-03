import { createDefaultProcessorFactory } from "@fustilio/data-loader";
import type { 
  WordNetProcessingResult, 
  WordNetProcessingOptions, 
  WordNetDataSourceRegistry
} from "./types.js";
import { WordNetContentDetector } from "./wordnet-content-detector.js";
import { getWordNetDataSource, WORDNET_DATA_SOURCES } from "./data-sources.js";

/**
 * WordNet-specific data processor
 * This extends the generic FormatProcessor with WordNet domain knowledge
 */
export class WordNetProcessor {
  private formatProcessor: any; // Will be created by factory
  private contentDetector: WordNetContentDetector;
  private dataSources: WordNetDataSourceRegistry;

  constructor(dataSources?: WordNetDataSourceRegistry) {
    // Use the new factory pattern for FormatProcessor
    const factory = createDefaultProcessorFactory();
    this.formatProcessor = factory.createProcessor();
    this.contentDetector = new WordNetContentDetector();
    this.dataSources = dataSources || WORDNET_DATA_SOURCES;
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
    const { onProgress } = options;

    try {
      // Initial progress
      if (onProgress) onProgress(0.05, 'Starting WordNet processing...');

      // Validate project ID using instance data sources
      if (!(options.projectId in this.dataSources)) {
        throw new Error(`Invalid WordNet project ID: ${options.projectId}`);
      }

      // Get data source information
      const dataSource = this.dataSources[options.projectId];
      if (!dataSource) {
        throw new Error(`WordNet data source not found: ${options.projectId}`);
      }

      if (onProgress) onProgress(0.1, 'Validating data source...');

      // Process data using the generic format processor
      // The @fustilio/data-loader already handles gzip decompression with pako internally
      if (onProgress) onProgress(0.15, 'Processing data format...');
      
      const shouldEnableTarExtraction = options.enableTarExtraction ?? 
        !dataSource.format.includes('tar.gz');
      
      const formatResult = await this.formatProcessor.processData(data, {
        projectId: options.projectId,
        enableTarExtraction: shouldEnableTarExtraction
      });
      
      if (onProgress) onProgress(0.25, 'Format processing completed...');

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

      // Ensure we have XML content for further processing
      if (!formatResult.xmlContent) {
        return {
          success: false,
          projectId: options.projectId,
          language: dataSource.language,
          version: dataSource.version,
          contentType: "unknown",
          confidence: "low",
          error: "No XML content found after format processing",
          processingSteps: [...formatResult.processingSteps, "No XML content found"],
          totalProcessingTime: Date.now() - startTime,
          originalSize,
          finalSize: 0
        };
      }

      // Apply WordNet-specific content detection
      if (onProgress) onProgress(0.3, 'Detecting WordNet content type...');
      
      const wordnetDetection = this.contentDetector.detectWordNetContentType(
        formatResult.xmlContent!,
        options.projectId
      );

      // Use WordNet-specific content type
      const finalContentType = wordnetDetection.type;

      if (onProgress) onProgress(0.4, 'Content detection completed...');

      // Extract WordNet metadata if requested
      let wordnetMetadata;
      if (options.extractMetadata) {
        if (onProgress) onProgress(0.5, 'Extracting WordNet metadata...');
        
        wordnetMetadata = this.contentDetector.extractWordNetMetadata(
          formatResult.xmlContent!,
          options.projectId
        );
        
        if (onProgress) onProgress(0.6, 'Metadata extraction completed...');
      }

      // Validate LMF structure if requested
      if (options.validateLMF && wordnetDetection.type === "lmf") {
        if (onProgress) onProgress(0.7, 'Validating LMF structure...');
        
        const validation = this.contentDetector.validateLMFStructure(formatResult.xmlContent!);
        if (!validation.isValid) {
          console.warn("LMF validation failed:", validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.warn("LMF validation warnings:", validation.warnings);
        }
        
        if (onProgress) onProgress(0.8, 'LMF validation completed...');
      }

      if (onProgress) onProgress(1.0, 'WordNet processing completed successfully');

      return {
        success: true,
        projectId: options.projectId,
        language: dataSource.language,
        version: dataSource.version,
        contentType: finalContentType,
        confidence: wordnetDetection.confidence,
        xmlContent: formatResult.xmlContent, // This should contain the decompressed XML content
        processingSteps: [
          ...formatResult.processingSteps,
          "WordNet content detection",
          ...(options.extractMetadata ? ["WordNet metadata extraction"] : []),
          ...(options.validateLMF ? ["LMF structure validation"] : [])
        ],
        totalProcessingTime: Date.now() - startTime,
        originalSize,
        finalSize: formatResult.finalSize || originalSize,
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
