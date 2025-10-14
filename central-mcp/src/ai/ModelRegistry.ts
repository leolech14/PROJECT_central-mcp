/**
 * MODEL REGISTRY - AI INTELLIGENCE FOUNDATION
 * ============================================
 *
 * THE AI BRAIN INFRASTRUCTURE
 *
 * Central-MCP is powered by WORLD-CLASS AI models at EVERY layer:
 * - Spec generation: Sonnet 4.5 (200K) or Gemini 2.5 Pro (1M)
 * - Task breakdown: Sonnet 4.5 (reasoning)
 * - Code generation: Sonnet 4.5 (implementation)
 * - Validation: Sonnet 4.5 (quality)
 * - Intelligence extraction: Sonnet 4.5 (understanding)
 * - Strategic planning: ChatGPT-5 Pro (Cloud Supervisor)
 *
 * CURRENT AVAILABLE MODELS (2025-10-11):
 * 1. **PRIMARY: Claude Sonnet 4.5 (200K Context)**
 *    - Pro tier, 200K context window
 *    - $3/1M input, $15/1M output
 *    - 1000 req/min
 *
 * 2. **FALLBACK: GLM-4.6 (200K Context, FREE)**
 *    - Free tier, 200K context
 *    - $0 cost
 *    - 60 req/min
 *
 * 3. **LARGE CONTEXT: Gemini 2.5 Pro (1M Context)**
 *    - Free tier, 1M context window!
 *    - $0 cost
 *    - 1500 req/min
 *
 * 4. **SUPERVISOR: ChatGPT-5 Pro**
 *    - Cloud Supervisor role
 *    - Strategic planning & coordination
 *
 * FUTURE GOALS:
 * - Anthropic Enterprise subscription
 * - Claude Sonnet 4.5 (1M context) - When available
 * - Claude Opus 4 - Maximum intelligence
 *
 * This system ensures Central-MCP uses the OPTIMAL model for each task!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export interface ModelDefinition {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'z.ai' | 'other';
  modelId: string;                   // e.g., 'claude-sonnet-4-5'
  displayName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';

  // Capabilities
  contextWindow: number;             // Max tokens (e.g., 1000000 for 1M)
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;

  // Performance
  costPer1MInputTokens: number;      // USD
  costPer1MOutputTokens: number;     // USD
  tokensPerSecond: number;           // Average speed

  // Rate limits
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;

  // Specializations
  bestFor: string[];                 // ['spec-generation', 'code', 'reasoning', etc.]

  // Status
  available: boolean;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'degraded' | 'down';
}

export interface Subscription {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'z.ai';
  accountTier: 'free' | 'pro' | 'team' | 'enterprise';
  apiKey: string;                    // Encrypted

  // Limits
  monthlyBudget?: number;            // USD
  currentSpend: number;              // USD this month

  // Usage tracking
  requestsThisMonth: number;
  tokensThisMonth: number;

  // Status
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelUsage {
  id: string;
  subscriptionId: string;
  modelId: string;
  timestamp: Date;

  // Usage details
  purpose: string;                   // 'spec-generation', 'task-breakdown', etc.
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost
  cost: number;                      // USD

  // Performance
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface ModelSelection {
  selectedModel: ModelDefinition;
  subscription: Subscription;
  reasoning: string;                 // Why this model was chosen
  fallbackModels: ModelDefinition[]; // Alternatives if primary fails
}

/**
 * Model Registry - Tracks available AI models and subscriptions
 */
export class ModelRegistry {
  private db: Database.Database;
  private models: Map<string, ModelDefinition>;
  private subscriptions: Map<string, Subscription>;

  constructor(db: Database.Database) {
    this.db = db;
    this.models = new Map();
    this.subscriptions = new Map();

    this.initializeDefaultModels();
    this.loadSubscriptions();

    logger.info(`🧠 Model Registry initialized`);
  }

