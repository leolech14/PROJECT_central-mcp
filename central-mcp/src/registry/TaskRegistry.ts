/**
 * Task Registry (Core Logic)
 * ===========================
 *
 * Central coordination system for multi-agent task management.
 * Provides atomic operations and automatic dependency resolution.
 */

import { TaskStore } from './TaskStore.js';
import { DependencyResolver } from './DependencyResolver.js';
import { RulesRegistry } from './RulesRegistry.js';
import type { Task, AgentId, TaskStatus, SprintMetrics } from '../types/Task.js';
import { logger } from '../utils/logger.js';

export class TaskRegistry {
  private store: TaskStore;
  private resolver: DependencyResolver;
  private rulesRegistry: RulesRegistry;

  constructor(dbPath?: string) {
    this.store = new TaskStore(dbPath);
    this.resolver = new DependencyResolver();
    this.rulesRegistry = new RulesRegistry(this.store.getDatabase());
    logger.info('🎯 TaskRegistry initialized with RulesRegistry');
  }

  /**
   * Initialize registry with tasks from markdown or database
   */
  async initialize(): Promise<void> {
    logger.info('📊 Initializing task registry...');

    // TODO: Parse CENTRAL_TASK_REGISTRY.md if database is empty
    // For now, assume tasks are already in database

    const tasks = this.store.getAllTasks();
    logger.info(`✅ Loaded ${tasks.length} tasks from database`);

    // Check for circular dependencies
    const cycles = this.resolver.detectCircularDependencies(tasks);
    if (cycles.length > 0) {
      logger.warn(`⚠️ Circular dependencies detected:`, cycles);
    }

    // Calculate critical path
    const criticalPath = this.resolver.getCriticalPath(tasks);
    logger.info(`🎯 Critical path length: ${criticalPath.length} tasks`);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return this.store.getAllTasks();
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | null {
    return this.store.getTask(taskId);
  }

  /**
   * Get available tasks for agent
   */
  getAvailableTasks(agent: AgentId): Task[] {
    const allTasks = this.store.getAllTasks();
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    return allTasks
      .filter(task => {
        // Must be assigned to this agent
        if (task.agent !== agent) {
          return false;
        }

        // Must be available
        if (task.status !== 'AVAILABLE') {
          return false;
        }

        // Dependencies must be satisfied
        const { satisfied } = this.resolver.areDependenciesSatisfied(task, taskMap);
        return satisfied;
      })
      .sort((a, b) => {
        // Sort by readiness score (highest first)
        const scoreA = this.resolver.calculateReadinessScore(a, taskMap);
        const scoreB = this.resolver.calculateReadinessScore(b, taskMap);
        return scoreB - scoreA;
      });
  }

  /**
   * Claim task (atomic)
   */
  async claimTask(
    taskId: string,
    agent: AgentId
  ): Promise<{ success: boolean; error?: string; claimedAt?: string }> {
    logger.info(`🎯 Agent ${agent} attempting to claim task ${taskId}...`);

    const task = this.store.getTask(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.agent !== agent) {
      return {
        success: false,
        error: `Task assigned to Agent ${task.agent}, not Agent ${agent}`
      };
    }

    if (task.status !== 'AVAILABLE') {
      return {
        success: false,
        error: `Task status is ${task.status}, not AVAILABLE`
      };
    }

    // Check dependencies
    const allTasks = new Map(this.store.getAllTasks().map(t => [t.id, t]));
    const { satisfied, unsatisfiedDeps } = this.resolver.areDependenciesSatisfied(task, allTasks);

    if (!satisfied) {
      return {
        success: false,
        error: `Dependencies not satisfied: ${unsatisfiedDeps.join(', ')}`
      };
    }

    // Atomic claim
    const success = this.store.claimTask(taskId, agent);

    if (success) {
      const claimedAt = new Date().toISOString();
      return { success: true, claimedAt };
    } else {
      return { success: false, error: 'Failed to claim task (possible race condition)' };
    }
  }

  /**
   * Complete task (atomic with auto-unblocking)
   */
  async completeTask(
    taskId: string,
    agent: AgentId,
    filesCreated?: string[],
    velocity?: number
  ): Promise<{ success: boolean; error?: string; unblocked?: string[] }> {
    logger.info(`✅ Agent ${agent} attempting to complete task ${taskId}...`);

    const success = this.store.completeTask(taskId, agent, filesCreated, velocity);

    if (!success) {
      return { success: false, error: 'Failed to complete task' };
    }

    // Auto-unblock dependent tasks
    const allTasks = new Map(this.store.getAllTasks().map(t => [t.id, t]));
    const tasksToUnblock = this.resolver.findTasksToUnblock(taskId, allTasks);

    const unblocked: string[] = [];

    for (const task of tasksToUnblock) {
      this.store.updateTaskStatus(task.id, 'AVAILABLE', agent);
      unblocked.push(task.id);
    }

    if (unblocked.length > 0) {
      logger.info(`🔓 Auto-unblocked ${unblocked.length} tasks: ${unblocked.join(', ')}`);
    }

    return { success: true, unblocked };
  }

  /**
   * Get sprint metrics
   */
  getSprintMetrics(): SprintMetrics {
    const tasks = this.store.getAllTasks();

    const completedTasks = tasks.filter(t => t.status === 'COMPLETE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED').length;
    const availableTasks = tasks.filter(t => t.status === 'AVAILABLE').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;

    const completionPercentage = Math.round((completedTasks / tasks.length) * 100);

    // Calculate average velocity
    const velocities = tasks
      .filter(t => t.velocity !== undefined && t.velocity > 0)
      .map(t => t.velocity!);

    const averageVelocity = velocities.length > 0
      ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
      : 0;

    // Calculate sprint acceleration (simplified)
    const sprintAcceleration = averageVelocity > 0
      ? Math.round((10000 / averageVelocity) - 100) // % ahead/behind
      : 0;

    // Estimated completion (simplified)
    const remainingTasks = tasks.length - completedTasks;
    const estimatedDays = averageVelocity > 0
      ? Math.ceil(remainingTasks / (averageVelocity / 100))
      : 7;

    return {
      totalTasks: tasks.length,
      completedTasks,
      inProgressTasks,
      availableTasks,
      blockedTasks,
      completionPercentage,
      averageVelocity,
      sprintAcceleration,
      estimatedCompletion: `Day ${estimatedDays}`
    };
  }

  /**
   * Get agent workload
   */
  getAgentWorkload(agent: AgentId) {
    const tasks = this.store.getTasksByAgent(agent);

    return {
      agent,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETE').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED').length,
      availableTasks: tasks.filter(t => t.status === 'AVAILABLE').length,
      blockedTasks: tasks.filter(t => t.status === 'BLOCKED').length,
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        priority: t.priority
      }))
    };
  }

  /**
   * Get database instance for intelligence tools
   */
  getDatabase(): import('better-sqlite3').Database {
    return this.store.getDatabase();
  }

  /**
   * Get rules registry instance
   */
  getRulesRegistry(): RulesRegistry {
    return this.rulesRegistry;
  }

  /**
   * Close registry
   */
  close(): void {
    this.store.close();
    logger.info('🔒 TaskRegistry closed');
  }
}
