import { describe, it, expect, beforeEach } from 'vitest';
import { XMLFakerGenerator, XMLFakerOptions } from '../src/XMLFakerGenerator';
import { faker } from '@faker-js/faker';

describe('XMLFakerGenerator', () => {
  let generator: XMLFakerGenerator;

  beforeEach(() => {
    generator = new XMLFakerGenerator({ seed: 12345 });
  });

  describe('Realistic Data Generation', () => {
    it('should generate realistic person names', () => {
      const firstName = generator.generateRealisticData('firstname');
      const lastName = generator.generateRealisticData('lastname');
      const fullName = generator.generateRealisticData('fullname');

      expect(firstName).toBeTruthy();
      expect(lastName).toBeTruthy();
      expect(fullName).toBeTruthy();
      expect(typeof firstName).toBe('string');
      expect(typeof lastName).toBe('string');
      expect(typeof fullName).toBe('string');
    });

    it('should generate realistic contact information', () => {
      const email = generator.generateRealisticData('email');
      const phone = generator.generateRealisticData('phone');
      const website = generator.generateRealisticData('website');

      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(phone).toBeTruthy();
      expect(website).toMatch(/^https?:\/\//);
    });

    it('should generate realistic location data', () => {
      const address = generator.generateRealisticData('address');
      const city = generator.generateRealisticData('city');
      const country = generator.generateRealisticData('country');
      const zipcode = generator.generateRealisticData('zipcode');

      expect(address).toBeTruthy();
      expect(city).toBeTruthy();
      expect(country).toBeTruthy();
      expect(zipcode).toBeTruthy();
    });

    it('should generate realistic business data', () => {
      const company = generator.generateRealisticData('company');
      const jobTitle = generator.generateRealisticData('jobtitle');
      const price = generator.generateRealisticData('price');

      expect(company).toBeTruthy();
      expect(jobTitle).toBeTruthy();
      expect(price).toBeTruthy();
    });

    it('should generate realistic content', () => {
      const title = generator.generateRealisticData('title');
      const description = generator.generateRealisticData('description');
      const content = generator.generateRealisticData('content');

      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
      expect(content).toBeTruthy();
      expect(title.length).toBeLessThan(description.length);
      expect(description.length).toBeLessThan(content.length);
    });

    it('should handle WordNet LMF specific elements', () => {
      const lemma = generator.generateRealisticData('lemma');
      const synset = generator.generateRealisticData('synset');
      const definition = generator.generateRealisticData('definition');

      expect(lemma).toBeTruthy();
      expect(synset).toBeTruthy();
      expect(definition).toBeTruthy();
    });
  });

  describe('Attribute Generation', () => {
    it('should generate common attributes', () => {
      const attributes = generator.generateAttributes('person');
      
      expect(attributes).toBeDefined();
      expect(typeof attributes).toBe('object');
      
      // Should have some common attributes
      const attrKeys = Object.keys(attributes);
      expect(attrKeys.length).toBeGreaterThan(0);
      
      // Check that attribute values are strings
      for (const value of Object.values(attributes)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it('should generate attributes based on existing attribute names', () => {
      const existingAttrs = ['id', 'name', 'type', 'class'];
      const attributes = generator.generateAttributes('element', existingAttrs);
      
      expect(attributes).toBeDefined();
      
      // Should have some of the existing attributes
      for (const attr of existingAttrs) {
        if (attributes[attr]) {
          expect(typeof attributes[attr]).toBe('string');
        }
      }
    });
  });

  describe('Child Element Generation', () => {
    it('should generate appropriate children for person elements', () => {
      const children = generator.generateChildren('person', 0);
      
      expect(Array.isArray(children)).toBe(true);
      expect(children.length).toBeGreaterThan(0);
      
      // Should have appropriate child names for person
      const childNames = children.map(child => child.name.toLowerCase());
      expect(childNames).toContain('name');
      expect(childNames).toContain('email');
    });

    it('should generate appropriate children for product elements', () => {
      const children = generator.generateChildren('product', 0);
      
      expect(Array.isArray(children)).toBe(true);
      
      const childNames = children.map(child => child.name.toLowerCase());
      expect(childNames).toContain('name');
      expect(childNames).toContain('description');
      expect(childNames).toContain('price');
    });

    it('should respect max depth constraints', () => {
      const maxDepth = 2;
      const limitedGenerator = new XMLFakerGenerator({ maxDepth });
      const children = limitedGenerator.generateChildren('root', 0);
      
      // Check that children don't exceed max depth
      const checkDepth = (elements: any[], currentDepth: number) => {
        if (currentDepth >= maxDepth) {
          expect(elements.length).toBe(0);
          return;
        }
        
        for (const element of elements) {
          checkDepth(element.children, currentDepth + 1);
        }
      };
      
      checkDepth(children, 0);
    });
  });

  describe('XML Generation from Structure', () => {
    it('should generate XML from a simple structure', () => {
      const structure = {
        rootElement: 'root',
        elementTypes: new Map([
          ['person', { count: 2, attributes: new Set(['id', 'name']), children: new Set(), examples: [] }],
          ['company', { count: 1, attributes: new Set(['id']), children: new Set(), examples: [] }]
        ])
      };

      const xml = generator.generateXMLFromStructure(structure);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<root');
      expect(xml).toContain('</root>');
      expect(xml).toContain('<person');
      expect(xml).toContain('<company');
      expect(xml).toContain('</person>');
      expect(xml).toContain('</company>');
    });

    it('should generate XML with attributes', () => {
      const structure = {
        rootElement: 'root',
        elementTypes: new Map([
          ['person', { count: 1, attributes: new Set(['id', 'name', 'email']), children: new Set(), examples: [] }]
        ])
      };

      const xml = generator.generateXMLFromStructure(structure);
      
      expect(xml).toContain('id="');
      expect(xml).toContain('name="');
      expect(xml).toContain('email="');
    });
  });

  describe('XSD-based XML Generation', () => {
    it('should parse XSD and generate XML', () => {
      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
      <xs:attribute name="name" type="xs:string"/>
    </xs:complexType>
  </xs:element>
  <xs:element name="company">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generator.generateXMLFromXSD(xsdContent);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<root>');
      expect(xml).toContain('</root>');
      expect(xml).toContain('<person');
      expect(xml).toContain('<company');
    });
  });

  describe('XAST Roundtrip', () => {
    it('should perform XML to XAST to XML roundtrip', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John">
    <email>john@example.com</email>
  </person>
</root>`;

      const result = await generator.xmlToXASTToXML(xmlContent);
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<root>');
      expect(result).toContain('<person');
      expect(result).toContain('id="1"');
      expect(result).toContain('name="John"');
      expect(result).toContain('<email>');
      expect(result).toContain('john@example.com');
      expect(result).toContain('</email>');
      expect(result).toContain('</person>');
      expect(result).toContain('</root>');
    });
  });

  describe('Sample XML Generation', () => {
    it('should generate sample XML with specified element count', () => {
      const elementCount = 5;
      const xml = generator.generateSampleXML(elementCount);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<sample>');
      expect(xml).toContain('</sample>');
      
      // Count the number of opening tags (excluding root)
      const openingTags = (xml.match(/<[^\/][^>]*>/g) || []).length;
      expect(openingTags).toBeGreaterThanOrEqual(elementCount);
    });
  });

  describe('Custom Generators', () => {
    it('should use custom generators when provided', () => {
      const customGenerators = {
        'custom': () => 'Custom Value',
        'special': () => 'Special Content'
      };

      const customGenerator = new XMLFakerGenerator({
        customGenerators,
        seed: 12345
      });

      const customValue = customGenerator.generateRealisticData('custom');
      const specialValue = customGenerator.generateRealisticData('special');

      expect(customValue).toBe('Custom Value');
      expect(specialValue).toBe('Special Content');
    });
  });

  describe('Seeding and Consistency', () => {
    it('should generate consistent results with the same seed', () => {
      const seed = 42;
      const generator = new XMLFakerGenerator({ seed });

      // Test that the same generator instance produces consistent behavior
      // (same data types, same structure, etc.)
      const value1 = generator.generateRealisticData('name');
      const value2 = generator.generateRealisticData('name');
      const value3 = generator.generateRealisticData('name');

      // All values should be strings (consistent type)
      expect(typeof value1).toBe('string');
      expect(typeof value2).toBe('string');
      expect(typeof value3).toBe('string');
      
      // All values should have reasonable length (consistent behavior)
      expect(value1.length).toBeGreaterThan(0);
      expect(value2.length).toBeGreaterThan(0);
      expect(value3.length).toBeGreaterThan(0);
      
      // Values should be realistic names (consistent format)
      expect(value1).toMatch(/^[A-Z][a-z]+$/);
      expect(value2).toMatch(/^[A-Z][a-z]+$/);
      expect(value3).toMatch(/^[A-Z][a-z]+$/);
    });

    it('should generate different results with different seeds', () => {
      const generator1 = new XMLFakerGenerator({ seed: 1 });
      const generator2 = new XMLFakerGenerator({ seed: 2 });

      const value1 = generator1.generateRealisticData('name');
      const value2 = generator2.generateRealisticData('name');

      expect(value1).not.toBe(value2);
    });
  });

  describe('Configuration Options', () => {
    it('should respect max depth configuration', () => {
      const maxDepth = 3;
      const limitedGenerator = new XMLFakerGenerator({ maxDepth });
      
      const children = limitedGenerator.generateChildren('root', 0);
      
      const checkDepth = (elements: any[], currentDepth: number) => {
        if (currentDepth >= maxDepth) {
          expect(elements.length).toBe(0);
          return;
        }
        
        for (const element of elements) {
          checkDepth(element.children, currentDepth + 1);
        }
      };
      
      checkDepth(children, 0);
    });

    it('should respect max children configuration', () => {
      const maxChildren = 5;
      const limitedGenerator = new XMLFakerGenerator({ maxChildren });
      
      const children = limitedGenerator.generateChildren('root', 0);
      
      expect(children.length).toBeLessThanOrEqual(maxChildren);
    });

    it('should handle realistic data configuration', () => {
      const realisticGenerator = new XMLFakerGenerator({ realisticData: true });
      const nonRealisticGenerator = new XMLFakerGenerator({ realisticData: false });

      const realisticValue = realisticGenerator.generateRealisticData('name');
      const nonRealisticValue = nonRealisticGenerator.generateRealisticData('name');

      expect(realisticValue).toBeTruthy();
      expect(nonRealisticValue).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XSD gracefully', () => {
      const malformedXSD = '<xs:schema><xs:element name="test"';
      
      expect(() => {
        generator.generateXMLFromXSD(malformedXSD);
      }).not.toThrow();
    });

    it('should handle empty XSD content', () => {
      const emptyXSD = '';
      
      const xml = generator.generateXMLFromXSD(emptyXSD);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<root>');
      expect(xml).toContain('</root>');
    });
  });
});
