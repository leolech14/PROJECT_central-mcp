/**
 * Pattern Detector (Historical Analysis)
 * =======================================
 *
 * Detects patterns in historical event data:
 * - Agent performance patterns
 * - Task completion patterns
 * - Bottleneck detection
 * - Success patterns
 */

import { Event } from '../events/EventBroadcaster.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { AIInsight } from '../clients/BaseAIClient.js';
import { logger } from '../utils/logger.js';
import { getAgentId, getTaskId, getVelocity } from '../utils/eventUtils.js';

export interface AgentPerformancePattern {
  agentId: string;
  specialty: string[];
  avg_velocity: number; // tasks per hour
  success_rate: number; // 0-100
  preferred_task_types: string[];
  peak_hours: number[]; // hours of day (0-23)
}

export interface TaskCompletionPattern {
  taskType: string;
  avg_duration_ms: number;
  success_rate: number;
  common_blockers: string[];
  best_agents: string[];
}

export interface BottleneckPattern {
  type: 'agent' | 'task' | 'dependency' | 'resource';
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  affected_tasks: string[];
  suggested_fix: string;
}

export interface SuccessPattern {
  description: string;
  frequency: number;
  conditions: string[];
  replication_steps: string[];
}

/**
 * Historical pattern detection engine
 */
export class PatternDetector {
  private eventHistory: Event[] = [];
  private intelligenceEngine: IntelligenceEngine;

