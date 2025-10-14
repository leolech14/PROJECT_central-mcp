/**
 * 🔒 DATABASE INTEGRITY VALIDATOR
 * ================================
 *
 * Comprehensive data integrity validation and enforcement system
 */

import { EventEmitter } from 'events';
import { getDatabase } from './DatabaseFactory.js';
import { logger } from '../utils/logger.js';

interface IntegrityViolation {
  type: string;
  table: string;
  count: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRecords?: any[];
  fixQuery?: string;
}

interface IntegrityReport {
  timestamp: number;
  totalViolations: number;
  violationsBySeverity: Record<string, number>;
  violations: IntegrityViolation[];
  healthScore: number; // 0-100
  recommendations: string[];
}

export class DatabaseIntegrityValidator extends EventEmitter {
  private validationInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lastReport: IntegrityReport | null = null;

  constructor() {
    super();
  }

  /**
   * Start integrity monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logger.info('🔒 Database integrity monitoring started');

    this.validationInterval = setInterval(async () => {
      await this.runValidation();
    }, intervalMs);

    // Run initial validation
    this.runValidation();
  }

  /**
   * Stop integrity monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }

    logger.info('🔒 Database integrity monitoring stopped');
  }

  /**
   * Run comprehensive integrity validation
   */
  async runValidation(): Promise<IntegrityReport> {
    const startTime = Date.now();
    logger.debug('🔒 Running database integrity validation...');

    const violations = await this.checkAllIntegrityConstraints();
    const report = this.generateReport(violations);

    this.lastReport = report;
    this.emit('validationComplete', report);

    // Log violations by severity
    if (report.totalViolations > 0) {
      logger.warn(`⚠️ Database integrity violations found: ${report.totalViolations} (Health: ${report.healthScore}%)`);

      const criticalViolations = violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0) {
        logger.error(`🚨 Critical integrity violations: ${criticalViolations.length}`);
        this.emit('criticalViolation', criticalViolations);
      }
    } else {
      logger.debug('✅ No integrity violations found');
    }

    const duration = Date.now() - startTime;
    logger.debug(`🔒 Integrity validation completed in ${duration}ms`);

