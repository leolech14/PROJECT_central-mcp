/**
 * Reverse Spec Generator - Code Archaeology
 * ==========================================
 *
 * Analyzes existing code and generates specification files automatically.
 * Enables bidirectional flow: Spec→Code AND Code→Spec!
 *
 * Use Cases:
 * - Rapid feature built first → Generate spec after (institutional memory)
 * - Legacy code → Generate specs automatically (documentation)
 * - Code changes → Update specs automatically (living docs)
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface GeneratedSpec {
  id: string;
  title: string;
  type: string;
  layer: string;
  purpose: string;

  requirements: {
    functional: Array<{
      id: string;
      description: string;
      implemented: boolean;
      implementedIn: string;
    }>;
    performance: Array<{
      metric: string;
      current: number;
      unit: string;
    }>;
    quality: Array<{
      standard: string;
      current: number;
    }>;
  };

  testing: {
    unit_tests: Array<{
      file: string;
      test_count: number;
    }>;
  };

  implementation: {
    files_actual: string[];
    loc: number;
    complexity: string;
  };

  metadata: {
    auto_generated: true;
    generated_from: string;
    generated_at: string;
  };
}

export class ReverseSpecGenerator {
  constructor(private db: Database.Database) {}

  /**
   * Main entry point - generate spec from code file
   */
  async generateSpecFromCode(filePath: string): Promise<GeneratedSpec> {
    console.log(`🔍 Reverse engineering spec from: ${filePath}`);

    const code = readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.ts');

    // 1. Extract exports and features
    const exports = this.extractExports(code);
    console.log(`   Found ${exports.length} exported features`);

    // 2. Find related tests
    const testFile = this.findTestFile(filePath);
    const testCount = testFile ? this.countTests(testFile) : 0;
    console.log(`   Found ${testCount} tests`);

    // 3. Calculate metrics
    const loc = code.split('\n').length;
    const complexity = this.estimateComplexity(code);
    console.log(`   ${loc} LOC, ${complexity} complexity`);

    // 4. Extract JSDoc if exists
    const jsdoc = this.extractJSDoc(code);

    // 5. Generate spec ID
    const specId = `LB-AUTO-${fileName.toUpperCase().replace(/-/g, '_')}`;

    // 6. Compile into official spec format
    const spec: GeneratedSpec = {
      id: specId,
      title: jsdoc?.title || this.generateTitle(fileName, exports),
      type: this.inferType(fileName, exports),
      layer: this.inferLayer(filePath),

      purpose: jsdoc?.description || this.generatePurpose(exports),

      requirements: {
        functional: exports.map((exp, i) => ({
          id: `${specId}-REQ-${String(i + 1).padStart(3, '0')}`,
          description: exp.description || `Implements ${exp.name}`,
          implemented: true,
          implementedIn: `${filePath}:${exp.line || 0}`
        })),

        performance: [
          {
            metric: 'EXECUTION_TIME',
            current: 5, // Placeholder - would need actual profiling
            unit: 'MS'
          }
        ],

        quality: [
          {
            standard: 'TEST_COVERAGE',
            current: testCount > 0 ? 70 : 0 // Estimate
          },
          {
            standard: 'CODE_QUALITY',
            current: complexity === 'SIMPLE' ? 90 : complexity === 'MEDIUM' ? 70 : 50
          }
        ]
      },

      testing: {
        unit_tests: testFile ? [{
          file: testFile,
          test_count: testCount
        }] : []
      },

      implementation: {
        files_actual: [filePath],
        loc,
        complexity
      },

      metadata: {
        auto_generated: true,
        generated_from: filePath,
        generated_at: new Date().toISOString()
      }
    };

    console.log(`✅ Generated spec: ${spec.id}`);

    return spec;
  }

  /**
   * Extract exported items from code
   */
  private extractExports(code: string): Array<{ name: string; type: string; description?: string; line?: number }> {
    const exports: Array<{ name: string; type: string; description?: string; line?: number }> = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // export class ClassName
      if (line.match(/export (class|interface|type) (\w+)/)) {
        const match = line.match(/export (class|interface|type) (\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: match[1].toUpperCase(),
            line: i + 1
          });
        }
      }

      // export function functionName
      if (line.match(/export (async )?function (\w+)/)) {
        const match = line.match(/export (async )?function (\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: 'FUNCTION',
            line: i + 1
          });
        }
      }

      // export const name
      if (line.match(/export const (\w+)/)) {
        const match = line.match(/export const (\w+)/);
        if (match) {
          exports.push({
            name: match[1],
            type: 'CONSTANT',
            line: i + 1
          });
        }
      }
    }

    return exports;
  }

  /**
   * Find related test file
   */
  private findTestFile(filePath: string): string | null {
    const patterns = [
      filePath.replace('.ts', '.test.ts'),
      filePath.replace('.ts', '.spec.ts'),
      filePath.replace('/src/', '/tests/').replace('.ts', '.test.ts')
    ];

    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Count tests in test file
   */
  private countTests(testFile: string): number {
    const content = readFileSync(testFile, 'utf-8');
    const itMatches = content.match(/\bit\(/g);
    const testMatches = content.match(/\btest\(/g);

    return (itMatches?.length || 0) + (testMatches?.length || 0);
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(code: string): 'SIMPLE' | 'MEDIUM' | 'COMPLEX' {
    const loc = code.split('\n').length;

    if (loc < 200) return 'SIMPLE';
    if (loc < 500) return 'MEDIUM';
    return 'COMPLEX';
  }

  /**
   * Extract JSDoc if exists
   */
  private extractJSDoc(code: string): { title?: string; description?: string } | null {
    const jsdocMatch = code.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n\s*\*\s*(.+?)\n/);

    if (jsdocMatch) {
      return {
        title: jsdocMatch[1].trim(),
        description: jsdocMatch[2].trim()
      };
    }

    return null;
  }

  /**
   * Generate title from filename
   */
  private generateTitle(fileName: string, exports: any[]): string {
    // Convert CamelCase or kebab-case to Title Case
    const title = fileName
      .replace(/([A-Z])/g, ' $1')
      .replace(/-/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (exports.length > 0 && exports[0].type === 'CLASS') {
      return exports[0].name;
    }

    return title;
  }

  /**
   * Generate purpose from exports
   */
  private generatePurpose(exports: any[]): string {
    if (exports.length === 0) {
      return 'Component purpose not documented';
    }

    if (exports.length === 1) {
      return `Implements ${exports[0].name} ${exports[0].type.toLowerCase()}`;
    }

    return `Provides ${exports.map(e => e.name).join(', ')} functionality`;
  }

  /**
   * Infer type from filename/location
   */
  private inferType(fileName: string, exports: any[]): string {
    if (fileName.includes('Engine') || fileName.includes('Manager')) return 'SYSTEM';
    if (fileName.includes('Component') || fileName.includes('Widget')) return 'COMPONENT';
    if (fileName.includes('Tool') || fileName.includes('Util')) return 'UTILITY';
    if (exports.some(e => e.type === 'CLASS')) return 'CLASS';

    return 'COMPONENT';
  }

  /**
   * Infer layer from file path
   */
  private inferLayer(filePath: string): string {
    if (filePath.includes('/ui/') || filePath.includes('/components/')) return 'UI';
    if (filePath.includes('/backend/') || filePath.includes('/api/')) return 'BACKEND';
    if (filePath.includes('/core/') || filePath.includes('/registry/')) return 'CORE';
    if (filePath.includes('/discovery/')) return 'DISCOVERY';

    return 'INFRASTRUCTURE';
  }
}
