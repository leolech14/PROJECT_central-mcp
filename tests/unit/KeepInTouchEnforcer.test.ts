/**
 * KeepInTouchEnforcer Tests
 * ==========================
 *
 * Unit tests for Keep-in-Touch completion gating system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { KeepInTouchEnforcer } from '../../src/core/KeepInTouchEnforcer.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('KeepInTouchEnforcer', () => {
  let db: Database.Database;
  let enforcer: KeepInTouchEnforcer;
  const testDbPath = path.join(process.cwd(), 'data', 'test-kit-enforcer.db');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create required tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT,
        created_at TEXT,
        last_activity TEXT,
        discovered_by TEXT,
        git_remote TEXT,
        vision TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT,
        agent TEXT,
        project_id TEXT
      );

      CREATE TABLE IF NOT EXISTS agent_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        agent_letter TEXT,
        activity_type TEXT,
        details TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      );

      INSERT INTO projects (id, name, path, type, created_at, last_activity, discovered_by)
      VALUES ('test-project', 'Test', '/test', 'TOOL', datetime('now'), datetime('now'), 'manual');

      INSERT INTO tasks (id, name, status, agent, project_id)
      VALUES ('T001', 'Test Task', 'IN_PROGRESS', 'A', 'test-project');
    `);

    enforcer = new KeepInTouchEnforcer(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('createSession', () => {
    it('should create Keep-in-Touch session', () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.agentId).toBe('agent-123');
      expect(session.projectId).toBe('test-project');
      expect(session.taskId).toBe('T001');
      expect(session.status).toBe('ACTIVE');
      expect(session.checkInInterval).toBe(1800); // 30 minutes
      expect(session.completionPermissionRequired).toBe(true);
    });

    it('should set default check-in interval to 30 minutes', () => {
      const session = enforcer.createSession('agent-123', 'test-project');

      expect(session.checkInInterval).toBe(1800); // 30 minutes in seconds
    });
  });

  describe('checkIn', () => {
    it('should accept valid check-in', () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      const success = enforcer.checkIn(session.id, 'agent-123', {
        currentActivity: 'Working on task',
        progress: 50
      });

      expect(success).toBe(true);

      const updated = enforcer.getSession(session.id);
      expect(updated?.missedCheckIns).toBe(0);
    });

    it('should reset missed check-ins on successful check-in', () => {
      const session = enforcer.createSession('agent-123', 'test-project');

      // Manually set missed check-ins
      db.prepare(`
        UPDATE kit_sessions SET missed_check_ins = 2 WHERE id = ?
      `).run(session.id);

      // Check in
      enforcer.checkIn(session.id, 'agent-123', {
        currentActivity: 'Checking in',
        progress: 0
      });

      const updated = enforcer.getSession(session.id);
      expect(updated?.missedCheckIns).toBe(0);
    });

    it('should reject check-in from wrong agent', () => {
      const session = enforcer.createSession('agent-123', 'test-project');

      expect(() => {
        enforcer.checkIn(session.id, 'agent-456', {
          currentActivity: 'Hacking',
          progress: 0
        });
      }).toThrow('Session does not belong to this agent');
    });
  });

  describe('checkPermission - CRITICAL FEATURE', () => {
    it('should BLOCK completion without permission', async () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      // Check in first
      enforcer.checkIn(session.id, 'agent-123', {
        currentActivity: 'Ready to complete',
        progress: 100
      });

      // Request permission
      const result = await enforcer.checkPermission('T001', 'agent-123');

      // First time - should create permission request
      expect(result.granted).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reason).toBe('PERMISSION_REQUESTED');
      expect(result.message).toContain('Waiting for approval');
    });

    it('should GRANT permission after timeout', async () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      enforcer.checkIn(session.id, 'agent-123', {
        currentActivity: 'Ready',
        progress: 100
      });

      // Create permission request with 0-second timeout (for testing)
      const permId = db.prepare(`
        INSERT INTO completion_permissions (
          id, session_id, task_id, agent_id, requested_at, status, auto_approve_after
        ) VALUES (?, ?, ?, ?, datetime('now', '-70 seconds'), 'PENDING', 60)
        RETURNING id
      `).get(
        'perm-123',
        session.id,
        'T001',
        'agent-123'
      ) as any;

      // Check permission (should auto-approve)
      const result = await enforcer.checkPermission('T001', 'agent-123');

      expect(result.granted).toBe(true);
      expect(result.permission?.status).toBe('GRANTED');
      expect(result.permission?.grantedBy).toBe('AUTO');
    });

    it('should BLOCK if check-in missed', async () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      // Set old check-in time (>30 min ago)
      db.prepare(`
        UPDATE kit_sessions SET last_check_in = datetime('now', '-3600 seconds')
        WHERE id = ?
      `).run(session.id);

      const result = await enforcer.checkPermission('T001', 'agent-123');

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('MISSED_CHECK_IN');
      expect(result.requiredAction).toBe('CHECK_IN');
    });
  });

  describe('detectMissedCheckIns', () => {
    it('should detect overdue check-ins', () => {
      const session = enforcer.createSession('agent-123', 'test-project');

      // Set old check-in
      db.prepare(`
        UPDATE kit_sessions SET
          last_check_in = datetime('now', '-3600 seconds'),
          check_in_interval = 1800
        WHERE id = ?
      `).run(session.id);

      const overdue = enforcer.detectMissedCheckIns();

      expect(overdue.length).toBeGreaterThan(0);
      expect(overdue[0].id).toBe(session.id);
    });

    it('should suspend after 3 missed check-ins', () => {
      const session = enforcer.createSession('agent-123', 'test-project');

      // Set 2 missed check-ins
      db.prepare(`
        UPDATE kit_sessions SET
          missed_check_ins = 2,
          last_check_in = datetime('now', '-3600 seconds')
        WHERE id = ?
      `).run(session.id);

      enforcer.detectMissedCheckIns();

      const updated = enforcer.getSession(session.id);
      expect(updated?.status).toBe('SUSPENDED');
    });
  });

  describe('grantPermission', () => {
    it('should grant permission manually', () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      // Create permission request
      const permId = db.prepare(`
        INSERT INTO completion_permissions (id, session_id, task_id, agent_id, status)
        VALUES (?, ?, ?, ?, 'PENDING')
        RETURNING id
      `).get('perm-123', session.id, 'T001', 'agent-123') as any;

      enforcer.grantPermission('perm-123', 'human-lech', 'Looks good!');

      const permission = enforcer.getPermission('perm-123');
      expect(permission?.status).toBe('GRANTED');
      expect(permission?.grantedBy).toBe('human-lech');
      expect(permission?.reason).toBe('Looks good!');
    });
  });

  describe('denyPermission', () => {
    it('should deny permission manually', () => {
      const session = enforcer.createSession('agent-123', 'test-project', 'T001');

      const permId = db.prepare(`
        INSERT INTO completion_permissions (id, session_id, task_id, agent_id, status)
        VALUES (?, ?, ?, ?, 'PENDING')
        RETURNING id
      `).get('perm-123', session.id, 'T001', 'agent-123') as any;

      enforcer.denyPermission('perm-123', 'human-lech', 'Needs more work');

      const permission = enforcer.getPermission('perm-123');
      expect(permission?.status).toBe('DENIED');
      expect(permission?.grantedBy).toBe('human-lech');
      expect(permission?.reason).toBe('Needs more work');
    });
  });
});
