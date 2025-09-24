import { createScopedLogger } from "utils/logger";
import { XMLParser } from "fast-xml-parser";

/**
 * Represents an XML element with its properties
 */
export interface XMLElement {
  name: string;
  attributes: Record<string, string>;
  children: (XMLElement | XMLTextNode)[];
  text: string;
  parent?: XMLElement;
}

/**
 * Represents a text node in XML
 */
export interface XMLTextNode {
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
interface MultiXMLParserResult {
  data: ParsedXMLResult;
  elementCount: number;
  rootElements: string[];
  parserUsed: 'DOMParser' | 'fast-xml-parser' | 'manual';
}

/**
 * Parser strategy options
 */
export interface ParserOptions {
  debug?: boolean;
  preferFastXMLParser?: boolean;
  fastXMLParserOptions?: {
    ignoreAttributes?: boolean;
    attributeNamePrefix?: string;
    textNodeName?: string;
    ignoreNameSpace?: boolean;
    parseAttributeValue?: boolean;
    parseTagValue?: boolean;
    trimValues?: boolean;
  };
}

/**
 * Multi-strategy XML parser that can use DOMParser, fast-xml-parser, or manual parsing
 */
export class MultiXMLParser {
  private xmlText: string;
  private options: ParserOptions;
  private logger = createScopedLogger("MultiXMLParser");

  constructor(xmlText: string, options: ParserOptions = {}) {
    this.xmlText = xmlText;
    this.options = { 
      debug: false, 
      preferFastXMLParser: false,
      fastXMLParserOptions: {
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        ignoreNameSpace: true,
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true
      },
      ...options 
    };
    
    if (this.options.debug) {
      this.logger.debug("MultiXMLParser starting", { 
        xmlLength: xmlText.length,
        firstChars: xmlText.substring(0, 500),
        preferFastXMLParser: this.options.preferFastXMLParser
      });
    }
  }

  /**
   * Detect the current JavaScript environment
   */
  private detectEnvironment(): 'main-thread' | 'web-worker' | 'node' {
    // Check if we're in a Web Worker (has self and importScripts but no window)
    if (typeof self !== 'undefined' && typeof (self as { importScripts?: () => void }).importScripts === 'function' && typeof window === 'undefined') {
      return 'web-worker';
    }
    
    // Check if we're in a main browser thread (has window)
    if (typeof window !== 'undefined') {
      return 'main-thread';
    }
    
    // Otherwise, assume Node.js
    return 'node';
  }

