/**
 * HealthChecker Tests
 * ====================
 *
 * Unit tests for system health monitoring and self-healing
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { HealthChecker } from '../../src/health/HealthChecker.js';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';

describe('HealthChecker', () => {
  let db: Database.Database;
  let healthChecker: HealthChecker;
  const testDbPath = path.join(process.cwd(), 'data', 'test-health-checker.db');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create necessary tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT,
        claimed_at TEXT,
        dependencies TEXT
      );

      CREATE TABLE IF NOT EXISTS agent_presence (
        agent_letter TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        current_session_id TEXT
      );

      CREATE TABLE IF NOT EXISTS agent_sessions (
        id TEXT PRIMARY KEY,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS agent_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        agent_letter TEXT,
        timestamp TEXT,
        activity_type TEXT
      );

      -- Initialize agent presence
      INSERT INTO agent_presence (agent_letter, status, last_seen) VALUES
        ('A', 'OFFLINE', datetime('now')),
        ('B', 'OFFLINE', datetime('now'));
    `);

    healthChecker = new HealthChecker(db, testDbPath);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('performHealthCheck', () => {
    it('should return HEALTHY status for good database', async () => {
      const health = await healthChecker.performHealthCheck();

      expect(health.healthy).toBe(true);
      expect(health.status).toBe('HEALTHY');
      expect(health.checks.length).toBeGreaterThan(0);
    });

    it('should check database connection', async () => {
      const health = await healthChecker.performHealthCheck();

      const dbCheck = health.checks.find(c => c.name === 'Database Connection');
      expect(dbCheck).toBeDefined();
      expect(dbCheck?.status).toBe('PASS');
    });

    it('should check database integrity', async () => {
      const health = await healthChecker.performHealthCheck();

      const integrityCheck = health.checks.find(c => c.name === 'Database Integrity');
      expect(integrityCheck).toBeDefined();
      expect(integrityCheck?.status).toBe('PASS');
    });
  });

  describe('Zombie Agent Detection', () => {
    it('should detect zombie agents', async () => {
      // Create agent with old last_seen
      db.prepare(`
        UPDATE agent_presence SET
          status = 'ONLINE',
          last_seen = datetime('now', '-600 seconds')
        WHERE agent_letter = 'A'
      `).run();

      const health = await healthChecker.performHealthCheck();

      const zombieCheck = health.checks.find(c => c.name === 'Zombie Agent Detection');
      expect(zombieCheck?.status).toBe('WARN');
    });

    it('should NOT detect active agents as zombies', async () => {
      // Create agent with recent heartbeat
      db.prepare(`
        UPDATE agent_presence SET
          status = 'ONLINE',
          last_seen = datetime('now')
        WHERE agent_letter = 'A'
      `).run();

      const health = await healthChecker.performHealthCheck();

      const zombieCheck = health.checks.find(c => c.name === 'Zombie Agent Detection');
      expect(zombieCheck?.status).toBe('PASS');
    });
  });

  describe('Self-Healing: cleanupZombieAgents', () => {
    it('should automatically clean up zombie agents', async () => {
      // Create zombie agent
      db.prepare(`
        UPDATE agent_presence SET
          status = 'ONLINE',
          last_seen = datetime('now', '-600 seconds')
        WHERE agent_letter = 'A'
      `).run();

      // Health check triggers auto-heal
      const health = await healthChecker.performHealthCheck();

      expect(health.autoRecoveryAttempted).toBe(true);

      // Verify agent now OFFLINE
      const presence = db.prepare(`
        SELECT * FROM agent_presence WHERE agent_letter = 'A'
      `).get() as any;

      expect(presence.status).toBe('OFFLINE');
    });
  });

  describe('Stuck Task Detection', () => {
    it('should detect stuck tasks', async () => {
      // Create stuck task
      db.prepare(`
        INSERT INTO tasks (id, name, status, claimed_at)
        VALUES ('T001', 'Test Task', 'IN_PROGRESS', datetime('now', '-30 hours'))
      `).run();

      const health = await healthChecker.performHealthCheck();

      const stuckCheck = health.checks.find(c => c.name === 'Stuck Task Detection');
      expect(stuckCheck?.status).toBe('WARN');
    });

    it('should NOT flag recent tasks as stuck', async () => {
      // Create recent task
      db.prepare(`
        INSERT INTO tasks (id, name, status, claimed_at)
        VALUES ('T001', 'Test Task', 'IN_PROGRESS', datetime('now', '-2 hours'))
      `).run();

      const health = await healthChecker.performHealthCheck();

      const stuckCheck = health.checks.find(c => c.name === 'Stuck Task Detection');
      expect(stuckCheck?.status).toBe('PASS');
    });
  });

  describe('Activity Log Growth', () => {
    it('should warn on large activity log', async () => {
      // Insert many activities
      const insert = db.prepare(`
        INSERT INTO agent_activity (session_id, agent_letter, activity_type)
        VALUES (?, ?, ?)
      `);

      for (let i = 0; i < 51000; i++) {
        insert.run('session-1', 'A', 'HEARTBEAT');
      }

      const health = await healthChecker.performHealthCheck();

      const activityCheck = health.checks.find(c => c.name === 'Activity Log Growth');
      expect(activityCheck?.status).toBe('WARN');
      expect(health.autoRecoveryAttempted).toBe(true);
    });
  });

  describe('Self-Healing: unblockReadyTasks', () => {
    it('should unblock tasks with no dependencies', async () => {
      // Create blocked task with no dependencies
      db.prepare(`
        INSERT INTO tasks (id, name, status, dependencies)
        VALUES ('T001', 'Test Task', 'BLOCKED', '[]')
      `).run();

      const unblocked = await healthChecker.unblockReadyTasks();

      expect(unblocked).toBe(1);

      const task = db.prepare(`SELECT * FROM tasks WHERE id = 'T001'`).get() as any;
      expect(task.status).toBe('AVAILABLE');
    });

    it('should unblock tasks with completed dependencies', async () => {
      // Create tasks
      db.prepare(`
        INSERT INTO tasks (id, name, status) VALUES
          ('T001', 'Dependency', 'COMPLETE'),
          ('T002', 'Blocked Task', 'BLOCKED')
      `).run();

      db.prepare(`
        UPDATE tasks SET dependencies = '["T001"]' WHERE id = 'T002'
      `).run();

      const unblocked = await healthChecker.unblockReadyTasks();

      expect(unblocked).toBe(1);

      const task = db.prepare(`SELECT * FROM tasks WHERE id = 'T002'`).get() as any;
      expect(task.status).toBe('AVAILABLE');
    });

    it('should NOT unblock tasks with incomplete dependencies', async () => {
      // Create tasks
      db.prepare(`
        INSERT INTO tasks (id, name, status) VALUES
          ('T001', 'Dependency', 'IN_PROGRESS'),
          ('T002', 'Blocked Task', 'BLOCKED')
      `).run();

      db.prepare(`
        UPDATE tasks SET dependencies = '["T001"]' WHERE id = 'T002'
      `).run();

      const unblocked = await healthChecker.unblockReadyTasks();

      expect(unblocked).toBe(0);

      const task = db.prepare(`SELECT * FROM tasks WHERE id = 'T002'`).get() as any;
      expect(task.status).toBe('BLOCKED'); // Still blocked
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure query performance', async () => {
      const health = await healthChecker.performHealthCheck();

      const perfCheck = health.checks.find(c => c.name === 'Query Performance');
      expect(perfCheck).toBeDefined();
      expect(perfCheck?.duration).toBeLessThan(1000); // Should be fast
    });
  });
});
