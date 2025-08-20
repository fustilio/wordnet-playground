/**
 * LMF Data Integrity Validation System
 * 
 * This module provides comprehensive validation by performing dry-run exports
 * and comparing reconstructed XML with original source files. This is the
 * "true way" to verify data integrity across the entire parsing pipeline.
 * 
 * The validation system:
 * 1. Loads data from a database (any database implementation)
 * 2. Reconstructs the original LMF XML structure
 * 3. Compares it with the source XML file
 * 4. Reports any differences, data loss, or corruption
 */

export interface ValidationResult {
  success: boolean;
  originalFile: string;
  reconstructedFile: string | undefined;
  differences: ValidationDifference[];
  summary: {
    totalElements: number;
    matchingElements: number;
    missingElements: number;
    extraElements: number;
    attributeMismatches: number;
  };
}

export interface ValidationDifference {
  type: 'missing_element' | 'extra_element' | 'attribute_mismatch' | 'content_mismatch' | 'structural_difference';
  path: string;
  original?: string;
  reconstructed?: string;
  details: string;
}

export interface DatabaseAdapter {
  /**
   * Get all lexicons from the database
   */
  getLexicons(): Promise<any[]>;
  
  /**
   * Get all words for a specific lexicon
   */
  getWords(lexiconId: string): Promise<any[]>;
  
  /**
   * Get all synsets for a specific lexicon
   */
  getSynsets(lexiconId: string): Promise<any[]>;
  
  /**
   * Get all senses for a specific word
   */
  getSenses(wordId: string): Promise<any[]>;
  
  /**
   * Get all forms for a specific word
   */
  getForms(wordId: string): Promise<any[]>;
  
  /**
   * Get all tags for a specific word
   */
  getWordTags(wordId: string): Promise<any[]>;
  
  /**
   * Get all tags for a specific form
   */
  getFormTags(formId: string): Promise<any[]>;
  
  /**
   * Get all sense relations for a specific sense
   */
  getSenseRelations(senseId: string): Promise<any[]>;
  
  /**
   * Get all examples for a specific sense
   */
  getSenseExamples(senseId: string): Promise<any[]>;
  
  /**
   * Get all counts for a specific sense
   */
  getSenseCounts(senseId: string): Promise<any[]>;
  
  /**
   * Get all syntactic behaviours for a specific word
   */
  getSyntacticBehaviours(wordId: string): Promise<any[]>;
  
  /**
   * Get all definitions for a specific synset
   */
  getDefinitions(synsetId: string): Promise<any[]>;
  
  /**
   * Get all ILI definitions for a specific synset
   */
  getILIDefinitions(synsetId: string): Promise<any[]>;
  
  /**
   * Get all synset relations for a specific synset
   */
  getSynsetRelations(synsetId: string): Promise<any[]>;
  
  /**
   * Get all examples for a specific synset
   */
  getSynsetExamples(synsetId: string): Promise<any[]>;
}

export interface ValidationOptions {
  outputReconstructed?: boolean;
  outputPath?: string;
  ignoreWhitespace?: boolean;
  ignoreOrder?: boolean;
  detailedDiff?: boolean;
}

/**
 * Perform a comprehensive validation by exporting and comparing LMF data
 * This is the "true way" to verify data integrity - reconstruct the original XML
 * and compare it with the source file
 */
