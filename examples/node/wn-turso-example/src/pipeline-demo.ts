/**
 * Pipeline Demo - Demonstrates wn-turso pipeline functionality
 *
 * Run with: pnpm pipeline
 */

import { Pipeline, arraySource, arraySink } from 'wn-turso/pipeline';

// Sample data simulating WordNet synsets
const sampleSynsets = [
  { id: 'syn1', pos: 'n', language: 'en', definition: 'A machine for computing' },
  { id: 'syn2', pos: 'v', language: 'en', definition: 'To calculate mathematically' },
  { id: 'syn3', pos: 'n', language: 'th', definition: 'เครื่องคอมพิวเตอร์' },
  { id: 'syn4', pos: 'n', language: 'en', definition: 'A device for processing data' },
  { id: 'syn5', pos: 'a', language: 'en', definition: 'Related to computation' },
];

async function demoBasicPipeline() {
  console.log('=== Demo 1: Basic Pipeline with Filter ===\n');

  const result = await Pipeline
    .from(arraySource(sampleSynsets, 'synsets'))
    .filter(row => row.language === 'en')
    .filter(row => row.pos === 'n')
    .toArray();

  console.log('Input: 5 synsets (mixed languages and POS)');
  console.log('Filter: language=en AND pos=n');
  console.log('Output:', result.length, 'synsets');
  console.log(result);
  console.log();
}

async function demoExtendForWorkingDB() {
  console.log('=== Demo 2: Extend (Working DB Pattern) ===\n');

  // This is the key pattern for "source of truth" -> "working DB"
  const result = await Pipeline
    .from(arraySource(sampleSynsets, 'synsets'))
    .filter(row => row.language === 'en')
    .extend(row => ({
      // Add working columns with default values
      cached_count: 0,
      last_accessed: null,
      custom_score: row.definition.length * 10,
      source_db: 'turso-main',
    }))
    .toArray();

  console.log('Extended English synsets with working columns:');
  console.log(result);
  console.log();
}

async function demoPipelineToSink() {
  console.log('=== Demo 3: Pipeline to Sink ===\n');

  const sink = arraySink();

  const pipelineResult = await Pipeline
    .from(arraySource(sampleSynsets, 'synsets'))
    .filter(row => row.pos === 'n')
    .extend(row => ({
      processed_at: new Date().toISOString(),
    }))
    .to(sink);

  console.log('Pipeline Result:');
  console.log('  Processed:', pipelineResult.processed);
  console.log('  Inserted:', pipelineResult.inserted);
  console.log('  Duration:', pipelineResult.duration, 'ms');
  console.log();
  console.log('Items in sink:', sink.items.length);
  console.log(sink.items);
  console.log();
}

async function demoChainedOperators() {
  console.log('=== Demo 4: Chained Operators ===\n');

  const result = await Pipeline
    .from(arraySource(sampleSynsets, 'synsets'))
    .filter(row => row.language === 'en')
    .map(row => ({ ...row, upper_def: row.definition.toUpperCase() }))
    .tap(row => console.log('  Processing:', row.id))
    .take(2)
    .toArray();

  console.log('\nTook first 2 English synsets with uppercase definitions:');
  console.log(result);
  console.log();
}

async function main() {
  console.log('wn-turso Pipeline Demo\n');
  console.log('='.repeat(50));
  console.log();

  await demoBasicPipeline();
  await demoExtendForWorkingDB();
  await demoPipelineToSink();
  await demoChainedOperators();

  console.log('='.repeat(50));
  console.log('Demo completed!');
}

main().catch(console.error);
