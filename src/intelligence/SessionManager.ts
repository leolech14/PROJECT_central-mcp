/**
 * SessionManager - Manages agent connection sessions
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface AgentSession {
  id: string;
  agent_letter: string;
  agent_model: string;
  project_id: string;
  connected_at: string;
  disconnected_at: string | null;
  last_heartbeat: string;
  machine_id: string | null;
  session_duration_minutes: number | null;
  total_queries: number;
  tasks_claimed: number;
  tasks_completed: number;
  status: 'ACTIVE' | 'IDLE' | 'DISCONNECTED';
}

export class SessionManager {
  constructor(private db: Database.Database) {}

  /**
   * Create new agent session
   */
  createSession(params: {
    agent: string;
    model: string;
    project: string;
    machineId?: string;
  }): AgentSession {
    // Check for existing active session
    const existingSession = this.db.prepare(`
      SELECT id FROM agent_sessions
      WHERE agent_letter = ? AND status = 'ACTIVE'
    `).get(params.agent) as { id: string } | undefined;

    // Close existing session if found
    if (existingSession) {
      console.log(`⚠️  Agent ${params.agent} already has active session ${existingSession.id}, closing it...`);
      this.closeSession(existingSession.id);
    }

    const sessionId = uuidv4();
    const now = new Date().toISOString();

    // Create new session
    this.db.prepare(`
      INSERT INTO agent_sessions (
        id, agent_letter, agent_model, project_id, connected_at, last_heartbeat, machine_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(sessionId, params.agent, params.model, params.project, now, now, params.machineId || null);

    // Update presence
    this.db.prepare(`
      UPDATE agent_presence SET
        status = 'ONLINE',
        current_session_id = ?,
        last_seen = ?,
        online_since = ?,
        total_sessions_today = total_sessions_today + 1
      WHERE agent_letter = ?
    `).run(sessionId, now, now, params.agent);

    // Log activity
    this.logActivity(sessionId, params.agent, 'CONNECT', null, {
      model: params.model,
      project: params.project,
      machineId: params.machineId
    });

    return this.getSession(sessionId)!;
  }

  /**
   * Update heartbeat for session
   */
  updateHeartbeat(sessionId: string, currentActivity?: string): void {
    const now = new Date().toISOString();

    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update session heartbeat
    this.db.prepare(`
      UPDATE agent_sessions SET
        last_heartbeat = ?,
        status = ?
      WHERE id = ?
    `).run(now, currentActivity === 'IDLE' ? 'IDLE' : 'ACTIVE', sessionId);

    // Update presence
    this.db.prepare(`
      UPDATE agent_presence SET
        last_seen = ?,
        status = ?
      WHERE agent_letter = ?
    `).run(now, currentActivity === 'IDLE' ? 'IDLE' : 'ONLINE', session.agent_letter);

    // Log heartbeat
    this.logActivity(sessionId, session.agent_letter, 'HEARTBEAT', null, { currentActivity });
  }

  /**
   * Close session
   */
  closeSession(sessionId: string): void {
    const now = new Date().toISOString();

    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Calculate session duration
    const connectedAt = new Date(session.connected_at);
    const disconnectedAt = new Date(now);
    const durationMinutes = Math.floor((disconnectedAt.getTime() - connectedAt.getTime()) / 60000);

    // Update session
    this.db.prepare(`
      UPDATE agent_sessions SET
        disconnected_at = ?,
        session_duration_minutes = ?,
        status = 'DISCONNECTED'
      WHERE id = ?
    `).run(now, durationMinutes, sessionId);

    // Update presence
    this.db.prepare(`
      UPDATE agent_presence SET
        status = 'OFFLINE',
        current_session_id = NULL,
        last_seen = ?,
        total_active_time_minutes = total_active_time_minutes + ?
      WHERE agent_letter = ?
    `).run(now, durationMinutes, session.agent_letter);

    // Log activity
    this.logActivity(sessionId, session.agent_letter, 'DISCONNECT', null, {
      duration_minutes: durationMinutes
    });

    // Update daily metrics
    this.updateDailyMetrics(session.agent_letter);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | null {
    return this.db.prepare(`
      SELECT * FROM agent_sessions WHERE id = ?
    `).get(sessionId) as AgentSession | null;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): AgentSession[] {
    return this.db.prepare(`
      SELECT * FROM agent_sessions
      WHERE status IN ('ACTIVE', 'IDLE')
      ORDER BY connected_at DESC
    `).all() as AgentSession[];
  }

  /**
   * Increment task claimed counter
   */
  incrementTasksClaimed(sessionId: string): void {
    this.db.prepare(`
      UPDATE agent_sessions SET
        total_queries = total_queries + 1,
        tasks_claimed = tasks_claimed + 1
      WHERE id = ?
    `).run(sessionId);
  }

  /**
   * Increment task completed counter
   */
  incrementTasksCompleted(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    this.db.prepare(`
      UPDATE agent_sessions SET
        tasks_completed = tasks_completed + 1
      WHERE id = ?
    `).run(sessionId);

    this.db.prepare(`
      UPDATE agent_presence SET
        tasks_today = tasks_today + 1
      WHERE agent_letter = ?
    `).run(session.agent_letter);
  }

  /**
   * Log activity
   */
  private logActivity(
    sessionId: string,
    agent: string,
    activityType: string,
    taskId: string | null,
    details?: any
  ): void {
    this.db.prepare(`
      INSERT INTO agent_activity (session_id, agent_letter, activity_type, task_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, agent, activityType, taskId, details ? JSON.stringify(details) : null);
  }

  /**
   * Update daily metrics for agent
   */
  private updateDailyMetrics(agent: string): void {
    const today = new Date().toISOString().split('T')[0];

    // Aggregate today's data
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(session_duration_minutes), 0) as total_active_minutes,
        COALESCE(SUM(tasks_claimed), 0) as tasks_claimed,
        COALESCE(SUM(tasks_completed), 0) as tasks_completed
      FROM agent_sessions
      WHERE agent_letter = ?
        AND DATE(connected_at) = ?
    `).get(agent, today) as any;

    const avgTaskMinutes = stats.tasks_completed > 0
      ? stats.total_active_minutes / stats.tasks_completed
      : null;

    const velocityScore = stats.total_active_minutes > 0
      ? (stats.tasks_completed / (stats.total_active_minutes / 60))
      : 0;

    // Insert or update metrics
    this.db.prepare(`
      INSERT INTO agent_metrics (
        agent_letter, metric_date, total_sessions, total_active_minutes,
        tasks_claimed, tasks_completed, average_task_minutes, velocity_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_letter, metric_date) DO UPDATE SET
        total_sessions = excluded.total_sessions,
        total_active_minutes = excluded.total_active_minutes,
        tasks_claimed = excluded.tasks_claimed,
        tasks_completed = excluded.tasks_completed,
        average_task_minutes = excluded.average_task_minutes,
        velocity_score = excluded.velocity_score
    `).run(
      agent,
      today,
      stats.total_sessions,
      stats.total_active_minutes,
      stats.tasks_claimed,
      stats.tasks_completed,
      avgTaskMinutes,
      velocityScore
    );
  }
}
