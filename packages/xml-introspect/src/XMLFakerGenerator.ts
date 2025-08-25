import { faker, Faker } from '@faker-js/faker';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';
import { XASTNode, XASTElement, XASTText } from './types.js';

export interface XMLFakerOptions {
  /**
   * Custom Faker instance for consistent seeding
   */
  faker?: Faker;
  
  /**
   * Seed for random generation
   */
  seed?: number | number[];
  
  /**
   * Maximum depth for nested elements
   */
  maxDepth?: number;
  
  /**
   * Maximum number of child elements per parent
   */
  maxChildren?: number;
  
  /**
   * Whether to generate realistic data based on element names
   */
  realisticData?: boolean;
  
  /**
   * Custom data generators for specific element names
   */
  customGenerators?: Record<string, () => string>;
  
  /**
   * Whether to preserve XML structure from input
   */
  preserveStructure?: boolean;
}

export interface ElementGenerator {
  name: string;
  attributes: Record<string, string>;
  children: ElementGenerator[];
  textContent?: string;
}

export class XMLFakerGenerator {
  private faker: Faker;
  private options: Required<XMLFakerOptions>;

  constructor(options: XMLFakerOptions = {}) {
    // Use the existing faker instance
    this.faker = options.faker || faker;
    
    this.options = {
      faker: this.faker,
      seed: options.seed || Date.now(),
      maxDepth: options.maxDepth || 5,
      maxChildren: options.maxChildren || 10,
      realisticData: options.realisticData ?? true,
      customGenerators: options.customGenerators || {},
      preserveStructure: options.preserveStructure ?? false
    };

    // Set seed if provided
    if (this.options.seed) {
      this.faker.seed(this.options.seed);
    }
  }

  /**
   * Generate realistic XML data based on element names using Faker
   */
  generateRealisticData(elementName: string, attributeName?: string): string {
    const name = elementName.toLowerCase();
    const attr = attributeName?.toLowerCase() || '';

    // Custom generators take precedence
    if (this.options.customGenerators[elementName]) {
      return this.options.customGenerators[elementName]();
    }

    // Generate realistic data based on element names
    switch (name) {
      case 'name':
      case 'firstname':
      case 'first_name':
        return this.faker.person.firstName();
      
      case 'lastname':
      case 'last_name':
      case 'surname':
        return this.faker.person.lastName();
      
      case 'fullname':
      case 'full_name':
        return this.faker.person.fullName();
      
      case 'email':
      case 'e-mail':
        return this.faker.internet.email();
      
      case 'phone':
      case 'telephone':
      case 'phone_number':
        return this.faker.phone.number();
      
      case 'address':
      case 'street':
        return this.faker.location.streetAddress();
      
      case 'city':
        return this.faker.location.city();
      
      case 'state':
      case 'province':
        return this.faker.location.state();
      
      case 'country':
        return this.faker.location.country();
      
      case 'zipcode':
      case 'postal_code':
        return this.faker.location.zipCode();
      
      case 'company':
      case 'organization':
        return this.faker.company.name();
      
      case 'job':
      case 'jobtitle':
      case 'job_title':
        return this.faker.person.jobTitle();
      
      case 'website':
      case 'url':
        return this.faker.internet.url();
      
      case 'description':
      case 'summary':
      case 'bio':
        return this.faker.lorem.paragraph();
      
      case 'title':
      case 'headline':
        return this.faker.lorem.sentence();
      
      case 'content':
      case 'body':
      case 'text':
        return this.faker.lorem.paragraphs();
      
      case 'date':
      case 'created':
      case 'updated':
        return this.faker.date.recent().toISOString();
      
      case 'age':
        return this.faker.number.int({ min: 1, max: 120 }).toString();
      
      case 'price':
      case 'cost':
        return this.faker.commerce.price();
      
      case 'quantity':
      case 'amount':
        return this.faker.number.int({ min: 1, max: 1000 }).toString();
      
      case 'id':
      case 'uuid':
        return this.faker.string.uuid();
      
      case 'username':
        return this.faker.internet.userName();
      
      case 'password':
        return this.faker.internet.password();
      
      default:
        // Try to match attribute names for more specific data
        if (attr) {
          return this.generateRealisticData(attr);
        }
        
        // Fallback to generic text
        return this.faker.lorem.word();
    }
  }

