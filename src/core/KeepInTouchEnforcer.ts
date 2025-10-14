/**
 * Keep-In-Touch Enforcer
 * =======================
 *
 * CRITICAL COMPONENT: Enforces completion permission gating
 *
 * Features:
 * - Session management with check-in tracking
 * - Completion permission gating (BLOCKS completion!)
 * - Auto-approval after timeout
 * - Missed check-in detection
 * - Human oversight integration
 *
 * T013 - CRITICAL PATH - KEEP HUMAN IN THE LOOP
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface KITSession {
  id: string;
  agentId: string;
  projectId: string;
  taskId: string | null;
  startedAt: string;
  lastCheckIn: string;
  checkInInterval: number; // seconds
  missedCheckIns: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  completionPermissionRequired: boolean;
}

export interface CompletionPermission {
  id: string;
  sessionId: string;
  taskId: string;
  agentId: string;
  requestedAt: string;
  status: 'PENDING' | 'GRANTED' | 'DENIED';
  grantedAt: string | null;
  grantedBy: string | null; // 'AUTO' or human user ID
  reason: string | null;
  autoApproveAfter: number; // seconds
}

export interface PermissionResult {
  granted: boolean;
  blocked?: boolean;
  reason?: string;
  message?: string;
  requiredAction?: string;
  retryAfter?: number; // seconds
  permission?: CompletionPermission;
}

export interface CheckInStatus {
  currentActivity: string;
  progress: number; // 0-100
  blockers?: string[];
}

export class KeepInTouchEnforcer {
  constructor(private db: Database.Database) {
    this.createTables();
  }

  /**
   * Create Keep-in-Touch tables
   */
  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kit_sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        task_id TEXT,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_check_in TEXT NOT NULL DEFAULT (datetime('now')),
        check_in_interval INTEGER DEFAULT 1800,
        missed_check_ins INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
        completion_permission_required INTEGER DEFAULT 1,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS completion_permissions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        requested_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'GRANTED', 'DENIED')),
        granted_at TEXT,
        granted_by TEXT,
        reason TEXT,
        auto_approve_after INTEGER DEFAULT 60,
        FOREIGN KEY (session_id) REFERENCES kit_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_kit_agent ON kit_sessions(agent_id);
      CREATE INDEX IF NOT EXISTS idx_kit_status ON kit_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_kit_check_in ON kit_sessions(last_check_in);
      CREATE INDEX IF NOT EXISTS idx_permissions_status ON completion_permissions(status);
      CREATE INDEX IF NOT EXISTS idx_permissions_task ON completion_permissions(task_id);
    `);
  }

  /**
   * Create Keep-in-Touch session
   */
  createSession(agentId: string, projectId: string, taskId?: string): KITSession {
    const session: KITSession = {
      id: uuidv4(),
      agentId,
      projectId,
      taskId: taskId || null,
      startedAt: new Date().toISOString(),
      lastCheckIn: new Date().toISOString(),
      checkInInterval: 1800, // 30 minutes
      missedCheckIns: 0,
      status: 'ACTIVE',
      completionPermissionRequired: true
    };

    this.db.prepare(`
      INSERT INTO kit_sessions (
        id, agent_id, project_id, task_id, started_at,
        last_check_in, check_in_interval, status, completion_permission_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.agentId,
      session.projectId,
      session.taskId,
      session.startedAt,
      session.lastCheckIn,
      session.checkInInterval,
      session.status,
      session.completionPermissionRequired ? 1 : 0
    );

    console.log(`⏱️  Keep-in-Touch session created: ${session.id}`);
    console.log(`   Check-in required every ${session.checkInInterval / 60} minutes`);

    return session;
  }

  /**
   * Validate check-in from agent
   */
  checkIn(sessionId: string, agentId: string, status: CheckInStatus): boolean {
    const session = this.getSession(sessionId);

    if (!session) {
      throw new Error('Invalid session');
    }

    if (session.agentId !== agentId) {
      throw new Error('Session does not belong to this agent');
    }

    // Update session
    this.db.prepare(`
      UPDATE kit_sessions SET
        last_check_in = datetime('now'),
        missed_check_ins = 0
      WHERE id = ?
    `).run(sessionId);

    // Log check-in activity
    this.db.prepare(`
      INSERT INTO agent_activity (session_id, agent_letter, activity_type, details)
      VALUES (?, ?, 'CHECK_IN', ?)
    `).run(sessionId, agentId, JSON.stringify(status));

    console.log(`✅ Check-in received for ${sessionId}`);

    return true;
  }

  /**
   * CRITICAL: Check permission for task completion
   */
  async checkPermission(taskId: string, agentId: string): Promise<PermissionResult> {
    const session = this.getActiveSession(agentId, taskId);

    if (!session) {
      return {
        granted: false,
        reason: 'NO_ACTIVE_SESSION',
        message: 'No active Keep-in-Touch session found'
      };
    }

    // Check if agent has checked in recently
    const lastCheckIn = new Date(session.lastCheckIn);
    const now = new Date();
    const timeSinceCheckIn = (now.getTime() - lastCheckIn.getTime()) / 1000; // seconds
    const gracePeriod = session.checkInInterval * 1.5; // 1.5x interval

    if (timeSinceCheckIn > gracePeriod) {
      return {
        granted: false,
        reason: 'MISSED_CHECK_IN',
        message: 'Please check in before completing task',
        requiredAction: 'CHECK_IN',
        retryAfter: 30
      };
    }

    // Check if completion permission exists
    const permission = this.db.prepare(`
      SELECT * FROM completion_permissions
      WHERE session_id = ? AND task_id = ?
      ORDER BY requested_at DESC LIMIT 1
    `).get(session.id, taskId) as any;

    if (!permission) {
      // No permission request yet - create one
      return this.requestCompletionPermission(session.id, taskId, agentId);
    }

    // Check permission status
    if (permission.status === 'GRANTED') {
      return {
        granted: true,
        permission: this.rowToPermission(permission)
      };
    }

    if (permission.status === 'DENIED') {
      return {
        granted: false,
        reason: 'PERMISSION_DENIED',
        message: permission.reason || 'Completion permission denied',
        permission: this.rowToPermission(permission)
      };
    }

    // PENDING - check if auto-approve timeout reached
    const requestedAt = new Date(permission.requested_at);
    const waitTime = (now.getTime() - requestedAt.getTime()) / 1000; // seconds

    if (waitTime >= permission.auto_approve_after) {
      // Auto-approve!
      this.grantPermission(permission.id, 'AUTO', 'Auto-approved after timeout');

      return {
        granted: true,
        permission: this.getPermission(permission.id)!
      };
    }

    // Still pending - ask agent to wait
    return {
      granted: false,
      blocked: true,
      reason: 'AWAITING_PERMISSION',
      message: `Waiting for stand-by permission (${Math.ceil(permission.auto_approve_after - waitTime)}s remaining)`,
      retryAfter: Math.ceil(permission.auto_approve_after - waitTime)
    };
  }

  /**
   * Request completion permission (creates PENDING permission)
   */
  private requestCompletionPermission(sessionId: string, taskId: string, agentId: string): PermissionResult {
    const permissionId = uuidv4();

    this.db.prepare(`
      INSERT INTO completion_permissions (
        id, session_id, task_id, agent_id, requested_at, status, auto_approve_after
      ) VALUES (?, ?, ?, ?, datetime('now'), 'PENDING', 60)
    `).run(permissionId, sessionId, taskId, agentId);

    console.log(`🔐 Completion permission requested: ${permissionId}`);
    console.log(`   Auto-approval in 60 seconds unless human responds`);

    return {
      granted: false,
      blocked: true,
      reason: 'PERMISSION_REQUESTED',
      message: 'Completion permission requested. Waiting for approval (auto-approve in 60s)',
      retryAfter: 60
    };
  }

  /**
   * Grant permission (manual or auto)
   */
  grantPermission(permissionId: string, grantedBy: string, reason?: string): void {
    this.db.prepare(`
      UPDATE completion_permissions SET
        status = 'GRANTED',
        granted_at = datetime('now'),
        granted_by = ?,
        reason = ?
      WHERE id = ?
    `).run(grantedBy, reason || 'Approved', permissionId);

    console.log(`✅ Permission granted: ${permissionId} by ${grantedBy}`);
  }

  /**
   * Deny permission
   */
  denyPermission(permissionId: string, deniedBy: string, reason: string): void {
    this.db.prepare(`
      UPDATE completion_permissions SET
        status = 'DENIED',
        granted_at = datetime('now'),
        granted_by = ?,
        reason = ?
      WHERE id = ?
    `).run(deniedBy, reason, permissionId);

    console.log(`❌ Permission denied: ${permissionId} by ${deniedBy}`);
  }

  /**
   * Get active session for agent and task
   */
  private getActiveSession(agentId: string, taskId?: string): KITSession | null {
    let query = `
      SELECT * FROM kit_sessions
      WHERE agent_id = ? AND status = 'ACTIVE'
    `;

    const params: any[] = [agentId];

    if (taskId) {
      query += ` AND task_id = ?`;
      params.push(taskId);
    }

    query += ` ORDER BY started_at DESC LIMIT 1`;

    const row = this.db.prepare(query).get(...params) as any;

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): KITSession | null {
    const row = this.db.prepare(`
      SELECT * FROM kit_sessions WHERE id = ?
    `).get(sessionId) as any;

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Get permission by ID
   */
  getPermission(permissionId: string): CompletionPermission | null {
    const row = this.db.prepare(`
      SELECT * FROM completion_permissions WHERE id = ?
    `).get(permissionId) as any;

    return row ? this.rowToPermission(row) : null;
  }

  /**
   * Close Keep-in-Touch session
   */
  closeSession(sessionId: string): void {
    this.db.prepare(`
      UPDATE kit_sessions SET status = 'CLOSED' WHERE id = ?
    `).run(sessionId);

    console.log(`🔒 Keep-in-Touch session closed: ${sessionId}`);
  }

  /**
   * Detect missed check-ins
   */
  detectMissedCheckIns(): KITSession[] {
    const overdue = this.db.prepare(`
      SELECT * FROM kit_sessions
      WHERE status = 'ACTIVE'
        AND datetime(last_check_in, '+' || check_in_interval || ' seconds') < datetime('now')
    `).all() as any[];

    // Increment missed check-in counter
    for (const session of overdue) {
      this.db.prepare(`
        UPDATE kit_sessions SET
          missed_check_ins = missed_check_ins + 1
        WHERE id = ?
      `).run(session.id);

      // Suspend after 3 missed check-ins
      if (session.missed_check_ins >= 2) {
        this.db.prepare(`
          UPDATE kit_sessions SET status = 'SUSPENDED' WHERE id = ?
        `).run(session.id);

        console.log(`⚠️  Session suspended (3 missed check-ins): ${session.id}`);
      }
    }

    return overdue.map(row => this.rowToSession(row));
  }

  /**
   * Get pending permissions (for human review)
   */
  getPendingPermissions(): CompletionPermission[] {
    const rows = this.db.prepare(`
      SELECT * FROM completion_permissions
      WHERE status = 'PENDING'
      ORDER BY requested_at ASC
    `).all() as any[];

    return rows.map(row => this.rowToPermission(row));
  }

  /**
   * Convert database row to KITSession
   */
  private rowToSession(row: any): KITSession {
    return {
      id: row.id,
      agentId: row.agent_id,
      projectId: row.project_id,
      taskId: row.task_id,
      startedAt: row.started_at,
      lastCheckIn: row.last_check_in,
      checkInInterval: row.check_in_interval,
      missedCheckIns: row.missed_check_ins,
      status: row.status,
      completionPermissionRequired: row.completion_permission_required === 1
    };
  }

  /**
   * Convert database row to CompletionPermission
   */
  private rowToPermission(row: any): CompletionPermission {
    return {
      id: row.id,
      sessionId: row.session_id,
      taskId: row.task_id,
      agentId: row.agent_id,
      requestedAt: row.requested_at,
      status: row.status,
      grantedAt: row.granted_at,
      grantedBy: row.granted_by,
      reason: row.reason,
      autoApproveAfter: row.auto_approve_after
    };
  }
}
