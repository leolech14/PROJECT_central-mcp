/**
 * 📄 JSON-ENHANCED TASK STORE WITH MODERN JSON COLUMNS
 * =======================================================
 *
 * Enhanced TaskStore using proper JSON columns with validation,
 * performance optimization, and advanced querying capabilities
 */

import type { Task, AgentId, TaskStatus } from '../types/Task.js';
import { logger } from '../utils/logger.js';
import { getDatabase } from '../database/DatabaseFactory.js';
import { getDatabaseMonitor } from '../database/DatabaseMonitor.js';
import {
  safeJsonParse,
  safeJsonStringify,
  jsonExtract,
  jsonSet,
  jsonContains,
  jsonAddToArray,
  jsonRemoveFromArray,
  jsonArrayLength,
  jsonMerge,
  validateJsonSchema,
  CommonSchemas,
  createJsonQueryBuilder,
  getJsonPerformanceMonitor
} from '../database/JsonHelpers.js';

export class JsonTaskStore {
  private dbFactory = getDatabase();
  private monitor = getDatabaseMonitor();
  private jsonMonitor = getJsonPerformanceMonitor();
  private taskQueryBuilder = createJsonQueryBuilder('tasks', 'dependencies');

  /**
   * Get all tasks with optimized JSON handling
   */
  async getAllTasks(): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          ORDER BY priority ASC, id ASC
        `);
        const rows = stmt.all() as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getAllTasks', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error('❌ Failed to get all tasks:', error);
      throw error;
    }
  }

  /**
   * Get task by ID with JSON validation
   */
  async getTask(taskId: string): Promise<Task | null> {
    const startTime = Date.now();

    try {
      const task = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE id = ?
        `);
        const row = stmt.get(taskId) as any;
        return row ? this.rowToTask(row) : null;
      });

      this.jsonMonitor.recordOperation('getTask', Date.now() - startTime);
      return task;
    } catch (error) {
      logger.error(`❌ Failed to get task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks by status with JSON optimization
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE status = ?
          ORDER BY priority ASC, id ASC
        `);
        const rows = stmt.all(status) as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getTasksByStatus', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error(`❌ Failed to get tasks by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks by agent with JSON optimization
   */
  async getTasksByAgent(agent: AgentId): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE agent = ?
          ORDER BY priority ASC, id ASC
        `);
        const rows = stmt.all(agent) as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getTasksByAgent', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error(`❌ Failed to get tasks by agent ${agent}:`, error);
      throw error;
    }
  }

  /**
   * Get available tasks with dependency analysis
   */
  async getAvailableTasks(agent: AgentId, limit: number = 50): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        // Use JSON functions to find tasks without unmet dependencies
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE status = 'AVAILABLE'
          AND (agent = ? OR agent = 'ANY')
          AND (
            dependencies IS NULL
            OR dependencies = '[]'
            OR json_array_length(dependencies) = 0
            OR NOT EXISTS (
              SELECT 1 FROM tasks t2
              WHERE json_extract(dependencies, '$') LIKE '%' || t2.id || '%'
              AND t2.status != 'COMPLETE'
            )
          )
          ORDER BY priority ASC, id ASC
          LIMIT ?
        `);
        const rows = stmt.all(agent, limit) as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getAvailableTasks', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error(`❌ Failed to get available tasks for agent ${agent}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks that depend on a specific task
   */
  async getTasksDependingOn(taskId: string): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        // Use JSON contains to find dependent tasks
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE json_extract(dependencies, '$') LIKE '%' || ? || '%'
          ORDER BY priority ASC, id ASC
        `);
        const rows = stmt.all(taskId) as any[];
        return rows.filter(row => {
          const deps = safeJsonParse(row.dependencies, []);
          return deps.includes(taskId);
        }).map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getTasksDependingOn', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error(`❌ Failed to get tasks depending on ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get blocked tasks with dependency analysis
   */
  async getBlockedTasks(): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE status = 'BLOCKED'
          OR (
            dependencies IS NOT NULL
            AND dependencies != '[]'
            AND json_array_length(dependencies) > 0
            AND EXISTS (
              SELECT 1 FROM tasks t2
              WHERE json_extract(dependencies, '$') LIKE '%' || t2.id || '%'
              AND t2.status != 'COMPLETE'
            )
          )
          ORDER BY priority ASC, id ASC
        `);
        const rows = stmt.all() as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('getBlockedTasks', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error('❌ Failed to get blocked tasks:', error);
      throw error;
    }
  }

  /**
   * Search tasks by JSON content
   */
  async searchTasksByJson(jsonPath: string, value: any): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          SELECT
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, created_at, updated_at,
            project_id
          FROM tasks
          WHERE json_extract(?, ?) = ?
          ORDER BY priority ASC, id ASC
        `);

        const rows = stmt.all(jsonPath, jsonPath, value) as any[];
        return rows.map(this.rowToTask);
      });

      this.jsonMonitor.recordOperation('searchTasksByJson', Date.now() - startTime);
      return tasks;
    } catch (error) {
      logger.error(`❌ Failed to search tasks by JSON path ${jsonPath}:`, error);
      throw error;
    }
  }

  /**
   * Upsert task with JSON validation and optimization
   */
  async upsertTask(task: Task): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate JSON fields
      const dependenciesValidation = validateJsonSchema(
        safeJsonStringify(task.dependencies),
        CommonSchemas.TaskDependencies
      );

      const deliverablesValidation = validateJsonSchema(
        safeJsonStringify(task.deliverables),
        CommonSchemas.TaskDeliverables
      );

      if (!dependenciesValidation.valid) {
        throw new Error(`Invalid dependencies: ${dependenciesValidation.errors.join(', ')}`);
      }

      if (!deliverablesValidation.valid) {
        throw new Error(`Invalid deliverables: ${deliverablesValidation.errors.join(', ')}`);
      }

      await this.dbFactory.withTransaction((db) => {
        const stmt = db.prepare(`
          INSERT INTO tasks (
            id, name, agent, status, priority, phase, timeline,
            dependencies, deliverables, acceptance_criteria, location,
            claimed_by, started_at, completed_at, files_created,
            velocity, estimated_hours, actual_minutes, project_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          safeJsonStringify(task.dependencies),
          safeJsonStringify(task.deliverables),
          safeJsonStringify(task.acceptanceCriteria),
          task.location,
          task.claimedBy || null,
          task.startedAt || null,
          task.completedAt || null,
          task.filesCreated ? safeJsonStringify(task.filesCreated) : null,
          task.velocity || null,
          task.estimatedHours || null,
          task.actualMinutes || null,
          'localbrain' // Default project ID since Task interface doesn't have projectId
        );
      });

      this.jsonMonitor.recordOperation('upsertTask', Date.now() - startTime);
      logger.debug(`📝 Upserted task: ${task.id}`);
    } catch (error) {
      logger.error(`❌ Failed to upsert task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Update task status with JSON-aware dependency checking
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    agent: AgentId
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
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
          INSERT INTO task_history (task_id, agent, action, old_status, new_status, details)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const details = safeJsonStringify({
          timestamp: new Date().toISOString(),
          previousStatus: oldStatus,
          newStatus: newStatus,
          dependencies: task.dependencies,
          blockedBy: task.dependencies
        });

        historyStmt.run(taskId, agent, 'status_change', oldStatus, newStatus, details);

        // If task is completed, check for dependent tasks to unblock
        if (newStatus === 'COMPLETE') {
          this.updateDependentTasks(db, taskId);
        }

        logger.info(`✅ Task ${taskId}: ${oldStatus} → ${newStatus} (by ${agent})`);
        return true;
      });
    } catch (error) {
      logger.error(`❌ Failed to update task status ${taskId}:`, error);
      throw error;
    } finally {
      this.jsonMonitor.recordOperation('updateTaskStatus', Date.now() - startTime);
    }
  }

  /**
   * Add dependency to task
   */
  async addDependency(taskId: string, dependencyId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          UPDATE tasks
          SET dependencies = json_insert(
            COALESCE(dependencies, '[]'),
            '$[#]',
            ?
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(dependencyId, taskId);
      });

      this.jsonMonitor.recordOperation('addDependency', Date.now() - startTime);
      logger.debug(`🔗 Added dependency ${dependencyId} to task ${taskId}`);
    } catch (error) {
      logger.error(`❌ Failed to add dependency ${dependencyId} to task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Remove dependency from task
   */
  async removeDependency(taskId: string, dependencyId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          UPDATE tasks
          SET dependencies = (
            SELECT json_group_array(value)
            FROM json_each(dependencies)
            WHERE value != ?
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(dependencyId, taskId);
      });

      this.jsonMonitor.recordOperation('removeDependency', Date.now() - startTime);
      logger.debug(`🔗 Removed dependency ${dependencyId} from task ${taskId}`);
    } catch (error) {
      logger.error(`❌ Failed to remove dependency ${dependencyId} from task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Add deliverable to task
   */
  async addDeliverable(taskId: string, deliverable: any): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dbFactory.withConnection((db) => {
        const stmt = db.prepare(`
          UPDATE tasks
          SET deliverables = json_insert(
            COALESCE(deliverables, '[]'),
            '$[#]',
            ?
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(safeJsonStringify(deliverable), taskId);
      });

      this.jsonMonitor.recordOperation('addDeliverable', Date.now() - startTime);
      logger.debug(`📦 Added deliverable to task ${taskId}`);
    } catch (error) {
      logger.error(`❌ Failed to add deliverable to task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get task statistics with JSON analysis
   */
  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byAgent: Record<AgentId, number>;
    completionRate: number;
    averageVelocity: number;
    averageDependencyCount: number;
    averageDeliverableCount: number;
  }> {
    const startTime = Date.now();

    try {
      return await this.dbFactory.withConnection((db) => {
        // Basic stats
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

        // JSON statistics
        const jsonStatsStmt = db.prepare(`
          SELECT
            AVG(json_array_length(dependencies)) as avg_deps,
            AVG(json_array_length(deliverables)) as avg_deliverables
          FROM tasks
        `);
        const jsonStats = jsonStatsStmt.get() as {
          avg_deps: number;
          avg_deliverables: number;
        };

        return {
          total,
          byStatus,
          byAgent,
          completionRate,
          averageVelocity: averageVelocity || 0,
          averageDependencyCount: jsonStats.avg_deps || 0,
          averageDeliverableCount: jsonStats.avg_deliverables || 0,
        };
      });
    } catch (error) {
      logger.error('❌ Failed to get task statistics:', error);
      throw error;
    } finally {
      this.jsonMonitor.recordOperation('getTaskStats', Date.now() - startTime);
    }
  }

  /**
   * Update dependent tasks when a task is completed
   */
  private updateDependentTasks(db: any, completedTaskId: string): void {
    const dependentTasks = db.prepare(`
      SELECT id FROM tasks
      WHERE json_extract(dependencies, '$') LIKE '%' || ? || '%'
      AND status = 'BLOCKED'
    `).all(completedTaskId) as { id: string }[];

    for (const task of dependentTasks) {
      const dependencies = db.prepare(`
        SELECT dependencies FROM tasks WHERE id = ?
      `).get(task.id) as { dependencies: string } | undefined;

      const deps = safeJsonParse(dependencies, []);
      const updatedDeps = deps.filter((dep: string) => dep !== completedTaskId);

      db.prepare(`
        UPDATE tasks
        SET dependencies = ?, status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(safeJsonStringify(updatedDeps), task.id);

      logger.debug(`🔓 Unblocked task ${task.id} by completing dependency ${completedTaskId}`);
    }
  }

  /**
   * Synchronous task lookup for use within transactions
   */
  private getTaskSync(db: any, taskId: string): Task | null {
    const stmt = db.prepare(`
      SELECT
        id, name, agent, status, priority, phase, timeline,
        dependencies, deliverables, acceptance_criteria, location,
        claimed_by, started_at, completed_at, files_created,
        velocity, estimated_hours, actual_minutes, created_at, updated_at,
        project_id
      FROM tasks
      WHERE id = ?
    `);
    const row = stmt.get(taskId) as any;
    return row ? this.rowToTask(row) : null;
  }

  /**
   * Convert database row to Task object with enhanced JSON parsing
   */
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      name: row.title || row.name || 'Untitled',
      agent: row.agent as AgentId,
      status: row.status as TaskStatus,
      priority: row.priority || 3,
      phase: row.phase || 'implementation',
      timeline: row.timeline || 'TBD',
      dependencies: safeJsonParse(row.dependencies, []),
      deliverables: safeJsonParse(row.deliverables, []),
      acceptanceCriteria: safeJsonParse(row.acceptance_criteria, []),
      location: row.location || row.category || 'general',
      claimedBy: row.claimed_by || undefined,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      filesCreated: safeJsonParse(row.files_created, undefined),
      velocity: row.velocity || undefined,
      estimatedHours: row.estimated_hours || undefined,
      actualMinutes: row.actual_minutes || undefined,
      // projectId removed as Task interface doesn't have this property
    };
  }

  /**
   * Get JSON performance statistics
   */
  getJsonPerformanceStats() {
    return this.jsonMonitor.getStats();
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

  /**
   * Initialize the task store (placeholder for future initialization logic)
   */
  async initialize(): Promise<void> {
    logger.info('📄 JsonTaskStore initialized');
  }

  /**
   * Claim a task for an agent
   */
  async claimTask(taskId: string, agentId: AgentId): Promise<boolean> {
    try {
      return await this.dbFactory.withTransaction(async (db) => {
        const task = this.getTaskSync(db, taskId);
        if (!task) {
          logger.warn(`⚠️ Task not found: ${taskId}`);
          return false;
        }

        if (task.status !== 'AVAILABLE') {
          logger.warn(`⚠️ Task ${taskId} is not available for claiming (status: ${task.status})`);
          return false;
        }

        // Update task status and claim
        const stmt = db.prepare(`
          UPDATE tasks
          SET status = 'IN_PROGRESS', claimed_by = ?, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(agentId, taskId);

        logger.info(`✅ Task ${taskId} claimed by ${agentId}`);
        return true;
      });
    } catch (error) {
      logger.error(`❌ Failed to claim task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    agentId: AgentId,
    files?: string[],
    velocity?: number
  ): Promise<boolean> {
    try {
      return await this.dbFactory.withTransaction(async (db) => {
        const task = this.getTaskSync(db, taskId);
        if (!task) {
          logger.warn(`⚠️ Task not found: ${taskId}`);
          return false;
        }

        if (task.claimedBy !== agentId) {
          logger.warn(`⚠️ Task ${taskId} is not claimed by ${agentId}`);
          return false;
        }

        // Update task completion
        const stmt = db.prepare(`
          UPDATE tasks
          SET status = 'COMPLETE', completed_at = CURRENT_TIMESTAMP,
               files_created = ?, velocity = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(
          files ? JSON.stringify(files) : null,
          velocity || null,
          taskId
        );

        // Update dependent tasks
        this.updateDependentTasks(db, taskId);

        logger.info(`✅ Task ${taskId} completed by ${agentId}`);
        return true;
      });
    } catch (error) {
      logger.error(`❌ Failed to complete task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get agent workload (number of active tasks)
   */
  async getAgentWorkload(agentId: AgentId): Promise<{
    active: number;
    completed: number;
    totalClaimed: number;
  }> {
    try {
      return await this.dbFactory.withConnection((db) => {
        const activeStmt = db.prepare(`
          SELECT COUNT(*) as count FROM tasks
          WHERE claimed_by = ? AND status = 'IN_PROGRESS'
        `);
        const { count: active } = activeStmt.get(agentId) as { count: number };

        const completedStmt = db.prepare(`
          SELECT COUNT(*) as count FROM tasks
          WHERE claimed_by = ? AND status = 'COMPLETE'
        `);
        const { count: completed } = completedStmt.get(agentId) as { count: number };

        const totalStmt = db.prepare(`
          SELECT COUNT(*) as count FROM tasks
          WHERE claimed_by = ?
        `);
        const { count: totalClaimed } = totalStmt.get(agentId) as { count: number };

        return { active, completed, totalClaimed };
      });
    } catch (error) {
      logger.error(`❌ Failed to get agent workload for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get sprint metrics
   */
  async getSprintMetrics(): Promise<{
    totalTasks: number;
    completedTasks: number;
    averageVelocity: number;
    completionRate: number;
  }> {
    try {
      return await this.dbFactory.withConnection((db) => {
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
        const { count: totalTasks } = totalStmt.get() as { count: number };

        const completedStmt = db.prepare(`
          SELECT COUNT(*) as count, AVG(velocity) as avg_velocity
          FROM tasks WHERE status = 'COMPLETE'
        `);
        const completed = completedStmt.get() as { count: number; avg_velocity: number };

        return {
          totalTasks,
          completedTasks: completed.count || 0,
          averageVelocity: completed.avg_velocity || 0,
          completionRate: totalTasks > 0 ? ((completed.count || 0) / totalTasks) * 100 : 0
        };
      });
    } catch (error) {
      logger.error('❌ Failed to get sprint metrics:', error);
      throw error;
    }
  }

  /**
   * Get registry metrics
   */
  async getRegistryMetrics(): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalProjects: number;
    healthySystems: number;
  }> {
    try {
      return await this.dbFactory.withConnection((db) => {
        // Agent metrics
        const agentStmt = db.prepare('SELECT COUNT(DISTINCT claimed_by) as count FROM tasks WHERE claimed_by IS NOT NULL');
        const { count: totalAgents } = agentStmt.get() as { count: number };

        const activeAgentStmt = db.prepare(`
          SELECT COUNT(DISTINCT claimed_by) as count FROM tasks
          WHERE claimed_by IS NOT NULL AND status = 'IN_PROGRESS'
        `);
        const { count: activeAgents } = activeAgentStmt.get() as { count: number };

        // Project metrics
        const projectStmt = db.prepare('SELECT COUNT(DISTINCT project_id) as count FROM tasks');
        const { count: totalProjects } = projectStmt.get() as { count: number };

        return {
          totalAgents,
          activeAgents,
          totalProjects,
          healthySystems: 1 // Placeholder - would need actual health monitoring
        };
      });
    } catch (error) {
      logger.error('❌ Failed to get registry metrics:', error);
      throw error;
    }
  }

  /**
   * Close the task store and cleanup resources
   */
  async close(): Promise<void> {
    try {
      logger.info('📄 JsonTaskStore closing...');
      // Database cleanup is handled by DatabaseFactory
      this.jsonMonitor.cleanup?.();
      logger.info('✅ JsonTaskStore closed');
    } catch (error) {
      logger.error('❌ Failed to close JsonTaskStore:', error);
      throw error;
    }
  }
}

export default JsonTaskStore;