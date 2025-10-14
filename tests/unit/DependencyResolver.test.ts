/**
 * DependencyResolver Tests
 * =========================
 *
 * Unit tests for dependency resolution and auto-unblocking
 */

import { describe, it, expect } from '@jest/globals';
import { DependencyResolver } from '../../src/registry/DependencyResolver.js';
import type { Task } from '../../src/types/Task.js';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;

  beforeEach(() => {
    resolver = new DependencyResolver();
  });

  describe('areDependenciesSatisfied', () => {
    it('should return true for task with no dependencies', () => {
      const task: Task = {
        id: 'T001',
        name: 'Test',
        agent: 'A',
        status: 'AVAILABLE',
        priority: 'P1',
        dependencies: []
      } as any;

      const taskMap = new Map([['T001', task]]);

      const result = resolver.areDependenciesSatisfied(task, taskMap);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedDeps).toEqual([]);
    });

    it('should return true when all dependencies are complete', () => {
      const dep1: Task = { id: 'T001', status: 'COMPLETE' } as any;
      const dep2: Task = { id: 'T002', status: 'COMPLETE' } as any;
      const task: Task = {
        id: 'T003',
        status: 'BLOCKED',
        dependencies: ['T001', 'T002']
      } as any;

      const taskMap = new Map([
        ['T001', dep1],
        ['T002', dep2],
        ['T003', task]
      ]);

      const result = resolver.areDependenciesSatisfied(task, taskMap);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedDeps).toEqual([]);
    });

    it('should return false when dependencies not complete', () => {
      const dep1: Task = { id: 'T001', status: 'IN_PROGRESS' } as any;
      const task: Task = {
        id: 'T002',
        status: 'BLOCKED',
        dependencies: ['T001']
      } as any;

      const taskMap = new Map([
        ['T001', dep1],
        ['T002', task]
      ]);

      const result = resolver.areDependenciesSatisfied(task, taskMap);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfiedDeps).toContain('T001');
    });

    it('should handle missing dependencies gracefully', () => {
      const task: Task = {
        id: 'T002',
        status: 'BLOCKED',
        dependencies: ['T001'] // T001 doesn't exist
      } as any;

      const taskMap = new Map([['T002', task]]);

      const result = resolver.areDependenciesSatisfied(task, taskMap);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfiedDeps).toContain('T001');
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependency', () => {
      const task1: Task = { id: 'T001', dependencies: ['T002'] } as any;
      const task2: Task = { id: 'T002', dependencies: ['T001'] } as any;

      const tasks = [task1, task2];

      const cycles = resolver.detectCircularDependencies(tasks);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('T001');
      expect(cycles[0]).toContain('T002');
    });

    it('should detect complex circular dependency', () => {
      const task1: Task = { id: 'T001', dependencies: ['T002'] } as any;
      const task2: Task = { id: 'T002', dependencies: ['T003'] } as any;
      const task3: Task = { id: 'T003', dependencies: ['T001'] } as any;

      const tasks = [task1, task2, task3];

      const cycles = resolver.detectCircularDependencies(tasks);

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for valid dependencies', () => {
      const task1: Task = { id: 'T001', dependencies: [] } as any;
      const task2: Task = { id: 'T002', dependencies: ['T001'] } as any;
      const task3: Task = { id: 'T003', dependencies: ['T002'] } as any;

      const tasks = [task1, task2, task3];

      const cycles = resolver.detectCircularDependencies(tasks);

      expect(cycles).toEqual([]);
    });
  });

  describe('findTasksToUnblock', () => {
    it('should find tasks that can be unblocked', () => {
      const completedTask: Task = { id: 'T001', status: 'COMPLETE' } as any;
      const blockedTask: Task = {
        id: 'T002',
        status: 'BLOCKED',
        dependencies: ['T001']
      } as any;

      const taskMap = new Map([
        ['T001', completedTask],
        ['T002', blockedTask]
      ]);

      const toUnblock = resolver.findTasksToUnblock('T001', taskMap);

      expect(toUnblock.length).toBe(1);
      expect(toUnblock[0].id).toBe('T002');
    });

    it('should not unblock tasks with multiple unsatisfied dependencies', () => {
      const complete1: Task = { id: 'T001', status: 'COMPLETE' } as any;
      const incomplete: Task = { id: 'T003', status: 'IN_PROGRESS' } as any;
      const blocked: Task = {
        id: 'T004',
        status: 'BLOCKED',
        dependencies: ['T001', 'T003']
      } as any;

      const taskMap = new Map([
        ['T001', complete1],
        ['T003', incomplete],
        ['T004', blocked]
      ]);

      const toUnblock = resolver.findTasksToUnblock('T001', taskMap);

      // T004 should NOT be unblocked (T003 still incomplete)
      expect(toUnblock.find(t => t.id === 'T004')).toBeUndefined();
    });

    it('should handle tasks with no dependents', () => {
      const task: Task = { id: 'T001', status: 'COMPLETE' } as any;
      const taskMap = new Map([['T001', task]]);

      const toUnblock = resolver.findTasksToUnblock('T001', taskMap);

      expect(toUnblock).toEqual([]);
    });
  });

  describe('getCriticalPath', () => {
    it('should identify critical path tasks', () => {
      const task1: Task = { id: 'T001', dependencies: [] } as any;
      const task2: Task = { id: 'T002', dependencies: ['T001'] } as any;
      const task3: Task = { id: 'T003', dependencies: ['T002'] } as any;

      const tasks = [task1, task2, task3];

      const criticalPath = resolver.getCriticalPath(tasks);

      expect(criticalPath.length).toBeGreaterThan(0);
      expect(criticalPath).toContain('T001');
      expect(criticalPath).toContain('T002');
      expect(criticalPath).toContain('T003');
    });

    it('should handle multiple paths', () => {
      const task1: Task = { id: 'T001', dependencies: [] } as any;
      const task2a: Task = { id: 'T002', dependencies: ['T001'] } as any;
      const task2b: Task = { id: 'T003', dependencies: ['T001'] } as any;

      const tasks = [task1, task2a, task2b];

      const criticalPath = resolver.getCriticalPath(tasks);

      expect(criticalPath).toContain('T001');
      // Should contain one of the branches
      expect(criticalPath.length).toBeGreaterThan(1);
    });
  });

  describe('calculateReadinessScore', () => {
    it('should return high score for ready tasks', () => {
      const task: Task = {
        id: 'T001',
        status: 'AVAILABLE',
        priority: 'P0',
        dependencies: []
      } as any;

      const taskMap = new Map([['T001', task]]);

      const score = resolver.calculateReadinessScore(task, taskMap);

      expect(score).toBeGreaterThan(50);
    });

    it('should return low score for blocked tasks', () => {
      const dep: Task = { id: 'T001', status: 'IN_PROGRESS' } as any;
      const task: Task = {
        id: 'T002',
        status: 'BLOCKED',
        priority: 'P2',
        dependencies: ['T001']
      } as any;

      const taskMap = new Map([
        ['T001', dep],
        ['T002', task]
      ]);

      const score = resolver.calculateReadinessScore(task, taskMap);

      expect(score).toBeLessThan(30);
    });

    it('should prioritize P0 tasks', () => {
      const taskP0: Task = {
        id: 'T001',
        status: 'AVAILABLE',
        priority: 'P0',
        dependencies: []
      } as any;

      const taskP2: Task = {
        id: 'T002',
        status: 'AVAILABLE',
        priority: 'P2',
        dependencies: []
      } as any;

      const taskMap = new Map([
        ['T001', taskP0],
        ['T002', taskP2]
      ]);

      const scoreP0 = resolver.calculateReadinessScore(taskP0, taskMap);
      const scoreP2 = resolver.calculateReadinessScore(taskP2, taskMap);

      expect(scoreP0).toBeGreaterThan(scoreP2);
    });
  });
});
