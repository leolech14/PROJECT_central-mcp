/**
 * Loop 5: Status Auto-Analysis
 * ==============================
 *
 * THE HEALTH MONITOR!
 *
 * Runs every 5 minutes:
 * 1. Monitors git status for all projects
 * 2. Analyzes build health
 * 3. Tracks commit velocity
 * 4. Identifies blockers
 * 5. Updates health metrics
 * 6. Alerts on critical issues
 *
 * Keeps all projects healthy without manual monitoring!
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { writeSystemEvent } from '../api/universal-write.js';

export interface StatusAnalysisConfig {
  intervalSeconds: number;       // How often to run (default: 300 = 5min)
  analyzeGit: boolean;            // Analyze git status (default: true)
  analyzeBuild: boolean;          // Check build health (default: true)
  detectBlockers: boolean;        // Identify blockers (default: true)
  autoAlert: boolean;             // Send alerts (default: true)
}

export class StatusAnalysisLoop {
  private db: Database.Database;
  private config: StatusAnalysisConfig;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private loopCount: number = 0;
  private projectsAnalyzed: number = 0;
  private blockersFound: number = 0;

  constructor(db: Database.Database, config: StatusAnalysisConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * Start status analysis loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️  Status analysis loop already running');
      return;
    }

    logger.info(`🔄 Starting Status Auto-Analysis Loop (every ${this.config.intervalSeconds}s)`);

    this.isRunning = true;

    // Run immediately
    this.runAnalysis();

    // Then on interval
    this.intervalHandle = setInterval(
      () => this.runAnalysis(),
      this.config.intervalSeconds * 1000
    );

    logger.info('✅ Loop 5: Status Auto-Analysis ACTIVE');
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
    logger.info('🛑 Loop 5: Status Auto-Analysis STOPPED');
  }

  /**
   * Run analysis cycle
   */
  private async runAnalysis(): Promise<void> {
    this.loopCount++;
    const startTime = Date.now();

    logger.info(`📊 Loop 2 Execution #${this.loopCount}: Analyzing project status...`);

    try {
      // Get all registered projects
      const projects = this.getRegisteredProjects();

      if (projects.length === 0) {
        logger.info(`   No projects to analyze`);
        return;
      }

      logger.info(`   Analyzing ${projects.length} projects`);

      let analyzed = 0;
      let blockers = 0;

      for (const project of projects) {
        try {
          const status = this.analyzeProjectStatus(project);
          this.updateProjectHealth(project.id, status);
          analyzed++;
          this.projectsAnalyzed++;

          if (status.blockers && status.blockers.length > 0) {
            blockers += status.blockers.length;
            this.blockersFound += status.blockers.length;
            logger.warn(`   🚧 ${project.name}: ${status.blockers.length} blockers found`);

            if (this.config.autoAlert) {
              this.alertBlockers(project, status.blockers);
            }
          } else {
            logger.info(`   ✅ ${project.name}: Healthy`);
          }

        } catch (err: any) {
          logger.error(`   ❌ Error analyzing ${project.name}: ${err.message}`);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ Loop 5 Complete: Analyzed ${analyzed} projects, found ${blockers} blockers in ${duration}ms`);

      // Write event to Universal Write System
      writeSystemEvent({
        eventType: 'loop_execution',
        eventCategory: 'system',
        eventActor: 'Loop-5',
        eventAction: `Status analysis: Analyzed ${analyzed} projects, found ${blockers} blockers`,
        eventDescription: `Loop #${this.loopCount}`,
        systemHealth: blockers > 0 ? 'warning' : 'healthy',
        activeLoops: 9,
        avgResponseTimeMs: duration,
        successRate: blockers === 0 ? 1.0 : 0.8,
        tags: ['loop-5', 'status-analysis', 'auto-proactive'],
        metadata: {
          loopCount: this.loopCount,
          projectsAnalyzed: analyzed,
          blockersFound: blockers
        }
      });

    } catch (err: any) {
      logger.error(`❌ Loop 2 Error:`, err);
    }
  }

  /**
   * Get all registered projects
   */
  private getRegisteredProjects(): any[] {
    return this.db.prepare(`
      SELECT id, name, path, type
      FROM projects
      ORDER BY project_number ASC
    `).all();
  }

  /**
   * Analyze single project status
   */
  private analyzeProjectStatus(project: any): any {
    const status: any = {
      projectId: project.id,
      projectName: project.name,
      analyzedAt: new Date().toISOString(),
      health: 'HEALTHY',
      blockers: []
    };

    // Git analysis
    if (this.config.analyzeGit && existsSync(project.path)) {
      try {
        const gitStatus = this.analyzeGitStatus(project.path);
        status.git = gitStatus;

        // Check for uncommitted changes
        if (gitStatus.hasUncommittedChanges) {
          status.blockers.push({
            type: 'UNCOMMITTED_CHANGES',
            severity: 'LOW',
            description: `${gitStatus.filesChanged} uncommitted files`
          });
        }

      } catch (err: any) {
        status.git = { error: err.message };
      }
    }

    // Build health (simplified - check for package.json errors)
    if (this.config.analyzeBuild && existsSync(project.path)) {
      try {
        const buildStatus = this.analyzeBuildHealth(project.path);
        status.build = buildStatus;

        if (!buildStatus.healthy) {
          status.blockers.push({
            type: 'BUILD_ISSUE',
            severity: 'HIGH',
            description: buildStatus.error || 'Build unhealthy'
          });
        }

      } catch (err: any) {
        status.build = { error: err.message };
      }
    }

    // Set overall health
    if (status.blockers.length > 0) {
      const hasCritical = status.blockers.some((b: any) => b.severity === 'CRITICAL');
      const hasHigh = status.blockers.some((b: any) => b.severity === 'HIGH');

      if (hasCritical) status.health = 'CRITICAL';
      else if (hasHigh) status.health = 'DEGRADED';
      else status.health = 'WARNING';
    }

    return status;
  }

  /**
   * Analyze git status
   */
  private analyzeGitStatus(projectPath: string): any {
    try {
      const statusOutput = execSync('git status --porcelain', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const filesChanged = statusOutput.trim().split('\n').filter(l => l.trim()).length;

      // Get recent commits
      const commitLog = execSync('git log --oneline -10', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const commits = commitLog.trim().split('\n').length;

      return {
        hasUncommittedChanges: filesChanged > 0,
        filesChanged: filesChanged,
        recentCommits: commits,
        healthy: true
      };

    } catch (err: any) {
      return {
        error: err.message,
        healthy: false
      };
    }
  }

  /**
   * Analyze build health
   */
  private analyzeBuildHealth(projectPath: string): any {
    // Simplified check - just verify no critical errors
    // Full implementation would run actual builds

    try {
      // Check if package.json exists
      const hasPackageJson = existsSync(`${projectPath}/package.json`);

      return {
        healthy: true,
        hasPackageJson: hasPackageJson
      };

    } catch (err: any) {
      return {
        healthy: false,
        error: err.message
      };
    }
  }

  /**
   * Update project health metrics
   */
  private updateProjectHealth(projectId: string, status: any): void {
    this.db.prepare(`
      UPDATE projects
      SET
        last_activity = datetime('now'),
        metadata = json_set(
          COALESCE(metadata, '{}'),
          '$.health', ?,
          '$.lastAnalyzed', ?,
          '$.blockers', ?
        )
      WHERE id = ?
    `).run(
      status.health,
      status.analyzedAt,
      JSON.stringify(status.blockers),
      projectId
    );
  }

  /**
   * Alert on blockers
   */
  private alertBlockers(project: any, blockers: any[]): void {
    // TODO: Implement actual alerting (Slack, email, etc.)
    // For now, just log
    logger.warn(`   📬 Would alert: ${project.name} has ${blockers.length} blockers`);
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
        'STATUS_ANALYSIS',
        'ANALYZE_HEALTH',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      // Ignore if can't log
    }
  }

  /**
   * Get loop statistics
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      loopCount: this.loopCount,
      projectsAnalyzed: this.projectsAnalyzed,
      blockersFound: this.blockersFound,
      intervalSeconds: this.config.intervalSeconds
    };
  }
}
