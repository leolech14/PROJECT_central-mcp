/**
 * Event Analyzer (Real-Time Intelligence)
 * ========================================
 *
 * Analyzes events in real-time for:
 * - Anomaly detection
 * - Alert triggering
 * - Relevance scoring
 * - Context-aware insights
 */

import { Event, EventBroadcaster } from '../events/EventBroadcaster.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { logger } from '../utils/logger.js';
import { getAgentId, getTaskId, getPercentage, getLogLevel, getMessage } from '../utils/eventUtils.js';

export interface AnalysisResult {
  event: Event;
  relevance_score: number; // 0-100
  is_anomaly: boolean;
  anomaly_reason?: string;
  requires_alert: boolean;
  alert_priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  insights: string[];
  recommended_actions: string[];
}

export interface EventContext {
  agent_history: Event[];
  task_history: Event[];
  recent_patterns: string[];
}

/**
 * Real-time event analyzer with anomaly detection
 */
export class EventAnalyzer {
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;
  private intelligenceEngine: IntelligenceEngine;
  private eventBroadcaster: EventBroadcaster;

  // Anomaly detection thresholds
  private readonly ANOMALY_THRESHOLDS = {
    progress_jump: 50, // Progress increase > 50% in one update
    long_silence: 30 * 60 * 1000, // 30 minutes of no activity
    rapid_failures: 3, // 3 failures within 5 minutes
    unusual_duration: 2.0 // Task taking 2x normal time
  };

  constructor() {
    this.intelligenceEngine = IntelligenceEngine.getInstance();
    this.eventBroadcaster = EventBroadcaster.getInstance();
  }

  /**
   * Analyze event in real-time
   */
  async analyzeRealtime(event: Event): Promise<AnalysisResult> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Build context
    const context = this.buildContext(event);

    // Calculate relevance
    const relevance_score = this.calculateRelevance(event, context);

    // Detect anomalies
    const { is_anomaly, anomaly_reason } = this.detectAnomaly(event, context);

    // Determine if alert needed
    const { requires_alert, alert_priority } = this.shouldAlert(event, is_anomaly, relevance_score);

    // Generate insights
    const insights = await this.generateInsights(event, context);

    // Recommend actions
    const recommended_actions = this.recommendActions(event, is_anomaly, context);

    const result: AnalysisResult = {
      event,
      relevance_score,
      is_anomaly,
      anomaly_reason,
      requires_alert,
      alert_priority,
      insights,
      recommended_actions
    };

    // Broadcast if significant
    if (requires_alert || is_anomaly) {
      this.broadcastAnalysis(result);
    }

    // Queue for deep analysis if anomaly
    if (is_anomaly) {
      this.intelligenceEngine.queueEvent(event);
    }

