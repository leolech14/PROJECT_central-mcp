/**
 * Best Practices Engine
 * ======================
 *
 * Enforces quality standards and best practices.
 *
 * Features:
 * - Rule-based validation system
 * - Blocking vs warning violations
 * - Role-specific rules
 * - Auto-validation before completion
 * - Git-based quality checks
 *
 * T016 - QUALITY ENFORCEMENT
 */

import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export interface BestPractice {
  id: string;
  name: string;
  description: string;
  enforcement: 'BLOCKING' | 'WARNING' | 'INFO';
  validator: (context: ValidationContext) => Promise<ValidationResult>;
  applicableRoles: string[]; // ['UI_SPECIALIST', 'BACKEND_SPECIALIST', etc.]
}

export interface ValidationContext {
  taskId: string;
  agentId: string;
  filesCreated: string[];
  projectPath: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

export interface CompletionValidation {
  canComplete: boolean;
  violations: Violation[];
  warnings: Violation[];
  passed: BestPractice[];
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  enforcement: string;
  message: string;
  details?: string;
}

export class BestPracticesEngine {
  private rules: BestPractice[] = [];

  constructor(private db: Database.Database, private projectPath: string) {
    this.initializeRules();
  }

  /**
   * Initialize built-in best practices
   */
  private initializeRules(): void {
    this.rules = [
      // Universal rules (all roles)
      {
        id: 'TEST_BEFORE_COMMIT',
        name: 'Tests Must Pass',
        description: 'All tests must pass before task completion',
        enforcement: 'BLOCKING',
        validator: this.validateTestsPassing.bind(this),
        applicableRoles: ['*']
      },
      {
        id: 'DOCUMENT_CHANGES',
        name: 'Documentation Required',
        description: 'Significant changes must be documented',
        enforcement: 'WARNING',
        validator: this.validateDocumentation.bind(this),
        applicableRoles: ['*']
      },
      {
        id: 'NO_CONSOLE_LOGS',
        name: 'No Console Logs',
        description: 'Remove console.log statements before completion',
        enforcement: 'WARNING',
        validator: this.validateNoConsoleLogs.bind(this),
        applicableRoles: ['UI_SPECIALIST', 'BACKEND_SPECIALIST']
      },
      {
        id: 'GIT_COMMITS_PRESENT',
        name: 'Git Commits Required',
        description: 'Task must have associated git commits',
        enforcement: 'BLOCKING',
        validator: this.validateGitCommits.bind(this),
        applicableRoles: ['*']
      },
      {
        id: 'FILES_CREATED',
        name: 'Files Must Exist',
        description: 'Declared files must actually exist',
        enforcement: 'BLOCKING',
        validator: this.validateFilesExist.bind(this),
        applicableRoles: ['*']
      },

      // Role-specific rules
      {
        id: 'UI_ACCESSIBILITY',
        name: 'Accessibility Compliance',
        description: 'UI components must meet WCAG 2.2 AA standards',
        enforcement: 'WARNING',
        validator: this.validateAccessibility.bind(this),
        applicableRoles: ['UI_SPECIALIST']
      },
      {
        id: 'BACKEND_API_DOCS',
        name: 'API Documentation',
        description: 'Backend APIs must have OpenAPI/Swagger docs',
        enforcement: 'WARNING',
        validator: this.validateAPIDocs.bind(this),
        applicableRoles: ['BACKEND_SPECIALIST']
      }
    ];
  }

  /**
   * Validate task completion against all applicable rules
   */
  async validateCompletion(context: ValidationContext): Promise<CompletionValidation> {
    const agent = this.getAgent(context.agentId);
    const agentRole = agent ? this.getAgentRole(agent) : 'GENERAL_CONTRIBUTOR';

    // Filter rules applicable to this agent
    const applicableRules = this.rules.filter(rule =>
      rule.applicableRoles.includes('*') || rule.applicableRoles.includes(agentRole)
    );

    const violations: Violation[] = [];
    const warnings: Violation[] = [];
    const passed: BestPractice[] = [];

    // Run all validators
    for (const rule of applicableRules) {
      try {
        const result = await rule.validator(context);

        if (!result.valid) {
          const violation: Violation = {
            ruleId: rule.id,
            ruleName: rule.name,
            enforcement: rule.enforcement,
            message: result.message,
            details: result.details
          };

          if (rule.enforcement === 'BLOCKING') {
            violations.push(violation);
          } else if (rule.enforcement === 'WARNING') {
            warnings.push(violation);
          }
        } else {
          passed.push(rule);
        }
      } catch (error) {
        console.warn(`⚠️  Validator ${rule.id} failed:`, error);
      }
    }

    return {
      canComplete: violations.length === 0,
      violations,
      warnings,
      passed
    };
  }

  /**
   * Validator: Tests must pass
   */
  private async validateTestsPassing(context: ValidationContext): Promise<ValidationResult> {
    try {
      // Check for test command in package.json
      const packageJsonPath = path.join(context.projectPath, 'package.json');

      if (!existsSync(packageJsonPath)) {
        return { valid: true, message: 'No package.json found (skipped)' };
      }

      // Try to run tests
      execSync('npm test', {
        cwd: context.projectPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000 // 30 second timeout
      });

      return { valid: true, message: 'All tests passing' };
    } catch (error) {
      return {
        valid: false,
        message: 'Tests are failing',
        details: 'Run npm test to see failures'
      };
    }
  }

