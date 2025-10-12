/**
 * Loop 2: Project Auto-Discovery
 * ================================
 *
 * THE FIRST AUTO-PROACTIVE LOOP!
 *
 * Runs every 60 seconds:
 * 1. Scans PROJECTS_all/ directory
 * 2. Detects new projects
 * 3. Auto-registers in database
 * 4. Loads project soul (specs + context)
 * 5. Triggers downstream analysis
 *
 * This is the foundation of the self-building system!
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { ProjectDetector } from '../discovery/ProjectDetector.js';
import { ContextExtractor } from '../discovery/ContextExtractor.js';
import { logger } from '../utils/logger.js';

export interface ProjectDiscoveryConfig {
  scanPaths: string[];          // Paths to scan (e.g., /Users/lech/PROJECTS_all/)
  intervalSeconds: number;      // How often to run (default: 60)
  autoRegister: boolean;        // Auto-register new projects (default: true)
  extractContext: boolean;      // Extract context on discovery (default: true)
}

export class ProjectDiscoveryLoop {
  private db: Database.Database;
  private config: ProjectDiscoveryConfig;
  private detector: ProjectDetector;
  private extractor: ContextExtractor;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private loopCount: number = 0;
  private projectsDiscovered: number = 0;

  constructor(db: Database.Database, config: ProjectDiscoveryConfig) {
    this.db = db;
    this.config = config;
    this.detector = new ProjectDetector(db);
    this.extractor = new ContextExtractor(db);
  }

  /**
   * Start the auto-discovery loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️  Project discovery loop already running');
      return;
    }

    logger.info(`🔄 Starting Project Auto-Discovery Loop (every ${this.config.intervalSeconds}s)`);
    logger.info(`📁 Scanning paths: ${this.config.scanPaths.join(', ')}`);

    this.isRunning = true;

    // Run immediately on start
    this.runDiscovery();

    // Then run on interval
    this.intervalHandle = setInterval(
      () => this.runDiscovery(),
      this.config.intervalSeconds * 1000
    );

    logger.info('✅ Loop 2: Project Auto-Discovery ACTIVE');
  }

  /**
   * Stop the loop
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('⚠️  Project discovery loop not running');
      return;
    }

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    logger.info('🛑 Loop 2: Project Auto-Discovery STOPPED');
  }

  /**
   * Run discovery cycle
   */
  private async runDiscovery(): Promise<void> {
    this.loopCount++;
    const startTime = Date.now();

    logger.info(`🔍 Loop 1 Execution #${this.loopCount}: Scanning for projects...`);

    let projectsFound = 0;
    let newProjects = 0;

    try {
      for (const scanPath of this.config.scanPaths) {
        if (!existsSync(scanPath)) {
          logger.warn(`⚠️  Scan path does not exist: ${scanPath}`);
          continue;
        }

        // Scan for projects
        const projects = this.scanDirectory(scanPath);
        projectsFound += projects.length;

        for (const projectPath of projects) {
          try {
            // Check if already registered
            const existing = this.db.prepare(`
              SELECT id FROM projects WHERE path = ?
            `).get(projectPath);

            if (existing) {
              // Already registered - update last_activity
              this.db.prepare(`
                UPDATE projects
                SET last_activity = datetime('now')
                WHERE path = ?
              `).run(projectPath);
            } else {
              // New project - auto-register!
              logger.info(`🆕 NEW PROJECT DISCOVERED: ${projectPath}`);

              if (this.config.autoRegister) {
                const project = await this.detector.detectProject(projectPath);
                newProjects++;
                this.projectsDiscovered++;

                logger.info(`✅ Registered: ${project.name} (${project.type})`);

                // Extract context if enabled (optional - implementation pending)
                if (this.config.extractContext) {
                  try {
                    // TODO: Implement context extraction
                    logger.info(`   📄 Context extraction: Pending implementation`);
                  } catch (err: any) {
                    logger.warn(`   ⚠️  Context extraction failed: ${err.message}`);
                  }
                }
              }
            }
          } catch (err: any) {
            logger.error(`❌ Error processing ${projectPath}:`, err.message);
          }
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`✅ Loop 1 Complete: Found ${projectsFound} projects (${newProjects} new) in ${duration}ms`);

      // Log loop execution to database
      this.logLoopExecution('PROJECT_DISCOVERY', {
        projectsScanned: projectsFound,
        projectsRegistered: newProjects,
        durationMs: duration
      });

    } catch (err: any) {
      logger.error(`❌ Loop 1 Error:`, err);
    }
  }

  /**
   * Scan directory for projects
   */
  private scanDirectory(basePath: string): string[] {
    const projects: string[] = [];

    try {
      const entries = readdirSync(basePath);

      for (const entry of entries) {
        // Skip hidden directories and common non-projects
        if (entry.startsWith('.') || entry === 'node_modules') {
          continue;
        }

        const fullPath = join(basePath, entry);

        try {
          const stats = statSync(fullPath);

          if (stats.isDirectory()) {
            // Check if it looks like a project
            if (this.looksLikeProject(fullPath)) {
              projects.push(fullPath);
            }
          }
        } catch (err) {
          // Permission error or similar - skip
          continue;
        }
      }
    } catch (err: any) {
      logger.error(`❌ Error scanning ${basePath}:`, err.message);
    }

    return projects;
  }

  /**
   * Check if directory looks like a project
   */
  private looksLikeProject(path: string): boolean {
    // Project indicators
    const indicators = [
      'CLAUDE.md',           // Claude Code project marker
      'package.json',        // Node.js project
      '01_CODEBASES',        // 6-layer architecture
      '02_SPECBASES',        // 6-layer architecture
      '.git',                // Git repository
      'Cargo.toml',          // Rust project
      'pyproject.toml',      // Python project
      'pom.xml',             // Java project
      'go.mod'               // Go project
    ];

    for (const indicator of indicators) {
      if (existsSync(join(path, indicator))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Log loop execution to database
   */
  private logLoopExecution(loopName: string, result: any): void {
    try {
      // Create auto_proactive_logs table if not exists
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS auto_proactive_logs (
          id TEXT PRIMARY KEY,
          loop_name TEXT NOT NULL,
          action TEXT NOT NULL,
          project_name TEXT,
          result TEXT,
          timestamp TEXT NOT NULL,
          execution_time_ms INTEGER
        )
      `);

      this.db.prepare(`
        INSERT INTO auto_proactive_logs (
          id, loop_name, action, result, timestamp, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        loopName,
        'SCAN_AND_REGISTER',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      logger.warn(`⚠️  Could not log loop execution: ${err.message}`);
    }
  }

  /**
   * Get loop statistics
   */
  getStats(): {
    isRunning: boolean;
    loopCount: number;
    projectsDiscovered: number;
    intervalSeconds: number;
  } {
    return {
      isRunning: this.isRunning,
      loopCount: this.loopCount,
      projectsDiscovered: this.projectsDiscovered,
      intervalSeconds: this.config.intervalSeconds
    };
  }
}
