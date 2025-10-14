#!/usr/bin/env npx tsx
/**
 * CLI Tool for Automated Spec Generation
 * ======================================
 *
 * Usage:
 *   npx tsx scripts/generate-spec.ts \
 *     --project localbrain \
 *     --module "Voice Conversation" \
 *     --context README.md,CLAUDE.md \
 *     --output 02_SPECBASES/voice_conversation.md
 */

import { SpecGenerator, SpecGenerationOptions } from '../src/spec-generator/SpecGenerator';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options: Partial<SpecGenerationOptions> = {
    format: 'orchestra',
    validate: true
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    switch (key) {
      case 'project':
        options.project = value;
        break;
      case 'module':
        options.module_name = value;
        break;
      case 'context':
        options.context_files = value.split(',').map(f => f.trim());
        break;
      case 'output':
        options.output_path = value;
        break;
      case 'category':
        options.category = value as any;
        break;
      case 'lifecycle':
        options.lifecycle = value as any;
        break;
    }
  }

  // Validate required options
  if (!options.project || !options.module_name || !options.context_files || !options.output_path) {
    console.error(`
❌ Missing required arguments!

Usage:
  npx tsx scripts/generate-spec.ts \\
    --project <project-name> \\
    --module "<module-name>" \\
    --context <file1>,<file2>,... \\
    --output <output-path> \\
    [--category <category>] \\
    [--lifecycle <lifecycle>]

Example:
  npx tsx scripts/generate-spec.ts \\
    --project localbrain \\
    --module "Voice Conversation" \\
    --context README.md,CLAUDE.md \\
    --output 02_SPECBASES/voice_conversation.md \\
    --category primitive \\
    --lifecycle dev
`);
    process.exit(1);
  }

  // Generate spec
  console.log(`\n🚀 Central-MCP Automated Spec Generator\n`);
  console.log(`📦 Project: ${options.project}`);
  console.log(`🎯 Module: ${options.module_name}`);
  console.log(`📄 Context: ${options.context_files?.join(', ')}`);
  console.log(`📝 Output: ${options.output_path}\n`);

  try {
    const generator = new SpecGenerator();
    const result = await generator.generate(options as SpecGenerationOptions);

    console.log(`\n✅ SPEC GENERATION COMPLETE!\n`);
    console.log(`📍 File: ${result.path}`);
    console.log(`📊 Lines: ${result.metadata.lines}`);
    console.log(`🔧 Sections: ${result.metadata.sections}`);
    console.log(`📋 Frontmatter fields: ${result.metadata.frontmatter_fields}`);
    console.log(`✅ Validation score: ${result.validation.score}/100`);

    if (result.validation.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.validation.errors.length}`);
      result.validation.errors.forEach(e => console.log(`   - ${e}`));
    }

    if (result.validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${result.validation.warnings.length}`);
      result.validation.warnings.forEach(w => console.log(`   - ${w}`));
    }

    console.log(`\n🎊 Spec saved to: ${result.path}\n`);

  } catch (error) {
    console.error(`\n❌ SPEC GENERATION FAILED!\n`);
    console.error(error);
    process.exit(1);
  }
}

main();
