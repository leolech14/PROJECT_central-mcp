/**
 * Prediction Engine (Outcome Forecasting)
 * ========================================
 *
 * Predicts outcomes based on:
 * - Historical performance data
 * - Current system state
 * - Detected patterns
 * - AI-powered analysis
 */

import { PatternDetector, AgentPerformancePattern, TaskCompletionPattern } from './PatternDetector.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { AIPrediction } from '../clients/BaseAIClient.js';
import { EventBroadcaster } from '../events/EventBroadcaster.js';
import { logger } from '../utils/logger.js';

export interface TaskPrediction {
  taskId: string;
  taskType: string;
  agentId?: string;
  estimated_completion_time: string; // Human-readable (e.g., "2.5 hours")
  estimated_completion_ms: number;
  success_probability: number; // 0-100
  risk_factors: string[];
  confidence: number; // 0-100
  reasoning: string;
  comparable_tasks: string[];
}

export interface AgentVelocityPrediction {
  agentId: string;
  predicted_tasks_per_hour: number;
  predicted_tasks_next_24h: number;
  confidence: number;
  factors: string[];
}

export interface SystemLoadPrediction {
  timestamp: number;
  predicted_active_tasks: number;
  predicted_completion_rate: number;
  bottleneck_probability: number; // 0-100
  resource_needs: {
    agents_needed: number;
    capacity_increase: string;
  };
  confidence: number;
}

/**
 * Predictive analytics engine for task outcomes
 */
export class PredictionEngine {
  private patternDetector: PatternDetector;
  private intelligenceEngine: IntelligenceEngine;
  private eventBroadcaster: EventBroadcaster;

  private taskPredictions: Map<string, TaskPrediction> = new Map();
  private agentPredictions: Map<string, AgentVelocityPrediction> = new Map();

  constructor() {
    this.patternDetector = new PatternDetector();
    this.intelligenceEngine = IntelligenceEngine.getInstance();
    this.eventBroadcaster = EventBroadcaster.getInstance();
  }