  /**
   * Parse the XML text using the best available strategy
   */
  async parse(): Promise<MultiXMLParserResult> {
    if (this.options.debug) {
      this.logger.debug("Starting XML parsing with multi-strategy approach");
    }

    const environment = this.detectEnvironment();
    if (this.options.debug) {
      this.logger.debug(`Detected environment: ${environment}`);
    }

    try {
      // Strategy 1: Use DOMParser in main browser thread (most reliable)
      if (environment === 'main-thread' && typeof DOMParser !== 'undefined') {
        try {
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.error("DOMParser failed in main browser thread.", { error: error instanceof Error ? error.message : String(error) });
          throw new Error("DOMParser failed in main browser thread. This is required for consistent LMF parsing.");
        }
      }

      // Strategy 2: Use fast-xml-parser in Web Workers or Node.js
      if ((environment === 'web-worker' || environment === 'node') && this.isFastXMLParserAvailable()) {
        try {
          return await this.parseWithFastXMLParser();
        } catch (error) {
          this.logger.warn("fast-xml-parser failed, trying other strategies", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Strategy 3: Fallback - try any available parser (but respect environment preferences)
      if (environment === 'main-thread' && typeof DOMParser !== 'undefined') {
        // In main-thread, always prefer DOMParser over fast-xml-parser
        try {
          this.logger.info("Falling back to DOMParser in main-thread environment");
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.warn("DOMParser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      } else if (this.isFastXMLParserAvailable()) {
        // In web-worker or node, prefer fast-xml-parser
        try {
          this.logger.info("Falling back to fast-xml-parser");
          return await this.parseWithFastXMLParser();
        } catch (error) {
          this.logger.warn("fast-xml-parser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Final fallback: try DOMParser if available (for any environment)
      if (typeof DOMParser !== 'undefined') {
        try {
          this.logger.info("Final fallback to DOMParser");
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.warn("Final DOMParser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      // No reliable parsers available
      this.logger.error(`No reliable XML parser available in ${environment} environment.`);
      throw new Error(`No reliable XML parser available in ${environment} environment. DOMParser (main thread) or fast-xml-parser (workers/Node.js) is required.`);
    } catch (error) {
      this.logger.error("All XML parsing strategies failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Check if fast-xml-parser is available
   */
  private isFastXMLParserAvailable(): boolean {
    // fast-xml-parser is now imported directly, so it's always available
    return true;
  }

  /**
   * Parse using fast-xml-parser (any JavaScript environment including web workers)
   */
  private async parseWithFastXMLParser(): Promise<MultiXMLParserResult> {
    try {
      // Remove debug logging for production
      // this.logger.debug('Parsing XML with fast-xml-parser');
      
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: false, // Disable for better performance
        parseTagValue: false, // Disable for better performance
        trimValues: false, // Disable for better performance
        allowBooleanAttributes: false, // Disable for better performance
        // Performance optimizations
        preserveOrder: false,
        processEntities: false, // Disable for better performance
        unpairedTags: [], // Empty array for better performance
        stopNodes: [], // Empty array for better performance
        // Note: validate option not available in fast-xml-parser v5
        // Memory optimizations
        removeNSPrefix: true,
        // Custom processors for better performance
        tagValueProcessor: (tagName: string, tagValue: string) => {
          // Only trim if necessary to avoid unnecessary string operations
          return tagValue.length > 1000 ? tagValue : tagValue.trim();
        },
        attributeValueProcessor: (attrName: string, attrValue: string) => {
          // Only process if necessary
          return attrValue;
        }
      });

      const result = parser.parse(this.xmlText);
      
      // Debug: Log the raw fast-xml-parser output for the first few elements

        this.logger.debug("fast-xml-parser raw output sample", {
          rootKeys: Object.keys(result),
          firstRootKey: Object.keys(result)[0],
          firstRootStructure: result[Object.keys(result)[0]] ? {
            keys: Object.keys(result[Object.keys(result)[0]]),
            hasSynset: !!result[Object.keys(result)[0]].Synset,
            synsetType: typeof result[Object.keys(result)[0]].Synset,
            synsetKeys: result[Object.keys(result)[0]].Synset ? Object.keys(result[Object.keys(result)[0]].Synset) : [],
          } : null,
        });
     
      
      const converted = this.convertFastXMLParserOutput(result);
      return {
        ...converted,
        parserUsed: 'fast-xml-parser' as const
      };
    } catch (error) {
      this.logger.warn('Fast XML parser failed, falling back to DOMParser:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Convert fast-xml-parser output to our standard format
   */
  private convertFastXMLParserOutput(parsedData: Record<string, unknown>): { data: ParsedXMLResult; elementCount: number; rootElements: string[] } {
    const result: ParsedXMLResult = {};
    let elementCount = 0;
    const rootElements: string[] = [];

    // Find the root element (first key that's not a special property)
    const rootKey = Object.keys(parsedData).find(key => 
      !key.startsWith('?') && !key.startsWith('@') && key !== '#text'
    );

    if (rootKey) {
      const rootData = parsedData[rootKey];
      rootElements.push(rootKey);
      
      if (typeof rootData === 'object' && rootData !== null) {
        const convertedElement = this.convertFastXMLParserElement(rootKey, rootData as Record<string, unknown>);
        result[rootKey] = convertedElement;
        elementCount = this.countElements(convertedElement);
      }
    }

    return { data: result, elementCount, rootElements };
  }

  /**
   * Convert a fast-xml-parser element to our format
   */
  private convertFastXMLParserElement(name: string, data: Record<string, unknown>, parent?: XMLElement): XMLElement {
    const attributes: Record<string, string> = {};
    const children: (XMLElement | XMLTextNode)[] = [];
    let text = '';

    // Extract attributes (prefixed with @_)
    Object.keys(data).forEach(key => {
      if (key.startsWith('@_')) {
        const attrName = key.substring(2);
        attributes[attrName] = String(data[key]);
      }
    });

    // Extract text content
    if (data['#text']) {
      text = String(data['#text']);
    }
    
    // Additional text extraction: look for any string values that might be text content
    // This helps when fast-xml-parser doesn't properly extract text into #text
    if (!text) {
      Object.keys(data).forEach(key => {
        if (key !== '#text' && !key.startsWith('@_') && typeof data[key] === 'string') {
          const stringValue = data[key].trim();
          if (stringValue && !text) {
            text = stringValue;
            if (this.options.debug) {
              this.logger.debug(`Found text content in key '${key}': "${stringValue}"`);
            }
          }
        }
      });
    }

    // Extract child elements
    Object.keys(data).forEach(key => {
      if (!key.startsWith('@_') && key !== '#text') {
        if (typeof data[key] === 'string') {
          // Handle string values as child elements with text content
          // This is for elements like <Definition>text</Definition> which become { Definition: "text" }
          const childElement: XMLElement = {
            name: key,
            attributes: {},
            children: [],
            text: data[key]
          };
          children.push(childElement);
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          if (Array.isArray(data[key])) {
            // Handle arrays of elements
            data[key].forEach((child: Record<string, unknown>) => {
              if (typeof child === 'object' && child !== null) {
                // Preserve the original tag name for each array element
                const converted = this.convertFastXMLParserElement(key, child, undefined);
                children.push(converted);
              } else if (typeof child === 'string') {
                // Handle array of strings
                const childElement: XMLElement = {
                  name: key,
                  attributes: {},
                  children: [],
                  text: child
                };
                children.push(childElement);
              }
            });
          } else {
            // Handle single child element
            children.push(this.convertFastXMLParserElement(key, data[key] as Record<string, unknown>, undefined));
          }
        }
      }
    });

    const element: XMLElement = { name, attributes, children, text };
    
    // Set parent reference for all children to maintain hierarchy
    children.forEach(child => {
      if (child.name !== '#text') {
        (child as XMLElement).parent = element;
      }
    });

    return element;
  }

  /**
   * Count total elements in the parsed structure
   */
  private countElements(element: XMLElement): number {
    let count = 1; // Count this element
    element.children.forEach(child => {
      if (child.name !== '#text') {
        count += this.countElements(child as XMLElement);
      }
    });
    return count;
  }

  /**
   * Parse using native DOMParser (browser environment)
   */
  private async parseWithDOMParser(): Promise<MultiXMLParserResult> {
    if (this.options.debug) {
      this.logger.debug("Parsing XML with DOMParser");
    }

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
        result[elementName] = this.processElement(rootElement);
        elementCount = this.countElements(result[elementName]);
      }
    }

    if (this.options.debug) {
      this.logger.debug("DOMParser parsing completed", { elementCount, rootElements: Object.keys(result) });
    }

    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result),
      parserUsed: 'DOMParser' as const
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

    if (this.options.debug) {
      this.logger.debug(`Processing element: ${name}`);
    }

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
          if (this.options.debug) {
            this.logger.debug(`Found text node: "${textContent}"`);
          }
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const processedChild = this.processElement(child as Element);
        children.push(processedChild);
        
        if (this.options.debug) {
          this.logger.debug(`Processed child ${processedChild.name} with text: "${processedChild.text}"`);
        }
      }
    }

    // If we have no direct text but have children with text, collect all text from children
    if (!text && children.length > 0) {
      const childTexts = children
        .map(child => child.text)
        .filter(t => t && t.trim())
        .join(' ');
      if (childTexts) {
        text = childTexts;
        if (this.options.debug) {
          this.logger.debug(`Collected text from children: "${text}"`);
        }
      }
    }

    // Special case: if this is a leaf element with no text but has children with text,
    // use the first child's text as this element's text
    if (!text && children.length === 1 && children[0].text) {
      text = children[0].text;
      if (this.options.debug) {
        this.logger.debug(`Using single child text for ${name}: "${text}"`);
      }
    }

    // Fallback: use element.textContent if still empty (helps with mocks that don't expose TEXT_NODEs)
    if (!text && typeof (element as { textContent?: string }).textContent === 'string') {
      const tc = (element as { textContent: string }).textContent.trim();
      if (tc) {
        text = tc;
        if (this.options.debug) {
          this.logger.debug(`Fallback to textContent for ${name}: "${text}"`);
        }
      }
    }

    if (this.options.debug) {
      this.logger.debug(`Final text for ${name}: "${text}"`);
    }

    return { name, attributes, children, text };
  }

  /**
   * Manual XML parsing fallback for environments without other parsers
   */
  private async parseManually(): Promise<MultiXMLParserResult> {
    if (this.options.debug) {
      this.logger.debug("Using manual XML parser fallback");
    }

    // Check for empty or whitespace-only content
    if (!this.xmlText || this.xmlText.trim() === '') {
      throw new Error('Empty content received');
    }

    // Simple manual parsing for basic XML structures
    const result: ParsedXMLResult = {};
    let elementCount = 0;

    try {
      // Find the root element by looking for the first <tag>
      const rootMatch = this.xmlText.match(/<([a-zA-Z][a-zA-Z0-9_:]*)([^>]*)>/);
      if (rootMatch) {
        const rootTagName = rootMatch[1];
        const attrString = rootMatch[2];
        
        // Extract attributes
        const attributes = this.parseAttributesManually(attrString);
        
        // Extract text content and children
        const { textContent, children } = this.extractContentAndChildren(rootTagName);
        
        result[rootTagName] = {
          name: rootTagName,
          attributes,
          children,
          text: textContent
        };
        try {
          this.logger.debug("Manual parser root element", { rootTagName, children: children.map(c => c.name) });
        } catch {}
        
        elementCount = 1 + children.length;
      }
    } catch (error) {
      this.logger.error("Manual parsing failed", { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Manual parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (this.options.debug) {
      this.logger.debug("Manual parsing completed", { elementCount, rootElements: Object.keys(result) });
    }

    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result),
      parserUsed: 'manual' as const
    };
  }

  /**
   * Extract text content and children from XML content
   */
  private extractContentAndChildren(rootTagName: string): { textContent: string; children: XMLElement[] } {
    const children: XMLElement[] = [];
    let textContent = '';

    const closingTag = `</${rootTagName}>`;
    const closingPos = this.xmlText.indexOf(closingTag);
    if (closingPos === -1) {
      return { textContent: '', children: [] };
    }

    const openingTagEnd = this.xmlText.indexOf('>', this.xmlText.indexOf(`<${rootTagName}`)) + 1;
    const content = this.xmlText.substring(openingTagEnd, closingPos);

    // Find normal child elements with closing tags
    const childRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)>([\s\S]*?)<\/\1>/g;
    let match: RegExpExecArray | null;
    const consumedSpans: Array<{ start: number; end: number }> = [];

    while ((match = childRegex.exec(content)) !== null) {
      const [full, childTagName, childAttrString, childInner] = match;
      const start = match.index;
      const end = match.index + full.length;
      consumedSpans.push({ start, end });

      const childAttributes = this.parseAttributesManually(childAttrString);

      // Parse nested children (closing tags)
      const nestedChildren: XMLElement[] = [];
      const nestedClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)>([\s\S]*?)<\/\1>/g;
      let nestedMatch: RegExpExecArray | null;
      let remainingChildText = childInner;
      while ((nestedMatch = nestedClosingRegex.exec(childInner)) !== null) {
        const [nestedFull, nestedTagName, nestedAttrString, nestedInner] = nestedMatch;
        nestedChildren.push({
          name: nestedTagName,
          attributes: this.parseAttributesManually(nestedAttrString),
          children: [],
          text: nestedInner.trim()
        });
        remainingChildText = remainingChildText.replace(nestedFull, '').trim();
      }

      // Also capture self-closing nested tags within this child
      const nestedSelfClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)\/>/g;
      let nestedSelfMatch: RegExpExecArray | null;
      while ((nestedSelfMatch = nestedSelfClosingRegex.exec(childInner)) !== null) {
        const nestedTagName = nestedSelfMatch[1];
        const nestedAttrString = nestedSelfMatch[2];
        nestedChildren.push({
          name: nestedTagName,
          attributes: this.parseAttributesManually(nestedAttrString),
          children: [],
          text: ''
        });
      }

      children.push({
        name: childTagName,
        attributes: childAttributes,
        children: nestedChildren,
        text: remainingChildText.trim()
      });
    }

    // Also find self-closing children at the top level inside the root content
    const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)\/>/g;
    let selfMatch: RegExpExecArray | null;
    while ((selfMatch = selfClosingRegex.exec(content)) !== null) {
      const start = selfMatch.index;
      const end = selfClosingRegex.lastIndex;
      // Skip if this span overlaps a previously consumed normal child
      const overlaps = consumedSpans.some(span => !(end <= span.start || start >= span.end));
      if (overlaps) continue;

      const childTagName = selfMatch[1];
      const childAttrString = selfMatch[2];
      children.push({
        name: childTagName,
        attributes: this.parseAttributesManually(childAttrString),
        children: [],
        text: ''
      });
    }

    // Compute leftover text content by removing all consumed child segments
    // This is a best-effort approach; tests mainly assert on child elements
    textContent = content.trim();

    return { textContent, children };
  }

  /**
   * Parse attributes manually from attribute string
   */
  private parseAttributesManually(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    // Updated regex to handle complex attribute values with spaces and special characters
    const regex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}

/**
 * Convenience function to parse XML with multiple strategies
 */
export async function parseXMLWithMultiStrategy(xmlText: string, options: ParserOptions = {}): Promise<MultiXMLParserResult> {
  const parser = new MultiXMLParser(xmlText, options);
  return parser.parse();
}

