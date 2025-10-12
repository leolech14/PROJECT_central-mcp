/**
 * Loop 6: Opportunity Auto-Scanning
 * ===================================
 *
 * THE OPPORTUNITY HUNTER!
 *
 * Runs every 15 minutes:
 * 1. Scans for specs without implementations
 * 2. Detects code without tests
 * 3. Finds documentation gaps
 * 4. Identifies performance issues
 * 5. Detects technical debt
 * 6. Auto-generates tasks for P0/P1 opportunities
 *
 * Ensures nothing falls through the cracks!
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export interface OpportunityScanningConfig {
  intervalSeconds: number;        // How often to run (default: 900 = 15min)
  scanSpecs: boolean;              // Scan for unimplemented specs (default: true)
  scanTests: boolean;              // Scan for untested code (default: true)
  scanDocs: boolean;               // Scan for doc gaps (default: true)
  autoGenerateTasks: boolean;      // Auto-create tasks from opportunities (default: true)
}

interface Opportunity {
  type: string;
  projectId: string;
  description: string;
  priority: string;
  suggestedAction: string;
}

export class OpportunityScanningLoop {
  private db: Database.Database;
  private config: OpportunityScanningConfig;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private loopCount: number = 0;
  private opportunitiesFound: number = 0;
  private tasksGenerated: number = 0;

  constructor(db: Database.Database, config: OpportunityScanningConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * Start scanning loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️  Opportunity scanning loop already running');
      return;
    }

    logger.info(`🔄 Starting Opportunity Auto-Scanning Loop (every ${this.config.intervalSeconds}s)`);

    this.isRunning = true;

    // Run immediately
    this.runScanning();

    // Then on interval
    this.intervalHandle = setInterval(
      () => this.runScanning(),
      this.config.intervalSeconds * 1000
    );

    logger.info('✅ Loop 6: Opportunity Auto-Scanning ACTIVE');
  }

  /**
   * Stop loop
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    logger.info('🛑 Loop 6: Opportunity Auto-Scanning STOPPED');
  }

  /**
   * Run scanning cycle
   */
  private async runScanning(): Promise<void> {
    this.loopCount++;
    const startTime = Date.now();

    logger.info(`🔍 Loop 5 Execution #${this.loopCount}: Scanning for opportunities...`);

    try {
      const projects = this.getRegisteredProjects();

      if (projects.length === 0) {
        logger.info(`   No projects to scan`);
        return;
      }

      const allOpportunities: Opportunity[] = [];

      for (const project of projects) {
        if (!existsSync(project.path)) {
          continue;
        }

        const opportunities = this.scanProject(project);
        allOpportunities.push(...opportunities);

        if (opportunities.length > 0) {
          logger.info(`   🎯 ${project.name}: ${opportunities.length} opportunities`);
        }
      }

      this.opportunitiesFound += allOpportunities.length;

      // Auto-generate tasks for critical opportunities
      const criticalOpps = allOpportunities.filter(opp =>
        opp.priority === 'P0-Critical' || opp.priority === 'P1-High'
      );

      if (this.config.autoGenerateTasks) {
        for (const opp of criticalOpps) {
          this.generateTaskFromOpportunity(opp);
          this.tasksGenerated++;
        }

        if (criticalOpps.length > 0) {
          logger.info(`   ✅ Generated ${criticalOpps.length} tasks from opportunities`);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ Loop 5 Complete: Found ${allOpportunities.length} opportunities in ${duration}ms`);

      // Log execution
      this.logLoopExecution({
        projectsScanned: projects.length,
        opportunitiesFound: allOpportunities.length,
        tasksGenerated: this.config.autoGenerateTasks ? criticalOpps.length : 0,
        durationMs: duration
      });

    } catch (err: any) {
      logger.error(`❌ Loop 5 Error:`, err);
    }
  }

  /**
   * Get registered projects
   */
  private getRegisteredProjects(): any[] {
    return this.db.prepare(`
      SELECT id, name, path, type FROM projects
      ORDER BY project_number ASC
    `).all();
  }

  /**
   * Scan project for opportunities
   */
  private scanProject(project: any): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // 1. Specs without implementations
    if (this.config.scanSpecs) {
      const specsWithoutImpl = this.findSpecsWithoutImplementation(project);
      opportunities.push(...specsWithoutImpl);
    }

    // 2. Code without tests
    if (this.config.scanTests) {
      const codeWithoutTests = this.findCodeWithoutTests(project);
      opportunities.push(...codeWithoutTests);
    }

    // 3. Documentation gaps
    if (this.config.scanDocs) {
      const docGaps = this.findDocumentationGaps(project);
      opportunities.push(...docGaps);
    }

    return opportunities;
  }

  /**
   * Find specs without implementation
   */
  private findSpecsWithoutImplementation(project: any): Opportunity[] {
    const opportunities: Opportunity[] = [];

    try {
      const specDir = join(project.path, '02_SPECBASES');
      if (!existsSync(specDir)) return opportunities;

      const specFiles = readdirSync(specDir)
        .filter(f => f.endsWith('.md'))
        .filter(f => f.startsWith('SPEC_'));

      // Check if implementation exists (simplified)
      const codebaseDir = join(project.path, '01_CODEBASES');
      const hasCodebase = existsSync(codebaseDir);

      if (specFiles.length > 0 && !hasCodebase) {
        opportunities.push({
          type: 'SPEC_WITHOUT_IMPLEMENTATION',
          projectId: project.id,
          description: `${specFiles.length} specs without implementation`,
          priority: 'P1-High',
          suggestedAction: 'Implement specifications'
        });
      }

    } catch (err) {
      // Ignore scan errors
    }

    return opportunities;
  }

  /**
   * Find code without tests
   */
  private findCodeWithoutTests(project: any): Opportunity[] {
    const opportunities: Opportunity[] = [];

    try {
      const srcDir = join(project.path, 'src');
      if (!existsSync(srcDir)) return opportunities;

      const sourceFiles = this.countFilesInDir(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      const testDir = join(project.path, 'tests');
      const testDir2 = join(project.path, '__tests__');
      const hasTests = existsSync(testDir) || existsSync(testDir2);

      if (sourceFiles > 0 && !hasTests) {
        opportunities.push({
          type: 'CODE_WITHOUT_TESTS',
          projectId: project.id,
          description: `${sourceFiles} source files without test coverage`,
          priority: 'P2-Medium',
          suggestedAction: 'Add test suite'
        });
      }

    } catch (err) {
      // Ignore
    }

    return opportunities;
  }

  /**
   * Find documentation gaps
   */
  private findDocumentationGaps(project: any): Opportunity[] {
    const opportunities: Opportunity[] = [];

    try {
      // Check for README
      const hasReadme = existsSync(join(project.path, 'README.md'));

      if (!hasReadme) {
        opportunities.push({
          type: 'DOCUMENTATION_GAP',
          projectId: project.id,
          description: 'Missing README.md',
          priority: 'P3-Low',
          suggestedAction: 'Create README documentation'
        });
      }

    } catch (err) {
      // Ignore
    }

    return opportunities;
  }

  /**
   * Count files in directory by extension
   */
  private countFilesInDir(dir: string, extensions: string[]): number {
    let count = 0;

    try {
      const scan = (currentDir: string) => {
        const entries = readdirSync(currentDir);

        for (const entry of entries) {
          if (entry === 'node_modules' || entry.startsWith('.')) continue;

          const fullPath = join(currentDir, entry);

          try {
            const stats = statSync(fullPath);

            if (stats.isDirectory()) {
              scan(fullPath);
            } else if (extensions.includes(extname(entry))) {
              count++;
            }
          } catch {
            continue;
          }
        }
      };

      scan(dir);

    } catch (err) {
      // Ignore
    }

    return count;
  }

  /**
   * Generate task from opportunity
   */
  private generateTaskFromOpportunity(opp: Opportunity): void {
    try {
      const taskId = `T-OPP-${Date.now()}`;

      const priorityMap: Record<string, number> = {
        'P0-Critical': 1,
        'P1-High': 2,
        'P2-Medium': 3,
        'P3-Low': 4
      };

      this.db.prepare(`
        INSERT INTO tasks (
          id, title, description, status, priority,
          project_id, agent, category, dependencies,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        taskId,
        opp.suggestedAction,
        opp.description,
        'pending',
        priorityMap[opp.priority] || 3,
        opp.projectId,
        'D', // Default to integration specialist
        opp.type.toLowerCase(),
        '[]',
        Date.now(),
        Date.now()
      );

      logger.info(`   ✅ Task created: ${taskId}`);

    } catch (err: any) {
      logger.warn(`   ⚠️  Could not create task: ${err.message}`);
    }
  }

  /**
   * Log loop execution
   */
  private logLoopExecution(result: any): void {
    try {
      this.db.prepare(`
        INSERT INTO auto_proactive_logs (
          id, loop_name, action, result, timestamp, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        'OPPORTUNITY_SCANNING',
        'SCAN_AND_GENERATE',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      // Ignore
    }
  }

  /**
   * Get loop statistics
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      loopCount: this.loopCount,
      opportunitiesFound: this.opportunitiesFound,
      tasksGenerated: this.tasksGenerated,
      intervalSeconds: this.config.intervalSeconds
    };
  }
}
