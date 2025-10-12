/**
 * Loop 4: Progress Auto-Monitoring (EVENT-DRIVEN VERSION)
 * =========================================================
 *
 * THE VIGILANT WATCHER - Now with instant reactions!
 *
 * MULTI-TRIGGER ARCHITECTURE:
 * 1. TIME: Every 30s - Heartbeat checks, stale detection
 * 2. EVENT: Instant reactions to:
 *    - TASK_PROGRESS_UPDATED → Update metrics instantly
 *    - TASK_CLAIMED → Start tracking agent activity
 *    - TASK_COMPLETED → Check for unblocking
 *    - AGENT_HEARTBEAT → Update activity tracking
 * 3. MANUAL: API-triggered monitoring
 *
 * Performance impact:
 * - Progress updates: 30s delay → <100ms (300x faster!)
 * - Blocked task detection: 30s delay → instant (when deps complete)
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { BaseLoop, LoopTriggerConfig, LoopExecutionContext } from './BaseLoop.js';
import { LoopEvent } from './EventBus.js';

export interface ProgressMonitoringConfig {
  intervalSeconds: number;           // How often to run (default: 30)
  staleThresholdMinutes: number;     // Consider session stale after (default: 5)
  abandonThresholdMinutes: number;   // Auto-release task after (default: 10)
  autoRelease: boolean;              // Actually release or just alert (default: true)
  autoUnblock: boolean;              // Auto-unblock when deps met (default: true)
}

export class ProgressMonitoringLoop extends BaseLoop {
  private config: ProgressMonitoringConfig;
  private sessionsMonitored: number = 0;
  private tasksReleased: number = 0;
  private tasksUnblocked: number = 0;

  constructor(db: Database.Database, config: ProgressMonitoringConfig) {
    // Configure multi-trigger architecture
    const triggerConfig: LoopTriggerConfig = {
      // TIME: Periodic heartbeat monitoring
      time: {
        enabled: true,
        intervalSeconds: config.intervalSeconds
      },

      // EVENT: Instant reactions to task/agent activity
      events: {
        enabled: true,
        triggers: [
          LoopEvent.TASK_PROGRESS_UPDATED,   // Progress update → instant metrics refresh
          LoopEvent.TASK_CLAIMED,             // Task claimed → start monitoring
          LoopEvent.TASK_COMPLETED,           // Task completed → check unblocking
          LoopEvent.AGENT_HEARTBEAT,          // Agent activity → update tracking
          LoopEvent.DEPENDENCIES_UNBLOCKED    // Dependencies met → verify unblocking
        ],
        priority: 'normal'
      },

      // MANUAL: Support API-triggered monitoring
      manual: {
        enabled: true
      }
    };

    super(db, 4, 'Progress Auto-Monitoring', triggerConfig);
    this.config = config;

    logger.info(`🏗️  Loop 4: Multi-trigger architecture configured`);
    logger.info(`   Stale threshold: ${config.staleThresholdMinutes}min`);
    logger.info(`   Abandon threshold: ${config.abandonThresholdMinutes}min`);
  }

  /**
   * Execute monitoring (called by BaseLoop for all trigger types)
   */
  protected async execute(context: LoopExecutionContext): Promise<void> {
    const startTime = Date.now();

    logger.info(`👁️  Loop 4 Execution #${this.executionCount} (${context.trigger})`);

    try {
      // Event-triggered monitoring: focused checks
      if (context.trigger === 'event') {
        await this.handleEventTriggeredMonitoring(context);
        return;
      }

      // Time/Manual triggered: full monitoring cycle
      await this.runFullMonitoringCycle(startTime);

    } catch (err: any) {
      logger.error(`❌ Loop 4 Error:`, err);
    }
  }

  /**
   * Handle event-triggered monitoring (focused, fast)
   */
  private async handleEventTriggeredMonitoring(context: LoopExecutionContext): Promise<void> {
    const event = context.event!;
    const payload = context.payload;

    logger.debug(`   Event: ${event} → Quick check`);

    switch (event) {
      case LoopEvent.TASK_PROGRESS_UPDATED:
        // Update metrics for specific task
        this.updateTaskMetrics(payload.taskId, payload.completionPercent);
        break;

      case LoopEvent.TASK_CLAIMED:
        // Start tracking agent activity
        this.trackAgentActivity(payload.agent, payload.taskId);
        break;

      case LoopEvent.TASK_COMPLETED:
        // Check if this completion unblocks other tasks
        if (this.config.autoUnblock) {
          const unblocked = this.checkAndUnblockTasks();
          if (unblocked > 0) {
            logger.info(`   ✅ Event triggered ${unblocked} task(s) unblocked`);
          }
        }
        break;

      case LoopEvent.AGENT_HEARTBEAT:
        // Update heartbeat timestamp
        this.updateAgentHeartbeat(payload.agent, payload.timestamp);
        break;

      case LoopEvent.DEPENDENCIES_UNBLOCKED:
        // Verify unblocking was successful
        logger.info(`   ✅ ${payload.count} tasks unblocked via event`);
        break;
    }
  }

  /**
   * Run full monitoring cycle (time-based or manual)
   */
  private async runFullMonitoringCycle(startTime: number): Promise<void> {
    // Get all active sessions
    const activeSessions = this.getActiveSessions();
    this.sessionsMonitored += activeSessions.length;

    if (activeSessions.length === 0) {
      logger.info(`   No active sessions to monitor`);
      return;
    }

    logger.info(`   Monitoring ${activeSessions.length} active sessions`);

    let staleCount = 0;
    let releasedCount = 0;
    let unblockedCount = 0;

    for (const session of activeSessions) {
      // Parse timestamp (could be ISO string or unix timestamp)
      let lastHeartbeat;
      try {
        lastHeartbeat = new Date(session.last_heartbeat).getTime();
      } catch {
        lastHeartbeat = Date.now() - (10 * 60 * 1000); // Default to 10min ago
      }

      const timeSinceHeartbeat = Date.now() - lastHeartbeat;
      const minutesSince = timeSinceHeartbeat / (60 * 1000);

      // Check if stale (no heartbeat for 5+ minutes)
      if (minutesSince > this.config.staleThresholdMinutes) {
        staleCount++;
        logger.warn(`   ⚠️  STALE: Agent ${session.agent_letter} (${minutesSince.toFixed(1)}min)`);

        // Check if should auto-release (10+ minutes)
        if (minutesSince > this.config.abandonThresholdMinutes && this.config.autoRelease) {
          this.releaseAbandonedTasks(session.session_id);
          this.markSessionInactive(session.session_id);
          releasedCount++;
          this.tasksReleased++;
          logger.info(`   🔄 AUTO-RELEASED: Agent ${session.agent_letter} tasks (${minutesSince.toFixed(1)}min stale)`);
        }
      }
    }

    // Check for tasks that can be unblocked
    if (this.config.autoUnblock) {
      const unblocked = this.checkAndUnblockTasks();
      unblockedCount = unblocked;
      this.tasksUnblocked += unblocked;

      if (unblocked > 0) {
        logger.info(`   ✅ AUTO-UNBLOCKED: ${unblocked} tasks (dependencies met)`);
      }
    }

    // Update dashboard metrics
    this.updateDashboardMetrics({
      activeSessions: activeSessions.length,
      staleSessions: staleCount,
      tasksReleased: releasedCount,
      tasksUnblocked: unblockedCount
    });

    const duration = Date.now() - startTime;
    logger.info(`✅ Loop 4 Complete: ${activeSessions.length} sessions monitored in ${duration}ms`);

    // Log execution
    this.logLoopExecution({
      sessionsMonitored: activeSessions.length,
      staleDetected: staleCount,
      tasksReleased: releasedCount,
      tasksUnblocked: unblockedCount,
      durationMs: duration
    });
  }

  /**
   * Get active sessions
   */
  private getActiveSessions(): any[] {
    return this.db.prepare(`
      SELECT
        id as session_id,
        agent_letter,
        project_id,
        last_heartbeat
      FROM agent_sessions
      WHERE status = 'ACTIVE'
      ORDER BY datetime(last_heartbeat) DESC
    `).all();
  }

  /**
   * Update task metrics (event-triggered)
   */
  private updateTaskMetrics(taskId: string, completionPercent: number): void {
    try {
      this.db.prepare(`
        UPDATE tasks
        SET completion_percent = ?,
            updated_at = ?
        WHERE id = ?
      `).run(completionPercent, new Date().toISOString(), taskId);

      logger.debug(`   📊 Updated metrics for ${taskId}: ${completionPercent}%`);
    } catch (err) {
      // Table might not have completion_percent column yet
      logger.debug(`   Could not update task metrics: ${err}`);
    }
  }

  /**
   * Track agent activity (event-triggered)
   */
  private trackAgentActivity(agent: string, taskId: string): void {
    logger.debug(`   📌 Tracking Agent ${agent} activity on ${taskId}`);
    // Activity tracking happens via heartbeat events
  }

  /**
   * Update agent heartbeat (event-triggered)
   */
  private updateAgentHeartbeat(agent: string, timestamp: number): void {
    try {
      this.db.prepare(`
        UPDATE agent_sessions
        SET last_heartbeat = ?
        WHERE agent_letter = ?
        AND status = 'ACTIVE'
      `).run(new Date(timestamp).toISOString(), agent);

      logger.debug(`   💓 Heartbeat: Agent ${agent}`);
    } catch (err) {
      // Session might not exist yet
    }
  }

  /**
   * Release abandoned tasks
   */
  private releaseAbandonedTasks(sessionId: string): void {
    this.db.prepare(`
      UPDATE tasks
      SET status = 'pending',
          claimed_by = NULL,
          claimed_at = NULL
      WHERE claimed_by = ?
      AND status = 'in-progress'
    `).run(sessionId);
  }

  /**
   * Mark session as inactive
   */
  private markSessionInactive(sessionId: string): void {
    this.db.prepare(`
      UPDATE agent_sessions
      SET status = 'DISCONNECTED',
          disconnected_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), sessionId);
  }

  /**
   * Check and unblock tasks
   */
  private checkAndUnblockTasks(): number {
    // Get blocked tasks
    const blockedTasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status = 'blocked'
    `).all();

    let unblocked = 0;

    for (const task of blockedTasks as any[]) {
      if (this.areDependenciesMet(task)) {
        // Unblock task
        this.db.prepare(`
          UPDATE tasks
          SET status = 'pending'
          WHERE id = ?
        `).run(task.id);

        unblocked++;

        logger.info(`   🔓 UNBLOCKED: ${task.id} (dependencies completed)`);

        // Emit unblock event
        this.eventBus.emitLoopEvent(
          LoopEvent.TASK_UNBLOCKED,
          {
            taskId: task.id,
            unblockedAt: Date.now()
          },
          {
            priority: 'high',
            source: 'Loop 4'
          }
        );
      }
    }

    return unblocked;
  }

  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(task: any): boolean {
    if (!task.dependencies) return true;

    let deps: string[] = [];
    try {
      deps = JSON.parse(task.dependencies);
    } catch {
      return true;
    }

    if (deps.length === 0) return true;

    // Check all dependencies completed
    for (const depId of deps) {
      const dep = this.db.prepare(`
        SELECT status FROM tasks WHERE id = ?
      `).get(depId) as any;

      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Update dashboard metrics
   */
  private updateDashboardMetrics(metrics: any): void {
    // TODO: Update real-time dashboard
    // For now, just log
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
        'PROGRESS_MONITORING',
        'MONITOR_AND_UNBLOCK',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      // Table might not exist yet, ignore
    }
  }

  /**
   * Get loop statistics (extends BaseLoop stats)
   */
  getLoopStats(): any {
    return {
      ...this.getStats(),
      sessionsMonitored: this.sessionsMonitored,
      tasksReleased: this.tasksReleased,
      tasksUnblocked: this.tasksUnblocked
    };
  }
}
