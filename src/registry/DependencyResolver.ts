/**
 * Dependency Resolver
 * ===================
 *
 * Manages task dependencies and automatic unblocking.
 */

import type { Task, TaskStatus } from '../types/Task.js';
import { logger } from '../utils/logger.js';

export class DependencyResolver {
  /**
   * Check if task dependencies are satisfied
   */
  areDependenciesSatisfied(
    task: Task,
    allTasks: Map<string, Task>
  ): { satisfied: boolean; unsatisfiedDeps: string[] } {
    const unsatisfiedDeps: string[] = [];

    for (const depId of task.dependencies) {
      const depTask = allTasks.get(depId);

      if (!depTask) {
        logger.warn(`⚠️ Dependency ${depId} not found for task ${task.id}`);
        unsatisfiedDeps.push(depId);
        continue;
      }

      if (depTask.status !== 'COMPLETE') {
        unsatisfiedDeps.push(depId);
      }
    }

    return {
      satisfied: unsatisfiedDeps.length === 0,
      unsatisfiedDeps
    };
  }

  /**
   * Find tasks that can be unblocked when a task completes
   */
  findTasksToUnblock(
    completedTaskId: string,
    allTasks: Map<string, Task>
  ): Task[] {
    const tasksToUnblock: Task[] = [];

    for (const task of allTasks.values()) {
      // Only check blocked tasks
      if (task.status !== 'BLOCKED') {
        continue;
      }

      // Check if this task depends on the completed task
      if (!task.dependencies.includes(completedTaskId)) {
        continue;
      }

      // Check if all dependencies are now satisfied
      const { satisfied } = this.areDependenciesSatisfied(task, allTasks);

      if (satisfied) {
        tasksToUnblock.push(task);
        logger.info(`🔓 Task ${task.id} can be unblocked (dependency ${completedTaskId} complete)`);
      }
    }

    return tasksToUnblock;
  }

  /**
   * Build dependency graph
   */
  buildDependencyGraph(tasks: Task[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const task of tasks) {
      if (!graph.has(task.id)) {
        graph.set(task.id, new Set());
      }

      for (const depId of task.dependencies) {
        const deps = graph.get(task.id)!;
        deps.add(depId);
      }
    }

    return graph;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(tasks: Task[]): string[][] {
    const graph = this.buildDependencyGraph(tasks);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (taskId: string, path: string[]): void => {
      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);

      const deps = graph.get(taskId) || new Set();

      for (const depId of deps) {
        if (!visited.has(depId)) {
          dfs(depId, [...path]);
        } else if (recursionStack.has(depId)) {
          // Circular dependency detected
          const cycleStart = path.indexOf(depId);
          const cycle = path.slice(cycleStart);
          cycles.push([...cycle, depId]);
        }
      }

      recursionStack.delete(taskId);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        dfs(task.id, []);
      }
    }

    return cycles;
  }

  /**
   * Get critical path (longest dependency chain)
   */
  getCriticalPath(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map<string, Task[]>();

    const findLongestPath = (taskId: string): Task[] => {
      if (memo.has(taskId)) {
        return memo.get(taskId)!;
      }

      const task = taskMap.get(taskId);
      if (!task) {
        return [];
      }

      if (task.dependencies.length === 0) {
        return [task];
      }

      let longestPath: Task[] = [];

      for (const depId of task.dependencies) {
        const depPath = findLongestPath(depId);
        if (depPath.length > longestPath.length) {
          longestPath = depPath;
        }
      }

      const result = [...longestPath, task];
      memo.set(taskId, result);
      return result;
    };

    let criticalPath: Task[] = [];

    for (const task of tasks) {
      const path = findLongestPath(task.id);
      if (path.length > criticalPath.length) {
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  /**
   * Calculate task readiness score (0-100)
   * Higher score = more ready to work on
   */
  calculateReadinessScore(
    task: Task,
    allTasks: Map<string, Task>
  ): number {
    let score = 0;

    // Status check (50 points)
    if (task.status === 'AVAILABLE') {
      score += 50;
    } else if (task.status === 'BLOCKED') {
      score += 0;
    } else {
      return 0; // Already claimed/in-progress/complete
    }

    // Dependencies (30 points)
    const { satisfied, unsatisfiedDeps } = this.areDependenciesSatisfied(task, allTasks);
    if (satisfied) {
      score += 30;
    } else {
      const completionRatio = 1 - (unsatisfiedDeps.length / task.dependencies.length);
      score += Math.floor(completionRatio * 30);
    }

    // Priority (20 points)
    if (task.priority === 'P0') {
      score += 20;
    } else if (task.priority === 'P1') {
      score += 10;
    } else {
      score += 0;
    }

    return score;
  }
}
