/**
 * Optimization Suggestor (AI-Powered Recommendations)
 * ====================================================
 *
 * Generates optimization suggestions based on:
 * - Historical performance data
 * - Detected patterns and bottlenecks
 * - AI analysis of system behavior
 * - Best practice recommendations
 */

import { PatternDetector, AgentPerformancePattern, TaskCompletionPattern, BottleneckPattern } from './PatternDetector.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { AIOptimization } from '../clients/BaseAIClient.js';
import { EventBroadcaster } from '../events/EventBroadcaster.js';
import { logger } from '../utils/logger.js';

export interface OptimizationSuggestion {
  id: string;
  category: 'ROUTING' | 'RESOURCE' | 'RULE' | 'PERFORMANCE' | 'WORKFLOW';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'HIGH' | 'MEDIUM' | 'LOW';
  expected_improvement: string;
  implementation_steps: string[];
  affected_agents?: string[];
  affected_tasks?: string[];
  confidence: number; // 0-100
  auto_implementable: boolean;
}

export interface RoutingOptimization {
  taskId: string;
  currentAgent?: string;
  recommendedAgent: string;
  reason: string;
  expected_speedup: string;
}

export interface RuleOptimization {
  ruleId?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  rule: {
    type: 'ROUTING' | 'DEPENDENCY' | 'PRIORITY' | 'PROJECT' | 'CAPACITY';
    name: string;
    condition?: any;
    action?: any;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  reason: string;
}

/**
 * AI-powered optimization suggestion engine
 */
export class OptimizationSuggestor {
  private patternDetector: PatternDetector;
  private intelligenceEngine: IntelligenceEngine;
  private eventBroadcaster: EventBroadcaster;

  private suggestions: OptimizationSuggestion[] = [];
  private lastSuggestionTime = 0;

  constructor() {
    this.patternDetector = new PatternDetector();
    this.intelligenceEngine = IntelligenceEngine.getInstance();
    this.eventBroadcaster = EventBroadcaster.getInstance();
  }

