/**
 * Health Checker & Self-Healing System
 * =====================================
 *
 * Monitors system health and automatically recovers from failures.
 *
 * Features:
 * - Database health monitoring
 * - Agent session health
 * - Task integrity checks
 * - Automatic recovery from common failures
 * - Performance monitoring
 * - Self-healing mechanisms
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

export interface HealthStatus {
  healthy: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  checks: HealthCheck[];
  issues: HealthIssue[];
  autoRecoveryAttempted: boolean;
}

export interface HealthCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  duration: number; // ms
}

export interface HealthIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  component: string;
  description: string;
  autoRecoverable: boolean;
  recoveryAction?: string;
}

export class HealthChecker {
  constructor(
    private db: Database.Database,
    private dbPath: string
  ) {}

  /**
   * Perform complete health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let autoRecoveryAttempted = false;

    // Check 1: Database Connection
    checks.push(await this.checkDatabaseConnection());

    // Check 2: Database Integrity
    checks.push(await this.checkDatabaseIntegrity());

    // Check 3: Zombie Agent Detection
    const zombieCheck = await this.checkZombieAgents();
    checks.push(zombieCheck);
    if (zombieCheck.status === 'WARN') {
      // Auto-heal: Clean up zombie agents
      await this.cleanupZombieAgents();
      autoRecoveryAttempted = true;
    }

    // Check 4: Stuck Task Detection
    const stuckCheck = await this.checkStuckTasks();
    checks.push(stuckCheck);
    if (stuckCheck.status === 'WARN') {
      issues.push({
        severity: 'MEDIUM',
        component: 'TaskRegistry',
        description: 'Tasks stuck in IN_PROGRESS for >24 hours',
        autoRecoverable: true,
        recoveryAction: 'Auto-release stuck tasks to AVAILABLE'
      });
    }

    // Check 5: Database Size
    checks.push(await this.checkDatabaseSize());

    // Check 6: Activity Log Growth
    const activityCheck = await this.checkActivityLogGrowth();
    checks.push(activityCheck);
    if (activityCheck.status === 'WARN') {
      // Auto-heal: Clean old activities
      await this.cleanupOldActivities();
      autoRecoveryAttempted = true;
    }

    // Check 7: Performance
    checks.push(await this.checkPerformance());

    // Determine overall status
    const criticalFailures = checks.filter(c => c.status === 'FAIL').length;
    const warnings = checks.filter(c => c.status === 'WARN').length;

    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    if (criticalFailures > 0) {
      status = 'UNHEALTHY';
    } else if (warnings > 1) {
      status = 'DEGRADED';
    } else {
      status = 'HEALTHY';
    }

    return {
      healthy: status === 'HEALTHY',
      status,
      timestamp: new Date().toISOString(),
      checks,
      issues,
      autoRecoveryAttempted
    };
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Simple query to verify connection
      this.db.prepare('SELECT 1 as result').get();

      return {
        name: 'Database Connection',
        status: 'PASS',
        message: 'Database connection healthy',
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'FAIL',
        message: `Database connection failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Check database integrity
   */
  private async checkDatabaseIntegrity(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Check foreign key constraints
      const violations = this.db.prepare('PRAGMA foreign_key_check').all() as any[];

      if (violations.length > 0) {
        return {
          name: 'Database Integrity',
          status: 'FAIL',
          message: `Foreign key violations: ${violations.length}`,
          duration: Date.now() - start
        };
      }

      // Verify all expected tables exist
      const expectedTables = [
        'tasks', 'agent_sessions', 'agent_presence', 'agent_activity',
        'agent_metrics', 'projects', 'agents', 'context_files'
      ];

      const existingTables = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table'
      `).all() as Array<{ name: string }>;

      const tableNames = existingTables.map(t => t.name);
      const missingTables = expectedTables.filter(t => !tableNames.includes(t));

      if (missingTables.length > 0) {
        return {
          name: 'Database Integrity',
          status: 'FAIL',
          message: `Missing tables: ${missingTables.join(', ')}`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Database Integrity',
        status: 'PASS',
        message: 'All tables and constraints valid',
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Database Integrity',
        status: 'FAIL',
        message: `Integrity check failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Check for zombie agents (missed heartbeats)
   */
  private async checkZombieAgents(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Find agents ONLINE but no heartbeat in 5 minutes
      const zombies = this.db.prepare(`
        SELECT agent_letter, last_seen
        FROM agent_presence
        WHERE status IN ('ONLINE', 'IDLE')
          AND datetime(last_seen) < datetime('now', '-300 seconds')
      `).all() as any[];

      if (zombies.length > 0) {
        return {
          name: 'Zombie Agent Detection',
          status: 'WARN',
          message: `${zombies.length} zombie agent(s) detected (will auto-cleanup)`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Zombie Agent Detection',
        status: 'PASS',
        message: 'No zombie agents',
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Zombie Agent Detection',
        status: 'FAIL',
        message: `Check failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * AUTO-HEAL: Clean up zombie agents
   */
  private async cleanupZombieAgents(): Promise<void> {
    console.log('🔧 AUTO-HEAL: Cleaning up zombie agents...');

    const updated = this.db.prepare(`
      UPDATE agent_presence SET status = 'OFFLINE'
      WHERE status IN ('ONLINE', 'IDLE')
        AND datetime(last_seen) < datetime('now', '-300 seconds')
    `).run();

    console.log(`✅ AUTO-HEAL: ${updated.changes} zombie agent(s) cleaned up`);
  }

  /**
   * Check for stuck tasks
   */
  private async checkStuckTasks(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Find tasks IN_PROGRESS for >24 hours
      const stuckTasks = this.db.prepare(`
        SELECT id, name, claimed_at
        FROM tasks
        WHERE status = 'IN_PROGRESS'
          AND datetime(claimed_at) < datetime('now', '-24 hours')
      `).all() as any[];

      if (stuckTasks.length > 0) {
        return {
          name: 'Stuck Task Detection',
          status: 'WARN',
          message: `${stuckTasks.length} task(s) stuck >24 hours`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Stuck Task Detection',
        status: 'PASS',
        message: 'No stuck tasks',
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Stuck Task Detection',
        status: 'FAIL',
        message: `Check failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Check database size
   */
  private async checkDatabaseSize(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      if (!existsSync(this.dbPath)) {
        return {
          name: 'Database Size',
          status: 'FAIL',
          message: 'Database file not found',
          duration: Date.now() - start
        };
      }

      const sizeOutput = execSync(`du -k "${this.dbPath}"`, { encoding: 'utf-8' });
      const sizeKB = parseInt(sizeOutput.split('\t')[0], 10);
      const sizeMB = (sizeKB / 1024).toFixed(2);

      if (sizeKB > 100 * 1024) { // >100MB
        return {
          name: 'Database Size',
          status: 'WARN',
          message: `Database is large: ${sizeMB} MB`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Database Size',
        status: 'PASS',
        message: `Database size: ${sizeMB} MB`,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Database Size',
        status: 'WARN',
        message: 'Could not check size',
        duration: Date.now() - start
      };
    }
  }

  /**
   * Check activity log growth
   */
  private async checkActivityLogGrowth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const count = this.db.prepare(`
        SELECT COUNT(*) as count FROM agent_activity
      `).get() as { count: number };

      if (count.count > 50000) {
        return {
          name: 'Activity Log Growth',
          status: 'WARN',
          message: `Activity log has ${count.count} entries (will auto-cleanup)`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Activity Log Growth',
        status: 'PASS',
        message: `Activity log: ${count.count} entries`,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Activity Log Growth',
        status: 'FAIL',
        message: `Check failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * AUTO-HEAL: Clean up old activities (keep last 10,000)
   */
  private async cleanupOldActivities(): Promise<void> {
    console.log('🔧 AUTO-HEAL: Cleaning up old activities...');

    // Keep only last 10,000 activities
    const deleted = this.db.prepare(`
      DELETE FROM agent_activity
      WHERE id NOT IN (
        SELECT id FROM agent_activity
        ORDER BY timestamp DESC
        LIMIT 10000
      )
    `).run();

    console.log(`✅ AUTO-HEAL: Deleted ${deleted.changes} old activity entries`);
  }

  /**
   * Check query performance
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Test query performance
      const testStart = Date.now();
      this.db.prepare('SELECT * FROM tasks').all();
      const queryTime = Date.now() - testStart;

      if (queryTime > 100) {
        return {
          name: 'Query Performance',
          status: 'WARN',
          message: `Slow query: ${queryTime}ms`,
          duration: Date.now() - start
        };
      }

      return {
        name: 'Query Performance',
        status: 'PASS',
        message: `Queries fast: ${queryTime}ms`,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: 'Query Performance',
        status: 'FAIL',
        message: `Performance check failed: ${error}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * AUTO-HEAL: Vacuum database (reclaim space and optimize)
   */
  async vacuumDatabase(): Promise<void> {
    console.log('🔧 AUTO-HEAL: Vacuuming database...');
    this.db.prepare('VACUUM').run();
    console.log('✅ AUTO-HEAL: Database vacuumed and optimized');
  }

  /**
   * AUTO-HEAL: Reset corrupted agent presence
   */
  async resetAgentPresence(): Promise<void> {
    console.log('🔧 AUTO-HEAL: Resetting corrupted agent presence...');

    // Reset all agents to OFFLINE if no active session
    this.db.prepare(`
      UPDATE agent_presence SET status = 'OFFLINE', current_session_id = NULL
      WHERE current_session_id NOT IN (
        SELECT id FROM agent_sessions WHERE status = 'ACTIVE'
      )
    `).run();

    console.log('✅ AUTO-HEAL: Agent presence reset');
  }

  /**
   * AUTO-HEAL: Unblock tasks with completed dependencies
   */
  async unblockReadyTasks(): Promise<number> {
    console.log('🔧 AUTO-HEAL: Checking for tasks ready to unblock...');

    const blockedTasks = this.db.prepare(`
      SELECT * FROM tasks WHERE status = 'BLOCKED'
    `).all() as any[];

    let unblocked = 0;

    for (const task of blockedTasks) {
      const dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];

      if (dependencies.length === 0) {
        // No dependencies but marked blocked - fix it
        this.db.prepare(`
          UPDATE tasks SET status = 'AVAILABLE' WHERE id = ?
        `).run(task.id);
        unblocked++;
        continue;
      }

      // Check if all dependencies are complete
      let allComplete = true;
      for (const depId of dependencies) {
        const dep = this.db.prepare(`
          SELECT status FROM tasks WHERE id = ?
        `).get(depId) as { status: string } | undefined;

        if (!dep || dep.status !== 'COMPLETE') {
          allComplete = false;
          break;
        }
      }

      if (allComplete) {
        this.db.prepare(`
          UPDATE tasks SET status = 'AVAILABLE' WHERE id = ?
        `).run(task.id);
        unblocked++;
      }
    }

    if (unblocked > 0) {
      console.log(`✅ AUTO-HEAL: Unblocked ${unblocked} task(s)`);
    }

    return unblocked;
  }

  /**
   * Get health summary for display
   */
  getHealthSummary(health: HealthStatus): string {
    const lines: string[] = [];

    lines.push('┌────────────────────────────────────────────────────────────┐');
    lines.push(`│  SYSTEM HEALTH: ${health.status.padEnd(44)} │`);
    lines.push('├────────────────────────────────────────────────────────────┤');

    for (const check of health.checks) {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
      const name = check.name.padEnd(30);
      const msg = check.message.substring(0, 20).padEnd(20);
      lines.push(`│  ${icon} ${name} ${msg} │`);
    }

    if (health.autoRecoveryAttempted) {
      lines.push('├────────────────────────────────────────────────────────────┤');
      lines.push('│  🔧 AUTO-HEAL: Recovery actions executed                   │');
    }

    if (health.issues.length > 0) {
      lines.push('├────────────────────────────────────────────────────────────┤');
      lines.push('│  ⚠️  ISSUES DETECTED:                                       │');
      for (const issue of health.issues.slice(0, 3)) {
        lines.push(`│     ${issue.severity}: ${issue.description.substring(0, 45)} │`);
      }
    }

    lines.push('└────────────────────────────────────────────────────────────┘');

    return lines.join('\n');
  }
}
