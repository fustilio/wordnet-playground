export interface SamplingOptions {
  maxElements?: number;
  maxDepth?: number;
  strategy?: SamplingStrategy;
  preserveAttributes?: boolean;
  preserveRelationships?: boolean;
  preserveAllTypes?: boolean;
  elementTypeLimits?: Record<string, number>;
  schema?: string;
}

export interface SchemaGenerationOptions {
  targetNamespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
  includeDocumentation?: boolean;
}

export interface ValidationOptions {
  strict?: boolean;
  ignoreWarnings?: boolean;
}

export interface ProcessingCallbacks {
  onElement?: (element: XMLElement, depth: number) => void;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error) => void;
}

export interface XMLElement {
  tagName: string;
  attributes: Record<string, string>;
  children: XMLElement[];
  textContent?: string;
  depth: number;
  parent?: XMLElement;
}

export interface XMLStructure {
  rootElement: string;
  elementTypes: Map<string, ElementTypeInfo>;
  maxDepth: number;
  totalElements: number;
  namespaces: Map<string, string>;
}

export interface ElementTypeInfo {
  count: number;
  attributes: Set<string>;
  children: Set<string>;
  maxDepth: number;
  examples: XMLElement[];
}

export enum SamplingStrategy {
  BALANCED = 'balanced',
  RANDOM = 'random',
  FIRST = 'first'
}

export interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  action: (options: Record<string, any>) => Promise<void>;
}

export interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: any;
}

// XAST (XML Abstract Syntax Tree) interfaces
export interface XASTNode {
  type: string;
  name?: string;
  attributes?: Record<string, string>;
  children?: XASTNode[];
  value?: string;
}

export interface XASTElement extends XASTNode {
  type: 'element';
  name: string;
  attributes: Record<string, string>;
  children: XASTNode[];
}

export interface XASTText extends XASTNode {
  type: 'text';
  value: string;
}

export interface XASTComment extends XASTNode {
  type: 'comment';
  value: string;
}

export interface XASTProcessingInstruction extends XASTNode {
  type: 'processingInstruction';
  name: string;
  value: string;
}

// Task-specific interfaces
export interface XSDFromXMLOptions {
  targetNamespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
  includeDocumentation?: boolean;
  inferTypes?: boolean;
}

export interface XMLFromXSDOptions {
  maxElements?: number;
  generateRealisticData?: boolean;
  preserveConstraints?: boolean;
}

export interface XMLTransformationOptions {
  inputFile: string;
  outputFile: string;
  maxElements?: number;
  preserveStructure?: boolean;
  samplingStrategy?: SamplingStrategy;
}

export interface PatternRule {
  elementName: string;
  attributes: string[];
  children: string[];
  minOccurrences: number;
  maxOccurrences: number;
  constraints: Constraint[];
}

export interface Constraint {
  type: 'attribute' | 'child' | 'value' | 'pattern';
  name?: string;
  value?: string;
  pattern?: string;
  required?: boolean;
}

// XSDAST (XSD Abstract Syntax Tree) for structural comparison - parallel to xast
import type { Node, Parent, Literal, Attributes, Data } from 'xast';

// Extend xast Data interface for XSD-specific information
declare module 'xast' {
  interface Data {
    // XSD-specific data
    xsdType?: 'element' | 'attribute' | 'complexType' | 'simpleType' | 'sequence' | 'choice' | 'restriction' | 'enumeration';
    minOccurs?: string;
    maxOccurs?: string;
    use?: 'required' | 'optional' | 'prohibited';
    default?: string;
    fixed?: string;
    base?: string;
    ref?: string;
    mixed?: boolean;
    nillable?: boolean;
    abstract?: boolean;
    final?: string;
    block?: string;
    substitutionGroup?: string;
    form?: 'qualified' | 'unqualified';
    targetNamespace?: string;
    elementFormDefault?: string;
    attributeFormDefault?: string;
  }
}

// Base XSD node interface
export interface XSDBaseNode {
  type: string;
  name: string;
  attributes: Record<string, string>;
  children?: XSDBaseNode[];
  value?: string;
}

