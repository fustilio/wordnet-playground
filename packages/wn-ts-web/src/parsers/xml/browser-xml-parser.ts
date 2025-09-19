import { createScopedLogger } from "../../../../packages/utils/logger";

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
   * Enhanced to handle WordNet XML structure with recursive element parsing
   */
  private async parseManually(): Promise<BrowserXMLParserResult> {
    this.logger.info("Using enhanced manual XML parser fallback for WordNet data");
    
    // Check for empty or whitespace-only content
    if (!this.xmlText || this.xmlText.trim() === '') {
      throw new Error('Empty content received');
    }
    
    const result: ParsedXMLResult = {};
    let elementCount = 0;

    try {
      // Find the root element by looking for the first <tag>
      const rootMatch = this.xmlText.match(/<([a-zA-Z][a-zA-Z0-9_:]*)([^>]*)>/);
      if (rootMatch) {
        const rootTagName = rootMatch[1];
        const rootAttributes = this.parseAttributesManually(rootMatch[2]);
        
        // For WordNet data, we need to parse all child elements (iteratively to avoid stack overflow)
        // Start with the root element and parse its children
        this.logger.debug(`Starting iterative parsing of root element: ${rootTagName}`);
        const rootElement = this.parseElementIteratively(rootTagName, rootAttributes, this.xmlText);
        result[rootTagName] = rootElement;
        
        // Count all elements iteratively
        elementCount = this.countElementsIteratively(rootElement);
        this.logger.debug(`Iterative parsing completed. Root element has ${rootElement.children ? rootElement.children.length : 0} direct children`);
        
        this.logger.info("Enhanced manual parsing completed", { 
          rootElement: rootTagName,
          elementCount,
          hasChildren: rootElement.children && rootElement.children.length > 0,
          childCount: rootElement.children ? rootElement.children.length : 0,
          firstChildType: rootElement.children && rootElement.children.length > 0 ? 
            (rootElement.children[0] && 'name' in rootElement.children[0] ? 
              (rootElement.children[0] as XMLElement).name : 'unknown') : 'none'
        });
      }
    } catch (error) {
      this.logger.error("Enhanced manual parsing failed", { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Enhanced manual XML parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result)
    };
  }

  /**
   * Iteratively parse an XML element and its children (non-recursive to avoid stack overflow)
   */
  private parseElementIteratively(tagName: string, attributes: Record<string, string>, xmlContent: string): XMLElement {
    // Find the opening tag for this element
    const openingTagRegex = new RegExp(`<${tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'g');
    const openingMatches = Array.from(xmlContent.matchAll(openingTagRegex));
    
    if (openingMatches.length === 0) {
      return {
        name: tagName,
        attributes,
        children: [],
        text: ""
      };
    }

    const children: XMLElement[] = [];
    let text = "";

    // Process each opening tag to find its content and children
    for (const match of openingMatches) {
      const fullMatch = match[0];
      const matchIndex = match.index!;
      
      // Find the corresponding closing tag
      const closingTag = `</${tagName}>`;
      const closingIndex = xmlContent.indexOf(closingTag, matchIndex);
      
      if (closingIndex === -1) continue;
      
      // Extract content between opening and closing tags
      const contentStart = matchIndex + fullMatch.length;
      const contentEnd = closingIndex;
      const elementContent = xmlContent.substring(contentStart, contentEnd);
      
      // Extract text content (remove all tags)
      const textContent = elementContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textContent) {
        text += textContent + " ";
      }
      
      // Find child elements within this element's content (non-recursive)
      const childElements = this.findChildElements(elementContent);
      children.push(...childElements);
    }

    return {
      name: tagName,
      attributes,
      children,
      text: text.trim()
    };
  }

  /**
   * Find all child elements within a given XML content (iterative, non-recursive)
   */
  private findChildElements(xmlContent: string): XMLElement[] {
    const children: XMLElement[] = [];
    
    // Find all opening tags (including self-closing tags)
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9_:-]*)([^>]*?)(\/?)>/g;
    const matches = Array.from(xmlContent.matchAll(tagRegex));
    
    // Log what we found for debugging
    if (this.debug && matches.length > 0) {
      const uniqueTags = [...new Set(matches.map(m => m[1]))];
      this.logger.debug(`Found ${matches.length} tags with ${uniqueTags.length} unique tag names:`, {
        uniqueTags: uniqueTags.slice(0, 10), // Show first 10 unique tags
        totalMatches: matches.length
      });
    }
    
    for (const match of matches) {
      const tagName = match[1];
      const attributes = this.parseAttributesManually(match[2]);
      const isSelfClosing = match[3] === '/';
      const fullMatch = match[0];
      const matchIndex = match.index!;
      
      if (isSelfClosing) {
        // Handle self-closing tags
        children.push({
          name: tagName,
          attributes,
          children: [],
          text: ""
        });
        continue;
      }
      
      // Find the corresponding closing tag
      const closingTag = `</${tagName}>`;
      const closingIndex = xmlContent.indexOf(closingTag, matchIndex);
      
      if (closingIndex === -1) continue;
      
      // Extract content between opening and closing tags
      const contentStart = matchIndex + fullMatch.length;
      const contentEnd = closingIndex;
      const elementContent = xmlContent.substring(contentStart, contentEnd);
      
      // Extract text content
      const textContent = elementContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // For large files, limit recursion depth to avoid stack overflow
      // Only process immediate children, not deeply nested ones
      const nestedChildren: XMLElement[] = [];
      
      // Only look for immediate child tags (not nested deeper than 1 level)
      const immediateChildRegex = /<([a-zA-Z][a-zA-Z0-9_:-]*)([^>]*?)(\/?)>/g;
      let immediateMatch: RegExpExecArray | null;
      let immediateCount = 0;
      const maxImmediateChildren = 100; // Limit to prevent excessive processing
      
      while ((immediateMatch = immediateChildRegex.exec(elementContent)) !== null && immediateCount < maxImmediateChildren) {
        immediateCount++;
        const childTagName = immediateMatch[1];
        const childAttributes = this.parseAttributesManually(immediateMatch[2]);
        const isChildSelfClosing = immediateMatch[3] === '/';
        
        if (isChildSelfClosing) {
          nestedChildren.push({
            name: childTagName,
            attributes: childAttributes,
            children: [],
            text: ""
          });
        } else {
          // For non-self-closing tags, just extract text content, don't recurse
          const childClosingTag = `</${childTagName}>`;
          const childClosingIndex = elementContent.indexOf(childClosingTag, immediateMatch.index!);
          if (childClosingIndex !== -1) {
            const childContentStart = immediateMatch.index! + immediateMatch[0].length;
            const childContent = elementContent.substring(childContentStart, childClosingIndex);
            const childText = childContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            nestedChildren.push({
              name: childTagName,
              attributes: childAttributes,
              children: [], // Don't recurse deeper
              text: childText
            });
          }
        }
      }
      
      children.push({
        name: tagName,
        attributes,
        children: nestedChildren,
        text: textContent
      });
    }
    
    return children;
  }

  /**
   * Count all elements recursively
   */
  private countElementsRecursively(element: XMLElement): number {
    let count = 1; // Count this element
    
    if (element.children && element.children.length > 0) {
      for (const child of element.children) {
        // Only count XMLElement children, skip XMLTextNode
        if ('name' in child && 'attributes' in child && 'children' in child) {
          count += this.countElementsRecursively(child as XMLElement);
        }
      }
    }
    
    return count;
  }

  /**
   * Count all elements iteratively (non-recursive to avoid stack overflow)
   */
  private countElementsIteratively(element: XMLElement): number {
    let count = 1; // Count this element
    const stack: XMLElement[] = [element];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current.children && current.children.length > 0) {
        for (const child of current.children) {
          // Only count XMLElement children, skip XMLTextNode
          if ('name' in child && 'attributes' in child && 'children' in child) {
            count++;
            stack.push(child as XMLElement);
          }
        }
      }
    }
    
    return count;
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

    // If no direct text content but we have children, try to extract text from children
    if (!text && children.length === 0) {
      // For leaf elements, try to get text content
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      text = textNodes.map(node => node.textContent?.trim()).filter(Boolean).join(' ');
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
    // Updated regex to handle complex attribute values with spaces and special characters
    const regex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}