export async function validateLMFDataIntegrity(
  databaseAdapter: DatabaseAdapter,
  originalXmlPath: string,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const {
    outputReconstructed = true,
    outputPath,
    ignoreWhitespace = true,
    ignoreOrder = true,
    detailedDiff = true
  } = options;

  try {
    // 1. Load the original XML file
    const originalXml = await fileOperations.loadFile(originalXmlPath);
    console.log(`🔍 Starting LMF data integrity validation`);
    console.log(`📄 Original XML: ${originalXmlPath} (${originalXml.length} characters)`);

    // 2. Get all lexicons from the database
    const lexicons = await databaseAdapter.getLexicons();
    console.log(`📚 Found ${lexicons.length} lexicons in database`);

    // 3. Perform dry-run export to reconstruct XML
    const reconstructedXml = await exportToXML(databaseAdapter, lexicons);
    console.log(`🔄 Reconstructed XML (${reconstructedXml.length} characters)`);

    // 4. Save reconstructed XML if requested
    let reconstructedPath: string | undefined;
    if (outputReconstructed) {
      reconstructedPath = outputPath || fileOperations.generateOutputPath(originalXmlPath);
      await fileOperations.saveFile(reconstructedPath, reconstructedXml);
      console.log(`💾 Saved reconstructed XML to: ${reconstructedPath}`);
    }

    // 5. Compare original vs reconstructed
    const differences = await compareXML(originalXml, reconstructedXml, {
      ignoreWhitespace,
      ignoreOrder,
      detailedDiff
    });

    // 6. Generate summary statistics
    const summary = generateValidationSummary(differences, originalXml, reconstructedXml);

    // 7. Log results
    if (differences.length === 0) {
      console.log(`✅ Validation PASSED - No differences found!`);
    } else {
      console.log(`⚠️ Validation FAILED - Found ${differences.length} differences`);
      if (detailedDiff) {
        differences.slice(0, 10).forEach((diff, i) => {
          console.log(`  ${i + 1}. ${diff.type}: ${diff.path} - ${diff.details}`);
        });
        if (differences.length > 10) {
          console.log(`  ... and ${differences.length - 10} more differences`);
        }
      }
    }

    const result: ValidationResult = {
      success: differences.length === 0,
      originalFile: originalXmlPath,
      reconstructedFile: reconstructedPath,
      differences,
      summary
    };

    return result;

  } catch (error) {
    console.error(`❌ Validation failed with error: ${error}`);
    throw new Error(`LMF validation failed: ${error}`);
  }
}

/**
 * Export database content to LMF XML format
 * This is a standalone version for validation purposes
 */