  /**
   * Predict task completion time and success probability
   */
  async predictTaskOutcome(
    taskId: string,
    taskType: string,
    agentId?: string
  ): Promise<TaskPrediction> {
    logger.info(`🔮 Predicting outcome for task ${taskId} (${taskType})`);

    // Get historical pattern
    const taskPattern = this.patternDetector.getTaskPattern(taskType);
    const agentPattern = agentId ? this.patternDetector.getAgentPattern(agentId) : null;

    // Calculate base estimates from historical data
    let estimated_completion_ms = taskPattern?.avg_duration_ms || 2 * 60 * 60 * 1000; // 2 hours default
    let success_probability = taskPattern?.success_rate || 70;
    const risk_factors: string[] = [];

    // Adjust based on agent assignment
    if (agentPattern && taskPattern) {
      // Agent specialization bonus
      if (agentPattern.specialty.includes(taskType)) {
        estimated_completion_ms *= 0.7; // 30% faster
        success_probability = Math.min(100, success_probability + 15);
      } else {
        risk_factors.push(`Agent ${agentId} not specialized in ${taskType} tasks`);
        estimated_completion_ms *= 1.3; // 30% slower
      }

      // Agent velocity factor
      if (agentPattern.avg_velocity > 2) {
        estimated_completion_ms *= 0.8; // High-velocity agent
        success_probability = Math.min(100, success_probability + 10);
      } else if (agentPattern.avg_velocity < 1) {
        risk_factors.push(`Agent ${agentId} has low velocity (${agentPattern.avg_velocity.toFixed(1)} tasks/hr)`);
        estimated_completion_ms *= 1.5;
      }

      // Agent success rate factor
      if (agentPattern.success_rate < 70) {
        risk_factors.push(`Agent ${agentId} has low success rate (${agentPattern.success_rate}%)`);
        success_probability = Math.min(success_probability, agentPattern.success_rate + 10);
      }
    } else if (agentPattern && !taskPattern) {
      // Have agent info but no task pattern
      if (agentPattern.avg_velocity > 2) {
        estimated_completion_ms *= 0.9; // Slightly faster
      }
    } else if (!agentId) {
      risk_factors.push('Task not yet assigned to an agent');
      estimated_completion_ms *= 1.2; // Delay for assignment
    }

    // Add task-specific risk factors
    if (taskPattern?.common_blockers && taskPattern.common_blockers.length > 0) {
      risk_factors.push(...taskPattern.common_blockers.slice(0, 2));
    }

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(taskPattern || undefined, agentPattern || undefined);

    // Get AI prediction for complex tasks
    let ai_prediction: AIPrediction | null = null;
    if (confidence < 70 || risk_factors.length > 2) {
      try {
        ai_prediction = await this.intelligenceEngine.predictOutcome({
          taskId,
          taskType,
          agentId,
          historical_pattern: taskPattern,
          agent_pattern: agentPattern,
          risk_factors
        });

        if (ai_prediction && ai_prediction.confidence > confidence) {
          // Use AI prediction if more confident
          estimated_completion_ms = this.parseTimeToMs(ai_prediction.estimated_completion_time || '2 hours');
          success_probability = ai_prediction.probability;
          risk_factors.push(...ai_prediction.risk_factors);
        }
      } catch (error) {
        logger.warn('⚠️ AI prediction failed, using statistical prediction');
      }
    }

    const prediction: TaskPrediction = {
      taskId,
      taskType,
      agentId,
      estimated_completion_time: this.formatDuration(estimated_completion_ms),
      estimated_completion_ms,
      success_probability: Math.round(success_probability),
      risk_factors: [...new Set(risk_factors)].slice(0, 5), // Unique, max 5
      confidence: Math.round(confidence),
      reasoning: this.generateReasoning(taskPattern || undefined, agentPattern || undefined, ai_prediction),
      comparable_tasks: taskPattern?.best_agents?.map(a => `${taskType} by ${a}`) || []
    };

    // Cache prediction
    this.taskPredictions.set(taskId, prediction);

    // Broadcast if high risk
    if (risk_factors.length > 2 || success_probability < 60) {
      this.broadcastPrediction(prediction);
    }

    return prediction;
  }

  /**
   * Predict agent velocity for next period
   */
  async predictAgentVelocity(agentId: string, hours: number = 24): Promise<AgentVelocityPrediction> {
    const agentPattern = this.patternDetector.getAgentPattern(agentId);

    if (!agentPattern) {
      return {
        agentId,
        predicted_tasks_per_hour: 1,
        predicted_tasks_next_24h: Math.round(hours),
        confidence: 30,
        factors: ['Insufficient historical data for this agent']
      };
    }

    // Base velocity from historical data
    let predicted_tasks_per_hour = agentPattern.avg_velocity;
    const factors: string[] = [];

    // Adjust for current time (peak hours boost)
    const currentHour = new Date().getHours();
    if (agentPattern.peak_hours.includes(currentHour)) {
      predicted_tasks_per_hour *= 1.3; // 30% boost during peak hours
      factors.push(`Currently in peak hour (${currentHour}:00)`);
    } else {
      predicted_tasks_per_hour *= 0.7; // 30% slower off-peak
      factors.push(`Currently off-peak hour (${currentHour}:00)`);
    }

    // Adjust for specialization
    if (agentPattern.specialty.length <= 3) {
      predicted_tasks_per_hour *= 1.2; // Specialized agents are faster
      factors.push(`Highly specialized: ${agentPattern.specialty.join(', ')}`);
    }

    // Adjust for success rate (lower success = slower effective velocity)
    if (agentPattern.success_rate < 80) {
      predicted_tasks_per_hour *= agentPattern.success_rate / 100;
      factors.push(`Success rate impact: ${agentPattern.success_rate}%`);
    }

    const predicted_tasks_next_24h = Math.round(predicted_tasks_per_hour * hours);
    const confidence = Math.min(95, Math.round(agentPattern.success_rate * 0.9));

    const prediction: AgentVelocityPrediction = {
      agentId,
      predicted_tasks_per_hour: Math.round(predicted_tasks_per_hour * 100) / 100,
      predicted_tasks_next_24h,
      confidence,
      factors
    };

    this.agentPredictions.set(agentId, prediction);

    return prediction;
  }

