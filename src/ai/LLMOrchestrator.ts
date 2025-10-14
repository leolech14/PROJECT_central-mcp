/**
 * LLM ORCHESTRATOR - THE AI BRAIN
 * ================================
 *
 * DEEP AI INTEGRATION INTO EVERY LAYER
 *
 * The LLM Orchestrator sits at the CORE of Central-MCP, providing
 * intelligent AI assistance at EVERY decision point:
 *
 * 1. **Message Understanding** (IntelligenceEngine)
 *    - Extract insights from user messages
 *    - Detect intent, requirements, preferences
 *    - Build behavioral rules
 *
 * 2. **Spec Generation** (Loop 7)
 *    - Transform insights → technical specifications
 *    - Generate validation criteria
 *    - Create dependency graphs
 *
 * 3. **Task Breakdown** (IntelligentTaskGenerator)
 *    - Parse specs → intelligent tasks
 *    - Determine dependencies
 *    - Assign optimal agents
 *
 * 4. **Code Generation** (VM Agents)
 *    - Implement according to specs
 *    - Follow project patterns
 *    - Write tests
 *
 * 5. **Validation & Review** (SpecLifecycleValidator)
 *    - Validate implementations
 *    - Suggest improvements
 *    - Ensure quality
 *
 * 6. **Strategic Planning** (Orchestration)
 *    - Coordinate multi-agent teams
 *    - Optimize resource allocation
 *    - Predict bottlenecks
 *
 * MODEL SELECTION STRATEGY:
 * - Sonnet 4.5 (1M) → Full project context, architecture, complex reasoning
 * - Sonnet 4.5 (200K) → Spec generation, task breakdown, validation
 * - GLM-4-6 (1M) → Fallback, high-volume, experimentation
 * - Gemini 2.0 Flash → Fast processing, multimodal
 *
 * This transforms Central-MCP from mechanical → INTELLIGENT!
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ModelRegistry, ModelSelection, ModelUsage } from './ModelRegistry.js';
import { logger } from '../utils/logger.js';
import Database from 'better-sqlite3';

export interface LLMRequest {
  purpose: string;                   // 'spec-generation', 'task-breakdown', etc.
  systemPrompt: string;
  userPrompt: string;
  contextSize?: number;              // Estimated context size
  requiresVision?: boolean;
  requiresFunctionCalling?: boolean;
  maxTokens?: number;
  temperature?: number;
  preferredModel?: string;
}

export interface LLMResponse {
  content: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
  cached?: boolean;                  // Prompt caching
}

export interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (response: LLMResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * LLM Orchestrator - Routes AI requests to optimal models
 */
export class LLMOrchestrator {
  private modelRegistry: ModelRegistry;
  private db: Database.Database;
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private rateLimitTracker: Map<string, number[]>; // modelId → timestamps

  constructor(db: Database.Database) {
    this.db = db;
    this.modelRegistry = new ModelRegistry(db);
    this.rateLimitTracker = new Map();

    // Initialize Anthropic client
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      logger.info(`🧠 LLM Orchestrator initialized with Anthropic`);
    }

