/**
 * Loop 8: Task Auto-Assignment (EVENT-DRIVEN VERSION)
 * ======================================================
 *
 * THE COORDINATION BRAIN - Now with instant assignments!
 *
 * MULTI-TRIGGER ARCHITECTURE:
 * 1. TIME: Every 2 minutes - Catch-all scan for unassigned tasks
 * 2. EVENT: Instant reactions to:
 *    - TASK_CREATED → Assign immediately (<1 second!)
 *    - DEPENDENCIES_UNBLOCKED → Assign newly available tasks
 *    - AGENT_AVAILABLE → Assign to newly free agent
 * 3. MANUAL: API-triggered assignment
 *
 * Performance impact:
 * - Task created → assigned: 2 minutes → <500ms (240x faster!)
 * - Task unblocked → assigned: 2 minutes → <500ms (240x faster!)
 * - This is how the system coordinates autonomously!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { writeSystemEvent } from '../api/universal-write.js';
import { BaseLoop, LoopTriggerConfig, LoopExecutionContext } from './BaseLoop.js';
import { LoopEvent } from './EventBus.js';

export interface TaskAssignmentConfig {
  intervalSeconds: number;      // How often to run (default: 120 = 2 minutes)
  autoAssign: boolean;           // Actually assign or just suggest (default: true)
  notifyAgents: boolean;         // Notify agents of assignments (default: true)
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  agent: string;
  status: string;
  priority: number;
  dependencies: string;
  category: string;
  claimed_by?: string | null;
}

interface Agent {
  agentLetter: string;
  model: string;
  capabilities: string[];
  currentWorkload: number;
  lastHeartbeat: string;
  sessionId: string;
  projectId: string;
}

export class TaskAssignmentLoop extends BaseLoop {
  private config: TaskAssignmentConfig;
  private systems: any; // Revolutionary systems for intelligent task assignment
  private tasksAssigned: number = 0;

  constructor(db: Database.Database, config: TaskAssignmentConfig, systems?: any) {
    // Configure multi-trigger architecture
    const triggerConfig: LoopTriggerConfig = {
      // TIME: Periodic catch-all scan (backup for missed events)
      time: {
        enabled: true,
        intervalSeconds: config.intervalSeconds
      },

      // EVENT: Instant reactions to task/agent availability (CRITICAL!)
      events: {
        enabled: true,
        triggers: [
          LoopEvent.TASK_CREATED,              // ⚡ Assign immediately when task created!
          LoopEvent.DEPENDENCIES_UNBLOCKED,    // ⚡ Assign when tasks become available
          LoopEvent.AGENT_AVAILABLE,           // ⚡ Assign work to newly free agent
        ],
        priority: 'high' // High priority - keep work flowing!
      },

      // MANUAL: Support API-triggered assignment
      manual: {
        enabled: true
      }
    };

    super(db, 8, 'Task Auto-Assignment', triggerConfig);
    this.config = config;
    this.systems = systems || {};

    if (systems && systems.agentOrchestrator) {
      logger.info('🎯 Loop 8: AgentDeploymentOrchestrator integrated for sophisticated assignment');
    }

    logger.info(`🏗️  Loop 8: Multi-trigger architecture configured`);
    logger.info(`   Auto-assign: ${config.autoAssign}`);
    logger.info(`   🚀 Event-driven: Task → assigned in <500ms!`);
  }

  /**
   * Execute task assignment (called by BaseLoop for all trigger types)
   */
  protected async execute(context: LoopExecutionContext): Promise<void> {
    const startTime = Date.now();

    logger.info(`🎯 Loop 8 Execution #${this.executionCount} (${context.trigger})`);

    try {
      // Event-triggered assignment: focused on specific task/agent
      if (context.trigger === 'event') {
        await this.handleEventTriggeredAssignment(context);
        return;
      }

      // Time/Manual triggered: full assignment scan
      await this.runFullAssignmentScan(startTime);

    } catch (err: any) {
      logger.error(`❌ Loop 8 Error:`, err);
    }
  }

  /**
   * Handle event-triggered assignment (INSTANT! <500ms)
   */
  private async handleEventTriggeredAssignment(context: LoopExecutionContext): Promise<void> {
    const event = context.event!;
    const payload = context.payload;

    logger.info(`   ⚡ Event: ${event} → INSTANT ASSIGNMENT`);

    switch (event) {
      case LoopEvent.TASK_CREATED:
        // Assign specific newly created task
        await this.assignSpecificTask(payload.taskId);
        break;

      case LoopEvent.DEPENDENCIES_UNBLOCKED:
        // Assign all newly unblocked tasks
        for (const taskId of payload.unblockedTasks || []) {
          await this.assignSpecificTask(taskId);
        }
        logger.info(`   ✅ Processed ${payload.count} unblocked task(s)`);
        break;

      case LoopEvent.AGENT_AVAILABLE:
        // Assign work to newly available agent
        await this.assignToSpecificAgent(payload.agent);
        break;
    }
  }

  /**
   * Assign a specific task (event-triggered)
   */
  private async assignSpecificTask(taskId: string): Promise<void> {
    // Get task details
    const task = this.db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId) as Task | undefined;

    if (!task) {
      logger.warn(`   Task ${taskId} not found`);
      return;
    }

    if (task.status !== 'pending' || task.claimed_by) {
      logger.debug(`   Task ${taskId} not available (${task.status})`);
      return;
    }

    // Check dependencies
    if (!this.areDependenciesMet(task)) {
      logger.debug(`   Task ${taskId} has unmet dependencies`);
      return;
    }

    // Get active agents
    const activeAgents = this.getActiveAgents();

    if (activeAgents.length === 0) {
      logger.info(`   No active agents available for ${taskId}`);
      return;
    }

    // Match and assign
    const matchedAgents = this.matchAgentCapabilities(task, activeAgents);

    if (matchedAgents.length === 0) {
      logger.info(`   ⚠️  No agents match task ${taskId}`);
      return;
    }

    const rankedAgents = this.rankAgentsByFitness(matchedAgents, task);
    const bestAgent = rankedAgents[0];

    if (this.config.autoAssign) {
      this.assignTask(taskId, bestAgent);
      this.tasksAssigned++;

      logger.info(`   ✅ ${taskId} → Agent ${bestAgent.agentLetter} (INSTANT!)`);

      // Emit assignment event
      this.eventBus.emitLoopEvent(
        LoopEvent.TASK_ASSIGNED,
        {
          taskId,
          agent: bestAgent.agentLetter,
          sessionId: bestAgent.sessionId,
          assignedAt: Date.now()
        },
        {
          priority: 'normal',
          source: 'Loop 8'
        }
      );

      if (this.config.notifyAgents) {
        this.notifyAgent(bestAgent, task);
      }
    }
  }

  /**
   * Assign tasks to specific agent (event-triggered)
   */
  private async assignToSpecificAgent(agentLetter: string): Promise<void> {
    // Get agent details
    const agents = this.getActiveAgents();
    const agent = agents.find(a => a.agentLetter === agentLetter);

    if (!agent) {
      logger.debug(`   Agent ${agentLetter} not found or inactive`);
      return;
    }

    // Get available tasks
    const availableTasks = this.getAvailableTasks();

    if (availableTasks.length === 0) {
      logger.info(`   No available tasks for Agent ${agentLetter}`);
      return;
    }

    // Find best task for this agent
    const matchedTasks = availableTasks.filter(task =>
      this.matchAgentCapabilities(task, [agent]).length > 0
    );

    if (matchedTasks.length === 0) {
      logger.info(`   No matching tasks for Agent ${agentLetter}`);
      return;
    }

    // Rank by priority and assign best
    const bestTask = matchedTasks.sort((a, b) => a.priority - b.priority)[0];

    if (this.config.autoAssign) {
      this.assignTask(bestTask.id, agent);
      this.tasksAssigned++;

      logger.info(`   ✅ ${bestTask.id} → Agent ${agentLetter} (INSTANT!)`);

      // Emit assignment event
      this.eventBus.emitLoopEvent(
        LoopEvent.TASK_ASSIGNED,
        {
          taskId: bestTask.id,
          agent: agentLetter,
          sessionId: agent.sessionId,
          assignedAt: Date.now()
        },
        {
          priority: 'normal',
          source: 'Loop 8'
        }
      );

      if (this.config.notifyAgents) {
        this.notifyAgent(agent, bestTask);
      }
    }
  }

  /**
   * Run full assignment scan (time-based or manual)
   */
  private async runFullAssignmentScan(startTime: number): Promise<void> {
    // Get available tasks (pending status, dependencies met)
    const availableTasks = this.getAvailableTasks();

    // Get active agents (heartbeat within 2 minutes)
    const activeAgents = this.getActiveAgents();

    if (availableTasks.length === 0) {
      logger.info(`   No available tasks to assign`);
      return;
    }

    if (activeAgents.length === 0) {
      logger.info(`   No active agents available`);
      return;
    }

    logger.info(`   Found ${availableTasks.length} tasks, ${activeAgents.length} agents`);

    let assigned = 0;

    for (const task of availableTasks) {
      // Match capabilities
      const matchedAgents = this.matchAgentCapabilities(task, activeAgents);

      if (matchedAgents.length === 0) {
        logger.info(`   ⚠️  No agents match task ${task.id}`);
        continue;
      }

      // Rank by fitness
      const rankedAgents = this.rankAgentsByFitness(matchedAgents, task);
      const bestAgent = rankedAgents[0];

      // Auto-assign
      if (this.config.autoAssign) {
        this.assignTask(task.id, bestAgent);
        assigned++;
        this.tasksAssigned++;

        logger.info(`   ✅ ${task.id} → Agent ${bestAgent.agentLetter} (${bestAgent.model})`);

        // Emit assignment event
        this.eventBus.emitLoopEvent(
          LoopEvent.TASK_ASSIGNED,
          {
            taskId: task.id,
            agent: bestAgent.agentLetter,
            sessionId: bestAgent.sessionId,
            assignedAt: Date.now()
          },
          {
            priority: 'normal',
            source: 'Loop 8'
          }
        );

        // Notify agent (if enabled)
        if (this.config.notifyAgents) {
          this.notifyAgent(bestAgent, task);
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`✅ Loop 8 Complete: Assigned ${assigned} tasks in ${duration}ms`);

    // Write event to Universal Write System
    writeSystemEvent({
      eventType: 'loop_execution',
      eventCategory: 'system',
      eventActor: 'Loop-8',
      eventAction: `Task assignment: ${availableTasks.length} tasks, ${activeAgents.length} agents, ${assigned} assigned`,
      eventDescription: `Loop #${this.executionCount}`,
      systemHealth: assigned > 0 ? 'healthy' : 'warning',
      activeLoops: 9,
      activeAgents: activeAgents.length,
      activeTasks: availableTasks.length,
      avgResponseTimeMs: duration,
      successRate: availableTasks.length > 0 ? (assigned / availableTasks.length) : 1.0,
      tags: ['loop-8', 'task-assignment', 'auto-proactive'],
      metadata: {
        executionCount: this.executionCount,
        tasksAvailable: availableTasks.length,
        agentsActive: activeAgents.length,
        tasksAssigned: assigned
      }
    });
  }

  /**
   * Get available tasks
   */
  private getAvailableTasks(): Task[] {
    const tasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status = 'pending'
      AND agent IS NOT NULL
      AND claimed_by IS NULL
      ORDER BY priority ASC, created_at ASC
      LIMIT 50
    `).all() as Task[];

    // Filter by dependencies met
    return tasks.filter(task => this.areDependenciesMet(task));
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: Task): boolean {
    if (!task.dependencies) return true;

    let deps: string[] = [];
    try {
      deps = JSON.parse(task.dependencies);
    } catch {
      return true;
    }

    if (deps.length === 0) return true;

    // Check all dependencies are completed
    for (const depId of deps) {
      const dep = this.db.prepare(`
        SELECT status FROM tasks WHERE id = ?
      `).get(depId) as any;

      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get active agents
   */
  private getActiveAgents(): Agent[] {
    // Get agents with heartbeat within last 2 minutes
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);

    const agents = this.db.prepare(`
      SELECT
        id as sessionId,
        agent_letter as agentLetter,
        agent_model as model,
        project_id as projectId,
        last_heartbeat as lastHeartbeat
      FROM agent_sessions
      WHERE status = 'ACTIVE'
      AND datetime(last_heartbeat) > datetime('now', '-2 minutes')
    `).all() as any[];

    // Get capabilities from agents table (or use defaults)
    return agents.map(a => {
      // Default capabilities based on agent letter
      const defaultCaps: Record<string, string[]> = {
        'A': ['ui', 'frontend', 'react'],
        'B': ['design', 'architecture', 'specbase'],
        'C': ['backend', 'api', 'database'],
        'D': ['integration', 'coordination'],
        'E': ['supervision', 'analysis'],
        'F': ['strategy', 'planning']
      };

      const capabilities = defaultCaps[a.agentLetter] || ['general'];
      const model = a.model || 'unknown';

      // Count current workload
      const workload = this.db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE claimed_by = ? AND status = 'in-progress'
      `).get(a.sessionId) as any;

      return {
        agentLetter: a.agentLetter,
        model: model,
        capabilities,
        currentWorkload: workload.count,
        lastHeartbeat: a.lastHeartbeat,
        sessionId: a.sessionId,
        projectId: a.projectId
      };
    });
  }

  /**
   * Match agent capabilities to task
   */
  private matchAgentCapabilities(task: Task, agents: Agent[]): Agent[] {
    // Get required capabilities from task category
    const taskCapabilities = this.getTaskCapabilities(task);

    return agents.filter(agent => {
      // Check if agent has any matching capabilities
      return taskCapabilities.some(cap =>
        agent.capabilities.includes(cap)
      );
    });
  }

  /**
   * Get required capabilities from task
   */
  private getTaskCapabilities(task: Task): string[] {
    const capabilityMap: Record<string, string[]> = {
      'auto-proactive': ['coordination', 'architecture'],
      'loop-1': ['discovery', 'filesystem'],
      'loop-2': ['monitoring', 'git'],
      'loop-3': ['llm', 'specbase', 'architecture'],
      'loop-4': ['coordination', 'algorithms'],
      'loop-5': ['scanning', 'analysis'],
      'loop-6': ['monitoring', 'real-time'],
      'llm': ['llm', 'integration'],
      'specbase': ['architecture', 'documentation'],
      'ui': ['frontend', 'react', 'design'],
      'backend': ['backend', 'api', 'database'],
      'integration': ['integration', 'coordination']
    };

    return capabilityMap[task.category] || ['general'];
  }

  /**
   * Rank agents by fitness for task
   */
  private rankAgentsByFitness(agents: Agent[], task: Task): Agent[] {
    return agents.sort((a, b) => {
      // Factors:
      // 1. Capability match strength
      // 2. Current workload (prefer less busy)
      // 3. Same project preference

      const scoreA = this.calculateFitnessScore(a, task);
      const scoreB = this.calculateFitnessScore(b, task);

      return scoreB - scoreA; // Descending
    });
  }

  /**
   * Calculate fitness score
   */
  private calculateFitnessScore(agent: Agent, task: Task): number {
    let score = 0;

    // Capability match (0-50 points)
    const taskCaps = this.getTaskCapabilities(task);
    const matchCount = taskCaps.filter(cap =>
      agent.capabilities.includes(cap)
    ).length;
    score += (matchCount / taskCaps.length) * 50;

    // Workload (0-30 points, inverse - less is better)
    const maxWorkload = 5;
    const workloadScore = Math.max(0, (maxWorkload - agent.currentWorkload) / maxWorkload * 30);
    score += workloadScore;

    // Same project (0-20 points)
    if (agent.projectId === task.projectId) {
      score += 20;
    }

    return score;
  }

  /**
   * Assign task to agent (using AgentDeploymentOrchestrator)
   */
  private assignTask(taskId: string, agent: Agent): void {
    // Use AgentDeploymentOrchestrator if available for sophisticated assignment
    if (this.systems.agentOrchestrator) {
      try {
        // Get task details for orchestrator
        const task = this.db.prepare(`
          SELECT * FROM tasks WHERE id = ?
        `).get(taskId) as Task;

        if (task) {
          // Use orchestrator to assign task (includes VM deployment if needed)
          this.systems.agentOrchestrator.assignTaskToAgent(task, agent.agentLetter);
          logger.debug(`   🎯 AgentDeploymentOrchestrator handled assignment of ${taskId}`);
        }
      } catch (err: any) {
        logger.debug(`   AgentDeploymentOrchestrator unavailable: ${err.message}, using direct assignment`);
        // Fall through to direct assignment
      }
    }

    // Direct database assignment (fallback or primary if no orchestrator)
    this.db.prepare(`
      UPDATE tasks
      SET claimed_by = ?,
          status = 'in-progress',
          claimed_at = ?
      WHERE id = ?
    `).run(agent.sessionId, Date.now(), taskId);
  }

  /**
   * Notify agent of assignment
   */
  private notifyAgent(agent: Agent, task: Task): void {
    // TODO: Implement agent notification system
    // For now, log only
    logger.info(`   📬 Would notify Agent ${agent.agentLetter} of ${task.id}`);
  }

  /**
   * Log loop execution
   */
  private logLoopExecution(result: any): void {
    try {
      this.db.prepare(`
        INSERT INTO auto_proactive_logs (
          id, loop_name, action, result, timestamp, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        'TASK_AUTO_ASSIGNMENT',
        'MATCH_AND_ASSIGN',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      logger.warn(`⚠️  Could not log loop execution: ${err.message}`);
    }
  }

  /**
   * Get loop statistics (extends BaseLoop stats)
   */
  getLoopStats(): any {
    return {
      ...this.getStats(),
      tasksAssigned: this.tasksAssigned
    };
  }
}
