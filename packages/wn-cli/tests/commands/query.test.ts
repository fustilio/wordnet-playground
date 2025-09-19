import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runCommand } from './test-helper.js';
import { writeFileSync } from "fs";
import { join } from "path";

// Common test data for query commands
const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-query" label="Query Lexicon" language="en" version="1.0">
    <LexicalEntry id="w_car"><Lemma writtenForm="car" partOfSpeech="n"/><Sense id="s_car" synset="ss_car"/></LexicalEntry>
    <LexicalEntry id="w_automobile"><Lemma writtenForm="automobile" partOfSpeech="n"/><Sense id="s_automobile" synset="ss_car"/></LexicalEntry>
    <LexicalEntry id="w_happy"><Lemma writtenForm="happy" partOfSpeech="a"/><Sense id="s_happy" synset="ss_happy"/></LexicalEntry>
    <LexicalEntry id="w_glad"><Lemma writtenForm="glad" partOfSpeech="a"/><Sense id="s_glad" synset="ss_happy"/></LexicalEntry>
    <Synset id="ss_car" partOfSpeech="n">
      <Definition language="en">a road vehicle, typically with four wheels</Definition>
    </Synset>
    <Synset id="ss_happy" partOfSpeech="a">
      <Definition language="en">feeling or showing pleasure or contentment.</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

