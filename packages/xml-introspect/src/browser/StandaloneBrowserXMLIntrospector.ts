/**
 * Standalone Browser-compatible XML Introspector
 * 
 * This is a completely standalone, browser-compatible version that doesn't import
 * from any other modules in the xml-introspect package to avoid Node.js dependencies.
 */

// Standalone types for browser compatibility
export interface StandaloneXMLStructure {
  elementCounts: Record<string, number>;
  attributeCounts: Record<string, number>;
  rootElements: string[];
  commonElements: Array<{ name: string; count: number }>;
  attributes: Array<{ name: string; count: number }>;
  maxDepth: number;
  totalElements: number;
}

export interface StandaloneContentPreview {
  firstLines: string[];
  lastLines: string[];
  totalLines: number;
  preview: string;
}

export interface StandaloneValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StandaloneContentAnalysis {
  structure: StandaloneXMLStructure;
  preview: StandaloneContentPreview;
  validation: StandaloneValidationResult;
}

export class StandaloneBrowserXMLIntrospector {
  /**
   * Analyze XML content structure using a simple XML parser
   */
  async analyzeContent(xmlContent: string): Promise<StandaloneXMLStructure> {
    try {
      // Use a simple XML parser approach
      const structure = this.parseXMLStructure(xmlContent);
      return structure;
    } catch (error) {
      console.warn('Failed to analyze XML content:', error);
      return this.createEmptyStructure();
    }
  }

  /**
   * Get content preview (first and last N lines)
   */
  getContentPreview(content: string, lines: number = 200): StandaloneContentPreview {
    const contentLines = content.split('\n');
    const totalLines = contentLines.length;
    
    if (totalLines <= lines * 2) {
      return {
        firstLines: contentLines,
        lastLines: [],
        totalLines,
        preview: content
      };
    }
    
    const firstLines = contentLines.slice(0, lines);
    const lastLines = contentLines.slice(-lines);
    
    const preview = [
      ...firstLines,
      `\n... (${totalLines - lines * 2} lines omitted) ...\n`,
      ...lastLines
    ].join('\n');
    
    return {
      firstLines,
      lastLines,
      totalLines,
      preview
    };
  }

  /**
   * Validate XML content (basic validation)
   */
  async validateContent(xmlContent: string): Promise<StandaloneValidationResult> {
    try {
      // Basic XML validation by checking for well-formedness
      const isValid = this.isWellFormedXML(xmlContent);
      return {
        valid: isValid,
        errors: isValid ? [] : ['Invalid XML structure'],
        warnings: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML'],
        warnings: []
      };
    }
  }

  /**
   * Comprehensive content analysis
   */
  async analyzeContentStructure(content: string): Promise<StandaloneContentAnalysis> {
    const structure = await this.analyzeContent(content);
    const preview = this.getContentPreview(content);
    const validation = await this.validateContent(content);
    
    return {
      structure,
      preview,
      validation
    };
  }

  /**
   * Simple XML structure parser
   */
  private parseXMLStructure(xmlContent: string): StandaloneXMLStructure {
    const elementCounts: Record<string, number> = {};
    const attributeCounts: Record<string, number> = {};
    const rootElements: string[] = [];
    const commonElements: Array<{ name: string; count: number }> = [];
    const attributes: Array<{ name: string; count: number }> = [];
    let maxDepth = 0;
    let totalElements = 0;

    // Simple regex-based XML parsing
    const elementRegex = /<(\w+)(?:\s+([^>]*))?>/g;
    const selfClosingRegex = /<(\w+)(?:\s+([^>]*))?\/>/g;
    let match;
    let depth = 0;

    // Parse regular elements
    while ((match = elementRegex.exec(xmlContent)) !== null) {
      const elementName = match[1];
      const attributesStr = match[2] || '';
      
      totalElements++;
      elementCounts[elementName] = (elementCounts[elementName] || 0) + 1;
      
      if (depth === 0) {
        rootElements.push(elementName);
      }

      // Parse attributes
      if (attributesStr) {
        const attrRegex = /(\w+)=["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          const attrName = attrMatch[1];
          attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
        }
      }

      depth++;
      maxDepth = Math.max(maxDepth, depth);
    }

    // Parse self-closing elements
    while ((match = selfClosingRegex.exec(xmlContent)) !== null) {
      const elementName = match[1];
      const attributesStr = match[2] || '';
      
      totalElements++;
      elementCounts[elementName] = (elementCounts[elementName] || 0) + 1;
      
      if (depth === 0) {
        rootElements.push(elementName);
      }

      // Parse attributes
      if (attributesStr) {
        const attrRegex = /(\w+)=["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          const attrName = attrMatch[1];
          attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
        }
      }
    }

    // Sort and limit common elements
    Object.entries(elementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .forEach(([name, count]) => {
        commonElements.push({ name, count });
      });

    // Sort and limit attributes
    Object.entries(attributeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .forEach(([name, count]) => {
        attributes.push({ name, count });
      });

    return {
      elementCounts,
      attributeCounts,
      rootElements,
      commonElements,
      attributes,
      maxDepth,
      totalElements
    };
  }

  /**
   * Basic XML well-formedness check
   */
  private isWellFormedXML(xmlContent: string): boolean {
    try {
      // Basic checks for XML structure
      const trimmed = xmlContent.trim();
      
      // Must start with < and end with >
      if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
        return false;
      }

      // Check for balanced tags (simplified)
      const openTags = trimmed.match(/<[^\/][^>]*>/g) || [];
      const closeTags = trimmed.match(/<\/[^>]*>/g) || [];
      const selfClosingTags = trimmed.match(/<[^>]*\/>/g) || [];

      // Basic balance check
      const totalOpenTags = openTags.length + selfClosingTags.length;
      const totalCloseTags = closeTags.length + selfClosingTags.length;

      return totalOpenTags >= totalCloseTags;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create empty structure for error cases
   */
  private createEmptyStructure(): StandaloneXMLStructure {
    return {
      elementCounts: {},
      attributeCounts: {},
      rootElements: [],
      commonElements: [],
      attributes: [],
      maxDepth: 0,
      totalElements: 0
    };
  }
}
