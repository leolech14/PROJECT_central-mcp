#!/usr/bin/env npx tsx

/**
 * Spec Normalization CLI
 *
 * Converts specs from various formats to Orchestra Universal Standard
 * using hybrid LLM + deterministic approach.
 *
 * Usage:
 *   npx tsx scripts/normalize-specs.ts --input path/to/spec.md --output path/to/normalized.md
 *   npx tsx scripts/normalize-specs.ts --batch path/to/specs/ --output-dir path/to/normalized/
 */

import { SpecNormalizer } from '../src/spec-generator/SpecNormalizer.js';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface CliArgs {
  input?: string;
  output?: string;
  batch?: string;
  outputDir?: string;
  apiKey?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Validate args
  if (!args.input && !args.batch) {
    console.error('❌ Error: Must provide either --input or --batch');
    printUsage();
    process.exit(1);
  }

  // Get API key from environment or args
  const apiKey = args.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in environment');
    console.error('   Set it with: export ANTHROPIC_API_KEY=your-key');
    process.exit(1);
  }

  const normalizer = new SpecNormalizer(apiKey);

  if (args.input && args.output) {
    // Single file mode
    await normalizeSingleFile(normalizer, args.input, args.output);
  } else if (args.batch && args.outputDir) {
    // Batch mode
    await normalizeBatch(normalizer, args.batch, args.outputDir);
  } else {
    console.error('❌ Error: Invalid argument combination');
    printUsage();
    process.exit(1);
  }
}

async function normalizeSingleFile(normalizer: SpecNormalizer, inputPath: string, outputPath: string) {
  console.log('🎯 Single file normalization');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);

  try {
    await normalizer.normalizeSpec(inputPath, outputPath);
    console.log('\n✅ Normalization complete!');
  } catch (error) {
    console.error('\n❌ Normalization failed:', error);
    process.exit(1);
  }
}

async function normalizeBatch(normalizer: SpecNormalizer, batchDir: string, outputDir: string) {
  console.log('🎯 Batch normalization');
  console.log(`   Input directory: ${batchDir}`);
  console.log(`   Output directory: ${outputDir}`);

  // Find all markdown files
  const specFiles = findMarkdownFiles(batchDir);
  console.log(`\n📁 Found ${specFiles.length} spec files`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < specFiles.length; i++) {
    const inputPath = specFiles[i];
    const relativePath = inputPath.replace(batchDir, '');
    const outputPath = join(outputDir, relativePath);

    console.log(`\n[${i + 1}/${specFiles.length}] ${relativePath}`);

    try {
      await normalizer.normalizeSpec(inputPath, outputPath);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${error}`);
      failCount++;
    }
  }

  console.log('\n📊 Batch normalization complete');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry !== 'node_modules' && !entry.startsWith('.')) {
          walk(fullPath);
        }
      } else if (stat.isFile() && extname(entry) === '.md') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--input':
      case '-i':
        args.input = argv[++i];
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--batch':
      case '-b':
        args.batch = argv[++i];
        break;
      case '--output-dir':
      case '-d':
        args.outputDir = argv[++i];
        break;
      case '--api-key':
      case '-k':
        args.apiKey = argv[++i];
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`❌ Unknown argument: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return args;
}

function printUsage() {
  console.log(`
Spec Normalization CLI - Convert specs to Orchestra Universal Standard

USAGE:
  Single file:
    npx tsx scripts/normalize-specs.ts --input <file> --output <file>

  Batch processing:
    npx tsx scripts/normalize-specs.ts --batch <dir> --output-dir <dir>

OPTIONS:
  -i, --input <file>        Input spec file to normalize
  -o, --output <file>       Output path for normalized spec
  -b, --batch <dir>         Batch process all .md files in directory
  -d, --output-dir <dir>    Output directory for batch processing
  -k, --api-key <key>       Anthropic API key (or use ANTHROPIC_API_KEY env var)
  -h, --help                Show this help message

EXAMPLES:
  # Normalize single LocalBrain spec
  npx tsx scripts/normalize-specs.ts \\
    --input /path/to/LB-AI-COMPONENT-GENERATOR-020.spec.md \\
    --output /path/to/normalized/LB-AI-COMPONENT-GENERATOR-020.md

  # Normalize single Central-MCP spec
  npx tsx scripts/normalize-specs.ts \\
    --input /path/to/0100_CENTRAL_MCP_FOUNDATION.md \\
    --output /path/to/normalized/0100_CENTRAL_MCP_FOUNDATION.md

  # Batch normalize all LocalBrain specs
  npx tsx scripts/normalize-specs.ts \\
    --batch /path/to/LocalBrain/02_SPECBASES/ \\
    --output-dir /path/to/normalized/LocalBrain/

  # Batch normalize all Central-MCP specs
  npx tsx scripts/normalize-specs.ts \\
    --batch /path/to/central-mcp/02_SPECBASES/ \\
    --output-dir /path/to/normalized/central-mcp/

ENVIRONMENT:
  ANTHROPIC_API_KEY        Required for LLM-powered conversion
`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
