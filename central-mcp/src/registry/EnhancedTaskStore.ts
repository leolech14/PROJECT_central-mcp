/**
 * 🏊 ENHANCED TASK STORE WITH CONNECTION POOLING
 * ===============================================
 *
 * Enhanced TaskStore with connection pooling, performance monitoring,
 * and improved error handling for better robustness
 */

import type { Task, AgentId, TaskStatus } from '../types/Task.js';
import { logger } from '../utils/logger.js';
import { getDatabase } from '../database/DatabaseFactory.js';
import { getDatabaseMonitor } from '../database/DatabaseMonitor.js';

export class EnhancedTaskStore {
  private dbFactory = getDatabase();
  private monitor = getDatabaseMonitor();

  /**
   * Get all tasks with connection pooling
   */
  async getAllTasks(): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare('SELECT * FROM tasks ORDER BY id');
      const rows = stmt.all() as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Get task by ID with connection pooling
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
      const row = stmt.get(taskId) as any;
      return row ? this.rowToTask(row) : null;
    });
  }

  /**
   * Get tasks by status with connection pooling
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY id');
      const rows = stmt.all(status) as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Get tasks by agent with connection pooling
   */
  async getTasksByAgent(agent: AgentId): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare('SELECT * FROM tasks WHERE agent = ? ORDER BY id');
      const rows = stmt.all(agent) as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Get available tasks for a specific agent
   */
  async getAvailableTasks(agent: AgentId, limit: number = 50): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare(`
        SELECT * FROM tasks
        WHERE status = 'AVAILABLE'
        AND (agent = ? OR agent = 'ANY')
        ORDER BY priority ASC, id ASC
        LIMIT ?
      `);
      const rows = stmt.all(agent, limit) as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byAgent: Record<AgentId, number>;
    completionRate: number;
    averageVelocity: number;
  }> {
    return this.dbFactory.withConnection((db) => {
      // Total tasks
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
      const { count: total } = totalStmt.get() as { count: number };

      // By status
      const statusStmt = db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
      const statusRows = statusStmt.all() as { status: TaskStatus; count: number }[];
      const byStatus = statusRows.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<TaskStatus, number>);

      // By agent
      const agentStmt = db.prepare('SELECT agent, COUNT(*) as count FROM tasks GROUP BY agent');
      const agentRows = agentStmt.all() as { agent: AgentId; count: number }[];
      const byAgent = agentRows.reduce((acc, row) => {
        acc[row.agent] = row.count;
        return acc;
      }, {} as Record<AgentId, number>);

      // Completion rate
      const completed = byStatus.COMPLETE || 0;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Average velocity
      const velocityStmt = db.prepare(`
        SELECT AVG(velocity) as avg_velocity
        FROM tasks
        WHERE velocity IS NOT NULL
        AND status = 'COMPLETE'
      `);
      const { avg_velocity: averageVelocity } = velocityStmt.get() as { avg_velocity: number };

      return {
        total,
        byStatus,
        byAgent,
        completionRate,
        averageVelocity: averageVelocity || 0,
      };
    });
  }

  /**
   * Upsert task with transaction support
   */
  async upsertTask(task: Task): Promise<void> {
    await this.dbFactory.withTransaction((db) => {
      const stmt = db.prepare(`
        INSERT INTO tasks (
          id, name, agent, status, priority, phase, timeline,
          dependencies, deliverables, acceptance_criteria, location,
          claimed_by, started_at, completed_at, files_created,
          velocity, estimated_hours, actual_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          agent = excluded.agent,
          status = excluded.status,
          priority = excluded.priority,
          phase = excluded.phase,
          timeline = excluded.timeline,
          dependencies = excluded.dependencies,
          deliverables = excluded.deliverables,
          acceptance_criteria = excluded.acceptance_criteria,
          location = excluded.location,
          claimed_by = excluded.claimed_by,
          started_at = excluded.started_at,
          completed_at = excluded.completed_at,
          files_created = excluded.files_created,
          velocity = excluded.velocity,
          estimated_hours = excluded.estimated_hours,
          actual_minutes = excluded.actual_minutes,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        task.id,
        task.name,
        task.agent,
        task.status,
        task.priority,
        task.phase,
        task.timeline,
        JSON.stringify(task.dependencies),
        JSON.stringify(task.deliverables),
        JSON.stringify(task.acceptanceCriteria),
        task.location,
        task.claimedBy || null,
        task.startedAt || null,
        task.completedAt || null,
        task.filesCreated ? JSON.stringify(task.filesCreated) : null,
        task.velocity || null,
        task.estimatedHours || null,
        task.actualMinutes || null
      );

      logger.debug(`📝 Upserted task: ${task.id}`);
    });
  }

  /**
   * Update task status with atomic transaction
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    agent: AgentId
  ): Promise<boolean> {
    return this.dbFactory.withTransaction((db) => {
      const task = this.getTaskSync(db, taskId);
      if (!task) {
        logger.warn(`⚠️ Task not found: ${taskId}`);
        return false;
      }

      const oldStatus = task.status;

      // Update task
      const stmt = db.prepare(`
        UPDATE tasks
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newStatus, taskId);

      // Record history
      const historyStmt = db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'status_change', oldStatus, newStatus);

      logger.info(`✅ Task ${taskId}: ${oldStatus} → ${newStatus} (by ${agent})`);
      return true;
    });
  }

  /**
   * Claim task with atomic transaction and race condition protection
   */
  async claimTask(taskId: string, agent: AgentId): Promise<boolean> {
    return this.dbFactory.withTransaction((db) => {
      const task = this.getTaskSync(db, taskId);
      if (!task) {
        logger.warn(`⚠️ Task not found: ${taskId}`);
        return false;
      }

      if (task.status !== 'AVAILABLE') {
        logger.warn(`⚠️ Task ${taskId} not available (status: ${task.status})`);
        return false;
      }

      if (task.claimedBy && task.claimedBy !== agent) {
        logger.warn(`⚠️ Task ${taskId} already claimed by ${task.claimedBy}`);
        return false;
      }

      const stmt = db.prepare(`
        UPDATE tasks
        SET status = ?, claimed_by = ?, started_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = ?
      `);
      const now = new Date().toISOString();
      const result = stmt.run('CLAIMED', agent, now, taskId, 'AVAILABLE');

      if (result.changes === 0) {
        throw new Error('Race condition: task no longer available');
      }

      // Record history
      const historyStmt = db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'claim', 'AVAILABLE', 'CLAIMED');

      logger.info(`🎯 Task ${taskId} claimed by Agent ${agent}`);
      return true;
    });
  }

  /**
   * Complete task with atomic transaction
   */
  async completeTask(
    taskId: string,
    agent: AgentId,
    filesCreated?: string[],
    velocity?: number
  ): Promise<boolean> {
    return this.dbFactory.withTransaction((db) => {
      const task = this.getTaskSync(db, taskId);
      if (!task) {
        logger.warn(`⚠️ Task not found: ${taskId}`);
        return false;
      }

      if (task.claimedBy !== agent) {
        logger.warn(`⚠️ Task ${taskId} not claimed by ${agent}`);
        return false;
      }

      const stmt = db.prepare(`
        UPDATE tasks
        SET status = ?, completed_at = ?, files_created = ?, velocity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const now = new Date().toISOString();
      stmt.run(
        'COMPLETE',
        now,
        filesCreated ? JSON.stringify(filesCreated) : null,
        velocity || null,
        taskId
      );

      // Record history
      const historyStmt = db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'complete', task.status, 'COMPLETE');

      logger.info(`✅ Task ${taskId} completed by Agent ${agent}${velocity ? ` (${velocity}% velocity)` : ''}`);
      return true;
    });
  }

  /**
   * Get task history
   */
  async getTaskHistory(taskId: string): Promise<any[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare(`
        SELECT * FROM task_history
        WHERE task_id = ?
        ORDER BY timestamp DESC
      `);
      return stmt.all(taskId) as any[];
    });
  }

  /**
   * Get tasks that are blocked by dependencies
   */
  async getBlockedTasks(): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare(`
        SELECT * FROM tasks
        WHERE status = 'BLOCKED'
        OR (dependencies != '[]' AND dependencies IS NOT NULL)
        ORDER BY priority ASC, id ASC
      `);
      const rows = stmt.all() as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Get agent workload
   */
  async getAgentWorkload(agent: AgentId): Promise<{
    total: number;
    claimed: number;
    completed: number;
    inProgress: number;
    averageVelocity: number;
  }> {
    return this.dbFactory.withConnection((db) => {
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE agent = ?');
      const { count: total } = totalStmt.get(agent) as { count: number };

      const claimedStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE claimed_by = ?');
      const { count: claimed } = claimedStmt.get(agent) as { count: number };

      const completedStmt = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE claimed_by = ? AND status = 'COMPLETE'
      `);
      const { count: completed } = completedStmt.get(agent) as { count: number };

      const inProgressStmt = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE claimed_by = ? AND status = 'CLAIMED'
      `);
      const { count: inProgress } = inProgressStmt.get(agent) as { count: number };

      const velocityStmt = db.prepare(`
        SELECT AVG(velocity) as avg_velocity
        FROM tasks
        WHERE claimed_by = ?
        AND velocity IS NOT NULL
        AND status = 'COMPLETE'
      `);
      const { avg_velocity: averageVelocity } = velocityStmt.get(agent) as { avg_velocity: number };

      return {
        total,
        claimed,
        completed,
        inProgress,
        averageVelocity: averageVelocity || 0,
      };
    });
  }

  /**
   * Search tasks by text content
   */
  async searchTasks(query: string, limit: number = 50): Promise<Task[]> {
    return this.dbFactory.withConnection((db) => {
      const stmt = db.prepare(`
        SELECT * FROM tasks
        WHERE (
          name LIKE ? OR
          location LIKE ? OR
          phase LIKE ? OR
          timeline LIKE ?
        )
        ORDER BY priority ASC, id ASC
        LIMIT ?
      `);
      const searchPattern = `%${query}%`;
      const rows = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, limit) as any[];
      return rows.map(this.rowToTask);
    });
  }

  /**
   * Synchronous task lookup for use within transactions
   */
  private getTaskSync(db: any, taskId: string): Task | null {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(taskId) as any;
    return row ? this.rowToTask(row) : null;
  }

  /**
   * Convert database row to Task object
   */
  private rowToTask(row: any): Task {
    // Safe JSON parse helper
    const safeParse = (value: any, fallback: any = []) => {
      if (!value || value === 'undefined' || value === 'null') return fallback;
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };

    return {
      id: row.id,
      name: row.title || row.name || 'Untitled',
      agent: row.agent as AgentId,
      status: row.status as TaskStatus,
      priority: row.priority || 3,
      phase: row.phase || 'implementation',
      timeline: row.timeline || 'TBD',
      dependencies: safeParse(row.dependencies, []),
      deliverables: safeParse(row.deliverables, []),
      acceptanceCriteria: safeParse(row.acceptance_criteria, []),
      location: row.location || row.category || 'general',
      claimedBy: row.claimed_by || undefined,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      filesCreated: safeParse(row.files_created, undefined),
      velocity: row.velocity || undefined,
      estimatedHours: row.estimated_hours || undefined,
      actualMinutes: row.actual_minutes || undefined
    };
  }

  /**
   * Get database performance metrics
   */
  getPerformanceMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    return this.monitor.getRecommendations();
  }
}

export default EnhancedTaskStore;