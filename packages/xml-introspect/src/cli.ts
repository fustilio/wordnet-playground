#!/usr/bin/env node

import { XMLIntrospector } from './XMLIntrospector.js';
import { XMLFakerGenerator, XMLFakerOptions } from './XMLFakerGenerator.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  input?: string;
  output?: string;
  command: string;
  maxElements?: number;
  maxDepth?: number;
  seed?: number;
  realistic?: boolean;
  targetSize?: number;
  namespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
  help?: boolean;
}

function printHelp() {
  console.log(`
XML Introspector CLI Tool

Usage: xml-introspect <command> [options]

Commands:
  sample <input> [options]     Generate a sample XML from input file
  schema <input> [options]     Generate XSD schema from XML file
  generate <xsd> [options]     Generate XML from XSD schema
  roundtrip <input> [options]  XML -> XAST -> XML roundtrip
  expand <input> [options]     Expand small XML to larger XML
  realistic <input> [options]  Generate realistic XML using Faker
  validate <xml> <xsd>         Validate XML against XSD schema

Options:
  -i, --input <file>           Input XML/XSD file path
  -o, --output <file>          Output file path
  -m, --max-elements <number>  Maximum number of elements (default: 100)
  -d, --max-depth <number>     Maximum nesting depth (default: 5)
  -s, --seed <number>          Random seed for consistent generation
  -r, --realistic              Use Faker for realistic data generation
  -t, --target-size <number>   Target size for expansion (default: 1000)
  -n, --namespace <url>        Target namespace for XSD generation
  --element-form <type>        Element form default (qualified/unqualified)
  --attribute-form <type>      Attribute form default (qualified/unqualified)
  -h, --help                   Show this help message

Examples:
  xml-introspect sample input.xml -o sample.xml -m 50
  xml-introspect schema input.xml -o schema.xsd -n "http://example.com"
  xml-introspect generate schema.xsd -o output.xml -r -s 12345
  xml-introspect realistic input.xml -o realistic.xml -s 42
  xml-introspect expand small.xml -o large.xml -t 5000
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = { command: '' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case 'sample':
      case 'schema':
      case 'generate':
      case 'roundtrip':
      case 'expand':
      case 'realistic':
      case 'validate':
        options.command = arg;
        // Handle positional arguments: first is input, second is output
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.input = args[i + 1];
          i++; // Skip the input argument
          
          // Check if there's a second positional argument for output
          if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            options.output = args[i + 1];
            i++; // Skip the output argument
          }
        }
        break;
        
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
        
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
        
      case '-m':
      case '--max-elements':
        options.maxElements = parseInt(args[++i]);
        break;
        
      case '-d':
      case '--max-depth':
        options.maxDepth = parseInt(args[++i]);
        break;
        
      case '-s':
      case '--seed':
        options.seed = parseInt(args[++i]);
        break;
        
      case '-r':
      case '--realistic':
        options.realistic = true;
        break;
        
      case '-t':
      case '--target-size':
        options.targetSize = parseInt(args[++i]);
        break;
        
      case '-n':
      case '--namespace':
        options.namespace = args[++i];
        break;
        
      case '--element-form':
        options.elementForm = args[++i] as 'qualified' | 'unqualified';
        break;
        
      case '--attribute-form':
        options.attributeForm = args[++i] as 'qualified' | 'unqualified';
        break;
        
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

async function runCommand(options: CLIOptions) {
  try {
    console.log(`🚀 Starting XML Introspector CLI...`);
    console.log(`📁 Input file: ${options.input}`);
    console.log(`📄 Output file: ${options.output || 'stdout'}`);
    console.log(`🔧 Command: ${options.command}`);
    console.log('');

    const introspector = new XMLIntrospector();
    
    switch (options.command) {
      case 'schema':
        console.log('🔄 Generating XSD schema from XML...');
        console.log('⏳ This may take a while for large files...');
        
        const startTime = Date.now();
        const xsd = await introspector.generateXSDFromXML(options.input!, {
          targetNamespace: options.namespace,
          elementForm: options.elementForm as 'qualified' | 'unqualified',
          attributeForm: options.attributeForm as 'qualified' | 'unqualified'
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`✅ XSD generation completed in ${duration.toFixed(2)} seconds`);
        console.log(`📊 Generated XSD size: ${(xsd.length / 1024).toFixed(2)} KB`);
        
        if (options.output) {
          writeFileSync(options.output, xsd);
          console.log(`💾 XSD saved to: ${options.output}`);
        } else {
          console.log('\n📋 Generated XSD:');
          console.log('─'.repeat(50));
          console.log(xsd);
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'sample':
        if (!options.input) {
          throw new Error('Input file is required for sample command');
        }
        
        const sample = await introspector.generateSample(options.input, {
          maxElements: options.maxElements || 100,
          maxDepth: options.maxDepth || 5
        });
        
        if (options.output) {
          writeFileSync(options.output, sample, 'utf8');
          console.log(`✅ Sample XML written to ${options.output}`);
        } else {
          console.log(sample);
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'generate':
        if (!options.input) {
          throw new Error('Input XSD file is required for generate command');
        }
        
        let xml: string;
        if (options.realistic) {
          xml = await introspector.generateXMLFromXSDWithFaker(options.input, {
            seed: options.seed,
            maxDepth: options.maxDepth || 5,
            maxChildren: options.maxElements || 100,
            realisticData: true
          });
        } else {
          xml = await introspector.generateXMLFromXSD(options.input, {
            maxElements: options.maxElements || 100,
            generateRealisticData: false
          });
        }
        
        if (options.output) {
          writeFileSync(options.output, xml, 'utf8');
          console.log(`✅ Generated XML written to ${options.output}`);
        } else {
          console.log(xml);
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'roundtrip':
        if (!options.input) {
          throw new Error('Input file is required for roundtrip command');
        }
        
        let result: string;
        if (options.realistic) {
          result = await introspector.xmlToXASTToXMLEnhanced(options.input);
        } else {
          result = await introspector.xmlToXASTToXML(options.input);
        }
        
        if (options.output) {
          writeFileSync(options.output, result, 'utf8');
          console.log(`✅ Roundtrip XML written to ${options.output}`);
        } else {
          console.log(result);
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'expand':
        if (!options.input) {
          throw new Error('Input file is required for expand command');
        }
        
        if (!options.output) {
          throw new Error('Output file is required for expand command');
        }
        
        if (options.realistic) {
          const realisticXML = await introspector.generateRealisticExpandedXML(
            options.input, 
            options.targetSize || 1000,
            {
              seed: options.seed,
              maxDepth: options.maxDepth || 5,
              realisticData: true
            }
          );
          writeFileSync(options.output, realisticXML);
        } else {
          await introspector.transformSmallToBig(
            options.input, 
            options.output, 
            options.targetSize || 1000
          );
        }
        
        console.log(`✅ Expanded XML written to ${options.output}`);
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'realistic':
        if (!options.input) {
          throw new Error('Input file is required for realistic command');
        }
        
        const realisticXML = await introspector.generateRealisticSample(options.input, {
          seed: options.seed,
          maxDepth: options.maxDepth || 5,
          maxChildren: options.maxElements || 100,
          realisticData: true
        });
        
        if (options.output) {
          writeFileSync(options.output, realisticXML, 'utf8');
          console.log(`✅ Realistic XML written to ${options.output}`);
        } else {
          console.log(realisticXML);
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'validate':
        if (!options.input || !options.output) {
          throw new Error('Both XML and XSD files are required for validate command');
        }
        
        const validation = await introspector.validateXML(options.input, options.output);
        
        if (validation.valid) {
          console.log('✅ XML is valid according to the XSD schema');
        } else {
          console.log('❌ XML validation failed:');
          validation.errors.forEach(error => {
            console.log(`  - ${error.message}`);
          });
        }
        console.log('\n✅ Command completed successfully');
        process.exit(0);
        break;
        
      default:
        throw new Error(`Unknown command: ${options.command}`);
    }
  } catch (error) {
    console.error(`❌ An unexpected error occurred in the CLI:`);
    console.error(error); // Log the full error object
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (!options.command) {
    console.error('❌ No command specified');
    printHelp();
    process.exit(1);
  }

  await runCommand(options);
  // Ensure clean exit after successful execution
  process.exit(0);
}

// This check ensures that the main function is only called when the script is executed directly
const scriptPath = process.argv[1];
if (scriptPath && (scriptPath.endsWith('cli.js') || scriptPath.endsWith('cli.ts'))) {
  main();
}

export { runCommand, parseArgs, printHelp };
