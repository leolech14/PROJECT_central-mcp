/**
 * 🚀 TASK REGISTRY - LEGACY COMPATIBILITY LAYER
 * ================================================
 *
 * **LEGACY WRAPPER** for backward compatibility.
 *
 * This file maintains the original TaskRegistry interface while
 * internally using the new IntegratedTaskRegistry for full functionality.
 *
 * **DEPRECATION NOTICE:** This wrapper exists for backward compatibility.
 * New code should use IntegratedTaskRegistry directly.
 */

import { IntegratedTaskRegistry, type IntegratedTaskRegistryConfig } from './IntegratedTaskRegistry.js';
import type { Task, AgentId, TaskStatus, SprintMetrics } from '../types/Task.js';
import { logger } from '../utils/logger.js';

/**
 * Legacy TaskRegistry - Wrapper around IntegratedTaskRegistry
 * @deprecated Use IntegratedTaskRegistry for new implementations
 */
export class TaskRegistry {
  private integratedRegistry: IntegratedTaskRegistry;

  constructor(dbPath?: string) {
    logger.warn('⚠️ TaskRegistry is deprecated. Use IntegratedTaskRegistry instead.');

    // Initialize with legacy config
    const config: IntegratedTaskRegistryConfig = {
      dbPath,
      enableConnectionPooling: true,
      enableMonitoring: true,
      enableIntegrityValidation: true,
      enableJsonColumns: true,
      enableAsyncOperations: true,
      performanceMonitoring: true,
    };

    this.integratedRegistry = new IntegratedTaskRegistry(config);
  }

  /**
   * Initialize registry (delegated to IntegratedTaskRegistry)
   */
  async initialize(): Promise<void> {
    return this.integratedRegistry.initialize();
  }

  /**
   * Get all tasks (async version for compatibility)
   */
  async getAllTasks(): Promise<Task[]> {
    return this.integratedRegistry.getAllTasks();
  }

  /**
   * Get task by ID (async version for compatibility)
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.integratedRegistry.getTask(taskId);
  }

  /**
   * Get available tasks for agent (async version for compatibility)
   */
  async getAvailableTasks(agent: AgentId): Promise<Task[]> {
    return this.integratedRegistry.getAvailableTasks(agent);
  }

  /**
   * Claim task (enhanced with new features)
   */
  async claimTask(taskId: string, agent: AgentId): Promise<{
    success: boolean;
    error?: string;
    claimedAt?: string;
    warnings?: string[];
    performanceMetrics?: any;
  }> {
    return this.integratedRegistry.claimTask(taskId, agent);
  }

  /**
   * Complete task (enhanced with new features)
   */
  async completeTask(
    taskId: string,
    agent: AgentId,
    filesCreated?: string[],
    velocity?: number
  ): Promise<{
    success: boolean;
    error?: string;
    unblocked?: string[];
    unblockedCount?: number;
    performanceMetrics?: any;
  }> {
    return this.integratedRegistry.completeTask(taskId, agent, filesCreated, velocity);
  }

  /**
   * Get sprint metrics (enhanced)
   */
  async getSprintMetrics(): Promise<SprintMetrics> {
    return this.integratedRegistry.getSprintMetrics();
  }

  /**
   * Get agent workload (enhanced)
   */
  async getAgentWorkload(agent: AgentId) {
    return this.integratedRegistry.getAgentWorkload(agent);
  }

  /**
   * Get database instance (legacy compatibility)
   * @deprecated Use integrated database operations instead
   */
  getDatabase(): import('better-sqlite3').Database {
    logger.warn('⚠️ getDatabase() is deprecated. Use integrated database operations instead.');

    // Return a mock database for compatibility
    throw new Error('Direct database access deprecated. Use integrated operations instead.');
  }

  /**
   * Get rules registry instance
   */
  getRulesRegistry() {
    return this.integratedRegistry.getRulesRegistry();
  }

  /**
   * Get registry metrics (new enhanced method)
   */
  async getRegistryMetrics() {
    return this.integratedRegistry.getRegistryMetrics();
  }

  /**
   * Close registry (enhanced)
   */
  async close(): Promise<void> {
    return this.integratedRegistry.shutdown();
  }
}

// Export the new IntegratedTaskRegistry as default for new implementations
export { IntegratedTaskRegistry };
export type { IntegratedTaskRegistryConfig };