  // Pattern caching
  private agentPatterns: Map<string, AgentPerformancePattern> = new Map();
  private taskPatterns: Map<string, TaskCompletionPattern> = new Map();
  private lastAnalysis: number = 0;
  private analysisInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.intelligenceEngine = IntelligenceEngine.getInstance();
  }

  /**
   * Add events to analysis pool
   */
  addEvents(events: Event[]): void {
    this.eventHistory.push(...events);

    // Keep last 10,000 events
    if (this.eventHistory.length > 10000) {
      this.eventHistory = this.eventHistory.slice(-10000);
    }
  }

  /**
   * Detect all patterns (comprehensive analysis)
   */
  async detectAllPatterns(): Promise<{
    agent_patterns: AgentPerformancePattern[];
    task_patterns: TaskCompletionPattern[];
    bottlenecks: BottleneckPattern[];
    success_patterns: SuccessPattern[];
    ai_insights: AIInsight[];
  }> {
    logger.info('🔍 Detecting patterns in historical data...');

    const agent_patterns = this.detectAgentPatterns();
    const task_patterns = this.detectTaskPatterns();
    const bottlenecks = this.detectBottlenecks();
    const success_patterns = this.detectSuccessPatterns();

    // Get AI insights on patterns
    const ai_insights = await this.getAIInsights();

    this.lastAnalysis = Date.now();

    logger.info(`✅ Pattern detection complete: ${agent_patterns.length} agent patterns, ${task_patterns.length} task patterns, ${bottlenecks.length} bottlenecks`);

    return {
      agent_patterns,
      task_patterns,
      bottlenecks,
      success_patterns,
      ai_insights
    };
  }

  /**
   * Detect agent performance patterns
   */
  private detectAgentPatterns(): AgentPerformancePattern[] {
    const patterns: AgentPerformancePattern[] = [];
    const agents = this.getUniqueAgents();

    for (const agentId of agents) {
      const agentEvents = this.eventHistory.filter(
        e => getAgentId(e) === agentId
      );

      if (agentEvents.length < 5) continue; // Need enough data

      // Calculate velocity (tasks per hour)
      const completions = agentEvents.filter(e => e.type === 'task_completed');
      const timespan = agentEvents.length > 0
        ? (agentEvents[agentEvents.length - 1].timestamp - agentEvents[0].timestamp) / (1000 * 60 * 60)
        : 1;
      const avg_velocity = completions.length / Math.max(timespan, 0.1);

      // Calculate success rate
      const claims = agentEvents.filter(e => e.type === 'task_claimed').length;
      const success_rate = claims > 0 ? (completions.length / claims) * 100 : 0;

      // Detect specialty (task types agent excels at)
      const specialty = this.detectAgentSpecialty(agentId, agentEvents);

      // Preferred task types (most frequent)
      const preferred_task_types = this.getPreferredTaskTypes(agentEvents);

      // Peak hours (hours of most activity)
      const peak_hours = this.getPeakHours(agentEvents);

      patterns.push({
        agentId,
        specialty,
        avg_velocity: Math.round(avg_velocity * 100) / 100,
        success_rate: Math.round(success_rate),
        preferred_task_types,
        peak_hours
      });

      // Cache pattern
      this.agentPatterns.set(agentId, patterns[patterns.length - 1]);
    }

    return patterns.sort((a, b) => b.avg_velocity - a.avg_velocity);
  }

  /**
   * Detect task completion patterns
   */
  private detectTaskPatterns(): TaskCompletionPattern[] {
    const patterns: TaskCompletionPattern[] = [];
    const taskTypes = this.getUniqueTaskTypes();

    for (const taskType of taskTypes) {
      // Simplified - match task type with event types
      const taskEvents = this.eventHistory.filter(
        e => e.type.includes('task')
      );

      if (taskEvents.length < 3) continue; // Need enough data

      // Calculate average duration
      const durations = this.calculateTaskDurations(taskType);
      const avg_duration_ms = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      // Calculate success rate
      const completions = taskEvents.filter(e => e.type === 'task_completed').length;
      const claims = taskEvents.filter(e => e.type === 'task_claimed').length;
      const success_rate = claims > 0 ? (completions / claims) * 100 : 0;

      // Detect common blockers
      const common_blockers = this.detectTaskBlockers(taskType, taskEvents);

      // Find best performing agents
      const best_agents = this.getBestAgentsForTask(taskType);

      patterns.push({
        taskType,
        avg_duration_ms: Math.round(avg_duration_ms),
        success_rate: Math.round(success_rate),
        common_blockers,
        best_agents
      });

      // Cache pattern
      this.taskPatterns.set(taskType, patterns[patterns.length - 1]);
    }

    return patterns.sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Detect bottlenecks in system
   */
  private detectBottlenecks(): BottleneckPattern[] {
    const bottlenecks: BottleneckPattern[] = [];

    // Bottleneck 1: Overloaded agents
    const agentLoads = this.calculateAgentLoads();
    for (const [agentId, load] of Object.entries(agentLoads)) {
      if (load > 5) {
        bottlenecks.push({
          type: 'agent',
          description: `Agent ${agentId} overloaded (${load} active tasks)`,
          impact: load > 10 ? 'HIGH' : 'MEDIUM',
          affected_tasks: this.getAgentActiveTasks(agentId),
          suggested_fix: `Redistribute tasks to other agents or add capacity`
        });
      }
    }

    // Bottleneck 2: Long-running tasks
    const longTasks = this.findLongRunningTasks();
    if (longTasks.length > 0) {
      bottlenecks.push({
        type: 'task',
        description: `${longTasks.length} tasks running longer than expected`,
        impact: longTasks.length > 3 ? 'HIGH' : 'MEDIUM',
        affected_tasks: longTasks,
        suggested_fix: 'Review task complexity, check for blockers, consider breaking into subtasks'
      });
    }

    // Bottleneck 3: Dependency chains
    const dependencyChains = this.findDependencyChains();
    if (dependencyChains.length > 2) {
      bottlenecks.push({
        type: 'dependency',
        description: `${dependencyChains.length} long dependency chains detected`,
        impact: 'MEDIUM',
        affected_tasks: dependencyChains.flat(),
        suggested_fix: 'Parallelize independent tasks, review dependency structure'
      });
    }

    // Bottleneck 4: Resource contention
    const resourceIssues = this.detectResourceContention();
    if (resourceIssues.length > 0) {
      bottlenecks.push({
        type: 'resource',
        description: `Resource contention detected: ${resourceIssues.join(', ')}`,
        impact: 'LOW',
        affected_tasks: [],
        suggested_fix: 'Add resource pooling, implement queuing strategy'
      });
    }

    return bottlenecks.sort((a, b) => {
      const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priority[b.impact] - priority[a.impact];
    });
  }

  /**
   * Detect success patterns (what works well)
   */
  private detectSuccessPatterns(): SuccessPattern[] {
    const patterns: SuccessPattern[] = [];

    // Pattern 1: Fast task completions
    const fastCompletions = this.eventHistory.filter(e => {
      const velocity = getVelocity(e);
      return e.type === 'task_completed' && velocity && velocity < 60 * 60 * 1000; // < 1 hour
    });

    if (fastCompletions.length > 5) {
      const velocities = fastCompletions.map(e => getVelocity(e) || 0);
      const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      const agents = [...new Set(fastCompletions.map(e => getAgentId(e)).filter(Boolean))];

      patterns.push({
        description: `Fast task completion pattern (avg ${Math.round(avgVelocity / 60000)} minutes)`,
        frequency: fastCompletions.length,
        conditions: [
          `Agents: ${agents.join(', ')}`,
          'Task complexity: Low to medium',
          'Clear requirements and minimal blockers'
        ],
        replication_steps: [
          'Assign well-defined tasks to specialized agents',
          'Ensure all dependencies resolved before start',
          'Minimize context switching'
        ]
      });
    }

    // Pattern 2: High agent productivity
    const productiveAgents = Array.from(this.agentPatterns.entries())
      .filter(([_, pattern]) => pattern.avg_velocity > 2 && pattern.success_rate > 80);

    if (productiveAgents.length > 0) {
      patterns.push({
        description: 'High productivity agent pattern',
        frequency: productiveAgents.length,
        conditions: productiveAgents.map(([id, p]) =>
          `${id}: ${p.avg_velocity} tasks/hr, ${p.success_rate}% success, specialty: ${p.specialty.join(', ')}`
        ),
        replication_steps: [
          'Route tasks to agent specialties',
          'Maintain consistent task types per agent',
          'Avoid overloading high performers'
        ]
      });
    }

    // Pattern 3: Successful dependency resolution
    const successfulUnblocks = this.eventHistory.filter(e => {
      if (e.type === 'task_update') {
        const status = e.status;
        return status === 'AVAILABLE';
      }
      return false;
    });

    if (successfulUnblocks.length > 3) {
      patterns.push({
        description: 'Effective dependency resolution pattern',
        frequency: successfulUnblocks.length,
        conditions: [
          'Clear dependency mapping',
          'Proactive completion notifications',
          'Automatic unblocking on completion'
        ],
        replication_steps: [
          'Define dependencies upfront',
          'Monitor dependency chains',
          'Auto-notify dependent tasks on completion'
        ]
      });
    }

    return patterns;
  }

  /**
   * Get AI insights on detected patterns
   */
  private async getAIInsights(): Promise<AIInsight[]> {
    try {
      const recentEvents = this.eventHistory.slice(-50);
      const insights = await this.intelligenceEngine.analyzePatterns(recentEvents);
      return insights;
    } catch (error: any) {
      logger.error('❌ Failed to get AI pattern insights:', error.message);
      return [];
    }
  }

  /**
   * Helper: Get unique agents from events
   */
  private getUniqueAgents(): string[] {
    const agents = new Set<string>();
    this.eventHistory.forEach(e => {
      const agent = getAgentId(e);
      if (agent) agents.add(agent);
    });
    return Array.from(agents);
  }

  /**
   * Helper: Get unique task types
   */
  private getUniqueTaskTypes(): string[] {
    const types = new Set<string>();
    // For now, use a simplified approach - can be enhanced with task metadata
    return ['ui', 'backend', 'integration', 'design', 'general'];
  }

  /**
   * Helper: Detect agent specialty
   */
  private detectAgentSpecialty(agentId: string, events: Event[]): string[] {
    // Simplified - use task type inference from event names
    return ['general', 'ui', 'backend'];
  }

  /**
   * Helper: Get preferred task types
   */
  private getPreferredTaskTypes(events: Event[]): string[] {
    // Simplified - use task type inference from event names
    return ['general', 'ui', 'backend'];
  }

  /**
   * Helper: Get peak activity hours
   */
  private getPeakHours(events: Event[]): number[] {
    const hours: { [key: number]: number } = {};

    events.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.entries(hours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Helper: Calculate task durations
   */
  private calculateTaskDurations(taskType: string): number[] {
    const durations: number[] = [];
    const claims: { [key: string]: number } = {};

    this.eventHistory.forEach(e => {
      const taskId = getTaskId(e);

      if (e.type === 'task_claimed' && taskId) {
        claims[taskId] = e.timestamp;
      }

      if (e.type === 'task_completed' && taskId) {
        const claimTime = claims[taskId];
        if (claimTime) {
          durations.push(e.timestamp - claimTime);
        }
      }
    });

    return durations;
  }

  /**
   * Helper: Detect task blockers
   */
  private detectTaskBlockers(taskType: string, events: Event[]): string[] {
    const blockers = new Set<string>();

    events
      .filter(e => e.type === 'agent_log')
      .forEach(e => {
        // Simplified - would need access to message in real implementation
        blockers.add('Common blocker detected');
      });

    return Array.from(blockers).slice(0, 3);
  }

  /**
   * Helper: Get best agents for task type
   */
  private getBestAgentsForTask(taskType: string): string[] {
    const agentPerformance: { [key: string]: number } = {};

    this.eventHistory
      .filter(e => e.type === 'task_completed')
      .forEach(e => {
        const agent = getAgentId(e);
        const velocity = getVelocity(e) || 3600000; // 1 hour default
        if (agent) {
          agentPerformance[agent] = (agentPerformance[agent] || 0) + (1 / velocity);
        }
      });

    return Object.entries(agentPerformance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([agent]) => agent);
  }

  /**
   * Helper: Calculate agent loads
   */
  private calculateAgentLoads(): { [key: string]: number } {
    const loads: { [key: string]: number } = {};
    const recentClaims = this.eventHistory.filter(
      e => e.type === 'task_claimed' && Date.now() - e.timestamp < 24 * 60 * 60 * 1000
    );

    recentClaims.forEach(e => {
      const agent = getAgentId(e);
      if (agent) loads[agent] = (loads[agent] || 0) + 1;
    });

    return loads;
  }

  /**
   * Helper: Get agent active tasks
   */
  private getAgentActiveTasks(agentId: string): string[] {
    const tasks = new Set<string>();

    this.eventHistory
      .filter(e => e.type === 'task_claimed' &&
        getAgentId(e) === agentId &&
        Date.now() - e.timestamp < 24 * 60 * 60 * 1000
      )
      .forEach(e => {
        const taskId = getTaskId(e);
        if (taskId) tasks.add(taskId);
      });

    return Array.from(tasks);
  }

  /**
   * Helper: Find long-running tasks
   */
  private findLongRunningTasks(): string[] {
    const longTasks: string[] = [];
    const claims: { [key: string]: number } = {};

    this.eventHistory.forEach(e => {
      if (e.type === 'task_claimed') {
        const taskId = getTaskId(e);
        if (taskId) claims[taskId] = e.timestamp;
      }
    });

    Object.entries(claims).forEach(([taskId, claimTime]) => {
      if (Date.now() - claimTime > 4 * 60 * 60 * 1000) { // > 4 hours
        longTasks.push(taskId);
      }
    });

    return longTasks;
  }

  /**
   * Helper: Find dependency chains
   */
  private findDependencyChains(): string[][] {
    // Simplified - would need access to task registry for real implementation
    return [];
  }

  /**
   * Helper: Detect resource contention
   */
  private detectResourceContention(): string[] {
    const issues: string[] = [];

    // Check for multiple agents trying same task type simultaneously
    const recentClaims = this.eventHistory.filter(
      e => e.type === 'task_claimed' && Date.now() - e.timestamp < 60 * 60 * 1000
    );

    const typeAgents: { [key: string]: Set<string> } = {};
    recentClaims.forEach(e => {
      const type = 'general'; // Simplified - would use task metadata in real implementation
      const agent = getAgentId(e);
      if (!typeAgents[type]) typeAgents[type] = new Set();
      if (agent) typeAgents[type].add(agent);
    });

    Object.entries(typeAgents).forEach(([type, agents]) => {
      if (agents.size > 3) {
        issues.push(`${agents.size} agents competing for ${type} tasks`);
      }
    });

    return issues;
  }

  /**
   * Get cached agent pattern
   */
  getAgentPattern(agentId: string): AgentPerformancePattern | undefined {
    return this.agentPatterns.get(agentId);
  }

  /**
   * Get cached task pattern
   */
  getTaskPattern(taskType: string): TaskCompletionPattern | undefined {
    return this.taskPatterns.get(taskType);
  }
}
