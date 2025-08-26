import { createScopedLogger } from "utils/logger";

export type ContentType = "xml" | "lmf" | "ili" | "tsv" | "tar" | "unknown";

export interface ContentAnalysis {
  type: ContentType;
  confidence: "high" | "medium" | "low";
  indicators: {
    hasTarHeader: boolean;
    hasXMLContent: boolean;
    hasTabs: boolean;
    hasTSVStructure: boolean;
    isOMWPackage: boolean;
    hasOMWIndicators: boolean;
    hasBinaryTarContent: boolean;
  };
  details: {
    length: number;
    firstChars: string;
    lastChars: string;
  };
}

/**
 * Detects the content type by examining decompressed file content
 */
export class ContentTypeDetector {
  private logger = createScopedLogger("ContentTypeDetector", "trace");

  /**
   * Detect the content type by examining the decompressed file content
   */
  detectContentType(
    content: string,
    projectIdWithVersion: string
  ): ContentAnalysis {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      this.logger.warn(`Empty content detected for ${projectIdWithVersion}`);
      return this.createAnalysis("unknown", "low", projectIdWithVersion, trimmedContent);
    }

    // Check for tar archive indicators (after decompression)
    const hasTarHeader =
      trimmedContent.startsWith("ustar") ||
      trimmedContent.startsWith("PaxHeader") ||
      trimmedContent.startsWith("GlobalHeader") ||
      // Check for tar file entries (e.g., "omw-fr/0000755...")
      /^[a-zA-Z0-9_-]+\/0000[0-7]{3}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}/m.test(trimmedContent);

    // Additional check: tar files typically don't contain XML-like content
    const hasXMLContent =
      trimmedContent.includes("<?xml") ||
      trimmedContent.includes("<LexicalResource") ||
      trimmedContent.includes("<lexicon");

    // Enhanced tar detection for OMW packages
    const isOMWPackage = projectIdWithVersion.startsWith("omw-");
    const hasOMWIndicators = 
      trimmedContent.includes("omw-") ||
      trimmedContent.includes("wolf") ||
      trimmedContent.includes("french") ||
      trimmedContent.includes("thai");

    // Check for binary tar content (tar files often contain binary data that looks like garbage when decoded as text)
    const hasBinaryTarContent = 
      trimmedContent.length > 1000 && 
      (trimmedContent.includes("\x00") || // null bytes
       trimmedContent.includes("\x1f") || // control characters
       trimmedContent.includes("\x7f"));  // delete character

    // Check for LMF XML content
    const hasTabs = trimmedContent.includes("\t");
    const hasTSVStructure = hasTabs && trimmedContent.includes("\n");
    
    // Check for ILI content
    const hasILIStructure = trimmedContent.includes("ili") && trimmedContent.includes("status");

    // Determine content type with confidence
    let type: ContentType;
    let confidence: "high" | "medium" | "low";

    // If we detect tar indicators, prioritize tar detection over other types
    if (hasTarHeader || (isOMWPackage && hasOMWIndicators && hasBinaryTarContent)) {
      type = "tar";
      confidence = hasTarHeader ? "high" : "medium";
      this.logger.debug(`Detected tar archive content after decompression for ${projectIdWithVersion}`);
    }
    // Check for LMF XML content
    else if (hasXMLContent) {
      type = "lmf";
      confidence = "high";
      this.logger.debug(`Detected LMF XML content for ${projectIdWithVersion}`);
    }
    // Check for ILI/TSV content (only if we're sure it's not a tar archive)
    else if (hasTSVStructure && !hasTarHeader && !isOMWPackage) {
      type = "tsv";
      confidence = "medium";
      this.logger.debug(`Detected TSV content for ${projectIdWithVersion}`);
    }
    // Check for ILI content
    else if (hasILIStructure) {
      type = "ili";
      confidence = "medium";
      this.logger.debug(`Detected ILI content for ${projectIdWithVersion}`);
    }
    // Fallback to XML if we have some XML-like content
    else if (hasXMLContent) {
      type = "xml";
      confidence = "low";
      this.logger.debug(`Detected generic XML content for ${projectIdWithVersion}`);
    }
    else {
      type = "unknown";
      confidence = "low";
    }

    // If we can't determine the type, log what we found for debugging
    if (type === "unknown") {
      this.logger.warn(
        `Could not determine content type for ${projectIdWithVersion}. Content analysis:`,
        {
          length: trimmedContent.length,
          hasTarHeader,
          hasXMLContent,
          hasTabs,
          hasTSVStructure,
          isOMWPackage,
          hasOMWIndicators,
          hasBinaryTarContent,
          firstChars: trimmedContent.substring(0, 200),
          lastChars: trimmedContent.substring(Math.max(0, trimmedContent.length - 200))
        }
      );
    }

    return this.createAnalysis(type, confidence, projectIdWithVersion, trimmedContent);
  }

  private createAnalysis(
    type: ContentType,
    confidence: "high" | "medium" | "low",
    projectId: string,
    content: string
  ): ContentAnalysis {
    return {
      type,
      confidence,
      indicators: {
        hasTarHeader: content.startsWith("ustar") || content.startsWith("PaxHeader") || content.startsWith("GlobalHeader"),
        hasXMLContent: content.includes("<?xml") || content.includes("<LexicalResource") || content.includes("<lexicon"),
        hasTabs: content.includes("\t"),
        hasTSVStructure: content.includes("\t") && content.includes("\n"),
        isOMWPackage: projectId.startsWith("omw-"),
        hasOMWIndicators: content.includes("omw-") || content.includes("wolf") || content.includes("french") || content.includes("thai"),
        hasBinaryTarContent: content.length > 1000 && (content.includes("\x00") || content.includes("\x1f") || content.includes("\x7f"))
      },
      details: {
        length: content.length,
        firstChars: content.substring(0, 200),
        lastChars: content.substring(Math.max(0, content.length - 200))
      }
    };
  }
}
