/**
 * Spec Normalizer - Hybrid LLM + Deterministic Approach
 *
 * Deterministic: Format detection, section extraction, output generation
 * LLM-Powered: Intelligent content conversion and semantic mapping
 *
 * Supported input formats:
 * - Simple markdown specs (LocalBrain features)
 * - Custom frontmatter specs (Central-MCP)
 * - Orchestra format specs (validation only)
 * - Legacy specs without frontmatter
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename } from 'path';
import matter from 'gray-matter';
import { LLMSpecConverter, RawSpecContent, OrchestraConversion } from './LLMSpecConverter.js';

export interface NormalizedSpec {
  frontmatter: Record<string, any>;
  sections: {
    purpose: string;
    features: string;
    architecture: string;
    contracts: string;
    subcomponents: string;
    state_progression: string;
    production_implementation: string;
    security: string;
    testing: string;
    success_criteria: string;
    agent_integration: string;
    integrations: string;
  };
}

export class SpecNormalizer {
  private llmConverter: LLMSpecConverter;

  constructor(apiKey?: string) {
    this.llmConverter = new LLMSpecConverter(apiKey);
  }

  /**
   * Normalize a spec file to Orchestra format
   */
  async normalizeSpec(inputPath: string, outputPath: string): Promise<void> {
    console.log(`\n📖 Reading spec: ${inputPath}`);

    const content = readFileSync(inputPath, 'utf-8');
    const parsed = matter(content);

    // Detect format (deterministic)
    const rawSpec = this.detectAndExtract(inputPath, parsed);

    console.log(`  Format detected: ${rawSpec.format}`);
    console.log(`  Title: ${rawSpec.title}`);
    console.log(`  Sections extracted: ${Object.keys(rawSpec.extractedSections).length}`);

    // Convert using LLM reasoning
    const conversion = await this.llmConverter.convertToOrchestra(rawSpec);

    console.log(`\n✨ LLM conversion complete`);
    console.log(`  Reasoning: ${conversion.reasoning.substring(0, 100)}...`);

    // Validate conversion (deterministic)
    const validation = this.llmConverter.validateConversion(conversion);
    if (!validation.valid) {
      console.warn(`\n⚠️  Validation warnings:`);
      validation.errors.forEach(err => console.warn(`  - ${err}`));
    }

    // Generate Orchestra format markdown (deterministic)
    const orchestraMarkdown = this.generateOrchestraMarkdown({
      frontmatter: conversion.frontmatter,
      sections: conversion.sections
    });

    // Write output
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, orchestraMarkdown, 'utf-8');

    console.log(`\n✅ Normalized spec written: ${outputPath}`);
    console.log(`  Size: ${orchestraMarkdown.length} chars`);
  }

  /**
   * DETERMINISTIC: Detect input format and extract raw content
   */
  private detectAndExtract(filePath: string, parsed: matter.GrayMatterFile<string>): RawSpecContent {
    const filename = basename(filePath);
    const content = parsed.content;
    const data = parsed.data;

    // Detect format by checking frontmatter and structure
    let format: 'central-mcp' | 'localbrain-simple' | 'orchestra' | 'legacy';
    let extractedSections: Record<string, string> = {};

    if (data.spec_id || data.status || filename.includes('0100_') || filename.includes('0200_')) {
      // Central-MCP format (custom frontmatter)
      format = 'central-mcp';
      extractedSections = this.extractSections(content, [
        'Purpose & Overview',
        'CENTRAL-MCP FOUNDATION OVERVIEW',
        'CORE ARCHITECTURE COMPONENTS',
        'Functional Requirements',
        'Performance Requirements',
        'Quality Requirements',
        'Technical Requirements',
        'Security & Compliance',
        'SECURITY AND COMPLIANCE',
        'Testing Strategy',
        'Dependencies',
        'Integration Points',
        'INTEGRATION APIS',
        'Success Criteria',
        'VALIDATION CRITERIA',
        'PERFORMANCE AND SCALABILITY REQUIREMENTS'
      ]);
    } else if (filename.includes('LB-') || filename.includes('T0') || filename.includes('.spec.md')) {
      // LocalBrain simple format
      format = 'localbrain-simple';
      extractedSections = this.extractSections(content, [
        'Feature Overview',
        'Requirements',
        'Functional Requirements',
        'Technical Requirements',
        'Dependencies',
        'Integration Points',
        'Testing Requirements',
        'Documentation Updates Required'
      ]);
    } else if (data.title && data.module_id && data.type && data.state) {
      // Already Orchestra format
      format = 'orchestra';
      extractedSections = this.extractOrchestraSections(content);
    } else {
      // Legacy format without frontmatter
      format = 'legacy';
      extractedSections = this.extractSections(content, [
        'Overview',
        'Description',
        'Requirements',
        'Implementation',
        'Testing'
      ]);
    }

    // Extract title
    const title = data.title || this.extractTitle(content) || filename.replace(/\.spec\.md$/, '').replace(/\.md$/, '');

    return {
      format,
      title,
      extractedSections,
      rawContent: content,
      metadata: data
    };
  }

  /**
   * DETERMINISTIC: Extract sections from markdown content
   */
  private extractSections(content: string, sectionNames: string[]): Record<string, string> {
    const sections: Record<string, string> = {};

    for (const sectionName of sectionNames) {
      // Try multiple heading levels and formats
      const patterns = [
        new RegExp(`##\\s+(?:\\d+\\.\\s*)?${this.escapeRegex(sectionName)}\\s*([\\s\\S]*?)(?=##|$)`, 'i'),
        new RegExp(`###\\s+(?:\\d+\\.\\s*)?${this.escapeRegex(sectionName)}\\s*([\\s\\S]*?)(?=###|##|$)`, 'i'),
        new RegExp(`##\\s+[🎯🏗️🔄📊🔒🚀📋]\\s*\\*\\*${this.escapeRegex(sectionName)}\\*\\*([\\s\\S]*?)(?=##|$)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          sections[sectionName] = match[1].trim();
          break;
        }
      }
    }

    return sections;
  }

  /**
   * DETERMINISTIC: Extract Orchestra format sections
   */
  private extractOrchestraSections(content: string): Record<string, string> {
    return this.extractSections(content, [
      'Purpose',
      'Primary Features',
      'Architecture',
      'Contracts',
      'Sub-Components & Behavior',
      'State Progression & Promotion Gates',
      'Production Implementation',
      'Security & Compliance',
      'Testing Strategy',
      'Success Criteria, Performance & Observability',
      'Agent Integration',
      'Integrations & References'
    ]);
  }

  /**
   * DETERMINISTIC: Extract title from content
   */
  private extractTitle(content: string): string | null {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  /**
   * Helper: Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * DETERMINISTIC: Generate Orchestra format markdown
   */
  private generateOrchestraMarkdown(spec: NormalizedSpec): string {
    const { frontmatter, sections } = spec;

    // Generate YAML frontmatter
    const yaml = `---
## ===== MODULE IDENTITY =====
title: "${frontmatter.title}"
module_id: "${frontmatter.module_id}"
type: "${frontmatter.type}"
category: "${frontmatter.category}"

## ===== SYSTEMATIC SCAFFOLDING =====
lifecycle: "${frontmatter.lifecycle}"
state: "${frontmatter.state}"
seat: "${frontmatter.seat}"

## ===== AVAILABILITY AND ACCESS =====
phase_availability: "${frontmatter.phase_availability}"
priority: "${frontmatter.priority}"

## ===== TECHNICAL METADATA =====
dependencies: ${JSON.stringify(frontmatter.dependencies || [])}
integrations: ${JSON.stringify(frontmatter.integrations || [])}
last_updated: "${frontmatter.last_updated}"
version: "${frontmatter.version}"
maintainer: "${frontmatter.maintainer}"
${frontmatter.swift_actor ? `swift_actor: "${frontmatter.swift_actor}"` : ''}
${frontmatter.swift_file ? `swift_file: "${frontmatter.swift_file}"` : ''}
${frontmatter.spec_probe_events ? `spec_probe_events: ${JSON.stringify(frontmatter.spec_probe_events)}` : ''}
---`;

    return `${yaml}

# ${frontmatter.title}

## Purpose

${sections.purpose}

---

## Primary Features

${sections.features}

---

## Architecture

${sections.architecture}

---

## Contracts

${sections.contracts}

---

## Sub-Components & Behavior

${sections.subcomponents}

---

## State Progression & Promotion Gates

${sections.state_progression}

---

## Production Implementation

${sections.production_implementation}

---

## Security & Compliance

${sections.security}

---

## Testing Strategy

${sections.testing}

---

## Success Criteria, Performance & Observability

${sections.success_criteria}

---

## Agent Integration

${sections.agent_integration}

---

## Integrations & References

${sections.integrations}

---

**This spec follows the Orchestra Universal Specification Standard.**
`;
  }
}
