/**
 * 🧪 UNIT TESTS: INTEGRATED TASK STORE
 * =====================================
 *
 * Test the legacy TaskRegistry wrapper and IntegratedTaskStore
 * with full async operations and performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TaskStore, IntegratedTaskRegistry } from '../../src/registry/TaskRegistry.js';
import { TestUtils } from '../setup.js';
import { type Task, TaskStatus } from '../../src/types/Task.js';

describe('🗃️ Legacy TaskStore Wrapper', () => {
  let store: TaskStore;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = TestUtils.createTestDatabase().databasePath;
    store = new TaskStore(testDbPath);
  });

  afterEach(async () => {
    await store.close();
    TestUtils.cleanupTestDatabase();
  });

  describe('🔄 Legacy Compatibility', () => {
    test('should maintain backward compatibility', async () => {
      // Should not throw error with legacy usage
      expect(() => new TaskStore()).not.toThrow();
    });

    test('should warn about deprecation', async () => {
      const consoleSpy = jest.spy(console, 'warn').mockImplementation(() => {});
      new TaskStore();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TaskRegistry is deprecated')
      );
      consoleSpy.mockRestore();
    });

    test('should initialize with legacy config', async () => {
      await expect(store.initialize()).resolves.not.toThrow();
    });
  });

  describe('📊 Async Operations', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    test('should get all tasks asynchronously', async () => {
      const tasks = await store.getAllTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });

    test('should get task by ID asynchronously', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const task = await store.getTask(taskId);
      expect(task).toBeNull(); // Should return null for non-existent task
    });

    test('should get available tasks for agent', async () => {
      const agentId = 'test-agent';
      const tasks = await store.getAvailableTasks(agentId);
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe('🎯 Task Operations (Enhanced)', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    test('should claim task with enhanced metrics', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const agentId = 'test-agent';

      // Create a test task first
      const testTask: Task = {
        id: taskId,
        name: 'Test Task',
        agent: agentId,
        status: 'AVAILABLE',
        priority: 3,
        phase: 'implementation',
        timeline: '1-2 days',
        dependencies: [],
        deliverables: [],
        acceptanceCriteria: [],
        location: 'test',
      };

      // Add task using integrated registry
      const integratedRegistry = new IntegratedTaskRegistry();
      await integratedRegistry.initialize();
      await integratedRegistry.getJsonTaskStore()?.upsertTask(testTask);
      await integratedRegistry.shutdown();

      // Test claim through legacy wrapper
      const result = await store.claimTask(taskId, agentId);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.performanceMetrics).toBeDefined();
    });

    test('should complete task with auto-unblocking', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const agentId = 'test-agent';

      const result = await store.completeTask(taskId, agentId);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.performanceMetrics).toBeDefined();
    });
  });

  describe('📈 Enhanced Metrics', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    test('should get enhanced sprint metrics', async () => {
      const metrics = await store.getSprintMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalTasks).toBeGreaterThanOrEqual(0);
    });

    test('should get enhanced agent workload', async () => {
      const agentId = 'test-agent';
      const workload = await store.getAgentWorkload(agentId);
      expect(workload).toBeDefined();
      expect(workload.agent).toBe(agentId);
      expect(workload.totalTasks).toBeGreaterThanOrEqual(0);
    });

    test('should get comprehensive registry metrics', async () => {
      const metrics = await store.getRegistryMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.databasePerformance).toBeDefined();
      expect(metrics.systemHealth).toBeDefined();
    });
  });

  describe('🔧 Legacy Method Deprecation', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    test('should warn about getDatabase deprecation', async () => {
      const consoleSpy = jest.spy(console, 'warn').mockImplementation(() => {});

      expect(() => store.getDatabase()).toThrow('Direct database access deprecated');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('getDatabase() is deprecated')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('🔌 Registry Management', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    test('should get rules registry', () => {
      const rulesRegistry = store.getRulesRegistry();
      expect(rulesRegistry).toBeDefined();
    });

    test('should close gracefully', async () => {
      await expect(store.close()).resolves.not.toThrow();
    });
  });
});

describe('🚀 IntegratedTaskStore Direct Usage', () => {
  let integratedRegistry: IntegratedTaskRegistry;

  beforeEach(() => {
    integratedRegistry = new IntegratedTaskRegistry();
  });

  afterEach(async () => {
    if (integratedRegistry) {
      await integratedRegistry.shutdown();
    }
  });

  describe('🔧 Direct Integration', () => {
    test('should initialize with all features enabled', async () => {
      await expect(integratedRegistry.initialize()).resolves.not.toThrow();
    });

    test('should support custom configuration', async () => {
      const customRegistry = new IntegratedTaskRegistry({
        dbPath: ':memory:',
        enableConnectionPooling: false,
        performanceMonitoring: false
      });

      await expect(customRegistry.initialize()).resolves.not.toThrow();
      await customRegistry.shutdown();
    });
  });

  describe('📊 Advanced Operations', () => {
    beforeEach(async () => {
      await integratedRegistry.initialize();
    });

    test('should get tasks with filtering options', async () => {
      const tasks = await integratedRegistry.getAllTasks({
        status: 'AVAILABLE',
        limit: 10,
        sortBy: 'priority',
        sortOrder: 'asc'
      });

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeLessThanOrEqual(10);
    });

    test('should get available tasks with dependency analysis', async () => {
      const tasks = await integratedRegistry.getAvailableTasks('Agent-A', {
        limit: 5,
        includePriority: true,
        dependencyAnalysis: true
      });

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeLessThanOrEqual(5);
    });

    test('should claim task with detailed metrics', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const agentId = 'Agent-A';

      const result = await integratedRegistry.claimTask(taskId, agentId);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.claimDuration).toBeGreaterThan(0);
    });

    test('should complete task with auto-unblocking metrics', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const agentId = 'Agent-A';
      const filesCreated = ['test.txt'];

      const result = await integratedRegistry.completeTask(taskId, agentId, filesCreated);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.completionDuration).toBeGreaterThan(0);
      expect(result.performanceMetrics.autoUnblockDuration).toBeGreaterThan(0);
    });
  });

  describe('📈 Performance Metrics', () => {
    beforeEach(async () => {
      await integratedRegistry.initialize();
    });

    test('should get comprehensive registry metrics', async () => {
      const metrics = await integratedRegistry.getRegistryMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalTasks).toBeGreaterThanOrEqual(0);
      expect(metrics.databasePerformance).toBeDefined();
      expect(metrics.jsonPerformance).toBeDefined();
      expect(metrics.systemHealth).toBeDefined();
      expect(metrics.systemHealth.overall).toMatch(/healthy|degraded|unhealthy/);
    });

    test('should track task status distribution', async () => {
      const metrics = await integratedRegistry.getRegistryMetrics();

      expect(metrics.taskStatusCounts).toBeDefined();
      expect(typeof metrics.taskStatusCounts.AVAILABLE).toBe('number');
      expect(typeof metrics.taskStatusCounts.COMPLETE).toBe('number');
    });
  });

  describe('🔌 Error Handling', () => {
    beforeEach(async () => {
      await integratedRegistry.initialize();
    });

    test('should handle claim task not found', async () => {
      const result = await integratedRegistry.claimTask('non-existent', 'Agent-A');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
    });

    test('should handle complete task not found', async () => {
      const result = await integratedRegistry.completeTask('non-existent', 'Agent-A');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
    });

    test('should handle unauthorized agent operations', async () => {
      const taskId = TestUtils.generateRandomId('task');
      const result = await integratedRegistry.claimTask(taskId, 'Unauthorized-Agent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent');
    });
  });

  describe('🎯 Advanced Features', () => {
    beforeEach(async () => {
      await integratedRegistry.initialize();
    });

    test('should handle dependency analysis', async () => {
      const tasks = await integratedRegistry.getAvailableTasks('Agent-A', {
        dependencyAnalysis: true
      });

      expect(Array.isArray(tasks)).toBe(true);
    });

    test('should provide performance monitoring', async () => {
      const metrics = await integratedRegistry.getRegistryMetrics();

      expect(metrics.databasePerformance).toBeDefined();
      expect(metrics.jsonPerformance).toBeDefined();
    });

    test('should support async operations throughout', async () => {
      const allTasks = await integratedRegistry.getAllTasks();
      const metrics = await integratedRegistry.getSprintMetrics();
      const workload = await integratedRegistry.getAgentWorkload('Agent-A');

      expect(Array.isArray(allTasks)).toBe(true);
      expect(metrics).toBeDefined();
      expect(workload).toBeDefined();
    });
  });
});