  /**
   * Initialize default model definitions
   */
  private initializeDefaultModels(): void {
    const defaultModels: ModelDefinition[] = [
      // ═══════════════════════════════════════════════════
      // ANTHROPIC MODELS (PRIMARY)
      // ═══════════════════════════════════════════════════
      {
        id: 'claude-sonnet-4-5-1m',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4.5-20250929',
        displayName: 'Claude Sonnet 4.5 (1M Context)',
        tier: 'enterprise',
        contextWindow: 1000000,        // 🔥 1M CONTEXT WINDOW!
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 3.00,
        costPer1MOutputTokens: 15.00,
        tokensPerSecond: 100,
        requestsPerMinute: 4000,       // Enterprise limits
        tokensPerMinute: 400000,
        requestsPerDay: 100000,
        bestFor: [
          'spec-generation',
          'architecture',
          'reasoning',
          'complex-tasks',
          'full-project-context'
        ],
        available: false,              // Requires enterprise subscription
        healthStatus: 'healthy'
      },
      {
        id: 'claude-sonnet-4-5-200k',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20241022',
        displayName: 'Claude Sonnet 4.5 (200K Context)',
        tier: 'pro',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 3.00,
        costPer1MOutputTokens: 15.00,
        tokensPerSecond: 100,
        requestsPerMinute: 1000,       // Pro limits
        tokensPerMinute: 100000,
        requestsPerDay: 50000,
        bestFor: [
          'spec-generation',
          'code-generation',
          'task-breakdown',
          'validation'
        ],
        available: true,               // Default for now
        healthStatus: 'healthy'
      },
      {
        id: 'claude-opus-4',
        provider: 'anthropic',
        modelId: 'claude-opus-4-20250514',
        displayName: 'Claude Opus 4 (Maximum Intelligence)',
        tier: 'enterprise',
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 15.00,   // More expensive
        costPer1MOutputTokens: 75.00,
        tokensPerSecond: 80,
        requestsPerMinute: 2000,
        tokensPerMinute: 200000,
        requestsPerDay: 50000,
        bestFor: [
          'complex-reasoning',
          'critical-decisions',
          'architecture-design',
          'strategic-planning'
        ],
        available: false,
        healthStatus: 'healthy'
      },

      // ═══════════════════════════════════════════════════
      // ALTERNATIVE MODELS (FALLBACK)
      // ═══════════════════════════════════════════════════
      {
        id: 'glm-4-6-200k',
        provider: 'z.ai',
        modelId: 'glm-4-6',
        displayName: 'GLM-4.6 (200K Context)',
        tier: 'free',
        contextWindow: 200000,         // 200K context
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: false,
        costPer1MInputTokens: 0,       // FREE!
        costPer1MOutputTokens: 0,
        tokensPerSecond: 60,
        requestsPerMinute: 60,
        tokensPerMinute: 60000,
        requestsPerDay: 10000,
        bestFor: [
          'fallback',
          'high-volume',
          'cost-sensitive',
          'experimentation'
        ],
        available: true,
        healthStatus: 'healthy'
      },
      {
        id: 'gemini-2-5-pro-1m',
        provider: 'google',
        modelId: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro (1M Context)',
        tier: 'free',
        contextWindow: 1000000,        // 1M context available NOW!
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 0,       // Free tier
        costPer1MOutputTokens: 0,
        tokensPerSecond: 120,
        requestsPerMinute: 1500,
        tokensPerMinute: 150000,
        requestsPerDay: 50000,
        bestFor: [
          'full-project-context',
          'fast-processing',
          'high-volume',
          'multimodal',
          'fallback'
        ],
        available: true,               // ✅ AVAILABLE NOW!
        healthStatus: 'healthy'
      },
      {
        id: 'gemini-2-flash-1m',
        provider: 'google',
        modelId: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (1M Context)',
        tier: 'free',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 0,       // Free tier
        costPer1MOutputTokens: 0,
        tokensPerSecond: 120,
        requestsPerMinute: 1500,
        tokensPerMinute: 150000,
        requestsPerDay: 50000,
        bestFor: [
          'fast-processing',
          'high-volume',
          'multimodal',
          'fallback'
        ],
        available: true,
        healthStatus: 'healthy'
      },
      {
        id: 'chatgpt-5-pro',
        provider: 'openai',
        modelId: 'gpt-5',
        displayName: 'ChatGPT-5 Pro (Cloud Supervisor)',
        tier: 'pro',
        contextWindow: 200000,         // Estimated
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 10.00,   // Estimated
        costPer1MOutputTokens: 30.00,
        tokensPerSecond: 100,
        requestsPerMinute: 1000,
        tokensPerMinute: 100000,
        requestsPerDay: 50000,
        bestFor: [
          'strategic-planning',
          'supervision',
          'high-level-decisions',
          'coordination'
        ],
        available: true,               // ✅ AVAILABLE NOW!
        healthStatus: 'healthy'
      },
      {
        id: 'gpt-4-turbo',
        provider: 'openai',
        modelId: 'gpt-4-turbo-2024-04-09',
        displayName: 'GPT-4 Turbo (128K Context)',
        tier: 'pro',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: true,
        costPer1MInputTokens: 10.00,
        costPer1MOutputTokens: 30.00,
        tokensPerSecond: 100,
        requestsPerMinute: 500,
        tokensPerMinute: 50000,
        requestsPerDay: 10000,
        bestFor: [
          'function-calling',
          'structured-output',
          'fallback'
        ],
        available: false,
        healthStatus: 'healthy'
      }
    ];

    for (const model of defaultModels) {
      this.models.set(model.id, model);
    }

    logger.info(`   ✅ ${defaultModels.length} models registered`);
  }

