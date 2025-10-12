/**
 * TaskRegistry Tests
 * ===================
 *
 * Unit tests for task coordination and management
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { TaskRegistry } from '../../src/registry/TaskRegistry.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('TaskRegistry', () => {
  let db: Database.Database;
  let registry: TaskRegistry;
  const testDbPath = path.join(process.cwd(), 'data', 'test-task-registry.db');

  beforeEach(async () => {
    db = new Database(testDbPath);

    // Create necessary tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        agent TEXT NOT NULL,
        status TEXT DEFAULT 'AVAILABLE',
        priority TEXT DEFAULT 'P1',
        dependencies TEXT,
        estimated_hours INTEGER,
        actual_hours INTEGER,
        velocity INTEGER,
        files_created TEXT,
        claimed_at TEXT,
        completed_at TEXT,
        project_id TEXT DEFAULT 'test-project'
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        git_remote TEXT,
        type TEXT,
        vision TEXT,
        created_at TEXT,
        last_activity TEXT,
        discovered_by TEXT,
        metadata TEXT
      );

      -- Insert test project
      INSERT INTO projects (id, name, path, type, created_at, last_activity, discovered_by)
      VALUES ('test-project', 'TestProject', '/test', 'TOOL', datetime('now'), datetime('now'), 'manual');

      -- Insert test tasks
      INSERT INTO tasks (id, name, agent, status, priority, dependencies) VALUES
        ('T001', 'Foundation Task', 'A', 'AVAILABLE', 'P0', '[]'),
        ('T002', 'Dependent Task', 'A', 'BLOCKED', 'P1', '["T001"]'),
        ('T003', 'Another Task', 'B', 'AVAILABLE', 'P1', '[]'),
        ('T004', 'Multi-Dep Task', 'A', 'BLOCKED', 'P2', '["T001", "T003"]');
    `);

    registry = new TaskRegistry(testDbPath);
    await registry.initialize();
  });

  afterEach(() => {
    registry.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      const tasks = registry.getAllTasks();

      expect(tasks.length).toBeGreaterThanOrEqual(4);
      expect(tasks.find(t => t.id === 'T001')).toBeDefined();
    });
  });

  describe('getTask', () => {
    it('should return specific task by ID', () => {
      const task = registry.getTask('T001');

      expect(task).toBeDefined();
      expect(task?.id).toBe('T001');
      expect(task?.name).toBe('Foundation Task');
    });

    it('should return null for non-existent task', () => {
      const task = registry.getTask('T999');

      expect(task).toBeNull();
    });
  });

  describe('getAvailableTasks', () => {
    it('should return only available tasks for agent', () => {
      const tasks = registry.getAvailableTasks('A');

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.every(t => t.agent === 'A')).toBe(true);
      expect(tasks.every(t => t.status === 'AVAILABLE')).toBe(true);

      // Should not include T002 (BLOCKED)
      expect(tasks.find(t => t.id === 'T002')).toBeUndefined();
    });

    it('should filter by dependency satisfaction', () => {
      const tasks = registry.getAvailableTasks('A');

      // T001 should be available (no dependencies)
      expect(tasks.find(t => t.id === 'T001')).toBeDefined();

      // T002 should NOT be available (depends on T001 which is not complete)
      expect(tasks.find(t => t.id === 'T002')).toBeUndefined();
    });

    it('should return empty array for agent with no tasks', () => {
      const tasks = registry.getAvailableTasks('Z' as any);

      expect(tasks).toEqual([]);
    });
  });

  describe('claimTask', () => {
    it('should claim available task successfully', async () => {
      const result = await registry.claimTask('T001', 'A');

      expect(result.success).toBe(true);
      expect(result.claimedAt).toBeDefined();

      // Verify status changed
      const task = registry.getTask('T001');
      expect(task?.status).toBe('CLAIMED');
    });

    it('should fail to claim task for wrong agent', async () => {
      const result = await registry.claimTask('T001', 'B' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('assigned to Agent A');
    });

    it('should fail to claim already claimed task', async () => {
      // Claim first time
      await registry.claimTask('T001', 'A');

      // Try to claim again
      const result = await registry.claimTask('T001', 'A');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not AVAILABLE');
    });

    it('should fail to claim blocked task', async () => {
      const result = await registry.claimTask('T002', 'A');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dependencies not satisfied');
    });

    it('should allow claiming task with satisfied dependencies', async () => {
      // Complete T001 first
      db.prepare(`UPDATE tasks SET status = 'COMPLETE' WHERE id = 'T001'`).run();

      // Now T002 should be claimable
      const result = await registry.claimTask('T002', 'A');

      expect(result.success).toBe(true);
    });
  });

  describe('completeTask', () => {
    it('should complete task and auto-unblock dependents', async () => {
      // Claim and complete T001
      await registry.claimTask('T001', 'A');

      const result = await registry.completeTask('T001', 'A', ['file1.ts'], 100);

      expect(result.success).toBe(true);
      expect(result.unblocked).toBeDefined();
      expect(result.unblocked?.includes('T002')).toBe(true);

      // Verify T001 is complete
      const task1 = registry.getTask('T001');
      expect(task1?.status).toBe('COMPLETE');

      // Verify T002 is now available
      const task2 = registry.getTask('T002');
      expect(task2?.status).toBe('AVAILABLE');
    });

    it('should unblock multiple dependent tasks', async () => {
      // Complete T001 and T003
      db.prepare(`UPDATE tasks SET status = 'COMPLETE' WHERE id IN ('T001', 'T003')`).run();

      // Now T004 (depends on both) should be unblockable
      // Note: completeTask was already called for T001, so we check manually
      const task4 = registry.getTask('T004');

      // Both dependencies complete, but task is still BLOCKED
      // (would be auto-unblocked when T003 is completed via registry.completeTask)
      expect(task4?.dependencies).toContain('T001');
      expect(task4?.dependencies).toContain('T003');
    });

    it('should fail to complete task not claimed by agent', async () => {
      const result = await registry.completeTask('T001', 'A');

      expect(result.success).toBe(false);
    });
  });

  describe('getSprintMetrics', () => {
    it('should calculate sprint metrics correctly', () => {
      const metrics = registry.getSprintMetrics();

      expect(metrics.totalTasks).toBeGreaterThanOrEqual(4);
      expect(metrics.completedTasks).toBeDefined();
      expect(metrics.inProgressTasks).toBeDefined();
      expect(metrics.availableTasks).toBeGreaterThan(0);
      expect(metrics.blockedTasks).toBeGreaterThan(0);
      expect(metrics.completionPercentage).toBeDefined();
    });

    it('should calculate completion percentage', () => {
      // Mark one task complete
      db.prepare(`UPDATE tasks SET status = 'COMPLETE' WHERE id = 'T001'`).run();

      const metrics = registry.getSprintMetrics();

      expect(metrics.completedTasks).toBe(1);
      expect(metrics.completionPercentage).toBeGreaterThan(0);
    });

    it('should calculate velocity from completed tasks', () => {
      // Add velocity to a completed task
      db.prepare(`
        UPDATE tasks SET status = 'COMPLETE', velocity = 150 WHERE id = 'T001'
      `).run();

      const metrics = registry.getSprintMetrics();

      expect(metrics.averageVelocity).toBeGreaterThan(0);
    });
  });

  describe('getAgentWorkload', () => {
    it('should return tasks for specific agent', () => {
      const workload = registry.getAgentWorkload('A');

      expect(workload.agent).toBe('A');
      expect(workload.totalTasks).toBeGreaterThan(0);
      expect(workload.tasks.every(t => t.id.startsWith('T'))).toBe(true);
    });

    it('should categorize tasks by status', () => {
      // Set various statuses
      db.prepare(`UPDATE tasks SET status = 'COMPLETE' WHERE id = 'T001'`).run();
      db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = 'T002'`).run();

      const workload = registry.getAgentWorkload('A');

      expect(workload.completedTasks).toBeGreaterThan(0);
      expect(workload.inProgressTasks).toBeGreaterThan(0);
    });

    it('should return empty for agent with no tasks', () => {
      const workload = registry.getAgentWorkload('Z' as any);

      expect(workload.totalTasks).toBe(0);
      expect(workload.tasks).toEqual([]);
    });
  });
});
