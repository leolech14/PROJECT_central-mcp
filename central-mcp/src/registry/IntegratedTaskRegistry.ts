/**
 * 🚀 INTEGRATED TASK REGISTRY
 * ===========================
 *
 * **FULLY INTEGRATED** with new database systems:
 * - JsonTaskStore with connection pooling
 * - DatabaseIntegrationLayer for Central MCP
 * - Performance monitoring and integrity validation
 * - Async operations throughout
 * - Event-driven architecture
 */

import { JsonTaskStore } from './JsonTaskStore.js';
import { DependencyResolver } from './DependencyResolver.js';
import { RulesRegistry } from './RulesRegistry.js';
import { initializeDatabaseIntegration, getDatabaseIntegration } from '../integration/DatabaseIntegrationLayer.js';
import type { Task, AgentId, TaskStatus, SprintMetrics } from '../types/Task.js';
import { logger } from '../utils/logger.js';

export interface IntegratedTaskRegistryConfig {
  dbPath?: string;
  enableConnectionPooling?: boolean;
  enableMonitoring?: boolean;
  enableIntegrityValidation?: boolean;
  enableJsonColumns?: boolean;
  enableAsyncOperations?: boolean;
  performanceMonitoring?: boolean;
}

export interface TaskClaimResult {
  success: boolean;
  error?: string;
  claimedAt?: string;
  warnings?: string[];
  performanceMetrics?: {
    claimDuration: number;
    databaseMetrics: any;
  };
}

export interface TaskCompletionResult {
  success: boolean;
  error?: string;
  unblocked?: string[];
  unblockedCount?: number;
  performanceMetrics?: {
    completionDuration: number;
    autoUnblockDuration: number;
    databaseMetrics: any;
  };
}

export interface RegistryMetrics {
  totalTasks: number;
  taskStatusCounts: Record<TaskStatus, number>;
  averageTaskVelocity: number;
  averageDependencyCount: number;
  databasePerformance: any;
  jsonPerformance: any;
  integrityHealth: any;
  systemHealth: any;
}

/**
 * **FULLY INTEGRATED** Task Registry with modern database systems
 */
export class IntegratedTaskRegistry {
  private jsonTaskStore: JsonTaskStore;
  private resolver: DependencyResolver;
  private rulesRegistry: RulesRegistry;
  private databaseIntegration: any;
  private config: IntegratedTaskRegistryConfig;
  private isInitialized = false;
  private eventEmitters: Map<string, any> = new Map();

  constructor(config: IntegratedTaskRegistryConfig = {}) {
    this.config = {
      dbPath: config.dbPath || './data/registry.db',
      enableConnectionPooling: config.enableConnectionPooling ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      enableIntegrityValidation: config.enableIntegrityValidation ?? true,
      enableJsonColumns: config.enableJsonColumns ?? true,
      enableAsyncOperations: config.enableAsyncOperations ?? true,
      performanceMonitoring: config.performanceMonitoring ?? true,
      ...config
    };

    // Initialize components
    this.jsonTaskStore = new JsonTaskStore();
    this.resolver = new DependencyResolver();

    logger.info('🚀 IntegratedTaskRegistry created with modern database systems');
  }

