import type { WordNetContentType } from "./types.js";

/**
 * WordNet-specific content type detection
 * This extends the generic data-loader with WordNet domain knowledge
 * 
 * Note: This is a simplified version that focuses on WordNet-specific detection.
 * The main content detection is handled by the generic FormatProcessor.
 */
export class WordNetContentDetector {
  
  /**
   * Detect WordNet-specific content types from decompressed content
   * This adds WordNet domain knowledge on top of generic content detection
   */
  detectWordNetContentType(content: string, projectId: string): {
    type: WordNetContentType;
    confidence: "high" | "medium" | "low";
    indicators: {
      hasLMFStructure: boolean;
      hasOMWIndicators: boolean;
      hasCILIIndicators: boolean;
      hasWordNetElements: boolean;
      hasLexicalResource: boolean;
      hasSynsets: boolean;
      hasLemmas: boolean;
    };
  } {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      return {
        type: "unknown",
        confidence: "low",
        indicators: this.createEmptyIndicators()
      };
    }

    // Check for LMF (Lexical Markup Framework) structure
    const hasLMFStructure = 
      trimmedContent.includes("<LexicalResource") ||
      trimmedContent.includes("<lexicon") ||
      trimmedContent.includes("xmlns:lmf");

    // Check for OMW (Open Multilingual WordNet) indicators
    const hasOMWIndicators = 
      trimmedContent.includes("omw-") ||
      trimmedContent.includes("Open Multilingual WordNet") ||
      trimmedContent.includes("GlobalWordNet") ||
      projectId.startsWith("omw-");

    // Check for CILI (Collaborative Interlingual Index) indicators
    const hasCILIIndicators = 
      trimmedContent.includes("cili") ||
      trimmedContent.includes("ili") ||
      trimmedContent.includes("status") ||
      projectId.includes("cili");

    // Check for WordNet-specific elements
    const hasWordNetElements = 
      trimmedContent.includes("<Synset") ||
      trimmedContent.includes("<Lemma") ||
      trimmedContent.includes("<Sense") ||
      trimmedContent.includes("<WordForm");

    // Check for LexicalResource root element
    const hasLexicalResource = trimmedContent.includes("<LexicalResource");

    // Check for synsets (can be in sense elements or synset elements)
    const hasSynsets = trimmedContent.includes("<Synset") || trimmedContent.includes("synset=");

    // Check for lemmas (can be in lemma elements or writtenForm attributes)
    const hasLemmas = trimmedContent.includes("<Lemma") || trimmedContent.includes("writtenForm=");

    const indicators = {
      hasLMFStructure,
      hasOMWIndicators,
      hasCILIIndicators,
      hasWordNetElements,
      hasLexicalResource,
      hasSynsets,
      hasLemmas
    };

    // Determine content type with confidence
    let type: WordNetContentType;
    let confidence: "high" | "medium" | "low";

    if (hasCILIIndicators && hasTabsAndNewlines(trimmedContent)) {
      type = "cili-data";
      confidence = "high";
    } else if (hasLMFStructure) {
      if (hasOMWIndicators) {
        type = "omw-package";
        confidence = "high";
      } else if (projectId.startsWith("oewn:") || projectId.startsWith("ewn:")) {
        type = "own-package";
        confidence = "high";
      } else {
        type = "lmf";
        confidence = "high";
      }
    } else if (hasLexicalResource) {
      type = "lmf";
      confidence = "medium";
    } else if (hasWordNetElements) {
      type = "lmf";
      confidence = "low";
    } else {
      type = "unknown";
      confidence = "low";
    }

    return { type, confidence, indicators };
  }

  /**
   * Extract WordNet metadata from content
   */
  extractWordNetMetadata(content: string, projectId: string): {
    synsetCount?: number;
    lemmaCount?: number;
    language?: string;
    version?: string;
    source?: string;
  } {
    const metadata: any = {};

    try {
      // Count synsets (both <Synset> elements and synset= attributes)
      const synsetElementMatches = content.match(/<Synset/g);
      const synsetAttributeMatches = content.match(/synset=/g);
      const synsetCount = (synsetElementMatches?.length || 0) + (synsetAttributeMatches?.length || 0);
      if (synsetCount > 0) {
        metadata.synsetCount = synsetCount;
      }

      // Count lemmas (both <Lemma> elements and writtenForm= attributes)
      const lemmaElementMatches = content.match(/<Lemma/g);
      const lemmaAttributeMatches = content.match(/writtenForm=/g);
      const lemmaCount = (lemmaElementMatches?.length || 0) + (lemmaAttributeMatches?.length || 0);
      if (lemmaCount > 0) {
        metadata.lemmaCount = lemmaCount;
      }

      // Extract language from project ID or content
      if (projectId.includes(":")) {
        const parts = projectId.split(":");
        if (parts[0].includes("-")) {
          const langPart = parts[0].split("-")[1];
          if (langPart && langPart.length === 2) {
            metadata.language = langPart;
          }
        }
      }

      // Extract version
      if (projectId.includes(":")) {
        const parts = projectId.split(":");
        metadata.version = parts[1];
      }

      // Extract source
      if (projectId.startsWith("omw-")) {
        metadata.source = "Open Multilingual WordNet";
      } else if (projectId.startsWith("oewn:") || projectId.startsWith("ewn:")) {
        metadata.source = "Open English WordNet";
      } else if (projectId.includes("cili")) {
        metadata.source = "Collaborative Interlingual Index";
      }

    } catch (error) {
      console.warn("Error extracting WordNet metadata:", error);
    }

    return metadata;
  }

  /**
   * Validate LMF structure
   */
  validateLMFStructure(content: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required LMF elements
    if (!content.includes("<LexicalResource")) {
      errors.push("Missing LexicalResource root element");
    }

    if (!content.includes("<lexicon")) {
      errors.push("Missing lexicon elements");
    }

    // Check for WordNet-specific elements
    if (!content.includes("<Synset")) {
      warnings.push("No synsets found - may not be a valid WordNet file");
    }

    if (!content.includes("<Lemma")) {
      warnings.push("No lemmas found - may not be a valid WordNet file");
    }

    // Check for proper XML structure
    if (!content.includes("<?xml")) {
      warnings.push("Missing XML declaration");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private createEmptyIndicators() {
    return {
      hasLMFStructure: false,
      hasOMWIndicators: false,
      hasCILIIndicators: false,
      hasWordNetElements: false,
      hasLexicalResource: false,
      hasSynsets: false,
      hasLemmas: false
    };
  }
}

/**
 * Helper function to check for tab-separated content
 */
function hasTabsAndNewlines(content: string): boolean {
  return content.includes("\t") && content.includes("\n");
}