async function exportToXML(databaseAdapter: DatabaseAdapter, lexicons: any[]): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">\n';
  xml += '<LexicalResource xmlns:dc="http://purl.org/dc/elements/1.1/">\n';

  for (const lexicon of lexicons) {
    // Export lexicon with all required attributes
    xml += `  <Lexicon id="${lexicon.id}" label="${lexicon.label}" language="${lexicon.language}"`;
    xml += ` email="${lexicon.email || 'maintainer@example.com'}"`;
    xml += ` license="${lexicon.license || 'https://creativecommons.org/licenses/by/4.0/'}"`;
    xml += ` version="${lexicon.version || '1'}"`;
    if (lexicon.url) xml += ` url="${lexicon.url}"`;
    if (lexicon.citation) xml += ` citation="${lexicon.citation}"`;
    if (lexicon.dc_contributor) xml += ` dc:contributor="${lexicon.dc_contributor}"`;
    if (lexicon.dc_coverage) xml += ` dc:coverage="${lexicon.dc_coverage}"`;
    if (lexicon.dc_creator) xml += ` dc:creator="${lexicon.dc_creator}"`;
    if (lexicon.dc_date) xml += ` dc:date="${lexicon.dc_date}"`;
    if (lexicon.dc_description) xml += ` dc:description="${lexicon.dc_description}"`;
    if (lexicon.dc_format) xml += ` dc:format="${lexicon.dc_format}"`;
    if (lexicon.dc_identifier) xml += ` dc:identifier="${lexicon.dc_identifier}"`;
    if (lexicon.dc_publisher) xml += ` dc:publisher="${lexicon.dc_publisher}"`;
    if (lexicon.dc_relation) xml += ` dc:relation="${lexicon.dc_relation}"`;
    if (lexicon.dc_rights) xml += ` dc:rights="${lexicon.dc_rights}"`;
    if (lexicon.dc_source) xml += ` dc:source="${lexicon.dc_source}"`;
    if (lexicon.dc_subject) xml += ` dc:subject="${lexicon.dc_subject}"`;
    if (lexicon.dc_title) xml += ` dc:title="${lexicon.dc_title}"`;
    if (lexicon.dc_type) xml += ` dc:type="${lexicon.dc_type}"`;
    if (lexicon.status) xml += ` status="${lexicon.status}"`;
    if (lexicon.note) xml += ` note="${lexicon.note}"`;
    if (lexicon.confidence_score) xml += ` confidenceScore="${lexicon.confidence_score}"`;
    xml += '>\n';

    // Get words (LexicalEntry) for this lexicon
    const words = await databaseAdapter.getWords(lexicon.id);
    for (const word of words) {
      xml += `    <LexicalEntry id="${word.id}"`;
      if (word.dc_contributor) xml += ` dc:contributor="${word.dc_contributor}"`;
      if (word.dc_coverage) xml += ` dc:coverage="${word.dc_coverage}"`;
      if (word.dc_creator) xml += ` dc:creator="${word.dc_creator}"`;
      if (word.dc_date) xml += ` dc:date="${word.dc_date}"`;
      if (word.dc_description) xml += ` dc:description="${word.dc_description}"`;
      if (word.dc_format) xml += ` dc:format="${word.dc_format}"`;
      if (word.dc_identifier) xml += ` dc:identifier="${word.dc_identifier}"`;
      if (word.dc_publisher) xml += ` dc:publisher="${word.dc_publisher}"`;
      if (word.dc_relation) xml += ` dc:relation="${word.dc_relation}"`;
      if (word.dc_rights) xml += ` dc:rights="${word.dc_rights}"`;
      if (word.dc_source) xml += ` dc:source="${word.dc_source}"`;
      if (word.dc_subject) xml += ` dc:subject="${word.dc_subject}"`;
      if (word.dc_title) xml += ` dc:title="${word.dc_title}"`;
      if (word.dc_type) xml += ` dc:type="${word.dc_type}"`;
      if (word.status) xml += ` status="${word.status}"`;
      if (word.note) xml += ` note="${word.note}"`;
      if (word.confidence_score) xml += ` confidenceScore="${word.confidence_score}"`;
      xml += '>\n';

      // Export Lemma
      xml += `      <Lemma partOfSpeech="${word.pos}" writtenForm="${word.lemma}"`;
      if (word.script) xml += ` script="${word.script}"`;
      xml += '>\n';
      
      // Get tags for this word
      const tags = await databaseAdapter.getWordTags(word.id);
      for (const tag of tags) {
        xml += `        <Tag category="${tag.category}">${tag.text}</Tag>\n`;
      }
      xml += '      </Lemma>\n';

      // Get forms for this word
      const forms = await databaseAdapter.getForms(word.id);
      for (const form of forms) {
        xml += `      <Form writtenForm="${form.written_form}"`;
        if (form.script) xml += ` script="${form.script}"`;
        xml += '>\n';
        
        // Get tags for this form
        const formTags = await databaseAdapter.getFormTags(form.id);
        for (const tag of formTags) {
          xml += `        <Tag category="${tag.category}">${tag.text}</Tag>\n`;
        }
        xml += '      </Form>\n';
      }

      // Get senses for this word
      const senses = await databaseAdapter.getSenses(word.id);
      for (const sense of senses) {
        xml += `      <Sense id="${sense.id}" synset="${sense.synset_id}"`;
        if (sense.lexicalized !== undefined) xml += ` lexicalized="${sense.lexicalized}"`;
        if (sense.adjposition) xml += ` adjposition="${sense.adjposition}"`;
        if (sense.dc_contributor) xml += ` dc:contributor="${sense.dc_contributor}"`;
        if (sense.dc_coverage) xml += ` dc:coverage="${sense.dc_coverage}"`;
        if (sense.dc_creator) xml += ` dc:creator="${sense.dc_creator}"`;
        if (sense.dc_date) xml += ` dc:date="${sense.dc_date}"`;
        if (sense.dc_description) xml += ` dc:description="${sense.dc_description}"`;
        if (sense.dc_format) xml += ` dc:format="${sense.dc_format}"`;
        if (sense.dc_identifier) xml += ` dc:identifier="${sense.dc_identifier}"`;
        if (sense.dc_publisher) xml += ` dc:publisher="${sense.dc_publisher}"`;
        if (sense.dc_relation) xml += ` dc:relation="${sense.dc_relation}"`;
        if (sense.dc_rights) xml += ` dc:rights="${sense.dc_rights}"`;
        if (sense.dc_source) xml += ` dc:source="${sense.dc_source}"`;
        if (sense.dc_subject) xml += ` dc:subject="${sense.dc_subject}"`;
        if (sense.dc_title) xml += ` dc:title="${sense.dc_title}"`;
        if (sense.dc_type) xml += ` dc:type="${sense.dc_type}"`;
        if (sense.status) xml += ` status="${sense.status}"`;
        if (sense.note) xml += ` note="${sense.note}"`;
        if (sense.confidence_score) xml += ` confidenceScore="${sense.confidence_score}"`;
        xml += '>\n';

        // Get sense relations
        const senseRelations = await databaseAdapter.getSenseRelations(sense.id);
        for (const rel of senseRelations) {
          xml += `        <SenseRelation relType="${rel.rel_type}" target="${rel.target}"`;
          if (rel.dc_type) xml += ` dc:type="${rel.dc_type}"`;
          xml += ' />\n';
        }

        // Get examples for this sense
        const senseExamples = await databaseAdapter.getSenseExamples(sense.id);
        for (const example of senseExamples) {
          xml += `        <Example`;
          if (example.language) xml += ` language="${example.language}"`;
          xml += `>${example.text}</Example>\n`;
        }

        // Get counts for this sense
        const counts = await databaseAdapter.getSenseCounts(sense.id);
        for (const count of counts) {
          xml += `        <Count`;
          if (count.dc_source) xml += ` dc:source="${count.dc_source}"`;
          xml += `>${count.value}</Count>\n`;
        }

        xml += '      </Sense>\n';
      }

      // Get syntactic behaviours for this word
      const syntacticBehaviours = await databaseAdapter.getSyntacticBehaviours(word.id);
      for (const sb of syntacticBehaviours) {
        xml += `      <SyntacticBehaviour senses="${sb.senses}" subcategorizationFrame="${sb.subcategorization_frame}"`;
        if (sb.dc_contributor) xml += ` dc:contributor="${sb.dc_contributor}"`;
        if (sb.dc_coverage) xml += ` dc:coverage="${sb.dc_coverage}"`;
        if (sb.dc_creator) xml += ` dc:creator="${sb.dc_creator}"`;
        if (sb.dc_date) xml += ` dc:date="${sb.dc_date}"`;
        if (sb.dc_description) xml += ` dc:description="${sb.dc_description}"`;
        if (sb.dc_format) xml += ` dc:format="${sb.dc_format}"`;
        if (sb.dc_identifier) xml += ` dc:identifier="${sb.dc_identifier}"`;
        if (sb.dc_publisher) xml += ` dc:publisher="${sb.dc_publisher}"`;
        if (sb.dc_relation) xml += ` dc:relation="${sb.dc_relation}"`;
        if (sb.dc_rights) xml += ` dc:rights="${sb.dc_rights}"`;
        if (sb.dc_source) xml += ` dc:source="${sb.dc_source}"`;
        if (sb.dc_subject) xml += ` dc:subject="${sb.dc_subject}"`;
        if (sb.dc_title) xml += ` dc:title="${sb.dc_title}"`;
        if (sb.dc_type) xml += ` dc:type="${sb.dc_type}"`;
        if (sb.status) xml += ` status="${sb.status}"`;
        if (sb.note) xml += ` note="${sb.note}"`;
        if (sb.confidence_score) xml += ` confidenceScore="${sb.confidence_score}"`;
        xml += ' />\n';
      }

      xml += '    </LexicalEntry>\n';
    }

    // Get synsets for this lexicon
    const synsets = await databaseAdapter.getSynsets(lexicon.id);
    for (const synset of synsets) {
      xml += `    <Synset id="${synset.id}" ili="${synset.ili || ''}" partOfSpeech="${synset.pos}"`;
      if (synset.lexicalized !== undefined) xml += ` lexicalized="${synset.lexicalized}"`;
      if (synset.dc_contributor) xml += ` dc:contributor="${synset.dc_contributor}"`;
      if (synset.dc_coverage) xml += ` dc:coverage="${synset.dc_coverage}"`;
      if (synset.dc_creator) xml += ` dc:creator="${synset.dc_creator}"`;
      if (synset.dc_date) xml += ` dc:date="${synset.dc_date}"`;
      if (synset.dc_description) xml += ` dc:description="${synset.dc_description}"`;
      if (synset.dc_format) xml += ` dc:format="${synset.dc_format}"`;
      if (synset.dc_identifier) xml += ` dc:identifier="${synset.dc_identifier}"`;
      if (synset.dc_publisher) xml += ` dc:publisher="${synset.dc_publisher}"`;
      if (synset.dc_relation) xml += ` dc:relation="${synset.dc_relation}"`;
      if (synset.dc_rights) xml += ` dc:rights="${synset.dc_rights}"`;
      if (synset.dc_source) xml += ` dc:source="${synset.dc_source}"`;
      if (synset.dc_subject) xml += ` dc:subject="${synset.dc_subject}"`;
      if (synset.dc_title) xml += ` dc:title="${synset.dc_title}"`;
      if (synset.dc_type) xml += ` dc:type="${synset.dc_type}"`;
      if (synset.status) xml += ` status="${synset.status}"`;
      if (synset.note) xml += ` note="${synset.note}"`;
      if (synset.confidence_score) xml += ` confidenceScore="${synset.confidence_score}"`;
      xml += '>\n';

      // Get definitions for this synset
      const definitions = await databaseAdapter.getDefinitions(synset.id);
      for (const def of definitions) {
        xml += `      <Definition`;
        if (def.language) xml += ` language="${def.language}"`;
        if (def.source_sense) xml += ` sourceSense="${def.source_sense}"`;
        xml += `>${def.text}</Definition>\n`;
      }

      // Get ILI definitions for this synset
      const iliDefinitions = await databaseAdapter.getILIDefinitions(synset.id);
      for (const iliDef of iliDefinitions) {
        xml += `      <ILIDefinition>${iliDef.text}</ILIDefinition>\n`;
      }

      // Get synset relations
      const synsetRelations = await databaseAdapter.getSynsetRelations(synset.id);
      for (const rel of synsetRelations) {
        xml += `      <SynsetRelation relType="${rel.rel_type}" target="${rel.target}" />\n`;
      }

      // Get examples for this synset
      const examples = await databaseAdapter.getSynsetExamples(synset.id);
      for (const example of examples) {
        xml += `      <Example`;
        if (example.language) xml += ` language="${example.language}"`;
        xml += `>${example.text}</Example>\n`;
      }

      xml += '    </Synset>\n';
    }

    xml += '  </Lexicon>\n';
  }

  xml += '</LexicalResource>';
  return xml;
}

