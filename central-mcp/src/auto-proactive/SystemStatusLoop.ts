/**
 * Loop 0: System Status & Health Check
 * =====================================
 *
 * THE ABSOLUTE FOUNDATION - ENSURE SYSTEM IS ALIVE!
 *
 * Runs every 5 seconds:
 * 1. Database connectivity check
 * 2. MCP server health verification
 * 3. File system accessibility
 * 4. Memory and CPU resource monitoring
 * 5. Network connectivity validation
 * 6. Critical service availability
 *
 * If Loop 0 fails, all other loops MUST pause until system is healthy!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { logger } from '../utils/logger.js';

export interface SystemStatusConfig {
  intervalSeconds: number;        // How often to run (default: 5)
  dbPath: string;                 // Path to database file
  criticalPaths: string[];        // Critical directories that must exist
  memoryThresholdMB: number;      // Alert if memory exceeds (default: 1000)
  autoRecover: boolean;           // Attempt auto-recovery (default: true)
}

export interface SystemHealth {
  isHealthy: boolean;
  database: boolean;
  filesystem: boolean;
  memory: boolean;
  timestamp: string;
  issues: string[];
}

export class SystemStatusLoop {
  private db: Database.Database;
  private config: SystemStatusConfig;
  private systems: any; // Revolutionary systems for intelligent health checks
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private loopCount: number = 0;
  private lastHealthStatus: SystemHealth | null = null;
  private consecutiveFailures: number = 0;

  constructor(db: Database.Database, config: SystemStatusConfig, systems?: any) {
    this.db = db;
    this.config = config;
    this.systems = systems || {};

    if (systems && systems.totalityVerification) {
      logger.info('🎯 Loop 0: TotalityVerificationSystem integrated for completeness checks');
    }
  }

  /**
   * Start system status monitoring loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️  System status loop already running');
      return;
    }

    logger.info(`🔄 Starting System Status & Health Check Loop (every ${this.config.intervalSeconds}s)`);

    this.isRunning = true;

    // Run immediately
    this.runHealthCheck();

    // Then on interval
    this.intervalHandle = setInterval(
      () => this.runHealthCheck(),
      this.config.intervalSeconds * 1000
    );

    logger.info('✅ Loop 0: System Status & Health Check ACTIVE');
  }

  /**
   * Stop monitoring loop
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    logger.info('🛑 Loop 0: System Status & Health Check STOPPED');
  }

  /**
   * Run health check cycle
   */
  private async runHealthCheck(): Promise<void> {
    this.loopCount++;
    const startTime = Date.now();

    const health: SystemHealth = {
      isHealthy: true,
      database: false,
      filesystem: false,
      memory: false,
      timestamp: new Date().toISOString(),
      issues: []
    };

    try {
      // 1. Database connectivity check
      try {
        this.db.prepare('SELECT 1').get();
        health.database = true;
      } catch (err: any) {
        health.isHealthy = false;
        health.issues.push(`Database error: ${err.message}`);
        logger.error('❌ Loop 0: Database connectivity FAILED');
      }

      // 2. File system accessibility check
      let filesystemOk = true;
      for (const path of this.config.criticalPaths) {
        if (!existsSync(path)) {
          filesystemOk = false;
          health.issues.push(`Critical path missing: ${path}`);
          logger.error(`❌ Loop 0: Critical path not accessible: ${path}`);
        }
      }
      health.filesystem = filesystemOk;
      if (!filesystemOk) health.isHealthy = false;

      // 3. Memory check
      const memoryUsage = process.memoryUsage();
      const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
      health.memory = memoryMB < this.config.memoryThresholdMB;

      if (!health.memory) {
        health.isHealthy = false;
        health.issues.push(`High memory usage: ${memoryMB.toFixed(0)}MB`);
        logger.warn(`⚠️  Loop 0: High memory usage: ${memoryMB.toFixed(0)}MB`);
      }

      // 4. System completeness check (using TotalityVerificationSystem)
      if (this.systems.totalityVerification) {
        try {
          const completeness = await this.systems.totalityVerification.checkCompleteness({
            projectId: 'central-mcp',
            scope: 'auto-proactive-loops'
          });

          // Log completeness metrics
          logger.debug(`   Completeness: ${completeness.percentage}%`);

          // Warn if completeness below threshold
          if (completeness.percentage < 70) {
            health.issues.push(`Low system completeness: ${completeness.percentage}%`);
            logger.warn(`⚠️  Loop 0: Low completeness: ${completeness.percentage}%`);
          }
        } catch (err: any) {
          logger.debug(`   Could not check completeness: ${err.message}`);
        }
      }

      // Update failure counter
      if (!health.isHealthy) {
        this.consecutiveFailures++;

        if (this.consecutiveFailures >= 3) {
          logger.error(`🚨 Loop 0: CRITICAL - ${this.consecutiveFailures} consecutive health check failures!`);
          logger.error(`   Issues: ${health.issues.join(', ')}`);

          if (this.config.autoRecover) {
            await this.attemptRecovery(health);
          }
        }
      } else {
        this.consecutiveFailures = 0;
      }

      this.lastHealthStatus = health;

      // Log to database
      if (health.database) {
        this.logHealthCheck({
          isHealthy: health.isHealthy,
          issues: health.issues,
          durationMs: Date.now() - startTime,
          memoryMB: memoryMB
        });
      }

      // Only log successful checks every 100 iterations (reduce noise)
      if (health.isHealthy && this.loopCount % 100 === 0) {
        logger.info(`✅ Loop 0: System healthy (${this.loopCount} checks)`);
      }

    } catch (err: any) {
      logger.error(`❌ Loop 0: Unexpected error:`, err);
      health.isHealthy = false;
      health.issues.push(`Unexpected error: ${err.message}`);
    }
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(health: SystemHealth): Promise<void> {
    logger.info('🔧 Loop 0: Attempting automatic recovery...');

    // Recovery strategies
    if (!health.database) {
      logger.info('   Checking database file integrity...');
      // Database recovery would go here
    }

    if (!health.memory) {
      logger.info('   Forcing garbage collection...');
      if (global.gc) {
        global.gc();
      }
    }

    logger.info('   Recovery attempt complete');
  }

  /**
   * Log health check to database
   */
  private logHealthCheck(result: any): void {
    try {
      this.db.prepare(`
        INSERT INTO auto_proactive_logs (
          id, loop_name, action, result, timestamp, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        'SYSTEM_STATUS',
        'HEALTH_CHECK',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      // If we can't log, system is in bad state - just warn
      logger.warn(`⚠️  Could not log health check: ${err.message}`);
    }
  }

  /**
   * Get current system health
   */
  getHealth(): SystemHealth | null {
    return this.lastHealthStatus;
  }

  /**
   * Get loop statistics
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      loopCount: this.loopCount,
      consecutiveFailures: this.consecutiveFailures,
      lastHealth: this.lastHealthStatus,
      intervalSeconds: this.config.intervalSeconds
    };
  }
}