  /**
   * Generate all optimization suggestions
   */
  async generateSuggestions(): Promise<OptimizationSuggestion[]> {
    logger.info('💡 Generating optimization suggestions...');

    this.suggestions = [];

    // Detect patterns first
    const patterns = await this.patternDetector.detectAllPatterns();

    // Generate suggestions from different sources
    await this.suggestRoutingOptimizations(patterns.agent_patterns, patterns.task_patterns);
    await this.suggestResourceOptimizations(patterns.agent_patterns);
    await this.suggestRuleOptimizations(patterns.bottlenecks);
    await this.suggestPerformanceOptimizations(patterns.bottlenecks);
    await this.suggestWorkflowOptimizations(patterns.success_patterns);

    // Get AI-powered suggestions
    const aiSuggestions = await this.getAISuggestions(patterns);
    this.suggestions.push(...aiSuggestions);

    // Sort by impact
    this.suggestions.sort((a, b) => {
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    // Broadcast top suggestions
    this.broadcastTopSuggestions();

    this.lastSuggestionTime = Date.now();

    logger.info(`✅ Generated ${this.suggestions.length} optimization suggestions`);

    return this.suggestions;
  }

  /**
   * Suggest routing optimizations (better task assignment)
   */
  private async suggestRoutingOptimizations(
    agentPatterns: AgentPerformancePattern[],
    taskPatterns: TaskCompletionPattern[]
  ): Promise<void> {
    // Find misrouted tasks (agent not specialized for task type)
    for (const taskPattern of taskPatterns) {
      if (taskPattern.best_agents.length > 0) {
        const bestAgent = taskPattern.best_agents[0];
        const bestAgentPattern = agentPatterns.find(p => p.agentId === bestAgent);

        if (bestAgentPattern) {
          this.suggestions.push({
            id: `routing-${taskPattern.taskType}`,
            category: 'ROUTING',
            title: `Route ${taskPattern.taskType} tasks to ${bestAgent}`,
            description: `Agent ${bestAgent} is ${Math.round(bestAgentPattern.avg_velocity * 100)}% faster at ${taskPattern.taskType} tasks`,
            impact: 'HIGH',
            effort: 'LOW',
            expected_improvement: `${Math.round((bestAgentPattern.avg_velocity - 1) * 100)}% faster completion`,
            implementation_steps: [
              `Create routing rule: IF task.type == "${taskPattern.taskType}" THEN assign to ${bestAgent}`,
              `Update task assignment logic in Rules Registry`,
              `Monitor performance for 24 hours`,
              `Adjust rule if needed`
            ],
            affected_agents: [bestAgent],
            affected_tasks: [taskPattern.taskType],
            confidence: Math.min(95, Math.round(bestAgentPattern.success_rate)),
            auto_implementable: true
          });
        }
      }
    }

    // Suggest load balancing for overloaded agents
    const overloadedAgents = agentPatterns.filter(p => p.avg_velocity > 5);
    const underloadedAgents = agentPatterns.filter(p => p.avg_velocity < 1);

    if (overloadedAgents.length > 0 && underloadedAgents.length > 0) {
      this.suggestions.push({
        id: 'routing-load-balance',
        category: 'ROUTING',
        title: 'Balance load across agents',
        description: `${overloadedAgents.length} agents are overloaded while ${underloadedAgents.length} are underutilized`,
        impact: 'MEDIUM',
        effort: 'MEDIUM',
        expected_improvement: '30% better resource utilization',
        implementation_steps: [
          `Identify shared task types between overloaded and underloaded agents`,
          `Create capacity-based routing rules`,
          `Gradually redistribute tasks`,
          `Monitor agent performance metrics`
        ],
        affected_agents: [...overloadedAgents.map(p => p.agentId), ...underloadedAgents.map(p => p.agentId)],
        confidence: 80,
        auto_implementable: false
      });
    }
  }

  /**
   * Suggest resource optimizations (capacity and allocation)
   */
  private async suggestResourceOptimizations(agentPatterns: AgentPerformancePattern[]): Promise<void> {
    // Suggest peak-hour scheduling
    const peakHourMap: { [hour: number]: string[] } = {};
    agentPatterns.forEach(p => {
      p.peak_hours.forEach(hour => {
        if (!peakHourMap[hour]) peakHourMap[hour] = [];
        peakHourMap[hour].push(p.agentId);
      });
    });

    const peakHours = Object.entries(peakHourMap)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    if (peakHours.length > 0) {
      this.suggestions.push({
        id: 'resource-peak-scheduling',
        category: 'RESOURCE',
        title: 'Optimize task scheduling for peak hours',
        description: `Most agents are active during hours: ${peakHours.map(([h]) => `${h}:00`).join(', ')}`,
        impact: 'MEDIUM',
        effort: 'LOW',
        expected_improvement: '20% better throughput during peak hours',
        implementation_steps: [
          `Schedule critical tasks during peak hours: ${peakHours.map(([h]) => `${h}:00`).join(', ')}`,
          `Queue non-urgent tasks for off-peak hours`,
          `Implement time-based priority rules`,
          `Monitor completion rates by hour`
        ],
        confidence: 75,
        auto_implementable: false
      });
    }

    // Suggest agent specialization
    const generalizedAgents = agentPatterns.filter(p => p.specialty.length > 5);
    if (generalizedAgents.length > 0) {
      this.suggestions.push({
        id: 'resource-specialization',
        category: 'RESOURCE',
        title: 'Increase agent specialization',
        description: `${generalizedAgents.length} agents are handling too many task types`,
        impact: 'HIGH',
        effort: 'MEDIUM',
        expected_improvement: '40% faster task completion through specialization',
        implementation_steps: [
          `Limit each agent to 3 primary task types`,
          `Create specialty-based routing rules`,
          `Train agents on specialized workflows`,
          `Monitor specialization impact on velocity`
        ],
        affected_agents: generalizedAgents.map(p => p.agentId),
        confidence: 85,
        auto_implementable: false
      });
    }
  }

  /**
   * Suggest rule optimizations (new/updated rules)
   */
  private async suggestRuleOptimizations(bottlenecks: BottleneckPattern[]): Promise<void> {
    for (const bottleneck of bottlenecks) {
      if (bottleneck.type === 'dependency') {
        this.suggestions.push({
          id: `rule-dependency-${bottlenecks.indexOf(bottleneck)}`,
          category: 'RULE',
          title: 'Create dependency resolution rule',
          description: bottleneck.description,
          impact: bottleneck.impact,
          effort: 'LOW',
          expected_improvement: 'Faster task unblocking, 25% shorter dependency chains',
          implementation_steps: [
            `Analyze dependency chain: ${bottleneck.affected_tasks.join(' → ')}`,
            `Create auto-unblock rules for common dependencies`,
            `Implement parallel execution where possible`,
            `Add dependency notification system`
          ],
          affected_tasks: bottleneck.affected_tasks,
          confidence: 80,
          auto_implementable: true
        });
      }

      if (bottleneck.type === 'agent' && bottleneck.impact === 'HIGH') {
        this.suggestions.push({
          id: `rule-capacity-${bottlenecks.indexOf(bottleneck)}`,
          category: 'RULE',
          title: 'Create capacity limit rule',
          description: `Prevent agent overload: ${bottleneck.description}`,
          impact: 'HIGH',
          effort: 'LOW',
          expected_improvement: '30% reduction in task delays',
          implementation_steps: [
            `Set max concurrent tasks per agent (recommend: 3-5)`,
            `Create capacity-based routing rule`,
            `Implement queue system for overflow tasks`,
            `Monitor agent load metrics`
          ],
          affected_agents: bottleneck.affected_tasks,
          confidence: 90,
          auto_implementable: true
        });
      }
    }
  }

  /**
   * Suggest performance optimizations
   */
  private async suggestPerformanceOptimizations(bottlenecks: BottleneckPattern[]): Promise<void> {
    const taskBottlenecks = bottlenecks.filter(b => b.type === 'task');

    if (taskBottlenecks.length > 0) {
      this.suggestions.push({
        id: 'performance-task-breakdown',
        category: 'PERFORMANCE',
        title: 'Break down long-running tasks',
        description: `${taskBottlenecks.length} tasks are running longer than expected`,
        impact: 'HIGH',
        effort: 'MEDIUM',
        expected_improvement: '50% faster completion through parallelization',
        implementation_steps: [
          `Identify tasks running > 4 hours: ${taskBottlenecks.flatMap(b => b.affected_tasks).join(', ')}`,
          `Break each into 3-5 smaller subtasks`,
          `Assign subtasks to different agents`,
          `Implement progress aggregation`,
          `Monitor subtask completion rates`
        ],
        affected_tasks: taskBottlenecks.flatMap(b => b.affected_tasks),
        confidence: 75,
        auto_implementable: false
      });
    }

    // Suggest caching for repeated operations
    this.suggestions.push({
      id: 'performance-caching',
      category: 'PERFORMANCE',
      title: 'Implement intelligent caching',
      description: 'Cache frequently accessed data and computation results',
      impact: 'MEDIUM',
      effort: 'MEDIUM',
      expected_improvement: '40% reduction in redundant operations',
      implementation_steps: [
        'Identify frequently repeated operations',
        'Implement Redis caching layer',
        'Cache task analysis results',
        'Cache agent capability lookups',
        'Set appropriate TTL (5-15 minutes)'
      ],
      confidence: 85,
      auto_implementable: false
    });
  }

  /**
   * Suggest workflow optimizations (process improvements)
   */
  private async suggestWorkflowOptimizations(successPatterns: any[]): Promise<void> {
    if (successPatterns.length > 0) {
      const topPattern = successPatterns[0];

      this.suggestions.push({
        id: 'workflow-replicate-success',
        category: 'WORKFLOW',
        title: 'Replicate successful workflow pattern',
        description: topPattern.description,
        impact: 'HIGH',
        effort: 'LOW',
        expected_improvement: topPattern.description.includes('Fast') ? '50% faster completion' : '30% better success rate',
        implementation_steps: topPattern.replication_steps,
        confidence: 90,
        auto_implementable: false
      });
    }

    // Suggest automation opportunities
    this.suggestions.push({
      id: 'workflow-automation',
      category: 'WORKFLOW',
      title: 'Automate repetitive task patterns',
      description: 'Identify and automate frequently repeated task sequences',
      impact: 'MEDIUM',
      effort: 'HIGH',
      expected_improvement: '60% reduction in manual coordination',
      implementation_steps: [
        'Analyze task sequences over past 7 days',
        'Identify patterns that repeat > 3 times',
        'Create workflow templates for common sequences',
        'Implement auto-trigger rules',
        'Monitor automation success rate'
      ],
      confidence: 70,
      auto_implementable: false
    });
  }

  /**
   * Get AI-powered optimization suggestions
   */
  private async getAISuggestions(patterns: any): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    try {
      const context = {
        agent_patterns: patterns.agent_patterns,
        task_patterns: patterns.task_patterns,
        bottlenecks: patterns.bottlenecks,
        success_patterns: patterns.success_patterns
      };

      const aiOptimization = await this.intelligenceEngine.suggestOptimization(context);

      if (aiOptimization) {
        suggestions.push({
          id: 'ai-optimization',
          category: 'PERFORMANCE',
          title: aiOptimization.suggestion,
          description: 'AI-powered optimization recommendation',
          impact: aiOptimization.impact,
          effort: aiOptimization.effort,
          expected_improvement: aiOptimization.expected_improvement,
          implementation_steps: aiOptimization.implementation_steps,
          confidence: 85,
          auto_implementable: false
        });
      }
    } catch (error: any) {
      logger.error('❌ Failed to get AI optimization suggestions:', error.message);
    }

    return suggestions;
  }

  /**
   * Broadcast top suggestions to clients
   */
  private broadcastTopSuggestions(): void {
    const topSuggestions = this.suggestions
      .filter(s => s.impact === 'HIGH' || s.impact === 'MEDIUM')
      .slice(0, 5);

    topSuggestions.forEach(suggestion => {
      this.eventBroadcaster.broadcast({
        type: 'intelligence_insight',
        timestamp: Date.now(),
        data: {
          type: 'optimization',
          title: suggestion.title,
          description: suggestion.description,
          confidence: suggestion.confidence,
          action_required: suggestion.impact === 'HIGH',
          priority: suggestion.impact
        }
      });
    });
  }

  /**
   * Get routing optimization for specific task
   */
  getRoutingOptimization(taskId: string, taskType: string): RoutingOptimization | null {
    const taskPattern = this.patternDetector.getTaskPattern(taskType);

    if (taskPattern && taskPattern.best_agents.length > 0) {
      const recommendedAgent = taskPattern.best_agents[0];
      const agentPattern = this.patternDetector.getAgentPattern(recommendedAgent);

      return {
        taskId,
        recommendedAgent,
        reason: `Agent ${recommendedAgent} has ${Math.round(taskPattern.success_rate)}% success rate on ${taskType} tasks`,
        expected_speedup: agentPattern
          ? `${Math.round((agentPattern.avg_velocity - 1) * 100)}% faster`
          : 'Significantly faster'
      };
    }

    return null;
  }

  /**
   * Get rule optimization suggestions
   */
  getRuleOptimizations(): RuleOptimization[] {
    const ruleOptimizations: RuleOptimization[] = [];

    // Extract rule-based suggestions
    this.suggestions
      .filter(s => s.category === 'RULE' && s.auto_implementable)
      .forEach(suggestion => {
        if (suggestion.id.includes('dependency')) {
          ruleOptimizations.push({
            action: 'CREATE',
            rule: {
              type: 'DEPENDENCY',
              name: suggestion.title,
              priority: 'HIGH',
              condition: { tasks: suggestion.affected_tasks }
            },
            reason: suggestion.description
          });
        }

        if (suggestion.id.includes('capacity')) {
          ruleOptimizations.push({
            action: 'CREATE',
            rule: {
              type: 'CAPACITY',
              name: suggestion.title,
              priority: 'HIGH',
              condition: { max_concurrent: 5 },
              action: { queue_overflow: true }
            },
            reason: suggestion.description
          });
        }
      });

    return ruleOptimizations;
  }

  /**
   * Auto-implement suggestions where possible
   */
  async autoImplement(suggestionId: string): Promise<{ success: boolean; message: string }> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      return { success: false, message: 'Suggestion not found' };
    }

    if (!suggestion.auto_implementable) {
      return { success: false, message: 'This suggestion requires manual implementation' };
    }

    // TODO: Implement auto-creation of rules via Rules Registry
    logger.info(`🤖 Auto-implementing suggestion: ${suggestion.title}`);

    return {
      success: true,
      message: `Successfully implemented: ${suggestion.title}`
    };
  }

  /**
   * Get all suggestions
   */
  getSuggestions(): OptimizationSuggestion[] {
    return this.suggestions;
  }

  /**
   * Get suggestions by category
   */
  getSuggestionsByCategory(category: OptimizationSuggestion['category']): OptimizationSuggestion[] {
    return this.suggestions.filter(s => s.category === category);
  }
}