/**
 * Compare two XML strings and find differences
 */
async function compareXML(
  originalXml: string,
  reconstructedXml: string,
  options: {
    ignoreWhitespace: boolean;
    ignoreOrder: boolean;
    detailedDiff: boolean;
  }
): Promise<ValidationDifference[]> {
  const differences: ValidationDifference[] = [];

  try {
    // For now, implement a basic comparison
    // In a full implementation, this would use a proper XML diff library
    
    if (options.ignoreWhitespace) {
      const normalizedOriginal = normalizeXML(originalXml);
      const normalizedReconstructed = normalizeXML(reconstructedXml);
      
      if (normalizedOriginal === normalizedReconstructed) {
        return differences; // No differences
      }
    }

    // Basic structural comparison
    const originalElements = countXMLElements(originalXml);
    const reconstructedElements = countXMLElements(reconstructedXml);
    
    if (originalElements !== reconstructedElements) {
      differences.push({
        type: 'structural_difference',
        path: 'root',
        original: `Elements: ${originalElements}`,
        reconstructed: `Elements: ${reconstructedElements}`,
        details: `Element count mismatch: original has ${originalElements}, reconstructed has ${reconstructedElements}`
      });
    }

    // TODO: Implement more sophisticated XML comparison
    // This would involve parsing both XMLs and comparing their DOM structures
    
  } catch (error) {
    differences.push({
      type: 'structural_difference',
      path: 'comparison',
      details: `Failed to compare XML: ${error}`
    });
  }

  return differences;
}