describe('query command tests', () => {
  let config: any;
  let add: any;
  beforeEach(async () => {
    // Dynamically import wn-ts after config.dataDirectory is set by test-helper
    ({ config, add } = await import("wn-ts"));
    // Ensure the temp data directory exists
    const fs = await import('fs');
    if (!fs.existsSync(config.dataDirectory)) {
      fs.mkdirSync(config.dataDirectory, { recursive: true });
    }
    // Debug: print config.dataDirectory and CLI config path
    // eslint-disable-next-line no-console
    console.log('[DEBUG] config.dataDirectory:', config.dataDirectory);
    // eslint-disable-next-line no-console
    console.log('[DEBUG] CLI config path:', process.env.WN_CLI_CONFIG_PATH || 'not set');
    const dbPath = join(config.dataDirectory, "wn.db");
    // eslint-disable-next-line no-console
    console.log('[DEBUG] DB exists after setup:', fs.existsSync(dbPath));
    const testFile = join(config.dataDirectory, "query.xml");
    // eslint-disable-next-line no-console
    console.log('DEBUG testFile:', testFile);
    writeFileSync(testFile, testLexicon);
    // Check file existence and readability
    try {
      const { statSync, readFileSync } = await import('fs');
      const stat = statSync(testFile);
      // eslint-disable-next-line no-console
      console.log('DEBUG testFile exists:', true, 'size:', stat.size);
      const content = readFileSync(testFile, 'utf8');
      // eslint-disable-next-line no-console
      console.log('DEBUG testFile first 100 chars:', content.slice(0, 100));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('DEBUG testFile exists:', false, e);
    }
    // Check isLMF and loadLMF
    try {
      const { isLMF, loadLMF } = await import('wn-ts');
      const isLmf = await isLMF(testFile);
      // eslint-disable-next-line no-console
      console.log('DEBUG isLMF result:', isLmf);
      if (isLmf) {
        try {
          const lmfData = await loadLMF(testFile);
          // eslint-disable-next-line no-console
          console.log('DEBUG loadLMF lexicons:', lmfData.lexicons?.length);
          console.log('DEBUG loadLMF synsets:', lmfData.synsets?.length);
          
          // Debug: check what definitions are being parsed
          if (lmfData.synsets) {
            for (const synset of lmfData.synsets) {
              // eslint-disable-next-line no-console
              console.log(`DEBUG synset ${synset.id} definitions:`, synset.definitions);
            }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('DEBUG loadLMF error:', e);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('DEBUG isLMF/loadLMF error:', e);
    }
    let addResult;
    try {
      addResult = await add(testFile, { force: true });
      // eslint-disable-next-line no-console
      console.log('DEBUG add() result:', addResult);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('DEBUG add() error:', e);
    }
    // Debug: print DB file existence and size
    const dbPathAfterSetup = join(config.dataDirectory, 'wn.db');
    if (fs.existsSync(dbPathAfterSetup)) {
      const stat = fs.statSync(dbPathAfterSetup);
      // eslint-disable-next-line no-console
      console.log('DEBUG wn.db exists:', true, 'size:', stat.size);
    }
    // Debug: print all definitions for ss_car using wn-ts API
    const { synset } = await import("wn-ts");
    let ssCar;
    try {
      ssCar = await synset("ss_car", { lexicon: "test-query" });
      // eslint-disable-next-line no-console
      console.log("DEBUG ss_car definitions:", ssCar?.definitions);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("DEBUG synset() error:", e);
    }
    
    // Debug: check what's actually in the database
    try {
      const { db } = await import("wn-ts");
      db.initialize();
      const synsets = db.all('SELECT * FROM synsets WHERE lexicon = ?', ['test-query']);
      // eslint-disable-next-line no-console
      console.log("DEBUG synsets in DB:", synsets);
      const words = db.all('SELECT * FROM words WHERE lexicon = ?', ['test-query']);
      // eslint-disable-next-line no-console
      console.log("DEBUG words in DB:", words);
      const senses = db.all('SELECT * FROM senses WHERE word_id IN (SELECT id FROM words WHERE lexicon = ?)', ['test-query']);
      // eslint-disable-next-line no-console
      console.log("DEBUG senses in DB:", senses);
      
      // Check if definitions are in the database
      const definitions = db.all('SELECT * FROM definitions WHERE synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)', ['test-query']);
      // eslint-disable-next-line no-console
      console.log("DEBUG definitions in DB:", definitions);
      
      db.close();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("DEBUG DB query error:", e);
    }
  });

  afterEach(async () => {
    const fs = await import('fs');
    const dbPath = join(config.dataDirectory, 'wn.db');
    // eslint-disable-next-line no-console
    console.log('[DEBUG] DB exists after test:', fs.existsSync(dbPath));
    // Print contents of temp dir
    try {
      const files = fs.readdirSync(config.dataDirectory);
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Temp dir contents:', files);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Could not read temp dir:', e);
    }
  });

  it('query command without arguments shows help', async () => {
    const { stdout, stderr } = await runCommand(['query']);
    expect(stdout).toContain('Usage: wn-cli query');
    expect(stderr).toBe('');
  });

  it('query word command without a word shows an error', async () => {
    const { stdout, stderr } = await runCommand(['query', 'word']);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it('query word command with a word runs successfully', async () => {
    const { stdout, stderr } = await runCommand(['query', 'word', 'car', '--lexicon', 'test-query']);
    // Debug output for investigation
    console.log('DEBUG STDOUT:', stdout);
    expect(stderr).toBe('');
    expect(stdout).toContain('Querying "car" in test-query...');
    expect(stdout).toContain('Found 1 words:');
    // The definition should be correctly retrieved.
    expect(stdout).toContain('Definition: a road vehicle, typically with four wheels');
  });

  it('query explain command without a word shows an error', async () => {
    const { stdout, stderr } = await runCommand(['query', 'explain']);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it('query explain command with a word runs successfully', async () => {
    const { stdout, stderr } = await runCommand(['query', 'explain', 'car', '--lexicon', 'test-query']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Learning about "car" in test-query...');
    // The output format has changed, so we check for the new format.
    expect(stdout).toContain('Meaning 1: car, automobile (n)');
  });

  it('query synset command without a word shows an error', async () => {
    const { stdout, stderr } = await runCommand(['query', 'synset']);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it('query synset command with a word runs successfully', async () => {
    const { stdout, stderr } = await runCommand(['query', 'synset', 'car', '--lexicon', 'test-query']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Querying synsets for "car" in test-query...');
    expect(stdout).toContain('Found 1 synsets:');
    expect(stdout).toContain('ss_car');
  });

  it('query explore command with a word runs successfully like synset', async () => {
    const { stdout, stderr } = await runCommand(['query', 'explore', 'car', '--lexicon', 'test-query']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Querying synsets for "car" in test-query...');
    expect(stdout).toContain('Found 1 synsets:');
    expect(stdout).toContain('ss_car');
  });

  it('query word command with pos as argument runs successfully', async () => {
    const { stdout, stderr } = await runCommand(['query', 'word', 'happy', 'a', '--lexicon', 'test-query']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Querying "happy" in test-query...');
    expect(stdout).toContain('Found 1 words:');
  });

  it('query synonyms command without a word shows an error', async () => {
    const { stdout, stderr } = await runCommand(['query', 'synonyms']);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it('query synonyms command with a word runs successfully', async () => {
    const { stdout, stderr } = await runCommand(['query', 'synonyms', 'happy', 'a', '--lexicon', 'test-query']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Alternatives for "happy"');
    expect(stdout).toContain('glad');
    expect(stdout).toContain('Meaning: feeling or showing pleasure or contentment.');
  });

  it('query word shows CILI tip for synsets without definitions', async () => {
    // Setup test data with a synset that has no definition
    const nodefLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-nodef" label="No Def Lexicon" language="en" version="1.0">
    <LexicalEntry id="w_undef"><Lemma writtenForm="undef" partOfSpeech="n"/><Sense id="s_undef" synset="ss_undef"/></LexicalEntry>
    <Synset id="ss_undef" ili="i12345" partOfSpeech="n"></Synset>
  </Lexicon>
</LexicalResource>`;
    const testFile = join(config.dataDirectory, "nodef.xml");
    writeFileSync(testFile, nodefLexicon);
    await add(testFile);

    const { stdout, stderr } = await runCommand(['query', 'word', 'undef', '--lexicon', 'test-nodef']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Definition: No definition available in this lexicon.');
    expect(stdout).toContain("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0");
  });
});