    return report;
  }

  /**
   * Check all integrity constraints
   */
  private async checkAllIntegrityConstraints(): Promise<IntegrityViolation[]> {
    const dbFactory = getDatabase();
    const violations: IntegrityViolation[] = [];

    await dbFactory.withConnection((db) => {
      // Check for orphaned records
      violations.push(...this.checkOrphanedRecords(db));

      // Check for invalid data
      violations.push(...this.checkInvalidData(db));

      // Check for constraint violations
      violations.push(...this.checkConstraintViolations(db));

      // Check for data consistency
      violations.push(...this.checkDataConsistency(db));

      // Check for performance issues
      violations.push(...this.checkPerformanceIssues(db));
    });

    return violations;
  }

  /**
   * Check for orphaned records (records with invalid foreign keys)
   */
  private checkOrphanedRecords(db: any): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // Orphaned tasks (no valid project)
    const orphanedTasks = db.prepare(`
      SELECT t.id, t.project_id, t.name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE p.id IS NULL
      LIMIT 10
    `).all();

    if (orphanedTasks.length > 0) {
      violations.push({
        type: 'orphaned_tasks',
        table: 'tasks',
        count: db.prepare(`
          SELECT COUNT(*) FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE p.id IS NULL
        `).get().count,
        description: 'Tasks without valid project references',
        severity: 'high',
        affectedRecords: orphanedTasks,
        fixQuery: `
          UPDATE tasks SET project_id = 'localbrain'
          WHERE project_id NOT IN (SELECT id FROM projects)
        `
      });
    }

    // Orphaned agent activity (no valid session)
    const orphanedActivity = db.prepare(`
      SELECT aa.id, aa.session_id, aa.activity_type
      FROM agent_activity aa
      LEFT JOIN agent_sessions a_s ON aa.session_id = a_s.id
      WHERE a_s.id IS NULL
      LIMIT 10
    `).all();

    if (orphanedActivity.length > 0) {
      violations.push({
        type: 'orphaned_agent_activity',
        table: 'agent_activity',
        count: db.prepare(`
          SELECT COUNT(*) FROM agent_activity aa
          LEFT JOIN agent_sessions a_s ON aa.session_id = a_s.id
          WHERE a_s.id IS NULL
        `).get().count,
        description: 'Agent activity without valid session references',
        severity: 'medium',
        affectedRecords: orphanedActivity,
        fixQuery: `
          DELETE FROM agent_activity
          WHERE session_id NOT IN (SELECT id FROM agent_sessions)
        `
      });
    }

    // Orphaned task history (no valid task)
    const orphanedHistory = db.prepare(`
      SELECT th.id, th.task_id, th.action
      FROM task_history th
      LEFT JOIN tasks t ON th.task_id = t.id
      WHERE t.id IS NULL
      LIMIT 10
    `).all();

    if (orphanedHistory.length > 0) {
      violations.push({
        type: 'orphaned_task_history',
        table: 'task_history',
        count: db.prepare(`
          SELECT COUNT(*) FROM task_history th
          LEFT JOIN tasks t ON th.task_id = t.id
          WHERE t.id IS NULL
        `).get().count,
        description: 'Task history without valid task references',
        severity: 'medium',
        affectedRecords: orphanedHistory,
        fixQuery: `
          DELETE FROM task_history
          WHERE task_id NOT IN (SELECT id FROM tasks)
        `
      });
    }

    // Invalid agent presence (invalid current session)
    const invalidPresence = db.prepare(`
      SELECT ap.agent_letter, ap.current_session_id
      FROM agent_presence ap
      LEFT JOIN agent_sessions a_s ON ap.current_session_id = a_s.id
      WHERE ap.current_session_id IS NOT NULL AND a_s.id IS NULL
    `).all();

    if (invalidPresence.length > 0) {
      violations.push({
        type: 'invalid_agent_presence',
        table: 'agent_presence',
        count: invalidPresence.length,
        description: 'Agent presence with invalid current session',
        severity: 'low',
        affectedRecords: invalidPresence,
        fixQuery: `
          UPDATE agent_presence
          SET current_session_id = NULL
          WHERE current_session_id NOT IN (SELECT id FROM agent_sessions)
        `
      });
    }

    return violations;
  }

  /**
   * Check for invalid data
   */
  private checkInvalidData(db: any): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // Tasks with invalid status
    const invalidTaskStatus = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status NOT IN (
        'AVAILABLE', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED',
        'COMPLETE', 'FAILED', 'CANCELLED'
      )
    `).get().count;

    if (invalidTaskStatus > 0) {
      violations.push({
        type: 'invalid_task_status',
        table: 'tasks',
        count: invalidTaskStatus,
        description: 'Tasks with invalid status values',
        severity: 'high',
        fixQuery: `
          UPDATE tasks SET status = 'AVAILABLE'
          WHERE status NOT IN (
            'AVAILABLE', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED',
            'COMPLETE', 'FAILED', 'CANCELLED'
          )
        `
      });
    }

    // Tasks with invalid priority
    const invalidPriority = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE priority < 1 OR priority > 5
    `).get().count;

    if (invalidPriority > 0) {
      violations.push({
        type: 'invalid_priority',
        table: 'tasks',
        count: invalidPriority,
        description: 'Tasks with invalid priority values',
        severity: 'medium',
        fixQuery: `
          UPDATE tasks SET priority = 3
          WHERE priority < 1 OR priority > 5
        `
      });
    }

    // Negative values where they shouldn't be
    const negativeValues = db.prepare(`
      SELECT
        SUM(CASE WHEN velocity < 0 THEN 1 ELSE 0 END) as negative_velocity,
        SUM(CASE WHEN estimated_hours < 0 THEN 1 ELSE 0 END) as negative_hours,
        SUM(CASE WHEN actual_minutes < 0 THEN 1 ELSE 0 END) as negative_minutes
      FROM tasks
    `).get();

    const totalNegatives = negativeValues.negative_velocity +
                         negativeValues.negative_hours +
                         negativeValues.negative_minutes;

    if (totalNegatives > 0) {
      violations.push({
        type: 'negative_values',
        table: 'tasks',
        count: totalNegatives,
        description: 'Tasks with negative numeric values',
        severity: 'medium',
        fixQuery: `
          UPDATE tasks SET
            velocity = ABS(velocity),
            estimated_hours = ABS(estimated_hours),
            actual_minutes = ABS(actual_minutes)
          WHERE velocity < 0 OR estimated_hours < 0 OR actual_minutes < 0
        `
      });
    }

    return violations;
  }

  /**
   * Check for constraint violations
   */
  private checkConstraintViolations(db: any): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // Duplicate tracking IDs in agents table
    const duplicateTrackingIds = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT tracking_id, COUNT(*) as cnt
        FROM agents
        GROUP BY tracking_id
        HAVING cnt > 1
      )
    `).get().count;

    if (duplicateTrackingIds > 0) {
      violations.push({
        type: 'duplicate_tracking_ids',
        table: 'agents',
        count: duplicateTrackingIds,
        description: 'Duplicate agent tracking IDs found',
        severity: 'critical',
        fixQuery: `-- Manual intervention required to resolve duplicate tracking IDs`
      });
    }

    // Duplicate project paths
    const duplicatePaths = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT path, COUNT(*) as cnt
        FROM projects
        GROUP BY path
        HAVING cnt > 1
      )
    `).get().count;

    if (duplicatePaths > 0) {
      violations.push({
        type: 'duplicate_project_paths',
        table: 'projects',
        count: duplicatePaths,
        description: 'Duplicate project paths found',
        severity: 'high',
        fixQuery: `-- Manual intervention required to resolve duplicate paths`
      });
    }

    return violations;
  }

  /**
   * Check for data consistency issues
   */
  private checkDataConsistency(db: any): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // Tasks claimed by agents not present in agent_presence
    const inconsistentClaims = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.claimed_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM agent_presence ap
        WHERE ap.agent_letter = t.claimed_by
        AND ap.status IN ('ONLINE', 'IDLE')
      )
    `).get().count;

    if (inconsistentClaims > 0) {
      violations.push({
        type: 'inconsistent_claims',
        table: 'tasks',
        count: inconsistentClaims,
        description: 'Tasks claimed by offline agents',
        severity: 'low',
        fixQuery: `
          UPDATE tasks SET claimed_by = NULL, status = 'AVAILABLE'
          WHERE claimed_by IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM agent_presence
            WHERE agent_letter = claimed_by
            AND status IN ('ONLINE', 'IDLE')
          )
        `
      });
    }

    // Inconsistent task status and timestamps
    const inconsistentStatus = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'COMPLETE' AND completed_at IS NULL
         OR status = 'CLAIMED' AND started_at IS NULL
         OR status IN ('AVAILABLE', 'FAILED', 'CANCELLED')
            AND (claimed_by IS NOT NULL OR started_at IS NOT NULL)
    `).get().count;

    if (inconsistentStatus > 0) {
      violations.push({
        type: 'inconsistent_status',
        table: 'tasks',
        count: inconsistentStatus,
        description: 'Task status inconsistent with timestamps',
        severity: 'medium',
        fixQuery: `
          UPDATE tasks SET
            completed_at = CASE
              WHEN status = 'COMPLETE' AND completed_at IS NULL
              THEN updated_at ELSE completed_at END,
            started_at = CASE
              WHEN status = 'CLAIMED' AND started_at IS NULL
              THEN updated_at ELSE started_at END,
            claimed_by = CASE
              WHEN status IN ('AVAILABLE', 'FAILED', 'CANCELLED')
              THEN NULL ELSE claimed_by END
          WHERE status = 'COMPLETE' AND completed_at IS NULL
             OR status = 'CLAIMED' AND started_at IS NULL
             OR status IN ('AVAILABLE', 'FAILED', 'CANCELLED')
                AND (claimed_by IS NOT NULL OR started_at IS NOT NULL)
        `
      });
    }

    return violations;
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(db: any): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // Tasks table without proper indexes
    const missingIndexes = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_index_list('tasks')
      WHERE name NOT LIKE 'sqlite_%'
    `).get().count;

    if (missingIndexes < 6) { // We expect at least 6 indexes
      violations.push({
        type: 'missing_indexes',
        table: 'tasks',
        count: 6 - missingIndexes,
        description: 'Missing recommended indexes on tasks table',
        severity: 'low',
        fixQuery: `
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
          CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
          CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
          CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
          CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
        `
      });
    }

    return violations;
  }

  /**
   * Generate integrity report
   */
  private generateReport(violations: IntegrityViolation[]): IntegrityReport {
    const totalViolations = violations.reduce((sum, v) => sum + v.count, 0);

    const violationsBySeverity = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + v.count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= (violationsBySeverity.critical || 0) * 25;
    healthScore -= (violationsBySeverity.high || 0) * 10;
    healthScore -= (violationsBySeverity.medium || 0) * 5;
    healthScore -= (violationsBySeverity.low || 0) * 1;
    healthScore = Math.max(0, healthScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations);

    return {
      timestamp: Date.now(),
      totalViolations,
      violationsBySeverity,
      violations,
      healthScore,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: IntegrityViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.severity === 'critical')) {
      recommendations.push('🚨 CRITICAL: Address critical integrity violations immediately');
    }

    if (violations.some(v => v.type === 'orphaned_tasks')) {
      recommendations.push('🔧 Run orphaned task cleanup to ensure data consistency');
    }

    if (violations.some(v => v.type === 'invalid_task_status')) {
      recommendations.push('🔧 Validate and fix invalid task status values');
    }

    if (violations.some(v => v.type === 'duplicate_tracking_ids')) {
      recommendations.push('🔧 Resolve duplicate agent tracking IDs');
    }

    if (violations.some(v => v.type === 'missing_indexes')) {
      recommendations.push('⚡ Add missing database indexes for better performance');
    }

    if (violations.some(v => v.severity === 'high')) {
      recommendations.push('⚠️ HIGH: Review and fix high-priority integrity issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Database integrity is excellent - no issues found');
    }

    return recommendations;
  }

  /**
   * Fix specific violations automatically
   */
  async fixViolations(violationTypes: string[]): Promise<void> {
    const dbFactory = getDatabase();
    let fixedCount = 0;

    await dbFactory.withTransaction((db) => {
      for (const violationType of violationTypes) {
        try {
          const result = db.exec(this.getFixQuery(violationType));
          fixedCount += result.changes || 0;
          logger.info(`🔧 Fixed ${result.changes || 0} violations of type: ${violationType}`);
        } catch (error) {
          logger.error(`❌ Failed to fix violations of type ${violationType}:`, error);
        }
      }
    });

    if (fixedCount > 0) {
      logger.info(`✅ Fixed ${fixedCount} integrity violations`);
      // Re-run validation to verify fixes
      await this.runValidation();
    }
  }

  /**
   * Get fix query for violation type
   */
  private getFixQuery(violationType: string): string {
    const fixQueries: Record<string, string> = {
      orphaned_tasks: `
        UPDATE tasks SET project_id = 'localbrain'
        WHERE project_id NOT IN (SELECT id FROM projects)
      `,
      orphaned_agent_activity: `
        DELETE FROM agent_activity
        WHERE session_id NOT IN (SELECT id FROM agent_sessions)
      `,
      orphaned_task_history: `
        DELETE FROM task_history
        WHERE task_id NOT IN (SELECT id FROM tasks)
      `,
      invalid_agent_presence: `
        UPDATE agent_presence
        SET current_session_id = NULL
        WHERE current_session_id NOT IN (SELECT id FROM agent_sessions)
      `,
      invalid_task_status: `
        UPDATE tasks SET status = 'AVAILABLE'
        WHERE status NOT IN (
          'AVAILABLE', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED',
          'COMPLETE', 'FAILED', 'CANCELLED'
        )
      `,
      invalid_priority: `
        UPDATE tasks SET priority = 3
        WHERE priority < 1 OR priority > 5
      `,
      negative_values: `
        UPDATE tasks SET
          velocity = ABS(velocity),
          estimated_hours = ABS(estimated_hours),
          actual_minutes = ABS(actual_minutes)
        WHERE velocity < 0 OR estimated_hours < 0 OR actual_minutes < 0
      `,
      missing_indexes: `
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
        CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
        CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
      `,
    };

    return fixQueries[violationType] || '';
  }

  /**
   * Get last integrity report
   */
  getLastReport(): IntegrityReport | null {
    return this.lastReport;
  }

  /**
   * Export integrity data for analysis
   */
  exportIntegrityData(): {
    lastReport: IntegrityReport | null;
    monitoringStatus: boolean;
    timestamp: number;
  } {
    return {
      lastReport: this.lastReport,
      monitoringStatus: this.isMonitoring,
      timestamp: Date.now(),
    };
  }
}

/**
 * Global integrity validator instance
 */
let globalValidator: DatabaseIntegrityValidator | null = null;

/**
 * Initialize the global integrity validator
 */
export function initializeDatabaseIntegrityValidator(): DatabaseIntegrityValidator {
  if (globalValidator) {
    return globalValidator;
  }

  globalValidator = new DatabaseIntegrityValidator();
  return globalValidator;
}

/**
 * Get the global integrity validator
 */
export function getDatabaseIntegrityValidator(): DatabaseIntegrityValidator {
  if (!globalValidator) {
    throw new Error('Database integrity validator not initialized');
  }
  return globalValidator;
}

export default DatabaseIntegrityValidator;