/**
 * Task Store (Persistent Storage)
 * ================================
 *
 * SQLite-based storage for task registry.
 * Provides atomic operations and transaction support.
 */

import Database from 'better-sqlite3';
import type { Task, AgentId, TaskStatus } from '../types/Task.js';
import { logger } from '../utils/logger.js';

export class TaskStore {
  private db: Database.Database;

  constructor(dbPath: string = './data/registry.db') {
    logger.info(`📂 Initializing TaskStore at: ${dbPath}`);
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        agent TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        phase TEXT NOT NULL,
        timeline TEXT NOT NULL,
        dependencies TEXT NOT NULL,
        deliverables TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL,
        location TEXT NOT NULL,
        claimed_by TEXT,
        started_at TEXT,
        completed_at TEXT,
        files_created TEXT,
        velocity REAL,
        estimated_hours REAL,
        actual_minutes REAL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
      CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);

      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        action TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES tasks(id)
      );

      CREATE INDEX IF NOT EXISTS idx_history_task_id ON task_history(task_id);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON task_history(timestamp);
    `);

    logger.info('✅ Database schema initialized');
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY id');
    const rows = stmt.all() as any[];
    return rows.map(this.rowToTask);
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(taskId) as any;
    return row ? this.rowToTask(row) : null;
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY id');
    const rows = stmt.all(status) as any[];
    return rows.map(this.rowToTask);
  }

  /**
   * Get tasks by agent
   */
  getTasksByAgent(agent: AgentId): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE agent = ? ORDER BY id');
    const rows = stmt.all(agent) as any[];
    return rows.map(this.rowToTask);
  }

  /**
   * Upsert task (insert or update)
   */
  upsertTask(task: Task): void {
    const stmt = this.db.prepare(`
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
  }

  /**
   * Update task status (atomic)
   */
  updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    agent: AgentId
  ): boolean {
    const task = this.getTask(taskId);
    if (!task) {
      logger.warn(`⚠️ Task not found: ${taskId}`);
      return false;
    }

    const oldStatus = task.status;

    // Begin transaction
    const updateTask = this.db.transaction(() => {
      // Update task
      const stmt = this.db.prepare(`
        UPDATE tasks
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newStatus, taskId);

      // Record history
      const historyStmt = this.db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'status_change', oldStatus, newStatus);
    });

    updateTask();

    logger.info(`✅ Task ${taskId}: ${oldStatus} → ${newStatus} (by ${agent})`);
    return true;
  }

  /**
   * Claim task (atomic)
   */
  claimTask(taskId: string, agent: AgentId): boolean {
    const task = this.getTask(taskId);
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

    // Begin transaction
    const claim = this.db.transaction(() => {
      const stmt = this.db.prepare(`
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
      const historyStmt = this.db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'claim', 'AVAILABLE', 'CLAIMED');
    });

    try {
      claim();
      logger.info(`🎯 Task ${taskId} claimed by Agent ${agent}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to claim task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Complete task (atomic)
   */
  completeTask(
    taskId: string,
    agent: AgentId,
    filesCreated?: string[],
    velocity?: number
  ): boolean {
    const task = this.getTask(taskId);
    if (!task) {
      logger.warn(`⚠️ Task not found: ${taskId}`);
      return false;
    }

    if (task.claimedBy !== agent) {
      logger.warn(`⚠️ Task ${taskId} not claimed by ${agent}`);
      return false;
    }

    // Begin transaction
    const complete = this.db.transaction(() => {
      const stmt = this.db.prepare(`
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
      const historyStmt = this.db.prepare(`
        INSERT INTO task_history (task_id, agent, action, old_status, new_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(taskId, agent, 'complete', task.status, 'COMPLETE');
    });

    complete();

    logger.info(`✅ Task ${taskId} completed by Agent ${agent}${velocity ? ` (${velocity}% velocity)` : ''}`);
    return true;
  }

  /**
   * Get task history
   */
  getTaskHistory(taskId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM task_history
      WHERE task_id = ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(taskId) as any[];
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
   * Get database instance
   */
  getDatabase(): import('better-sqlite3').Database {
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('📂 Database connection closed');
  }
}