    // Initialize OpenAI client
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      logger.info(`🧠 LLM Orchestrator initialized with OpenAI`);
    }

    if (!anthropicKey && !openaiKey) {
      logger.warn(`⚠️  No API keys found - LLM features disabled`);
      logger.warn(`   Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable`);
    }
  }

  /**
   * Send request to optimal model
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Select optimal model
      const selection = this.modelRegistry.selectModel({
        purpose: request.purpose,
        contextSize: request.contextSize,
        requiresVision: request.requiresVision,
        requiresFunctionCalling: request.requiresFunctionCalling,
        preferredProvider: request.preferredModel
      });

      if (!selection) {
        throw new Error(`No available model for: ${request.purpose}`);
      }

      logger.info(`🤖 Using ${selection.selectedModel.displayName} for ${request.purpose}`);
      logger.debug(`   Reasoning: ${selection.reasoning}`);

      // Check rate limits
      await this.enforceRateLimit(selection.selectedModel.id, selection.selectedModel.requestsPerMinute);

      // Route to appropriate provider
      let response: LLMResponse;

      switch (selection.selectedModel.provider) {
        case 'anthropic':
          response = await this.callAnthropic(request, selection);
          break;

        case 'openai':
          response = await this.callOpenAI(request, selection);
          break;

        case 'google':
          response = await this.callGoogle(request, selection);
          break;

        case 'z.ai':
          response = await this.callZAI(request, selection);
          break;

        default:
          throw new Error(`Provider not supported: ${selection.selectedModel.provider}`);
      }

      // Track usage
      this.modelRegistry.trackUsage({
        subscriptionId: selection.subscription.id,
        modelId: selection.selectedModel.id,
        purpose: request.purpose,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        latencyMs: response.latencyMs,
        success: true
      });

      return response;

    } catch (err: any) {
      const latency = Date.now() - startTime;
      logger.error(`❌ LLM request failed: ${err.message}`);

      // Try fallback model
      // TODO: Implement fallback logic

      throw err;
    }
  }

  /**
   * Streaming completion
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, LLMResponse, undefined> {
    const startTime = Date.now();

    const selection = this.modelRegistry.selectModel({
      purpose: request.purpose,
      contextSize: request.contextSize
    });

    if (!selection) {
      throw new Error(`No available model for: ${request.purpose}`);
    }

    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    logger.info(`🤖 Streaming with ${selection.selectedModel.displayName}`);

    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const stream = await this.anthropic.messages.stream({
        model: selection.selectedModel.modelId,
        max_tokens: request.maxTokens || 8192,
        temperature: request.temperature || 0.7,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.userPrompt
          }
        ]
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullContent += text;
          yield text;
        }

        if (chunk.type === 'message_stop') {
          // Extract token counts from final message
          const message = await stream.finalMessage();
          promptTokens = message.usage.input_tokens;
          completionTokens = message.usage.output_tokens;
        }
      }

      const latency = Date.now() - startTime;

      const response: LLMResponse = {
        content: fullContent,
        modelUsed: selection.selectedModel.displayName,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latencyMs: latency,
        cost: this.calculateCost(selection.selectedModel.id, promptTokens, completionTokens)
      };

      // Track usage
      this.modelRegistry.trackUsage({
        subscriptionId: selection.subscription.id,
        modelId: selection.selectedModel.id,
        purpose: request.purpose,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latencyMs: latency,
        success: true
      });

      return response;

    } catch (err: any) {
      logger.error(`❌ Streaming failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(request: LLMRequest, selection: ModelSelection): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: selection.selectedModel.modelId,
      max_tokens: request.maxTokens || 8192,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt
        }
      ]
    });

    const latency = Date.now() - startTime;

    // Extract text content
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: textContent,
      modelUsed: selection.selectedModel.displayName,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      latencyMs: latency,
      cost: this.calculateCost(
        selection.selectedModel.id,
        response.usage.input_tokens,
        response.usage.output_tokens
      )
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(request: LLMRequest, selection: ModelSelection): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: selection.selectedModel.modelId,
      max_tokens: request.maxTokens || 8192,
      temperature: request.temperature || 0.7,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user',
          content: request.userPrompt
        }
      ]
    });

    const latency = Date.now() - startTime;

    // Extract text content
    const textContent = response.choices[0]?.message?.content || '';

    return {
      content: textContent,
      modelUsed: selection.selectedModel.displayName,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      latencyMs: latency,
      cost: this.calculateCost(
        selection.selectedModel.id,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      )
    };
  }

  /**
   * Call Google API
   */
  private async callGoogle(request: LLMRequest, selection: ModelSelection): Promise<LLMResponse> {
    // TODO: Implement Google integration
    throw new Error('Google integration not yet implemented');
  }

  /**
   * Call Z.AI API
   */
  private async callZAI(request: LLMRequest, selection: ModelSelection): Promise<LLMResponse> {
    // TODO: Implement Z.AI integration
    throw new Error('Z.AI integration not yet implemented');
  }

  /**
   * Enforce rate limits
   */
  private async enforceRateLimit(modelId: string, requestsPerMinute: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get recent requests
    let timestamps = this.rateLimitTracker.get(modelId) || [];

    // Remove old timestamps
    timestamps = timestamps.filter(t => t > oneMinuteAgo);

    // Check limit
    if (timestamps.length >= requestsPerMinute) {
      const oldestTimestamp = timestamps[0];
      const waitMs = 60000 - (now - oldestTimestamp);

      logger.warn(`⏱️  Rate limit reached for ${modelId}, waiting ${waitMs}ms`);
      await new Promise(resolve => setTimeout(resolve, waitMs));

      // Retry
      return this.enforceRateLimit(modelId, requestsPerMinute);
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimitTracker.set(modelId, timestamps);
  }

  /**
   * Calculate cost
   */
  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.modelRegistry.getModel(modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000000) * model.costPer1MInputTokens;
    const outputCost = (outputTokens / 1000000) * model.costPer1MOutputTokens;

    return inputCost + outputCost;
  }

  /**
   * Register subscription (convenience method)
   */
  registerSubscription(config: {
    provider: 'anthropic' | 'openai' | 'google' | 'z.ai';
    accountTier: 'free' | 'pro' | 'team' | 'enterprise';
    apiKey: string;
    monthlyBudget?: number;
  }): void {
    this.modelRegistry.registerSubscription(config);

    // Re-initialize client if Anthropic
    if (config.provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey: config.apiKey });
      logger.info(`🔄 Anthropic client reinitialized`);
    }
  }

  /**
   * Get model registry
   */
  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }
}