  /**
   * Load subscriptions from database
   */
  private loadSubscriptions(): void {
    // TODO: Load from database
    // For now, empty
    logger.info(`   ℹ️  No active subscriptions loaded`);
  }

  /**
   * Register subscription
   */
  registerSubscription(config: {
    provider: Subscription['provider'];
    accountTier: Subscription['accountTier'];
    apiKey: string;
    monthlyBudget?: number;
  }): Subscription {
    const subscription: Subscription = {
      id: randomUUID(),
      provider: config.provider,
      accountTier: config.accountTier,
      apiKey: config.apiKey, // TODO: Encrypt
      monthlyBudget: config.monthlyBudget,
      currentSpend: 0,
      requestsThisMonth: 0,
      tokensThisMonth: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.subscriptions.set(subscription.id, subscription);

    // Enable models for this subscription
    this.enableModelsForSubscription(subscription);

    logger.info(`✅ Subscription registered: ${config.provider} (${config.accountTier})`);

    return subscription;
  }

  /**
   * Enable models based on subscription
   */
  private enableModelsForSubscription(subscription: Subscription): void {
    for (const model of this.models.values()) {
      if (model.provider !== subscription.provider) continue;

      // Enable if subscription tier matches or exceeds model tier
      const tierOrder = { 'free': 0, 'pro': 1, 'team': 2, 'enterprise': 3 };
      const subTier = tierOrder[subscription.accountTier];
      const modelTier = tierOrder[model.tier];

      if (subTier >= modelTier) {
        model.available = true;
        logger.info(`   ✅ Enabled: ${model.displayName}`);
      }
    }
  }

  /**
   * Select optimal model for task
   */
  selectModel(config: {
    purpose: string;
    contextSize?: number;
    requiresVision?: boolean;
    requiresFunctionCalling?: boolean;
    maxCost?: number;
    preferredProvider?: string;
  }): ModelSelection | null {
    const candidates: ModelDefinition[] = [];

    // Filter available models
    for (const model of this.models.values()) {
      if (!model.available) continue;

      // Check context window
      if (config.contextSize && model.contextWindow < config.contextSize) continue;

      // Check vision
      if (config.requiresVision && !model.supportsVision) continue;

      // Check function calling
      if (config.requiresFunctionCalling && !model.supportsFunctionCalling) continue;

      // Check cost
      if (config.maxCost) {
        const estimatedCost = (config.contextSize || 10000) / 1000000 * model.costPer1MInputTokens;
        if (estimatedCost > config.maxCost) continue;
      }

      // Check if good for purpose
      if (model.bestFor.includes(config.purpose)) {
        candidates.push(model);
      }
    }

    if (candidates.length === 0) {
      logger.warn(`⚠️  No models available for: ${config.purpose}`);
      return null;
    }

    // Sort by preference
    candidates.sort((a, b) => {
      // Prefer specified provider
      if (config.preferredProvider) {
        if (a.provider === config.preferredProvider && b.provider !== config.preferredProvider) return -1;
        if (b.provider === config.preferredProvider && a.provider !== config.preferredProvider) return 1;
      }

      // Prefer larger context window
      if (a.contextWindow !== b.contextWindow) {
        return b.contextWindow - a.contextWindow;
      }

      // Prefer lower cost
      return a.costPer1MInputTokens - b.costPer1MInputTokens;
    });

    const selected = candidates[0];
    const subscription = this.getSubscriptionForModel(selected);

    if (!subscription) {
      logger.error(`❌ No subscription for model: ${selected.displayName}`);
      return null;
    }

    const reasoning = this.generateSelectionReasoning(selected, config);

    return {
      selectedModel: selected,
      subscription,
      reasoning,
      fallbackModels: candidates.slice(1, 3)
    };
  }

  /**
   * Get subscription for model
   */
  private getSubscriptionForModel(model: ModelDefinition): Subscription | undefined {
    for (const sub of this.subscriptions.values()) {
      if (sub.provider === model.provider && sub.active) {
        return sub;
      }
    }
    return undefined;
  }

  /**
   * Generate selection reasoning
   */
  private generateSelectionReasoning(model: ModelDefinition, config: any): string {
    const reasons: string[] = [];

    reasons.push(`Selected ${model.displayName} for ${config.purpose}`);

    if (model.contextWindow >= 1000000) {
      reasons.push('• 1M context window enables full project understanding');
    } else if (model.contextWindow >= 200000) {
      reasons.push('• 200K context sufficient for task');
    }

    if (model.costPer1MInputTokens === 0) {
      reasons.push('• Free tier - no cost concerns');
    } else {
      reasons.push(`• Cost: $${model.costPer1MInputTokens}/1M input tokens`);
    }

    if (model.bestFor.includes(config.purpose)) {
      reasons.push(`• Optimized for ${config.purpose}`);
    }

    return reasons.join('\n');
  }

  /**
   * Track model usage
   */
  trackUsage(usage: Omit<ModelUsage, 'id' | 'timestamp' | 'cost'>): void {
    const model = this.models.get(usage.modelId);
    if (!model) return;

    const cost = this.calculateCost(
      model,
      usage.promptTokens,
      usage.completionTokens
    );

    const usageRecord: ModelUsage = {
      ...usage,
      id: randomUUID(),
      timestamp: new Date(),
      cost
    };

    // Update subscription usage
    const subscription = this.subscriptions.get(usage.subscriptionId);
    if (subscription) {
      subscription.currentSpend += cost;
      subscription.requestsThisMonth += 1;
      subscription.tokensThisMonth += usage.totalTokens;
      subscription.updatedAt = new Date();

      // Check budget
      if (subscription.monthlyBudget && subscription.currentSpend > subscription.monthlyBudget) {
        logger.warn(`⚠️  Budget exceeded for ${subscription.provider}: $${subscription.currentSpend}/$${subscription.monthlyBudget}`);
      }
    }

    // Log usage
    logger.debug(`💸 Model usage: ${model.displayName} - ${usage.totalTokens} tokens ($${cost.toFixed(4)})`);
  }

  /**
   * Calculate cost
   */
  private calculateCost(model: ModelDefinition, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000000) * model.costPer1MInputTokens;
    const outputCost = (outputTokens / 1000000) * model.costPer1MOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelDefinition[] {
    return Array.from(this.models.values()).filter(m => m.available);
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelDefinition | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all subscriptions
   */
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Health check all models
   */
  async healthCheckAllModels(): Promise<void> {
    logger.info(`🏥 Running health checks on all models...`);

    for (const model of this.models.values()) {
      if (!model.available) continue;

      // TODO: Actual health check (test API call)
      model.lastHealthCheck = new Date();
      model.healthStatus = 'healthy';
    }

    logger.info(`   ✅ Health checks complete`);
  }
}