  /**
   * Predict system load for next period
   */
  async predictSystemLoad(hours: number = 24): Promise<SystemLoadPrediction> {
    // Get all agent predictions
    const patterns = await this.patternDetector.detectAllPatterns();
    const agentVelocities = await Promise.all(
      patterns.agent_patterns.map(p => this.predictAgentVelocity(p.agentId, hours))
    );

    // Calculate total predicted task completions
    const predicted_completion_rate = agentVelocities.reduce(
      (sum, v) => sum + v.predicted_tasks_next_24h,
      0
    ) / hours;

    // Estimate active tasks (tasks claimed but not completed)
    const predicted_active_tasks = Math.round(predicted_completion_rate * 2); // 2x buffer

    // Calculate bottleneck probability
    const overloadedAgents = agentVelocities.filter(v => v.predicted_tasks_per_hour > 3).length;
    const totalAgents = agentVelocities.length;
    const bottleneck_probability = totalAgents > 0
      ? Math.round((overloadedAgents / totalAgents) * 100)
      : 50;

    // Calculate resource needs
    const agents_needed = Math.max(
      totalAgents,
      Math.ceil(predicted_active_tasks / 3) // 3 tasks per agent ideal
    );

    const capacity_increase = agents_needed > totalAgents
      ? `+${agents_needed - totalAgents} agents needed`
      : 'Current capacity sufficient';

    // Average confidence across agent predictions
    const confidence = agentVelocities.length > 0
      ? Math.round(agentVelocities.reduce((sum, v) => sum + v.confidence, 0) / agentVelocities.length)
      : 50;

    const prediction: SystemLoadPrediction = {
      timestamp: Date.now(),
      predicted_active_tasks,
      predicted_completion_rate: Math.round(predicted_completion_rate * 100) / 100,
      bottleneck_probability,
      resource_needs: {
        agents_needed,
        capacity_increase
      },
      confidence
    };

    // Broadcast if high bottleneck risk
    if (bottleneck_probability > 60) {
      this.eventBroadcaster.broadcast({
        type: 'intelligence_insight',
        timestamp: Date.now(),
        data: {
          type: 'prediction',
          title: 'High bottleneck risk predicted',
          description: `${bottleneck_probability}% probability of system bottleneck in next ${hours} hours. ${capacity_increase}`,
          confidence,
          action_required: true,
          priority: 'HIGH'
        }
      });
    }

    return prediction;
  }

  /**
   * Predict risk of task failure
   */
  predictTaskRisk(taskId: string, taskType: string, agentId?: string): {
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risk_percentage: number;
    risk_factors: string[];
  } {
    const taskPattern = this.patternDetector.getTaskPattern(taskType);
    const agentPattern = agentId ? this.patternDetector.getAgentPattern(agentId) : null;

    const risk_factors: string[] = [];
    let risk_percentage = 30; // Base risk

    // Task complexity risk
    if (taskPattern && taskPattern.avg_duration_ms > 4 * 60 * 60 * 1000) {
      risk_percentage += 20;
      risk_factors.push('Complex task (>4 hours average duration)');
    }

    // Agent mismatch risk
    if (agentPattern && taskPattern && !agentPattern.specialty.includes(taskType)) {
      risk_percentage += 25;
      risk_factors.push('Agent not specialized for this task type');
    }

    // Historical failure risk
    if (taskPattern && taskPattern.success_rate < 70) {
      risk_percentage += 30;
      risk_factors.push(`Low historical success rate (${taskPattern.success_rate}%)`);
    }

    // Agent performance risk
    if (agentPattern && agentPattern.success_rate < 70) {
      risk_percentage += 20;
      risk_factors.push(`Agent has low success rate (${agentPattern.success_rate}%)`);
    }

    // Blocker risk
    if (taskPattern && taskPattern.common_blockers.length > 0) {
      risk_percentage += 15;
      risk_factors.push('Common blockers detected in historical data');
    }

    // Determine risk level
    let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (risk_percentage < 30) risk_level = 'LOW';
    else if (risk_percentage < 50) risk_level = 'MEDIUM';
    else if (risk_percentage < 70) risk_level = 'HIGH';
    else risk_level = 'CRITICAL';

    return {
      risk_level,
      risk_percentage: Math.min(100, risk_percentage),
      risk_factors
    };
  }

