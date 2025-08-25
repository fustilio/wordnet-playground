import { 
  XSDSchema,
  XSDElement,
  XSDAttribute,
  XSDComplexType,
  XSDSimpleType,
  XSDSequence,
  XSDChoice,
  XSDRestriction,
  XSDAST,
  XSDElementInfo,
  XSDAttributeInfo,
  XSDTypeInfo,
  XSDBaseNode,
  XASTElement
} from './types';
import { readFileSync } from 'fs';
import { fromXml } from 'xast-util-from-xml';
import { visit, SKIP } from 'unist-util-visit';

export class XSDParser {
  private xsdXAST: XSDAST | null = null;

  /**
   * Parse an XSD file into a unified XAST structure
   */
  async parseXSDFile(filePath: string): Promise<XSDAST> {
    const content = readFileSync(filePath, 'utf8');
    return this.parseXSDContent(content);
  }

  /**
   * Parse XSD content string into a unified XAST structure
   */
  parseXSDContent(content: string): XSDAST {
    const xast = fromXml(content);
    let schemaNode: XASTElement | null = null;

    visit(xast, 'element', (node) => {
      const el = node as XASTElement;
      if (el.name === 'xs:schema' || el.name === 'schema') {
        schemaNode = el;
        return SKIP;
      }
    });

    if (!schemaNode) {
      // Fallback for schemas that might not have a schema tag but are valid XSDs
      schemaNode = {
        type: 'element',
        name: 'schema',
        attributes: {},
        children: xast.children?.filter(c => c.type === 'element') as XASTElement[] || []
      };
    }
    
    const convertNode = (xastNode: XASTElement): XSDBaseNode => {
      const name = xastNode.name.replace(/xs:/g, '');
      const xsdNode: XSDBaseNode = {
        type: `xsd:${name}`,
        name: name,
        attributes: xastNode.attributes || {},
        children: []
      };

      if (xastNode.children) {
        xsdNode.children = xastNode.children
          .filter(c => c.type === 'element')
          .map(c => convertNode(c as XASTElement));
      }
      return xsdNode;
    };

    const schema: XSDSchema = convertNode(schemaNode) as XSDSchema;
    const elements = new Map<string, XSDElementInfo>();
    const attributes = new Map<string, XSDAttributeInfo>();
    const types = new Map<string, XSDTypeInfo>();

    const extractElementInfo = (xsdElementNode: XSDElement): XSDElementInfo => {
      const name = xsdElementNode.attributes.name || xsdElementNode.attributes.ref!;
      const elementAttributes = new Set<string>();
      const elementChildren = new Set<string>();

      const complexTypeNode = xsdElementNode.children?.find(c => c.type === 'xsd:complexType') as XSDComplexType;
      if (complexTypeNode) {
        complexTypeNode.children?.forEach(child => {
          if (child.type === 'xsd:attribute') {
            const attr = child as XSDAttribute;
            if (attr.attributes.name) elementAttributes.add(attr.attributes.name);
          }
        });

        const sequenceNode = complexTypeNode.children?.find(c => c.type === 'xsd:sequence') as XSDSequence;
        if (sequenceNode) {
          sequenceNode.children?.forEach(child => {
            if (child.type === 'xsd:element') {
              const el = child as XSDElement;
              if (el.attributes.name) elementChildren.add(el.attributes.name);
              if (el.attributes.ref) elementChildren.add(el.attributes.ref);
            }
          });
        }
      }

      return {
        name,
        type: 'element',
        attributes: elementAttributes,
        children: elementChildren,
        minOccurs: xsdElementNode.attributes.minOccurs || '1',
        maxOccurs: xsdElementNode.attributes.maxOccurs || '1',
        isRef: !!xsdElementNode.attributes.ref,
        xsdNode: xsdElementNode
      };
    };
    
    schema.children.forEach(node => {
      if (node.type === 'xsd:element') {
        const el = node as XSDElement;
        const name = el.attributes.name || el.attributes.ref;
        if (name) {
          elements.set(name, extractElementInfo(el));

          // Also recursively find nested elements
          visit(el, (childNode: any) => {
            if (childNode.type === 'xsd:element' && childNode.attributes.name) {
              elements.set(childNode.attributes.name, extractElementInfo(childNode));
            }
          });
        }
      }
    });

    const xsdXAST: XSDAST = {
      root: schema,
      elements,
      attributes,
      types,
      namespaces: new Map(Object.entries(schema.attributes).filter(([k]) => k.startsWith('xmlns') || k === 'targetNamespace')),
      rootElement: elements.keys().next().value || null
    };

    this.xsdXAST = xsdXAST;
    return xsdXAST;
  }

  /**
   * Get the parsed XSD XAST
   */
  getXSDXAST(): XSDAST | null {
    return this.xsdXAST;
  }

  /**
   * Get all element names from the XSD
   */
  getElementNames(): string[] {
    if (!this.xsdXAST) return [];
    return Array.from(this.xsdXAST.elements.keys());
  }

  /**
   * Get a specific element by name
   */
  getElement(name: string): XSDElementInfo | undefined {
    if (!this.xsdXAST) return undefined;
    return this.xsdXAST.elements.get(name);
  }

  /**
   * Get all attribute names from the XSD
   */
  getAttributeNames(): string[] {
    if (!this.xsdXAST) return [];
    return Array.from(this.xsdXAST.attributes.keys());
  }

  /**
   * Get a specific attribute by name
   */
  getAttribute(name: string): XSDAttributeInfo | undefined {
    if (!this.xsdXAST) return undefined;
    return this.xsdXAST.attributes.get(name);
  }

  /**
   * Validate that an XML structure conforms to the XSD
   */
  validateXMLStructure(xmlElements: string[]): boolean {
    if (!this.xsdXAST) return false;
    
    const xsdElementNames = this.getElementNames();
    return xmlElements.every(element => xsdElementNames.includes(element));
  }

  /**
   * Generate a summary of the XSD structure
   */
  getStructureSummary(): string {
    if (!this.xsdXAST) return 'No XSD loaded';
    
    const elementCount = this.xsdXAST.elements.size;
    const attributeCount = this.xsdXAST.attributes.size;
    const typeCount = this.xsdXAST.types.size;
    
    return `XSD Structure Summary:
 - Root Element: ${this.xsdXAST.rootElement || 'None'}
 - Elements: ${elementCount}
 - Attributes: ${attributeCount}
 - Types: ${typeCount}`;
  }
}
