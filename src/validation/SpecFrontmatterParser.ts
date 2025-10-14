/**
 * SpecBase Frontmatter Parser - EXECUTABLE DEFINITION OF DONE
 * =============================================================
 *
 * GENIUS SYSTEM: Spec files contain YAML frontmatter that defines
 * objective, deterministic success criteria for the ENTIRE project lifecycle:
 *
 * 1. Spec Structure Validation - Is the spec complete?
 * 2. Implementation Validation - Does code match spec?
 * 3. Runtime Performance Validation - Does it meet performance targets?
 *
 * Example Spec Frontmatter:
 * ```yaml
 * ---
 * spec_id: SPEC_0010
 * title: Auto-Proactive Intelligence System
 * status: IN_PROGRESS
 * priority: P0-CRITICAL
 *
 * # DEFINITION OF DONE (Executable Contract)
 * validation:
 *   spec_structure:
 *     required_sections:
 *       - Overview
 *       - Technical Architecture
 *       - Implementation Tasks
 *       - Success Criteria
 *     min_words: 500
 *     max_words: 5000
 *
 *   implementation:
 *     required_files:
 *       - src/auto-proactive/EventBus.ts
 *       - src/auto-proactive/BaseLoop.ts
 *       - src/auto-proactive/ProgressMonitoringLoop.ts
 *     required_tests:
 *       - tests/auto-proactive/EventBus.test.ts
 *     min_coverage: 80
 *
 *   runtime_performance:
 *     metrics:
 *       - name: event_latency
 *         target: 50
 *         unit: ms
 *         operator: lt
 *       - name: events_per_minute
 *         target: 100
 *         unit: count
 *         operator: gte
 *     health_check:
 *       url: http://localhost:3000/health
 *       timeout: 5000
 *       expected_status: 200
 *
 *   browser_testing:
 *     enabled: true
 *     scenarios:
 *       - name: dashboard_load
 *         url: http://localhost:3000/dashboard
 *         max_load_time: 2000
 *         required_elements:
 *           - "#agent-status"
 *           - ".task-list"
 *       - name: task_claim_flow
 *         steps:
 *           - action: navigate
 *             url: http://localhost:3000/dashboard
 *           - action: click
 *             selector: ".task-item:first-child .claim-button"
 *           - action: waitFor
 *             selector: ".task-claimed-success"
 *             timeout: 3000
 * ---
 * ```
 */