    return result;
  }

  /**
   * Build context for event analysis
   */
  private buildContext(event: Event): EventContext {
    const agentId = getAgentId(event);
    const taskId = getTaskId(event);

    // Get agent's recent events
    const agent_history = agentId
      ? this.eventHistory
          .filter(e => getAgentId(e) === agentId)
          .slice(-20)
      : [];

    // Get task's recent events
    const task_history = taskId
      ? this.eventHistory
          .filter(e => getTaskId(e) === taskId)
          .slice(-20)
      : [];

    // Extract recent patterns (simplified)
    const recent_patterns = this.extractPatterns(this.eventHistory.slice(-50));

    return {
      agent_history,
      task_history,
      recent_patterns
    };
  }

  /**
   * Calculate event relevance score (0-100)
   */
  private calculateRelevance(event: Event, context: EventContext): number {
    let score = 50; // Base score

    // Task completion events are highly relevant
    if (event.type === 'task_completed') score += 30;

    // Agent status changes are relevant
    if (event.type === 'agent_status') score += 20;

    // Progress updates are moderately relevant
    if (event.type === 'agent_progress') score += 15;

    // Rule changes are important
    if (event.type.includes('rule_')) score += 25;

    // Events with high impact agents/tasks
    if (context.task_history.length > 10) score += 10; // Active task
    if (context.agent_history.length > 15) score += 10; // Active agent

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Detect anomalies in event
   */
  private detectAnomaly(event: Event, context: EventContext): { is_anomaly: boolean; anomaly_reason?: string } {
    const taskId = getTaskId(event);
    const agentId = getAgentId(event);
    const percentage = getPercentage(event);
    const level = getLogLevel(event);

    // Anomaly 1: Progress jump (suspicious rapid progress)
    if (event.type === 'agent_progress' && taskId && percentage !== undefined) {
      const prevProgress = this.getLastProgress(taskId, context);

      if (prevProgress && percentage - prevProgress > this.ANOMALY_THRESHOLDS.progress_jump) {
        return {
          is_anomaly: true,
          anomaly_reason: `Suspicious progress jump: ${prevProgress}% → ${percentage}% (>${this.ANOMALY_THRESHOLDS.progress_jump}%)`
        };
      }
    }

    // Anomaly 2: Long silence (agent inactive too long)
    if (event.type === 'agent_status' && agentId) {
      const lastActivity = this.getLastAgentActivity(agentId, context);
      if (lastActivity && Date.now() - lastActivity > this.ANOMALY_THRESHOLDS.long_silence) {
        return {
          is_anomaly: true,
          anomaly_reason: `Agent silent for ${Math.round((Date.now() - lastActivity) / 60000)} minutes`
        };
      }
    }

    // Anomaly 3: Rapid failures (multiple errors quickly)
    if (event.type === 'agent_log' && level === 'error') {
      const recentErrors = context.agent_history.filter(
        e => e.type === 'agent_log' && getLogLevel(e) === 'error' && Date.now() - e.timestamp < 5 * 60 * 1000
      );

      if (recentErrors.length >= this.ANOMALY_THRESHOLDS.rapid_failures) {
        return {
          is_anomaly: true,
          anomaly_reason: `${recentErrors.length} errors in 5 minutes (threshold: ${this.ANOMALY_THRESHOLDS.rapid_failures})`
        };
      }
    }

    // Anomaly 4: Task claimed but already active elsewhere
    if (event.type === 'task_claimed' && taskId) {
      const activeAgents = context.task_history.filter(
        e => e.type === 'task_claimed' && getTaskId(e) === taskId
      );

      if (activeAgents.length > 1) {
        return {
          is_anomaly: true,
          anomaly_reason: `Task ${taskId} claimed by multiple agents: ${activeAgents.map(e => getAgentId(e)).join(', ')}`
        };
      }
    }

    return { is_anomaly: false };
  }

  /**
   * Determine if event requires alert
   */
  private shouldAlert(
    event: Event,
    is_anomaly: boolean,
    relevance_score: number
  ): { requires_alert: boolean; alert_priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' } {
    const level = getLogLevel(event);
    const percentage = getPercentage(event);

    // Critical: Anomalies always alert
    if (is_anomaly) {
      return { requires_alert: true, alert_priority: 'CRITICAL' };
    }

    // High: Task completion
    if (event.type === 'task_completed' && relevance_score > 70) {
      return { requires_alert: true, alert_priority: 'HIGH' };
    }

    // High: Agent errors
    if (event.type === 'agent_log' && level === 'error') {
      return { requires_alert: true, alert_priority: 'HIGH' };
    }

    // Medium: Rule changes
    if (event.type.includes('rule_') && relevance_score > 60) {
      return { requires_alert: true, alert_priority: 'MEDIUM' };
    }

    // Low: Significant progress
    if (event.type === 'agent_progress' && percentage !== undefined && percentage >= 75) {
      return { requires_alert: true, alert_priority: 'LOW' };
    }

    return { requires_alert: false };
  }

  /**
   * Generate AI insights for event
   */
  private async generateInsights(event: Event, context: EventContext): Promise<string[]> {
    const insights: string[] = [];
    const agentId = getAgentId(event);
    const percentage = getPercentage(event);

    // Use AI for complex events
    if (event.type === 'task_completed' || event.type === 'agent_status') {
      try {
        const analysis = await this.intelligenceEngine.analyzeEvent(event);

        if (analysis && analysis.confidence > 60) {
          insights.push(analysis.reasoning);
          insights.push(...analysis.optimization_suggestions);
        }
      } catch (error) {
        // AI analysis optional - continue with rule-based insights
      }
    }

    // Rule-based insights
    if (event.type === 'agent_progress' && percentage === 100) {
      insights.push('Task appears complete - verify deliverables before marking done');
    }

    if (context.agent_history.length > 20 && event.type === 'task_claimed' && agentId) {
      insights.push(`Agent ${agentId} is very active - consider load balancing`);
    }

    if (context.task_history.filter(e => e.type === 'agent_progress').length > 10) {
      insights.push('Task has many updates - may be complex or blocked');
    }

    return insights;
  }

  /**
   * Recommend actions based on analysis
   */
  private recommendActions(event: Event, is_anomaly: boolean, context: EventContext): string[] {
    const actions: string[] = [];
    const level = getLogLevel(event);

    if (is_anomaly) {
      actions.push('🚨 Investigate anomaly immediately');
      actions.push('Review agent logs and task history');
    }

    if (event.type === 'agent_log' && level === 'error') {
      actions.push('Check error details and stack trace');
      actions.push('Verify task dependencies are met');
    }

    if (event.type === 'task_completed') {
      actions.push('Run completion verification');
      actions.push('Check for dependent tasks to unblock');
    }

    if (event.type === 'agent_status') {
      actions.push('Reassign pending tasks if agent down');
      actions.push('Check system health and connectivity');
    }

    return actions;
  }

  /**
   * Broadcast analysis result
   */
  private broadcastAnalysis(result: AnalysisResult): void {
    this.eventBroadcaster.broadcast({
      type: 'intelligence_insight',
      timestamp: Date.now(),
      data: {
        type: result.is_anomaly ? 'anomaly' : 'pattern',
        title: result.is_anomaly ? `Anomaly: ${result.anomaly_reason}` : 'Event Analysis',
        description: result.insights.join(' | '),
        confidence: result.relevance_score,
        action_required: result.requires_alert,
        priority: result.alert_priority || 'LOW'
      }
    });
  }

  /**
   * Helper: Get last progress for task
   */
  private getLastProgress(taskId: string, context: EventContext): number | null {
    const progressEvents = context.task_history
      .filter(e => e.type === 'agent_progress' && getTaskId(e) === taskId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (progressEvents.length > 1) {
      const percentage = getPercentage(progressEvents[1]);
      return percentage !== undefined ? percentage : null;
    }
    return null;
  }

  /**
   * Helper: Get last agent activity timestamp
   */
  private getLastAgentActivity(agentId: string, context: EventContext): number | null {
    const activities = context.agent_history
      .filter(e => getAgentId(e) === agentId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return activities.length > 0 ? activities[0].timestamp : null;
  }

  /**
   * Helper: Extract patterns from events
   */
  private extractPatterns(events: Event[]): string[] {
    const patterns: string[] = [];

    // Pattern 1: Most active agent
    const agentCounts: { [key: string]: number } = {};
    events.forEach(e => {
      const agent = getAgentId(e);
      if (agent) agentCounts[agent] = (agentCounts[agent] || 0) + 1;
    });

    const mostActive = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostActive) {
      patterns.push(`Agent ${mostActive[0]} most active (${mostActive[1]} events)`);
    }

    // Pattern 2: Most common event type
    const typeCounts: { [key: string]: number } = {};
    events.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      patterns.push(`Most events: ${mostCommon[0]} (${mostCommon[1]} occurrences)`);
    }

    // Pattern 3: Task completion rate
    const completions = events.filter(e => e.type === 'task_completed').length;
    const claims = events.filter(e => e.type === 'task_claimed').length;
    if (claims > 0) {
      const rate = Math.round((completions / claims) * 100);
      patterns.push(`Task completion rate: ${rate}%`);
    }

    return patterns;
  }

  /**
   * Get analysis statistics
   */
  getStats() {
    return {
      total_events_analyzed: this.eventHistory.length,
      anomalies_detected: this.eventHistory.filter(e => this.detectAnomaly(e, this.buildContext(e)).is_anomaly)
        .length,
      avg_relevance_score:
        this.eventHistory.length > 0
          ? Math.round(
              this.eventHistory.reduce(
                (sum, e) => sum + this.calculateRelevance(e, this.buildContext(e)),
                0
              ) / this.eventHistory.length
            )
          : 0
    };
  }
}