  /**
   * Validator: Documentation exists
   */
  private async validateDocumentation(context: ValidationContext): Promise<ValidationResult> {
    const hasReadme = context.filesCreated.some(f => f.toLowerCase().includes('readme'));
    const hasDocs = context.filesCreated.some(f => f.toLowerCase().includes('doc') || f.endsWith('.md'));

    if (hasReadme || hasDocs) {
      return { valid: true, message: 'Documentation present' };
    }

    return {
      valid: false,
      message: 'No documentation files created',
      details: 'Consider adding README.md or documentation'
    };
  }

  /**
   * Validator: No console.log statements
   */
  private async validateNoConsoleLogs(context: ValidationContext): Promise<ValidationResult> {
    const codeFiles = context.filesCreated.filter(f =>
      f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
    );

    for (const file of codeFiles) {
      const filePath = path.join(context.projectPath, file);
      if (!existsSync(filePath)) continue;

      try {
        const result = execSync(`grep -n "console\\.log" "${filePath}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });

        if (result.trim()) {
          return {
            valid: false,
            message: `Found console.log in ${file}`,
            details: result.split('\n')[0]
          };
        }
      } catch (error) {
        // No console.log found (grep returns error when no match)
      }
    }

    return { valid: true, message: 'No console.log statements found' };
  }

  /**
   * Validator: Git commits exist
   */
  private async validateGitCommits(context: ValidationContext): Promise<ValidationResult> {
    try {
      const commits = execSync(`git log --oneline --grep="${context.taskId}"`, {
        cwd: context.projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      const commitCount = commits.split('\n').filter(l => l.trim()).length;

      if (commitCount === 0) {
        return {
          valid: false,
          message: 'No git commits found for this task',
          details: `Git commits should mention ${context.taskId} in message`
        };
      }

      return { valid: true, message: `${commitCount} git commit(s) found` };
    } catch (error) {
      return { valid: false, message: 'Could not check git commits' };
    }
  }

  /**
   * Validator: Files actually exist
   */
  private async validateFilesExist(context: ValidationContext): Promise<ValidationResult> {
    const missingFiles: string[] = [];

    for (const file of context.filesCreated) {
      const filePath = path.join(context.projectPath, file);
      if (!existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        valid: false,
        message: `${missingFiles.length} declared file(s) not found`,
        details: `Missing: ${missingFiles.join(', ')}`
      };
    }

    return { valid: true, message: 'All declared files exist' };
  }

  /**
   * Validator: UI accessibility (basic check)
   */
  private async validateAccessibility(context: ValidationContext): Promise<ValidationResult> {
    const uiFiles = context.filesCreated.filter(f =>
      f.endsWith('.tsx') || f.endsWith('.jsx')
    );

    // Basic check: Look for aria- attributes or accessibility keywords
    let hasAccessibility = false;

    for (const file of uiFiles) {
      const filePath = path.join(context.projectPath, file);
      if (!existsSync(filePath)) continue;

      try {
        const result = execSync(`grep -i "aria-\\|role=\\|accessibility" "${filePath}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });

        if (result.trim()) {
          hasAccessibility = true;
          break;
        }
      } catch (error) {
        // No accessibility found
      }
    }

    if (!hasAccessibility && uiFiles.length > 0) {
      return {
        valid: false,
        message: 'No accessibility attributes found',
        details: 'Consider adding aria-labels, roles, or other a11y features'
      };
    }

    return { valid: true, message: 'Accessibility considerations present' };
  }

  /**
   * Validator: API documentation
   */
  private async validateAPIDocs(context: ValidationContext): Promise<ValidationResult> {
    const apiFiles = context.filesCreated.filter(f =>
      f.includes('api') || f.includes('route') || f.includes('endpoint')
    );

    if (apiFiles.length === 0) {
      return { valid: true, message: 'No API files (skipped)' };
    }

    // Check for swagger/openapi docs
    const hasSwagger = context.filesCreated.some(f =>
      f.toLowerCase().includes('swagger') || f.toLowerCase().includes('openapi')
    );

    if (!hasSwagger) {
      return {
        valid: false,
        message: 'API documentation not found',
        details: 'Consider adding OpenAPI/Swagger documentation'
      };
    }

    return { valid: true, message: 'API documentation present' };
  }

  /**
   * Helper: Get agent
   */
  private getAgent(agentId: string): any | null {
    return this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agentId) as any;
  }

  /**
   * Helper: Get agent role (simplified)
   */
  private getAgentRole(agent: any): string {
    const caps = agent.capabilities ? JSON.parse(agent.capabilities) : {};

    if (caps.ui) return 'UI_SPECIALIST';
    if (caps.backend) return 'BACKEND_SPECIALIST';
    if (caps.design) return 'DESIGN_SPECIALIST';
    if (caps.integration) return 'INTEGRATION_SPECIALIST';

    return 'GENERAL_CONTRIBUTOR';
  }

  /**
   * Get rules for role
   */
  getRulesForRole(role: string): BestPractice[] {
    return this.rules.filter(rule =>
      rule.applicableRoles.includes('*') || rule.applicableRoles.includes(role)
    );
  }
}
