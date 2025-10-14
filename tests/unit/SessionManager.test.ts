/**
 * SessionManager Tests
 * ====================
 *
 * Unit tests for agent session management and intelligence system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { SessionManager } from '../../src/intelligence/SessionManager.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('SessionManager', () => {
  let db: Database.Database;
  let sessionManager: SessionManager;
  const testDbPath = path.join(process.cwd(), 'data', 'test-session-manager.db');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create necessary tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        id TEXT PRIMARY KEY,
        agent_letter TEXT NOT NULL,
        agent_model TEXT NOT NULL,
        project_id TEXT NOT NULL DEFAULT 'LocalBrain',
        connected_at TEXT NOT NULL,
        disconnected_at TEXT,
        last_heartbeat TEXT NOT NULL,
        machine_id TEXT,
        session_duration_minutes INTEGER,
        total_queries INTEGER DEFAULT 0,
        tasks_claimed INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS agent_presence (
        agent_letter TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'OFFLINE',
        current_session_id TEXT,
        current_task_id TEXT,
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        online_since TEXT,
        total_sessions_today INTEGER DEFAULT 0,
        total_active_time_minutes INTEGER DEFAULT 0,
        tasks_today INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS agent_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        agent_letter TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        activity_type TEXT NOT NULL,
        task_id TEXT,
        details TEXT,
        duration_ms INTEGER
      );

      CREATE TABLE IF NOT EXISTS agent_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_letter TEXT NOT NULL,
        metric_date TEXT NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        total_active_minutes INTEGER DEFAULT 0,
        tasks_claimed INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        average_task_minutes REAL,
        velocity_score REAL,
        quality_score REAL DEFAULT 1.0,
        collaboration_score REAL DEFAULT 0.0,
        UNIQUE(agent_letter, metric_date)
      );

      -- Initialize agent presence
      INSERT OR IGNORE INTO agent_presence (agent_letter, status) VALUES
        ('A', 'OFFLINE'), ('B', 'OFFLINE'), ('C', 'OFFLINE'),
        ('D', 'OFFLINE'), ('E', 'OFFLINE'), ('F', 'OFFLINE');
    `);

    sessionManager = new SessionManager(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('createSession', () => {
    it('should create new session successfully', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      expect(session).toBeDefined();
      expect(session.agent_letter).toBe('A');
      expect(session.agent_model).toBe('GLM-4.6');
      expect(session.project_id).toBe('LocalBrain');
      expect(session.status).toBe('ACTIVE');
      expect(session.id).toBeTruthy();
    });

    it('should update agent presence to ONLINE', () => {
      sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.status).toBe('ONLINE');
      expect(presence.total_sessions_today).toBe(1);
    });

    it('should close duplicate session (BUG FIX #2)', () => {
      // Create first session
      const session1 = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      // Create second session (should close first)
      const session2 = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      // Session IDs should be different
      expect(session2.id).not.toBe(session1.id);

      // First session should be closed
      const firstSession = sessionManager.getSession(session1.id);
      expect(firstSession?.status).toBe('DISCONNECTED');

      // Second session should be active
      expect(session2.status).toBe('ACTIVE');
    });
  });

  describe('updateHeartbeat', () => {
    it('should update heartbeat timestamp', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      const beforeHeartbeat = session.last_heartbeat;

      // Wait a bit
      const wait = new Promise(resolve => setTimeout(resolve, 100));
      wait.then(() => {
        sessionManager.updateHeartbeat(session.id);

        const updated = sessionManager.getSession(session.id);
        expect(updated?.last_heartbeat).not.toBe(beforeHeartbeat);
      });
    });

    it('should update presence last_seen', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.updateHeartbeat(session.id);

      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.status).toBe('ONLINE');
      expect(presence.last_seen).toBeTruthy();
    });

    it('should handle IDLE status', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.updateHeartbeat(session.id, 'IDLE');

      const updated = sessionManager.getSession(session.id);
      expect(updated?.status).toBe('IDLE');

      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.status).toBe('IDLE');
    });
  });

  describe('closeSession', () => {
    it('should calculate session duration (BUG FIX #1)', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      // Wait a bit to ensure duration > 0
      const wait = () => new Promise(resolve => setTimeout(resolve, 100));

      wait().then(() => {
        sessionManager.closeSession(session.id);

        const closed = sessionManager.getSession(session.id);

        expect(closed?.status).toBe('DISCONNECTED');
        expect(closed?.session_duration_minutes).toBeDefined();
        expect(closed?.session_duration_minutes).not.toBeNull();
        expect(closed?.disconnected_at).toBeTruthy();
      });
    });

    it('should update agent presence to OFFLINE', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.closeSession(session.id);

      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.status).toBe('OFFLINE');
      expect(presence.current_session_id).toBeNull();
    });

    it('should update daily metrics', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.closeSession(session.id);

      const today = new Date().toISOString().split('T')[0];
      const metrics = db.prepare(`
        SELECT * FROM agent_metrics
        WHERE agent_letter = 'A' AND metric_date = ?
      `).get(today) as any;

      expect(metrics).toBeDefined();
      expect(metrics.total_sessions).toBeGreaterThan(0);
    });
  });

  describe('incrementTasksClaimed', () => {
    it('should increment tasks claimed counter', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.incrementTasksClaimed(session.id);

      const updated = sessionManager.getSession(session.id);
      expect(updated?.tasks_claimed).toBe(1);
      expect(updated?.total_queries).toBe(1);
    });
  });

  describe('incrementTasksCompleted', () => {
    it('should increment tasks completed counter', () => {
      const session = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      sessionManager.incrementTasksCompleted(session.id);

      const updated = sessionManager.getSession(session.id);
      expect(updated?.tasks_completed).toBe(1);

      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.tasks_today).toBe(1);
    });
  });

  describe('getActiveSessions', () => {
    it('should return only active sessions', () => {
      // Create multiple sessions
      const session1 = sessionManager.createSession({
        agent: 'A',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      const session2 = sessionManager.createSession({
        agent: 'B',
        model: 'Sonnet-4.5',
        project: 'LocalBrain'
      });

      const session3 = sessionManager.createSession({
        agent: 'C',
        model: 'GLM-4.6',
        project: 'LocalBrain'
      });

      // Close one session
      sessionManager.closeSession(session2.id);

      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions.length).toBe(2);
      expect(activeSessions.find(s => s.id === session1.id)).toBeDefined();
      expect(activeSessions.find(s => s.id === session3.id)).toBeDefined();
      expect(activeSessions.find(s => s.id === session2.id)).toBeUndefined();
    });
  });
});