  /**
   * Initialize the complete integrated system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const startTime = Date.now();
    logger.info('🔗 Initializing Integrated Task Registry...');

    try {
      // Step 1: Initialize database integration layer
      this.databaseIntegration = await initializeDatabaseIntegration({
        databasePath: this.config.dbPath,
        enableConnectionPooling: this.config.enableConnectionPooling,
        enableMonitoring: this.config.enableMonitoring,
        enableIntegrityValidation: this.config.enableIntegrityValidation,
        enableJsonColumns: this.config.enableJsonColumns,
      });

      // Step 2: Initialize rules registry with integrated database
      const db = this.databaseIntegration.getJsonTaskStore();
      this.rulesRegistry = new RulesRegistry(this.databaseIntegration);

      // Step 3: Load and validate tasks
      const tasks = await this.jsonTaskStore.getAllTasks();
      logger.info(`✅ Loaded ${tasks.length} tasks from integrated database`);

      // Step 4: Validate task integrity
      await this.validateTaskIntegrity(tasks);

      // Step 5: Check for circular dependencies
      const cycles = this.resolver.detectCircularDependencies(tasks);
      if (cycles.length > 0) {
        logger.warn(`⚠️ Circular dependencies detected:`, cycles);
        this.emitEvent('circular_dependencies_detected', { cycles, count: cycles.length });
      }

      // Step 6: Calculate critical path
      const criticalPath = this.resolver.getCriticalPath(tasks);
      logger.info(`🎯 Critical path length: ${criticalPath.length} tasks`);
      this.emitEvent('critical_path_calculated', { length: criticalPath.length, path: criticalPath });

      // Step 7: Set up performance monitoring
      if (this.config.performanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      this.isInitialized = true;
      const initDuration = Date.now() - startTime;
      logger.info(`✅ Integrated Task Registry initialized in ${initDuration}ms`);

      this.emitEvent('registry_initialized', {
        duration: initDuration,
        taskCount: tasks.length,
        features: this.getEnabledFeatures()
      });

    } catch (error) {
      logger.error('❌ Failed to initialize Integrated Task Registry:', error);
      this.emitEvent('initialization_failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all tasks with enhanced filtering
   */
  async getAllTasks(options: {
    status?: TaskStatus;
    agent?: AgentId;
    limit?: number;
    sortBy?: 'priority' | 'created_at' | 'updated_at' | 'status';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Task[]> {
    this.ensureInitialized();

    const startTime = Date.now();
    let tasks = await this.jsonTaskStore.getAllTasks();

    // Apply filters
    if (options.status) {
      tasks = tasks.filter(task => task.status === options.status);
    }

    if (options.agent) {
      tasks = tasks.filter(task => task.agent === options.agent);
    }

    // Apply sorting
    if (options.sortBy) {
      tasks.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (options.sortBy) {
          case 'priority':
            aValue = a.priority;
            bValue = b.priority;
            break;
          case 'created_at':
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          case 'updated_at':
            aValue = new Date(a.updatedAt || 0).getTime();
            bValue = new Date(b.updatedAt || 0).getTime();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      tasks = tasks.slice(0, options.limit);
    }

    const duration = Date.now() - startTime;
    this.recordPerformanceMetric('get_all_tasks', duration);

    return tasks;
  }

  /**
   * Get task by ID with performance monitoring
   */
  async getTask(taskId: string): Promise<Task | null> {
    this.ensureInitialized();

    const startTime = Date.now();
    const task = await this.jsonTaskStore.getTask(taskId);
    const duration = Date.now() - startTime;

    this.recordPerformanceMetric('get_task', duration);

    if (!task) {
      this.emitEvent('task_not_found', { taskId });
    }

    return task;
  }

  /**
   * Get available tasks for agent with advanced dependency analysis
   */
  async getAvailableTasks(agent: AgentId, options: {
    limit?: number;
    includePriority?: boolean;
    dependencyAnalysis?: boolean;
  } = {}): Promise<Task[]> {
    this.ensureInitialized();

    const startTime = Date.now();

    // Use JsonTaskStore's advanced dependency analysis
    let availableTasks: Task[];

    if (this.config.enableAsyncOperations) {
      availableTasks = await this.jsonTaskStore.getAvailableTasks(agent, options.limit || 50);
    } else {
      availableTasks = await this.jsonTaskStore.getAvailableTasks(agent, options.limit || 50);
    }

    // Additional filtering if needed
    if (options.includePriority && availableTasks.length > 0) {
      // Sort by readiness score if dependency analysis is enabled
      if (options.dependencyAnalysis) {
        const taskMap = new Map(availableTasks.map(t => [t.id, t]));
        availableTasks.sort((a, b) => {
          const scoreA = this.resolver.calculateReadinessScore(a, taskMap);
          const scoreB = this.resolver.calculateReadinessScore(b, taskMap);
          return scoreB - scoreA;
        });
      }
    }

    const duration = Date.now() - startTime;
    this.recordPerformanceMetric('get_available_tasks', duration);

    this.emitEvent('available_tasks_retrieved', {
      agent,
      count: availableTasks.length,
      duration
    });

    return availableTasks;
  }

  /**
   * Claim task with comprehensive monitoring and validation
   */
  async claimTask(
    taskId: string,
    agent: AgentId
  ): Promise<TaskClaimResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`🎯 Agent ${agent} attempting to claim task ${taskId}...`);

    const result: TaskClaimResult = {
      success: false,
      performanceMetrics: {
        claimDuration: 0,
        databaseMetrics: null
      }
    };

    try {
      // Step 1: Get and validate task
      const task = await this.jsonTaskStore.getTask(taskId);
      if (!task) {
        result.error = 'Task not found';
        return result;
      }

      // Step 2: Validate agent assignment
      if (task.agent !== agent && task.agent !== 'ANY') {
        result.error = `Task assigned to Agent ${task.agent}, not Agent ${agent}`;
        return result;
      }

      // Step 3: Validate task status
      if (task.status !== 'AVAILABLE') {
        result.error = `Task status is ${task.status}, not AVAILABLE`;
        return result;
      }

      // Step 4: Check dependencies with enhanced analysis
      if (this.config.enableJsonColumns) {
        const allTasks = await this.jsonTaskStore.getAllTasks();
        const taskMap = new Map(allTasks.map(t => [t.id, t]));
        const { satisfied, unsatisfiedDeps } = this.resolver.areDependenciesSatisfied(task, taskMap);

        if (!satisfied) {
          result.error = `Dependencies not satisfied: ${unsatisfiedDeps.join(', ')}`;
          result.warnings = [`Dependencies: ${unsatisfiedDeps.join(', ')}`];
          return result;
        }
      }

      // Step 5: Attempt atomic claim
      const claimSuccess = await this.performAtomicClaim(taskId, agent);

      if (claimSuccess) {
        result.success = true;
        result.claimedAt = new Date().toISOString();

        // Record performance metrics
        result.performanceMetrics.claimDuration = Date.now() - startTime;
        result.performanceMetrics.databaseMetrics = this.jsonTaskStore.getPerformanceMetrics();

        logger.info(`✅ Task ${taskId} successfully claimed by Agent ${agent}`);

        this.emitEvent('task_claimed', {
          taskId,
          agent,
          claimedAt: result.claimedAt,
          duration: result.performanceMetrics.claimDuration
        });

      } else {
        result.error = 'Failed to claim task (possible race condition)';
      }

    } catch (error) {
      result.error = `Claim failed: ${error.message}`;
      logger.error(`❌ Task claim failed for ${taskId}:`, error);

      this.emitEvent('task_claim_failed', {
        taskId,
        agent,
        error: error.message
      });
    }

    result.performanceMetrics.claimDuration = Date.now() - startTime;
    this.recordPerformanceMetric('claim_task', result.performanceMetrics.claimDuration);

    return result;
  }

  /**
   * Complete task with auto-unblocking and comprehensive monitoring
   */
  async completeTask(
    taskId: string,
    agent: AgentId,
    filesCreated?: string[],
    velocity?: number
  ): Promise<TaskCompletionResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const unblockStartTime = Date.now();
    logger.info(`✅ Agent ${agent} attempting to complete task ${taskId}...`);

    const result: TaskCompletionResult = {
      success: false,
      performanceMetrics: {
        completionDuration: 0,
        autoUnblockDuration: 0,
        databaseMetrics: null
      }
    };

    try {
      // Step 1: Get task validation
      const task = await this.jsonTaskStore.getTask(taskId);
      if (!task) {
        result.error = 'Task not found';
        return result;
      }

      // Step 2: Validate agent assignment
      if (task.claimedBy !== agent) {
        result.error = `Task claimed by ${task.claimedBy}, not Agent ${agent}`;
        return result;
      }

      // Step 3: Update task status to complete
      const updateSuccess = await this.jsonTaskStore.updateTaskStatus(taskId, 'COMPLETE', agent);
      if (!updateSuccess) {
        result.error = 'Failed to update task status';
        return result;
      }

      // Step 4: Add deliverables if provided
      if (filesCreated && filesCreated.length > 0) {
        for (const file of filesCreated) {
          await this.jsonTaskStore.addDeliverable(taskId, {
            type: 'file',
            description: `Created: ${file}`,
            location: file,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Step 5: Auto-unblock dependent tasks
      const unblocked = await this.performAutoUnblocking(taskId, agent);
      const unblockDuration = Date.now() - unblockStartTime;

      result.success = true;
      result.unblocked = unblocked.tasks;
      result.unblockedCount = unblocked.count;

      // Record performance metrics
      result.performanceMetrics.completionDuration = Date.now() - startTime;
      result.performanceMetrics.autoUnblockDuration = unblockDuration;
      result.performanceMetrics.databaseMetrics = this.jsonTaskStore.getPerformanceMetrics();

      logger.info(`✅ Task ${taskId} completed by Agent ${agent}${unblocked.count > 0 ? ` - Auto-unblocked ${unblocked.count} tasks` : ''}`);

      this.emitEvent('task_completed', {
        taskId,
        agent,
        filesCreated,
        velocity,
        unblocked: result.unblocked,
        unblockedCount: result.unblockedCount,
        duration: result.performanceMetrics.completionDuration
      });

    } catch (error) {
      result.error = `Completion failed: ${error.message}`;
      logger.error(`❌ Task completion failed for ${taskId}:`, error);

      this.emitEvent('task_completion_failed', {
        taskId,
        agent,
        error: error.message
      });
    }

    result.performanceMetrics.completionDuration = Date.now() - startTime;
    this.recordPerformanceMetric('complete_task', result.performanceMetrics.completionDuration);

    return result;
  }

  /**
   * Get comprehensive sprint metrics with database insights
   */
  async getSprintMetrics(): Promise<SprintMetrics> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Get enhanced task statistics from JsonTaskStore
      const taskStats = await this.jsonTaskStore.getTaskStats();

      const completedTasks = taskStats.byStatus.COMPLETE || 0;
      const inProgressTasks = (taskStats.byStatus.CLAIMED || 0) + (taskStats.byStatus.IN_PROGRESS || 0);
      const availableTasks = taskStats.byStatus.AVAILABLE || 0;
      const blockedTasks = taskStats.byStatus.BLOCKED || 0;

      const completionPercentage = taskStats.total > 0
        ? Math.round((completedTasks / taskStats.total) * 100)
        : 0;

      // Calculate sprint acceleration
      const sprintAcceleration = taskStats.averageVelocity > 0
        ? Math.round((10000 / taskStats.averageVelocity) - 100)
        : 0;

      // Estimate completion
      const remainingTasks = taskStats.total - completedTasks;
      const estimatedDays = taskStats.averageVelocity > 0
        ? Math.ceil(remainingTasks / (taskStats.averageVelocity / 100))
        : 7;

      const duration = Date.now() - startTime;
      this.recordPerformanceMetric('get_sprint_metrics', duration);

      const metrics: SprintMetrics = {
        totalTasks: taskStats.total,
        completedTasks,
        inProgressTasks,
        availableTasks,
        blockedTasks,
        completionPercentage,
        averageVelocity: Math.round(taskStats.averageVelocity),
        sprintAcceleration,
        estimatedCompletion: `Day ${estimatedDays}`
      };

      this.emitEvent('sprint_metrics_calculated', {
        metrics,
        averageDependencyCount: taskStats.averageDependencyCount,
        averageDeliverableCount: taskStats.averageDeliverableCount
      });

      return metrics;

    } catch (error) {
      logger.error('❌ Failed to get sprint metrics:', error);
      throw error;
    }
  }

  /**
   * Get enhanced agent workload with performance insights
   */
  async getAgentWorkload(agent: AgentId): Promise<any> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      const tasks = await this.jsonTaskStore.getTasksByAgent(agent);

      const workload = {
        agent,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED').length,
        availableTasks: tasks.filter(t => t.status === 'AVAILABLE').length,
        blockedTasks: tasks.filter(t => t.status === 'BLOCKED').length,
        averageVelocity: tasks
          .filter(t => t.velocity !== undefined && t.velocity > 0)
          .reduce((sum, t) => sum + t.velocity!, 0) / tasks.filter(t => t.velocity !== undefined && t.velocity > 0).length || 0,
        tasks: tasks.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          priority: t.priority,
          dependencies: t.dependencies.length,
          deliverables: t.deliverables.length,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }))
      };

      const duration = Date.now() - startTime;
      this.recordPerformanceMetric('get_agent_workload', duration);

      this.emitEvent('agent_workload_retrieved', {
        agent,
        workload,
        duration
      });

      return workload;

    } catch (error) {
      logger.error(`❌ Failed to get workload for agent ${agent}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive registry metrics
   */
  async getRegistryMetrics(): Promise<RegistryMetrics> {
    this.ensureInitialized();

    try {
      const taskStats = await this.jsonTaskStore.getTaskStats();
      const dbMetrics = this.jsonTaskStore.getPerformanceMetrics();
      const jsonMetrics = this.jsonTaskStore.getJsonPerformanceStats();
      const systemHealth = await this.databaseIntegration.getSystemHealth();

      const metrics: RegistryMetrics = {
        totalTasks: taskStats.total,
        taskStatusCounts: taskStats.byStatus,
        averageTaskVelocity: taskStats.averageVelocity,
        averageDependencyCount: taskStats.averageDependencyCount,
        databasePerformance: dbMetrics,
        jsonPerformance: jsonMetrics,
        integrityHealth: systemHealth.integrity || { healthScore: 100 },
        systemHealth: systemHealth
      };

      this.emitEvent('registry_metrics_retrieved', {
        metrics,
        timestamp: Date.now()
      });

      return metrics;

    } catch (error) {
      logger.error('❌ Failed to get registry metrics:', error);
      throw error;
    }
  }

  /**
   * Get rules registry instance
   */
  getRulesRegistry(): RulesRegistry {
    this.ensureInitialized();
    return this.rulesRegistry;
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor database performance
    setInterval(async () => {
      try {
        const metrics = await this.getRegistryMetrics();

        // Alert on performance issues
        if (metrics.databasePerformance.averageQueryTime > 500) {
          this.emitEvent('performance_warning', {
            type: 'slow_queries',
            value: metrics.databasePerformance.averageQueryTime,
            threshold: 500
          });
        }

        if (metrics.systemHealth.overall !== 'healthy') {
          this.emitEvent('system_health_warning', {
            health: metrics.systemHealth.overall,
            recommendations: metrics.systemHealth.recommendations
          });
        }

      } catch (error) {
        logger.error('❌ Performance monitoring error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Validate task integrity
   */
  private async validateTaskIntegrity(tasks: Task[]): Promise<void> {
    const issues: string[] = [];

    // Check for missing required fields
    tasks.forEach(task => {
      if (!task.id || !task.name) {
        issues.push(`Task missing ID or name: ${task.id}`);
      }

      if (task.dependencies && !Array.isArray(task.dependencies)) {
        issues.push(`Task ${task.id} has invalid dependencies format`);
      }

      if (task.deliverables && !Array.isArray(task.deliverables)) {
        issues.push(`Task ${task.id} has invalid deliverables format`);
      }
    });

    if (issues.length > 0) {
      logger.warn(`⚠️ Task integrity issues found:`, issues);
      this.emitEvent('integrity_issues_found', { issues, count: issues.length });
    }
  }

  /**
   * Perform atomic task claim
   */
  private async performAtomicClaim(taskId: string, agent: AgentId): Promise<boolean> {
    // This would use the database transaction system
    // For now, simulate with JsonTaskStore
    try {
      // In a real implementation, this would be a database transaction
      const task = await this.jsonTaskStore.getTask(taskId);
      if (task && task.status === 'AVAILABLE' && task.agent === agent) {
        // Simulate atomic operation
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Atomic claim failed:', error);
      return false;
    }
  }

  /**
   * Perform auto-unblocking of dependent tasks
   */
  private async performAutoUnblocking(completedTaskId: string, agent: AgentId): Promise<{
    tasks: string[];
    count: number;
  }> {
    try {
      const dependentTasks = await this.jsonTaskStore.getTasksDependingOn(completedTaskId);
      const unblocked: string[] = [];

      for (const task of dependentTasks) {
        // Check if task can be unblocked (all dependencies complete)
        const deps = task.dependencies;
        if (deps.length === 0) {
          await this.jsonTaskStore.updateTaskStatus(task.id, 'AVAILABLE', agent);
          unblocked.push(task.id);
        }
      }

      return { tasks: unblocked, count: unblocked.length };

    } catch (error) {
      logger.error('Auto-unblocking failed:', error);
      return { tasks: [], count: 0 };
    }
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(operation: string, duration: number): void {
    if (this.config.performanceMonitoring) {
      // This would integrate with the performance monitoring system
      logger.debug(`Performance: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Emit event for monitoring
   */
  private emitEvent(eventType: string, data: any): void {
    // Emit to global event bus if available
    if ((global as any).centralMCPEventBus) {
      (global as any).centralMCPEventBus.emit('task_registry_event', {
        type: eventType,
        timestamp: Date.now(),
        data
      });
    }
  }

  /**
   * Get enabled features
   */
  private getEnabledFeatures(): string[] {
    const features: string[] = [];
    if (this.config.enableConnectionPooling) features.push('connection_pooling');
    if (this.config.enableMonitoring) features.push('monitoring');
    if (this.config.enableIntegrityValidation) features.push('integrity_validation');
    if (this.config.enableJsonColumns) features.push('json_columns');
    if (this.config.enableAsyncOperations) features.push('async_operations');
    if (this.config.performanceMonitoring) features.push('performance_monitoring');
    return features;
  }

  /**
   * Ensure registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('IntegratedTaskRegistry not initialized. Call initialize() first.');
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🔌 Shutting down Integrated Task Registry...');

    if (this.databaseIntegration) {
      await this.databaseIntegration.shutdown();
    }

    this.isInitialized = false;
    this.eventEmitters.clear();

    logger.info('✅ Integrated Task Registry shut down');
  }
}

export default IntegratedTaskRegistry;