import { readFileSync, existsSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import { logger } from '../utils/logger.js';

/**
 * Spec frontmatter structure (YAML)
 */
export interface SpecFrontmatter {
  spec_id: string;
  title: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'DEPRECATED';
  priority: 'P0-CRITICAL' | 'P1-HIGH' | 'P2-MEDIUM' | 'P3-LOW';
  author?: string;
  created_at?: string;
  updated_at?: string;

  // DEFINITION OF DONE - The executable contract!
  validation: ValidationCriteria;
}

/**
 * Complete validation criteria (3 layers)
 */
export interface ValidationCriteria {
  // Layer 1: Spec Structure Validation
  spec_structure?: SpecStructureValidation;

  // Layer 2: Implementation Validation
  implementation?: ImplementationValidation;

  // Layer 3: Runtime Performance Validation
  runtime_performance?: RuntimePerformanceValidation;

  // Layer 4: Browser Testing (Chrome MCP)
  browser_testing?: BrowserTestingValidation;
}

/**
 * Layer 1: Spec file structure requirements
 */
export interface SpecStructureValidation {
  required_sections: string[];      // Sections that MUST exist
  min_words?: number;                // Minimum word count
  max_words?: number;                // Maximum word count
  required_diagrams?: string[];      // Mermaid diagrams required
  required_links?: string[];         // External references required
}

/**
 * Layer 2: Implementation requirements
 */
export interface ImplementationValidation {
  required_files: string[];          // Files that MUST exist
  required_tests?: string[];         // Test files that MUST exist
  min_coverage?: number;             // Minimum test coverage %
  required_types?: string[];         // TypeScript types/interfaces required
  required_functions?: string[];     // Functions that must be implemented
  git_requirements?: {
    min_commits?: number;            // Minimum commit count
    conventional_commits?: boolean;  // Must use conventional commit format
  };
}

/**
 * Layer 3: Runtime performance requirements
 */
export interface RuntimePerformanceValidation {
  metrics: PerformanceMetric[];      // Performance targets
  health_check?: HealthCheckConfig;  // Health endpoint validation
  load_testing?: LoadTestConfig;     // Load testing requirements
}

/**
 * Performance metric definition
 */
export interface PerformanceMetric {
  name: string;                      // Metric name (e.g., 'event_latency')
  target: number;                    // Target value
  unit: string;                      // Unit (ms, count, percent, etc.)
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq'; // Comparison operator
  source?: string;                   // Where to get metric (log, api, etc.)
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  url: string;
  timeout: number;
  expected_status: number;
  required_fields?: string[];        // JSON fields that must exist
}

/**
 * Load testing configuration
 */
export interface LoadTestConfig {
  concurrent_users: number;
  duration_seconds: number;
  max_response_time: number;
  min_success_rate: number;
}

/**
 * Layer 4: Browser testing (Chrome MCP)
 */
export interface BrowserTestingValidation {
  enabled: boolean;
  scenarios: BrowserTestScenario[];
}

/**
 * Browser test scenario
 */
export interface BrowserTestScenario {
  name: string;
  url?: string;
  max_load_time?: number;
  required_elements?: string[];      // CSS selectors that must exist
  steps?: BrowserTestStep[];         // Multi-step user flows
}

/**
 * Browser test step
 */
export interface BrowserTestStep {
  action: 'navigate' | 'click' | 'type' | 'waitFor' | 'screenshot' | 'evaluate';
  url?: string;                      // For navigate
  selector?: string;                 // For click, type, waitFor
  text?: string;                     // For type
  timeout?: number;                  // For waitFor
  script?: string;                   // For evaluate
}

/**
 * Validation result (per layer)
 */
export interface ValidationLayerResult {
  layer: 'spec_structure' | 'implementation' | 'runtime_performance' | 'browser_testing';
  passed: boolean;
  score: number;                     // 0-100
  checks: ValidationCheck[];
  duration?: number;                 // Validation duration (ms)
}

/**
 * Individual validation check result
 */
export interface ValidationCheck {
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  message?: string;
}

/**
 * Complete validation result (all layers)
 */
export interface CompleteValidationResult {
  spec_id: string;
  title: string;
  timestamp: Date;
  passed: boolean;                   // All layers passed
  overall_score: number;             // Weighted average (0-100)
  layers: ValidationLayerResult[];
  total_duration: number;            // Total validation time (ms)

  // Lifecycle status
  lifecycle_stage: 'spec_complete' | 'implementation_complete' | 'production_ready';
}

/**
 * SpecBase Frontmatter Parser
 */
export class SpecFrontmatterParser {
  /**
   * Parse spec file and extract frontmatter
   */
  parseSpecFile(filePath: string): SpecFrontmatter | null {
    try {
      if (!existsSync(filePath)) {
        logger.error(`❌ Spec file not found: ${filePath}`);
        return null;
      }

      const content = readFileSync(filePath, 'utf-8');

      // Extract YAML frontmatter (between --- delimiters)
      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

      if (!frontmatterMatch) {
        logger.warn(`⚠️  No frontmatter found in ${filePath}`);
        return null;
      }

      const yamlContent = frontmatterMatch[1];
      const frontmatter = parseYAML(yamlContent) as SpecFrontmatter;

      logger.info(`✅ Parsed frontmatter: ${frontmatter.spec_id} - ${frontmatter.title}`);

      return frontmatter;

    } catch (err: any) {
      logger.error(`❌ Failed to parse spec file: ${err.message}`);
      return null;
    }
  }

  /**
   * Parse all spec files in directory
   */
  parseSpecDirectory(dirPath: string): Map<string, SpecFrontmatter> {
    const specs = new Map<string, SpecFrontmatter>();

    // TODO: Walk directory and parse all .md files
    // For now, return empty map

    return specs;
  }

  /**
   * Validate frontmatter structure
   */
  validateFrontmatter(frontmatter: SpecFrontmatter): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check required fields
    if (!frontmatter.spec_id) {
      checks.push({
        name: 'spec_id_required',
        passed: false,
        message: 'spec_id field is required'
      });
    } else {
      checks.push({
        name: 'spec_id_required',
        passed: true
      });
    }

    if (!frontmatter.title) {
      checks.push({
        name: 'title_required',
        passed: false,
        message: 'title field is required'
      });
    } else {
      checks.push({
        name: 'title_required',
        passed: true
      });
    }

    if (!frontmatter.status) {
      checks.push({
        name: 'status_required',
        passed: false,
        message: 'status field is required'
      });
    } else {
      checks.push({
        name: 'status_required',
        passed: true
      });
    }

    // Check validation criteria exists
    if (!frontmatter.validation) {
      checks.push({
        name: 'validation_criteria_required',
        passed: false,
        message: 'validation criteria required (definition of done)'
      });
    } else {
      checks.push({
        name: 'validation_criteria_required',
        passed: true
      });

      // Check at least one validation layer is defined
      const hasLayers =
        frontmatter.validation.spec_structure !== undefined ||
        frontmatter.validation.implementation !== undefined ||
        frontmatter.validation.runtime_performance !== undefined ||
        frontmatter.validation.browser_testing !== undefined;

      checks.push({
        name: 'at_least_one_validation_layer',
        passed: hasLayers,
        message: hasLayers ? undefined : 'At least one validation layer required'
      });
    }

    return checks;
  }

  /**
   * Get validation criteria from spec
   */
  getValidationCriteria(specId: string, specPath: string): ValidationCriteria | null {
    const frontmatter = this.parseSpecFile(specPath);
    if (!frontmatter) return null;

    return frontmatter.validation;
  }

  /**
   * Check if spec has complete validation criteria
   */
  hasCompleteValidation(frontmatter: SpecFrontmatter): boolean {
    if (!frontmatter.validation) return false;

    // All 4 layers should be defined for complete validation
    return !!(
      frontmatter.validation.spec_structure &&
      frontmatter.validation.implementation &&
      frontmatter.validation.runtime_performance &&
      frontmatter.validation.browser_testing
    );
  }

  /**
   * Get lifecycle stage based on validation status
   */
  determineLifecycleStage(result: CompleteValidationResult): string {
    // Check which layers passed
    const layers = result.layers;
    const specPassed = layers.find(l => l.layer === 'spec_structure')?.passed;
    const implPassed = layers.find(l => l.layer === 'implementation')?.passed;
    const runtimePassed = layers.find(l => l.layer === 'runtime_performance')?.passed;
    const browserPassed = layers.find(l => l.layer === 'browser_testing')?.passed;

    if (specPassed && !implPassed) {
      return 'spec_complete';
    }

    if (specPassed && implPassed && !runtimePassed) {
      return 'implementation_complete';
    }

    if (specPassed && implPassed && runtimePassed && browserPassed) {
      return 'production_ready';
    }

    return 'incomplete';
  }

  /**
   * Generate validation report
   */
  generateValidationReport(result: CompleteValidationResult): string {
    const lines: string[] = [];

    lines.push(`# Validation Report: ${result.spec_id}`);
    lines.push(`**Title:** ${result.title}`);
    lines.push(`**Timestamp:** ${result.timestamp.toISOString()}`);
    lines.push(`**Overall Score:** ${result.overall_score}/100`);
    lines.push(`**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`**Lifecycle Stage:** ${result.lifecycle_stage}`);
    lines.push('');

    // Layer-by-layer results
    for (const layer of result.layers) {
      lines.push(`## ${layer.layer.toUpperCase()}`);
      lines.push(`**Score:** ${layer.score}/100`);
      lines.push(`**Status:** ${layer.passed ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push('');

      // Individual checks
      for (const check of layer.checks) {
        const icon = check.passed ? '✅' : '❌';
        lines.push(`${icon} **${check.name}**`);

        if (check.expected !== undefined) {
          lines.push(`   Expected: ${check.expected}`);
        }

        if (check.actual !== undefined) {
          lines.push(`   Actual: ${check.actual}`);
        }

        if (check.message) {
          lines.push(`   ${check.message}`);
        }

        lines.push('');
      }
    }

    lines.push(`---`);
    lines.push(`**Total Duration:** ${result.total_duration}ms`);

    return lines.join('\n');
  }
}