// XSD-specific node types
export interface XSDSchema extends XSDBaseNode {
  type: 'xsd:schema';
  name: 'schema';
  attributes: Record<string, string> & {
    targetNamespace?: string;
    elementFormDefault?: string;
    attributeFormDefault?: string;
    xmlns?: string;
    'xmlns:xs'?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDElement extends XSDBaseNode {
  type: 'xsd:element';
  name: 'element';
  attributes: Record<string, string> & {
    name?: string;
    ref?: string;
    type?: string;
    minOccurs?: string;
    maxOccurs?: string;
    nillable?: string;
    abstract?: string;
    final?: string;
    block?: string;
    substitutionGroup?: string;
    form?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDAttribute extends XSDBaseNode {
  type: 'xsd:attribute';
  name: 'attribute';
  attributes: Record<string, string> & {
    name?: string;
    type?: string;
    use?: string;
    default?: string;
    fixed?: string;
    form?: string;
    ref?: string;
  };
}

export interface XSDComplexType extends XSDBaseNode {
  type: 'xsd:complexType';
  name: 'complexType';
  attributes: Record<string, string> & {
    name?: string;
    mixed?: string;
    abstract?: string;
    final?: string;
    block?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDSimpleType extends XSDBaseNode {
  type: 'xsd:simpleType';
  name: 'simpleType';
  attributes: Record<string, string> & {
    name?: string;
    final?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDSequence extends XSDBaseNode {
  type: 'xsd:sequence';
  name: 'sequence';
  attributes: Record<string, string> & {
    minOccurs?: string;
    maxOccurs?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDChoice extends XSDBaseNode {
  type: 'xsd:choice';
  name: 'choice';
  attributes: Record<string, string> & {
    minOccurs?: string;
    maxOccurs?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDRestriction extends XSDBaseNode {
  type: 'xsd:restriction';
  name: 'restriction';
  attributes: Record<string, string> & {
    base?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDEnumeration extends XSDBaseNode {
  type: 'xsd:enumeration';
  name: 'enumeration';
  attributes: Record<string, string> & {
    value?: string;
  };
  value: string;
}

export interface XSDUnion extends XSDBaseNode {
  type: 'xsd:union';
  name: 'union';
  attributes: Record<string, string> & {
    memberTypes?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDList extends XSDBaseNode {
  type: 'xsd:list';
  name: 'list';
  attributes: Record<string, string> & {
    itemType?: string;
  };
  children: XSDBaseNode[];
}

export interface XSDAnnotation extends XSDBaseNode {
  type: 'xsd:annotation';
  name: 'annotation';
  attributes: Record<string, string>;
  children: XSDBaseNode[];
}

export interface XSDDocumentation extends XSDBaseNode {
  type: 'xsd:documentation';
  name: 'documentation';
  attributes: Record<string, string> & {
    source?: string;
    'xml:lang'?: string;
  };
  value: string;
}

export interface XSDAppInfo extends XSDBaseNode {
  type: 'xsd:appinfo';
  name: 'appinfo';
  attributes: Record<string, string> & {
    source?: string;
  };
  value: string;
}

// Union type for all XSD nodes
export type XSDNode = 
  | XSDSchema 
  | XSDElement 
  | XSDAttribute 
  | XSDComplexType 
  | XSDSimpleType 
  | XSDSequence 
  | XSDChoice 
  | XSDRestriction 
  | XSDEnumeration
  | XSDUnion
  | XSDList
  | XSDAnnotation
  | XSDDocumentation
  | XSDAppInfo;

// XSDAST (XSD Abstract Syntax Tree) for structural comparison
export interface XSDAST {
  root: XSDSchema;
  elements: Map<string, XSDElementInfo>;
  attributes: Map<string, XSDAttributeInfo>;
  types: Map<string, XSDTypeInfo>;
  namespaces: Map<string, string>;
  rootElement: string | null;
}

export interface XSDElementInfo {
  name: string;
  type: string;
  attributes: Set<string>;
  children: Set<string>;
  minOccurs: string;
  maxOccurs: string;
  isRef: boolean;
  xsdNode: XSDElement;
}

export interface XSDAttributeInfo {
  name: string;
  type: string;
  use: string;
  xsdNode: XSDAttribute;
}

export interface XSDTypeInfo {
  name: string;
  type: string;
  elements: Set<string>;
  attributes: Set<string>;
  xsdNode: XSDComplexType | XSDSimpleType;
}

export interface XSDASTComparison {
  equal: boolean;
  differences: string[];
  elementDifferences: string[];
  attributeDifferences: string[];
  namespaceDifferences: string[];
  structuralDifferences: string[];
}

export interface XMLValidationResult {
  valid: boolean;
  errors: any[]; // xmllint-wasm returns XMLValidationError[]
  warnings?: any[]; // Optional warnings
}