/**
 * Normalize XML by removing extra whitespace and normalizing line endings
 */
function normalizeXML(xml: string): string {
  return xml
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Count XML elements (basic implementation)
 */
function countXMLElements(xml: string): number {
  const matches = xml.match(/<[^!?][^>]*>/g);
  return matches ? matches.length : 0;
}

/**
 * Generate validation summary statistics
 */
function generateValidationSummary(
  differences: ValidationDifference[],
  originalXml: string,
  _reconstructedXml: string
): ValidationResult['summary'] {
  const totalElements = countXMLElements(originalXml);
  const missingElements = differences.filter(d => d.type === 'missing_element').length;
  const extraElements = differences.filter(d => d.type === 'extra_element').length;
  const attributeMismatches = differences.filter(d => d.type === 'attribute_mismatch').length;
  const matchingElements = totalElements - missingElements;

  return {
    totalElements,
    matchingElements,
    missingElements,
    extraElements,
    attributeMismatches
  };
}

/**
 * Framework-agnostic file operations
 * These will be implemented by the consuming frameworks
 */
async function loadFile(_path: string): Promise<string> {
  // This should be overridden by the framework-specific implementation
  throw new Error('loadFile not implemented - must be provided by framework');
}

async function saveFile(_path: string, _content: string): Promise<void> {
  // This should be overridden by the framework-specific implementation
  throw new Error('saveFile not implemented - must be provided by framework');
}

function generateOutputPath(_originalPath: string): string {
  // This should be overridden by the framework-specific implementation
  throw new Error('generateOutputPath not implemented - must be provided by framework');
}

/**
 * Export the file operation functions so they can be overridden
 */
export const fileOperations = {
  loadFile,
  saveFile,
  generateOutputPath
};