  /**
   * Generate attributes for an element
   */
  generateAttributes(elementName: string, existingAttributes: string[] = []): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Generate common attributes
    const commonAttrs = ['id', 'name', 'type', 'class', 'style', 'title'];
    
    for (const attr of existingAttributes.length > 0 ? existingAttributes : commonAttrs) {
      // Always generate attributes when they are explicitly specified
      if (existingAttributes.length > 0 || this.faker.datatype.boolean(0.7)) {
        attributes[attr] = this.generateRealisticData(elementName, attr);
      }
    }
    
    return attributes;
  }

  /**
   * Generate child elements based on parent element name
   */
  generateChildren(parentName: string, depth: number = 0): ElementGenerator[] {
    if (depth >= this.options.maxDepth) {
      return [];
    }

    const children: ElementGenerator[] = [];
    const childCount = this.faker.number.int({ 
      min: 0, 
      max: Math.min(this.options.maxChildren, 5) 
    });

    // Generate child elements based on parent context
    const childNames = this.getChildElementNames(parentName);
    
    for (let i = 0; i < childCount; i++) {
      const childName = childNames[i % childNames.length] || `item${i + 1}`;
      
      children.push({
        name: childName,
        attributes: this.generateAttributes(childName),
        children: this.generateChildren(childName, depth + 1),
        textContent: this.faker.datatype.boolean(0.6) ? 
          this.generateRealisticData(childName) : undefined
      });
    }

    return children;
  }

  /**
   * Get appropriate child element names based on parent context
   */
  private getChildElementNames(parentName: string): string[] {
    const name = parentName.toLowerCase();
    
    // Common XML patterns
    switch (name) {
      case 'person':
      case 'user':
      case 'employee':
        return ['name', 'email', 'phone', 'address', 'company', 'job'];
      
      case 'product':
      case 'item':
        return ['name', 'description', 'price', 'category', 'image'];
      
      case 'order':
      case 'purchase':
        return ['customer', 'items', 'total', 'date', 'status'];
      
      case 'article':
      case 'post':
        return ['title', 'author', 'content', 'date', 'tags'];
      
      case 'company':
      case 'organization':
        return ['name', 'address', 'phone', 'website', 'employees'];
      
      case 'address':
        return ['street', 'city', 'state', 'zipcode', 'country'];
      
      case 'lexicalentry':
      case 'lexical_entry':
        return ['lemma', 'sense', 'definition', 'partofspeech'];
      
      case 'synset':
        return ['definition', 'examples', 'relations', 'partofspeech'];
      
      case 'lemma':
        return ['writtenform', 'partofspeech', 'pronunciation'];
      
      case 'sense':
        return ['synset', 'definition', 'examples'];
      
      default:
        return ['name', 'description', 'value', 'content'];
    }
  }

  /**
   * Generate XML from a structure definition
   */
  generateXMLFromStructure(structure: any, options: XMLFakerOptions = {}): string {
    const mergedOptions = { ...this.options, ...options };
    const generator = new XMLFakerGenerator(mergedOptions);
    
    const rootElement: ElementGenerator = {
      name: structure.rootElement || 'root',
      attributes: generator.generateAttributes(structure.rootElement || 'root'),
      children: []
    };

    // Generate children based on element types
    if (structure.elementTypes) {
      for (const [elementName, typeInfo] of structure.elementTypes) {
        const childCount = Math.min(
          typeInfo.count || 1,
          mergedOptions.maxChildren
        );

        for (let i = 0; i < childCount; i++) {
          rootElement.children.push({
            name: elementName,
            attributes: generator.generateAttributes(elementName, 
              Array.from(typeInfo.attributes || [])),
            children: generator.generateChildren(elementName, 1),
            textContent: generator.generateRealisticData(elementName)
          });
        }
      }
    }

    // Add XML declaration
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += this.elementToXML(rootElement);
    return xml;
  }

  /**
   * Convert element generator to XML string
   */
  private elementToXML(element: ElementGenerator, indent: number = 0): string {
    const indentStr = '  '.repeat(indent);
    let xml = indentStr + `<${element.name}`;
    
    // Add attributes
    for (const [name, value] of Object.entries(element.attributes)) {
      xml += ` ${name}="${value}"`;
    }
    
    if (element.children.length === 0 && !element.textContent) {
      xml += ' />\n';
    } else {
      xml += '>';
      
      if (element.textContent) {
        xml += element.textContent;
      }
      
      if (element.children.length > 0) {
        xml += '\n';
        for (const child of element.children) {
          xml += this.elementToXML(child, indent + 1);
        }
        xml += indentStr;
      }
      
      xml += `</${element.name}>\n`;
    }
    
    return xml;
  }

  /**
   * Generate XML from XSD schema using Faker
   */
  generateXMLFromXSD(xsdContent: string, options: XMLFakerOptions = {}): string {
    const mergedOptions = { ...this.options, ...options };
    const generator = new XMLFakerGenerator(mergedOptions);
    
    // Parse XSD to extract element information
    const elements = this.parseXSDElements(xsdContent);
    
    // Generate XML based on XSD structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<root>\n';
    
    for (const element of elements) {
      xml += generator.generateElementFromXSD(element, 1);
    }
    
    xml += '</root>';
    return xml;
  }

  /**
   * Parse XSD to extract element information
   */
  private parseXSDElements(xsdContent: string): Array<{
    name: string;
    type: string;
    minOccurs: number;
    maxOccurs: number;
    attributes: string[];
  }> {
    const elements: Array<{
      name: string;
      type: string;
      minOccurs: number;
      maxOccurs: number;
      attributes: string[];
    }> = [];
    
    // Simple regex-based XSD parsing
    const elementRegex = /<xs:element\s+name="([^"]+)"[^>]*>/g;
    const attributeRegex = /<xs:attribute\s+name="([^"]+)"[^>]*>/g;
    
    let match;
    while ((match = elementRegex.exec(xsdContent)) !== null) {
      const name = match[1];
      const attributes: string[] = [];
      
      // Find attributes for this element
      const attrMatch = attributeRegex.exec(xsdContent);
      if (attrMatch) {
        attributes.push(attrMatch[1]);
      }
      
      elements.push({
        name,
        type: 'string', // Default type
        minOccurs: 1,
        maxOccurs: 1,
        attributes
      });
    }
    
    return elements;
  }

  /**
   * Generate element from XSD definition
   */
  private generateElementFromXSD(element: any, depth: number): string {
    const indentStr = '  '.repeat(depth);
    let xml = indentStr + `<${element.name}`;
    
    // Add attributes
    for (const attr of element.attributes) {
      xml += ` ${attr}="${this.generateRealisticData(element.name, attr)}"`;
    }
    
    xml += '>';
    
    // Add content
    if (this.faker.datatype.boolean(0.8)) {
      xml += this.generateRealisticData(element.name);
    }
    
    xml += `</${element.name}>\n`;
    return xml;
  }

  /**
   * Convert XML to XAST and back using xast-util libraries
   */
  async xmlToXASTToXML(xmlContent: string): Promise<string> {
    try {
      // Parse XML to XAST
      const xast = fromXml(xmlContent);
      
      // Convert back to XML
      const result = toXml(xast);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to process XML through XAST: ${errorMessage}`);
    }
  }

  /**
   * Generate sample XML with realistic data
   */
  generateSampleXML(elementCount: number = 10, options: XMLFakerOptions = {}): string {
    const mergedOptions = { ...this.options, ...options };
    const generator = new XMLFakerGenerator(mergedOptions);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sample>\n';
    
    for (let i = 0; i < elementCount; i++) {
      const elementName = this.faker.helpers.arrayElement([
        'person', 'product', 'order', 'article', 'company'
      ]);
      
      xml += generator.generateElementFromXSD({
        name: elementName,
        type: 'string',
        minOccurs: 1,
        maxOccurs: 1,
        attributes: ['id', 'name', 'type']
      }, 1);
    }
    
    xml += '</sample>';
    return xml;
  }
}
