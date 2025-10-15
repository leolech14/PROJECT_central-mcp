/**
 * Base AI Client (Abstract Interface)
 * ====================================
 *
 * Unified interface for all AI providers (Z.AI, Anthropic, Gemini, OpenAI)
 * Provides standardized methods for event analysis, pattern detection, optimization
 */

import { Event } from '../events/EventBroadcaster.js';

export interface AIAnalysis {
  patterns_detected: string[];
  anomalies: string[];
  optimization_suggestions: string[];
  confidence: number; // 0-100
  reasoning: string;
}

export interface AIPrediction {
  outcome: string;
  probability: number; // 0-100
  estimated_completion_time?: string;
  risk_factors: string[];
  confidence: number;
}

export interface AIOptimization {
  suggestion: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'HIGH' | 'MEDIUM' | 'LOW';
  expected_improvement: string;
  implementation_steps: string[];
}

export interface AIInsight {
  type: 'pattern' | 'anomaly' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  action_required: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ModelUsageStats {
  provider: string;
  model: string;
  calls_made: number;
  tokens_used: number;
  estimated_cost: number;
  avg_response_time_ms: number;
}

/**
 * Abstract base class for all AI clients
 */
export abstract class BaseAIClient {
  protected provider: string;
  protected model: string;
  protected apiKey: string;
  protected baseUrl: string;

  // Usage tracking
  protected callCount = 0;
  protected totalTokens = 0;
  protected totalCost = 0;
  protected responseTimes: number[] = [];

  constructor(provider: string, model: string, apiKey: string, baseUrl: string) {
    this.provider = provider;
    this.model = model;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze a single event for insights
   */
  abstract analyzeEvent(event: Event): Promise<AIAnalysis>;

  /**
   * Analyze multiple events for patterns
   */
  abstract analyzePatterns(events: Event[]): Promise<AIInsight[]>;

  /**
   * Predict outcome based on current state
   */
  abstract predictOutcome(context: any): Promise<AIPrediction>;

  /**
   * Suggest optimizations
   */
  abstract suggestOptimization(context: any): Promise<AIOptimization>;

  /**
   * Generic completion call (internal)
   */
  protected abstract callCompletion(prompt: string, options?: any): Promise<string>;

  /**
   * Get usage statistics
   */
  getUsageStats(): ModelUsageStats {
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      provider: this.provider,
      model: this.model,
      calls_made: this.callCount,
      tokens_used: this.totalTokens,
      estimated_cost: this.totalCost,
      avg_response_time_ms: Math.round(avgResponseTime)
    };
  }

  /**
   * Reset usage statistics
   */
  resetStats(): void {
    this.callCount = 0;
    this.totalTokens = 0;
    this.totalCost = 0;
    this.responseTimes = [];
  }

  /**
   * Track API call (internal)
   */
  protected trackCall(tokens: number, cost: number, responseTime: number): void {
    this.callCount++;
    this.totalTokens += tokens;
    this.totalCost += cost;
    this.responseTimes.push(responseTime);
  }

  /**
   * Health check
   */
  abstract healthCheck(): Promise<boolean>;
}

/**
 * System prompts for different AI tasks
 */
export const SystemPrompts = {
  EVENT_ANALYSIS: `You are an AI intelligence engine analyzing multi-agent coordination events.
Your role is to:
1. Detect patterns in agent behavior
2. Identify anomalies or inefficiencies
3. Suggest optimizations
4. Provide actionable insights

Respond in JSON format with:
{
  "patterns_detected": ["pattern 1", "pattern 2"],
  "anomalies": ["anomaly 1"],
  "optimization_suggestions": ["suggestion 1", "suggestion 2"],
  "confidence": 85,
  "reasoning": "Brief explanation of analysis"
}`,

  PATTERN_DETECTION: `You are analyzing historical events to detect patterns in multi-agent system.
Focus on:
1. Agent performance patterns (who's fast at what)
2. Task completion patterns (what takes longest)
3. Bottlenecks and inefficiencies
4. Success patterns (what works well)

Respond with array of insights in JSON format.`,

  OUTCOME_PREDICTION: `You are predicting outcomes for multi-agent tasks.
Based on historical data and current state, predict:
1. Likely outcome (success/failure/delayed)
2. Estimated completion time
3. Risk factors
4. Confidence level

Respond in JSON format with prediction details.`,

  OPTIMIZATION_SUGGESTION: `You are suggesting optimizations for multi-agent coordination.
Analyze the system and suggest:
1. Better task routing
2. More efficient agent allocation
3. Improved rules or priorities
4. Performance optimizations

Respond in JSON format with concrete, actionable suggestions.`
};
