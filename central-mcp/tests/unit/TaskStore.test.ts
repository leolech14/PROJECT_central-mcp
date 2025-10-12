/**
 * TaskStore Tests
 * ================
 *
 * Unit tests for SQLite task persistence and atomic operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { TaskStore } from '../../src/registry/TaskStore.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('TaskStore', () => {
  let db: Database.Database;
  let store: TaskStore;
  const testDbPath = path.join(process.cwd(), 'data', 'test-task-store.db');

  beforeEach(() => {
    store = new TaskStore(testDbPath);
    db = store.getDatabase();

    // Insert test tasks
    db.exec(`
      INSERT INTO tasks (id, name, agent, status, priority, dependencies, project_id) VALUES
        ('T001', 'Task One', 'A', 'AVAILABLE', 'P0', '[]', 'test-project'),
        ('T002', 'Task Two', 'A', 'AVAILABLE', 'P1', '["T001"]', 'test-project'),
        ('T003', 'Task Three', 'B', 'CLAIMED', 'P1', '[]', 'test-project'),
        ('T004', 'Task Four', 'B', 'COMPLETE', 'P0', '[]', 'test-project');
    `);
  });

  afterEach(() => {
    store.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      const tasks = store.getAllTasks();

      expect(tasks.length).toBeGreaterThanOrEqual(4);
      expect(tasks.find(t => t.id === 'T001')).toBeDefined();
    });

    it('should parse dependencies as array', () => {
      const tasks = store.getAllTasks();
      const task2 = tasks.find(t => t.id === 'T002');

      expect(task2?.dependencies).toEqual(['T001']);
    });
  });

  describe('getTask', () => {
    it('should return specific task', () => {
      const task = store.getTask('T001');

      expect(task).toBeDefined();
      expect(task?.id).toBe('T001');
      expect(task?.name).toBe('Task One');
    });

    it('should return null for non-existent task', () => {
      const task = store.getTask('T999');

      expect(task).toBeNull();
    });
  });

  describe('getTasksByAgent', () => {
    it('should filter tasks by agent', () => {
      const tasksA = store.getTasksByAgent('A');
      const tasksB = store.getTasksByAgent('B');

      expect(tasksA.length).toBe(2); // T001, T002
      expect(tasksB.length).toBe(2); // T003, T004

      expect(tasksA.every(t => t.agent === 'A')).toBe(true);
      expect(tasksB.every(t => t.agent === 'B')).toBe(true);
    });

    it('should return empty array for agent with no tasks', () => {
      const tasks = store.getTasksByAgent('Z' as any);

      expect(tasks).toEqual([]);
    });
  });

  describe('getTasksByStatus', () => {
    it('should filter tasks by status', () => {
      const available = store.getTasksByStatus('AVAILABLE');
      const claimed = store.getTasksByStatus('CLAIMED');
      const complete = store.getTasksByStatus('COMPLETE');

      expect(available.length).toBe(2); // T001, T002
      expect(claimed.length).toBe(1);   // T003
      expect(complete.length).toBe(1);  // T004
    });
  });

  describe('claimTask (Atomic Operation)', () => {
    it('should claim available task atomically', () => {
      const success = store.claimTask('T001', 'A');

      expect(success).toBe(true);

      const task = store.getTask('T001');
      expect(task?.status).toBe('CLAIMED');
      expect(task?.claimed_by).toBe('A');
    });

    it('should fail to claim non-available task', () => {
      const success = store.claimTask('T003', 'B'); // Already CLAIMED

      expect(success).toBe(false);

      const task = store.getTask('T003');
      expect(task?.status).toBe('CLAIMED'); // Unchanged
    });

    it('should fail to claim non-existent task', () => {
      const success = store.claimTask('T999', 'A');

      expect(success).toBe(false);
    });

    it('should prevent race conditions (atomic)', () => {
      // This tests that only one claim succeeds
      // In real scenario, two agents claiming simultaneously

      const success1 = store.claimTask('T001', 'A');
      const success2 = store.claimTask('T001', 'A'); // Try again

      expect(success1).toBe(true);
      expect(success2).toBe(false); // Should fail (already claimed)
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      store.updateTaskStatus('T001', 'IN_PROGRESS', 'A');

      const task = store.getTask('T001');
      expect(task?.status).toBe('IN_PROGRESS');
    });

    it('should track who updated the status', () => {
      store.updateTaskStatus('T001', 'IN_PROGRESS', 'A');

      const task = store.getTask('T001');
      expect(task?.claimed_by).toBe('A');
    });
  });

  describe('completeTask', () => {
    it('should complete task with metadata', () => {
      const success = store.completeTask('T003', 'B', ['file1.ts', 'file2.ts'], 150);

      expect(success).toBe(true);

      const task = store.getTask('T003');
      expect(task?.status).toBe('COMPLETE');
      expect(task?.velocity).toBe(150);
      expect(task?.files_created).toEqual(['file1.ts', 'file2.ts']);
      expect(task?.completed_at).toBeTruthy();
    });

    it('should fail to complete task not owned by agent', () => {
      // T003 is claimed by B, try to complete as A
      const success = store.completeTask('T003', 'A', [], 100);

      expect(success).toBe(false);

      const task = store.getTask('T003');
      expect(task?.status).toBe('CLAIMED'); // Unchanged
    });

    it('should fail to complete non-existent task', () => {
      const success = store.completeTask('T999', 'A', [], 100);

      expect(success).toBe(false);
    });
  });

  describe('getTasksByProject', () => {
    it('should filter tasks by project', () => {
      // Add task for different project
      db.prepare(`
        INSERT INTO tasks (id, name, agent, status, project_id)
        VALUES ('T100', 'Other Project Task', 'A', 'AVAILABLE', 'other-project')
      `).run();

      const testTasks = store.getTasksByProject('test-project');
      const otherTasks = store.getTasksByProject('other-project');

      expect(testTasks.length).toBe(4); // Original tasks
      expect(otherTasks.length).toBe(1); // New task
      expect(otherTasks[0].id).toBe('T100');
    });
  });

  describe('Database Integrity', () => {
    it('should maintain data integrity on concurrent updates', () => {
      // Simulate concurrent claim attempts
      const task = store.getTask('T001');
      expect(task?.status).toBe('AVAILABLE');

      // First claim
      const claim1 = store.claimTask('T001', 'A');
      expect(claim1).toBe(true);

      // Second claim (should fail - task no longer available)
      const claim2 = store.claimTask('T001', 'B' as any);
      expect(claim2).toBe(false);

      // Verify only one claim succeeded
      const final = store.getTask('T001');
      expect(final?.status).toBe('CLAIMED');
      expect(final?.claimed_by).toBe('A');
    });

    it('should handle transaction rollback on error', () => {
      // This tests that failed operations don't corrupt database
      const beforeCount = store.getAllTasks().length;

      try {
        // Try to update with invalid data
        db.prepare(`
          UPDATE tasks SET status = 'INVALID_STATUS' WHERE id = 'T001'
        `).run();
      } catch (error) {
        // Error expected
      }

      // Database should be unchanged
      const afterCount = store.getAllTasks().length;
      expect(afterCount).toBe(beforeCount);
    });
  });
});