  /**
   * Helper: Calculate prediction confidence
   */
  private calculateConfidence(
    taskPattern?: TaskCompletionPattern,
    agentPattern?: AgentPerformancePattern
  ): number {
    let confidence = 50; // Base confidence

    if (taskPattern) {
      confidence += 20; // Has task history
      if (taskPattern.success_rate > 80) confidence += 10;
    }

    if (agentPattern) {
      confidence += 15; // Has agent history
      if (agentPattern.success_rate > 80) confidence += 10;
      if (agentPattern.avg_velocity > 1) confidence += 5;
    }

    return Math.min(95, confidence);
  }

  /**
   * Helper: Generate reasoning for prediction
   */
  private generateReasoning(
    taskPattern?: TaskCompletionPattern,
    agentPattern?: AgentPerformancePattern,
    ai_prediction?: AIPrediction | null
  ): string {
    const reasons: string[] = [];

    if (ai_prediction) {
      return ai_prediction.outcome;
    }

    if (taskPattern) {
      reasons.push(`Historical data: ${taskPattern.avg_duration_ms / 60000} min average, ${taskPattern.success_rate}% success`);
    }

    if (agentPattern) {
      reasons.push(`Agent ${agentPattern.agentId}: ${agentPattern.avg_velocity} tasks/hr, ${agentPattern.success_rate}% success`);
    }

    if (reasons.length === 0) {
      return 'Prediction based on system defaults (limited historical data)';
    }

    return reasons.join('. ');
  }

  /**
   * Helper: Format milliseconds to human-readable duration
   */
  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}.${Math.round(minutes / 6)} hours`;
    }
    return `${minutes} minutes`;
  }

  /**
   * Helper: Parse time string to milliseconds
   */
  private parseTimeToMs(timeStr: string): number {
    const hourMatch = timeStr.match(/(\d+\.?\d*)\s*hours?/i);
    const minMatch = timeStr.match(/(\d+)\s*minutes?/i);

    let ms = 0;

    if (hourMatch) {
      ms += parseFloat(hourMatch[1]) * 60 * 60 * 1000;
    }

    if (minMatch) {
      ms += parseInt(minMatch[1]) * 60 * 1000;
    }

    return ms || 2 * 60 * 60 * 1000; // Default 2 hours
  }

  /**
   * Helper: Broadcast prediction to clients
   */
  private broadcastPrediction(prediction: TaskPrediction): void {
    this.eventBroadcaster.broadcast({
      type: 'intelligence_insight',
      timestamp: Date.now(),
      data: {
        type: 'prediction',
        title: `Task ${prediction.taskId} prediction`,
        description: `${prediction.success_probability}% success probability, ETA: ${prediction.estimated_completion_time}. Risks: ${prediction.risk_factors.join(', ')}`,
        confidence: prediction.confidence,
        action_required: prediction.success_probability < 60,
        priority: prediction.success_probability < 50 ? 'HIGH' : 'MEDIUM'
      }
    });
  }

  /**
   * Get cached prediction for task
   */
  getTaskPrediction(taskId: string): TaskPrediction | undefined {
    return this.taskPredictions.get(taskId);
  }

  /**
   * Get cached prediction for agent
   */
  getAgentPrediction(agentId: string): AgentVelocityPrediction | undefined {
    return this.agentPredictions.get(agentId);
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.taskPredictions.clear();
    this.agentPredictions.clear();
    logger.info('🔄 Prediction cache cleared');
  }
}
