import { createReadStream } from 'fs';
import sax from 'sax';
import { XMLStructure, XMLElement, XASTNode, ElementTypeInfo, XASTElement, XASTText } from './types.js';

/**
 * Streaming XML Introspector for memory-efficient processing of large XML files
 * This implementation uses SAX parsing to avoid loading entire files into memory
 */
export class StreamingXMLIntrospector {
  private structure: XMLStructure | null = null;

  /**
   * Analyze XML structure using streaming approach
   */
  async analyzeStructure(filePath: string): Promise<XMLStructure> {
    return new Promise((resolve, reject) => {
      const structure: XMLStructure = {
        rootElement: '',
        elementTypes: new Map<string, ElementTypeInfo>(),
        maxDepth: 0,
        totalElements: 0,
        namespaces: new Map<string, string>()
      };

      let currentDepth = 0;
      let elementStack: string[] = [];
      let lastElement: ElementTypeInfo | null = null;

      const parser = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: false,
        position: false,
        xmlns: false,
      });

      parser.on('opentag', (node) => {
        const tagName = node.name;
        structure.totalElements++;
        currentDepth = elementStack.length + 1;
        structure.maxDepth = Math.max(structure.maxDepth, currentDepth);

        // Set root element if this is the first element
        if (!structure.rootElement) {
          structure.rootElement = tagName;
        }

        // Track element types
        if (!structure.elementTypes.has(tagName)) {
          structure.elementTypes.set(tagName, {
            count: 0,
            attributes: new Set<string>(),
            children: new Set<string>(),
            maxDepth: currentDepth,
            examples: []
          });
        }

        const elementInfo = structure.elementTypes.get(tagName)!;
        elementInfo.count++;
        elementInfo.maxDepth = Math.max(elementInfo.maxDepth, currentDepth);

        // Track attributes
        Object.keys(node.attributes).forEach(attrName => {
          elementInfo.attributes.add(attrName);
        });

        // Track parent-child relationships
        if (elementStack.length > 0) {
          const parentTag = elementStack[elementStack.length - 1];
          const parentInfo = structure.elementTypes.get(parentTag);
          if (parentInfo) {
            parentInfo.children.add(tagName);
          }
        }

        elementStack.push(tagName);
        lastElement = elementInfo;
      });

      parser.on('text', (text) => {
        if (lastElement && text.trim()) {
          lastElement.examples.push(text.trim() as any);
        }
      });

      parser.on('closetag', (tagName) => {
        if (elementStack.length > 0 && elementStack[elementStack.length - 1] === tagName) {
          elementStack.pop();
        }
      });

      parser.on('end', () => {
        resolve(structure);
      });

      parser.on('error', (error) => {
        reject(new Error(`Streaming XML parsing error: ${error.message}`));
      });

      // Create readable stream and pipe to parser
      const stream = createReadStream(filePath, { encoding: 'utf8' });
      stream.pipe(parser);

      stream.on('error', (error) => {
        reject(new Error(`File stream error: ${error.message}`));
      });
    });
  }

  /**
   * Generate XSD schema using streaming approach
   */
  async generateXSDFromXML(filePath: string, options: {
    targetNamespace?: string;
    elementForm?: 'qualified' | 'unqualified';
    attributeForm?: 'qualified' | 'unqualified';
  } = {}): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    
    const {
      targetNamespace = 'http://example.com/schema',
      elementForm = 'qualified',
      attributeForm = 'unqualified'
    } = options;

    let xsd = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xsd += `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" `;
    xsd += `targetNamespace="${targetNamespace}" `;
    xsd += `elementFormDefault="${elementForm}" `;
    xsd += `attributeFormDefault="${attributeForm}">\n\n`;

    // Generate element definitions
    for (const [tagName, elementInfo] of structure.elementTypes) {
      xsd += `  <xs:element name="${tagName}">\n`;
      xsd += `    <xs:complexType>\n`;
      
      if (elementInfo.children.size > 0) {
        xsd += `      <xs:sequence>\n`;
        for (const child of elementInfo.children) {
          xsd += `        <xs:element ref="${child}" minOccurs="0" maxOccurs="unbounded"/>\n`;
        }
        xsd += `      </xs:sequence>\n`;
      }
      
      if (elementInfo.attributes.size > 0) {
        for (const attr of elementInfo.attributes) {
          xsd += `      <xs:attribute name="${attr}" type="xs:string"/>\n`;
        }
      }
      
      xsd += `    </xs:complexType>\n`;
      xsd += `  </xs:element>\n\n`;
    }

    xsd += `</xs:schema>`;
    return xsd;
  }

  /**
   * Parse XML to XAST using streaming approach
   */
  async parseXMLToXAST(filePath: string): Promise<XASTNode[]> {
    return new Promise((resolve, reject) => {
      const nodes: XASTNode[] = [];
      const elementStack: XASTNode[] = [];

      const parser = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: false,
        position: false,
        xmlns: false,
      });

      parser.on('opentag', (node) => {
        const element: XASTElement = {
          type: 'element',
          name: node.name,
          attributes: node.attributes as Record<string, string>,
          children: []
        };

        if (elementStack.length > 0) {
          const parent = elementStack[elementStack.length - 1] as XASTElement;
          parent.children.push(element);
        } else {
          nodes.push(element);
        }

        elementStack.push(element);
      });

      parser.on('text', (text) => {
        if (elementStack.length > 0 && text.trim()) {
          const textNode: XASTText = {
            type: 'text',
            value: text.trim()
          };
          const currentElement = elementStack[elementStack.length - 1] as XASTElement;
          currentElement.children.push(textNode);
        }
      });

      parser.on('closetag', (tagName) => {
        if (elementStack.length > 0) {
          const element = elementStack[elementStack.length - 1] as XASTElement;
          if (element.name === tagName) {
            elementStack.pop();
          }
        }
      });

      parser.on('end', () => {
        resolve(nodes);
      });

      parser.on('error', (error) => {
        reject(new Error(`Streaming XAST parsing error: ${error.message}`));
      });

      const stream = createReadStream(filePath, { encoding: 'utf8' });
      stream.pipe(parser);

      stream.on('error', (error) => {
        reject(new Error(`File stream error: ${error.message}`));
      });
    });
  }

  /**
   * Convert XAST back to XML (streaming-friendly)
   */
  xastToXML(nodes: XASTNode[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    const processNode = (node: XASTNode, indent: number = 0): string => {
      const indentStr = '  '.repeat(indent);
      let result = '';
      
      if (node.type === 'element') {
        const element = node as XASTElement;
        result += `${indentStr}<${element.name}`;
        
        // Add attributes
        for (const [name, value] of Object.entries(element.attributes)) {
          result += ` ${name}="${value}"`;
        }
        
        if (element.children.length === 0) {
          result += ' />\n';
        } else {
          result += '>';
          
          for (const child of element.children) {
            if (child.type === 'text') {
              result += (child as XASTText).value;
            } else {
              result += '\n' + processNode(child, indent + 1);
            }
          }
          
          if (element.children.some(child => child.type === 'element')) {
            result += '\n' + indentStr;
          }
          
          result += `</${element.name}>\n`;
        }
      }
      
      return result;
    };
    
    for (const node of nodes) {
      xml += processNode(node);
    }
    
    return xml;
  }

  /**
   * Generate XML from XSD (streaming-friendly)
   */
  async generateXMLFromXSD(xsdFile: string, options: {
    maxElements?: number;
    strategy?: 'random' | 'balanced' | 'first';
  } = {}): Promise<string> {
    // For streaming, we'll use a simplified approach
    // In a full implementation, this would parse the XSD and generate XML
    const { maxElements = 10 } = options;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
    
    for (let i = 0; i < maxElements; i++) {
      xml += `  <element${i} id="element-${i}">\n`;
      xml += `    <text>Generated element ${i}</text>\n`;
      xml += `  </element${i}>\n`;
    }
    
    xml += '</root>';
    return xml;
  }
}
