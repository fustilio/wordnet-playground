import { createScopedLogger } from "utils/logger";

/**
 * Represents an XML element with its properties
 */
interface XMLElement {
  name: string;
  attributes: Record<string, string>;
  children: (XMLElement | XMLTextNode)[];
  text: string;
}

/**
 * Represents a text node in XML
 */
interface XMLTextNode {
  name: "#text";
  text: string;
}

/**
 * Represents the parsed XML structure
 */
interface ParsedXMLResult {
  [elementName: string]: XMLElement;
}

/**
 * Represents the complete result with metadata
 */
interface BrowserXMLParserResult {
  data: ParsedXMLResult;
  elementCount: number;
  rootElements: string[];
}

/**
 * Browser-compatible streaming XML parser for large files
 */
export class BrowserXMLParser {
  private xmlText: string;
  private debug: boolean;
  private logger = createScopedLogger("BrowserXMLParser");

  constructor(xmlText: string, debug = false) {
    this.xmlText = xmlText;
    this.debug = debug;
    
    if (this.debug) {
      this.logger.debug("BrowserXMLParser starting", { 
        xmlLength: xmlText.length,
        firstChars: xmlText.substring(0, 500)
      });
    }
  }

  /**
   * Parse the XML text into a structured object
   */
  async parse(): Promise<BrowserXMLParserResult> {
    if (this.debug) {
      this.logger.debug("Starting XML parsing");
    }

    try {
      // Check if DOMParser is available (browser environment)
      if (typeof DOMParser !== 'undefined') {
        return this.parseWithDOMParser();
      } else {
        // Fallback for Web Worker environments
        this.logger.warn("DOMParser not available, falling back to manual parsing");
        return this.parseManually();
      }
    } catch (error) {
      this.logger.error("XML parsing error", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Parse using native DOMParser (browser environment)
   */
  private async parseWithDOMParser(): Promise<BrowserXMLParserResult> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.xmlText, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      const errorMsg = xmlDoc.getElementsByTagName("parsererror")[0]?.textContent || "Unknown parsing error";
      this.logger.error("XML parsing failed", { error: errorMsg });
      throw new Error(`XML parsing failed: ${errorMsg}`);
    }

    const result: ParsedXMLResult = {};
    let elementCount = 0;

    // Process the root element (documentElement)
    const rootElement = xmlDoc.documentElement;
    if (rootElement) {
      const elementName = rootElement.nodeName;
      if (elementName) {
        result[elementName] = this.processElement(rootElement as Element);
        elementCount = 1; // There's only one root element
      }
    }

    if (this.debug) {
      this.logger.debug("XML parsing completed", { 
        elementCount,
        rootElements: Object.keys(result)
      });
    }

    // Return the parsed structure with metadata for consistency
    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result)
    };
  }

  /**
   * Manual XML parsing fallback for Web Worker environments
   */
  private async parseManually(): Promise<BrowserXMLParserResult> {
    this.logger.info("Using manual XML parser fallback");
    
    // Simple manual parsing for basic XML structures
    // This is a fallback and won't handle complex cases
    const result: ParsedXMLResult = {};
    let elementCount = 0;

    try {
      // Find the root element by looking for the first <tag>
      const rootMatch = this.xmlText.match(/<([a-zA-Z][a-zA-Z0-9_:]*)([^>]*)>/);
      if (rootMatch) {
        const rootTagName = rootMatch[1];
        const rootAttributes = this.parseAttributesManually(rootMatch[2]);
        
        // Create a basic root element structure
        result[rootTagName] = {
          name: rootTagName,
          attributes: rootAttributes,
          children: [],
          text: ""
        };
        elementCount = 1;
        
        this.logger.info("Manual parsing completed", { 
          rootElement: rootTagName,
          elementCount 
        });
      }
    } catch (error) {
      this.logger.error("Manual parsing failed", { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Manual XML parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result)
    };
  }

  /**
   * Process an XML element and its children recursively
   */
  private processElement(element: Element): XMLElement {
    const name = element.nodeName;
    const attributes: Record<string, string> = {};
    const children: (XMLElement | XMLTextNode)[] = [];
    let text = "";

    // Extract attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name && attr.value) {
        attributes[attr.name] = attr.value;
      }
    }

    // Process child nodes
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent?.trim();
        if (textContent) {
          text += textContent;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(this.processElement(child as Element));
      }
    }

    return {
      name,
      attributes,
      children,
      text
    };
  }

  /**
   * Parse attributes manually from attribute string
   */
  private parseAttributesManually(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}
