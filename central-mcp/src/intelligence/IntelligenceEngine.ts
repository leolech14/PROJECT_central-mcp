/**
 * Intelligence Engine (Main AI Orchestrator)
 * ==========================================
 *
 * Central AI coordination system that:
 * - Manages multiple AI providers (Z.AI, Anthropic, Gemini, OpenAI)
 * - Routes analysis to optimal models based on task type
 * - Provides real-time intelligence insights
 * - Broadcasts AI findings to all connected clients
 */

import { BaseAIClient, AIAnalysis, AIPrediction, AIOptimization, AIInsight, ModelUsageStats } from '../clients/BaseAIClient.js';
import { ZAIClient } from '../clients/ZAIClient.js';
import { Event, EventBroadcaster } from '../events/EventBroadcaster.js';
import { logger } from '../utils/logger.js';

export interface IntelligenceConfig {
  enableZAI?: boolean;
  enableAnthropic?: boolean;
  enableGemini?: boolean;
  enableOpenAI?: boolean;

  // Model selection for different tasks
  realtimeModel?: 'zai' | 'anthropic' | 'gemini';
  optimizationModel?: 'zai' | 'anthropic' | 'gemini';
  predictionModel?: 'zai' | 'anthropic' | 'gemini';
  patternModel?: 'zai' | 'anthropic' | 'gemini';
}

export interface IntelligenceStats {
  providers: {
    zai?: ModelUsageStats;
    anthropic?: ModelUsageStats;
    gemini?: ModelUsageStats;
    openai?: ModelUsageStats;
  };
  totalCalls: number;
  totalCost: number;
  uptime: number;
}

/**
 * Main Intelligence Engine - Coordinates all AI providers
 */
export class IntelligenceEngine {
  private static instance: IntelligenceEngine | null = null;

  private zaiClient?: ZAIClient;
  private anthropicClient?: BaseAIClient;
  private geminiClient?: BaseAIClient;
  private openaiClient?: BaseAIClient;

  private eventBroadcaster: EventBroadcaster;
  private config: IntelligenceConfig;
  private startTime: number;

  // Analysis queue and processing
  private eventQueue: Event[] = [];
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;

  private constructor(config: IntelligenceConfig = {}) {
    this.config = {
      enableZAI: config.enableZAI ?? true,
      enableAnthropic: config.enableAnthropic ?? false,
      enableGemini: config.enableGemini ?? false,
      enableOpenAI: config.enableOpenAI ?? false,
      realtimeModel: config.realtimeModel ?? 'zai',
      optimizationModel: config.optimizationModel ?? 'zai',
      predictionModel: config.predictionModel ?? 'zai',
      patternModel: config.patternModel ?? 'zai'
    };

    this.eventBroadcaster = EventBroadcaster.getInstance();
    this.startTime = Date.now();

    this.initializeClients();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: IntelligenceConfig): IntelligenceEngine {
    if (!IntelligenceEngine.instance) {
      IntelligenceEngine.instance = new IntelligenceEngine(config);
    }
    return IntelligenceEngine.instance;
  }

  /**
   * Initialize AI clients based on configuration
   */
  private initializeClients(): void {
    try {
      // Z.AI (GLM-4.6) - Real-time analysis (fast, cheap)
      if (this.config.enableZAI) {
        this.zaiClient = new ZAIClient('flash'); // 200K context
        logger.info('✅ Z.AI GLM-4-Flash initialized for real-time analysis');
      }

      // Anthropic Claude (Sonnet-4.5) - Optimization (smart, expensive)
      if (this.config.enableAnthropic) {
        // TODO: Create AnthropicClient when API key is available
        logger.warn('⚠️ Anthropic client not yet implemented');
      }

      // Google Gemini (2.5 Pro) - Prediction (accurate)
      if (this.config.enableGemini) {
        // TODO: Create GeminiClient when service account is available
        logger.warn('⚠️ Gemini client not yet implemented');
      }

      // OpenAI (GPT-4) - Optional fallback
      if (this.config.enableOpenAI) {
        // TODO: Create OpenAIClient if needed
        logger.warn('⚠️ OpenAI client not yet implemented');
      }

    } catch (error: any) {
      logger.error('❌ Failed to initialize AI clients:', error.message);
    }
  }

  /**
   * Start intelligence engine (begin processing events)
   */
  async start(): Promise<void> {
    logger.info('🧠 Starting Intelligence Engine...');

    // Test all available clients
    await this.healthCheck();

    // Start event processing loop (every 5 seconds)
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, 5000);

    logger.info('✅ Intelligence Engine started successfully');
  }

  /**
   * Stop intelligence engine
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    logger.info('🛑 Intelligence Engine stopped');
  }

  /**
   * Analyze a single event in real-time
   */
  async analyzeEvent(event: Event): Promise<AIAnalysis | null> {
    const client = this.getClientForTask(this.config.realtimeModel || 'zai');

    if (!client) {
      logger.warn('⚠️ No AI client available for event analysis');
      return null;
    }

    try {
      const analysis = await client.analyzeEvent(event);

      // Broadcast insights if significant
      if (analysis.confidence > 70) {
        this.broadcastInsight({
          type: 'pattern',
          title: 'Event Analysis',
          description: analysis.reasoning,
          confidence: analysis.confidence,
          action_required: analysis.anomalies.length > 0,
          priority: analysis.anomalies.length > 0 ? 'HIGH' : 'MEDIUM'
        });
      }

      return analysis;
    } catch (error: any) {
      logger.error('❌ Event analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Analyze patterns in event history
   */
  async analyzePatterns(events: Event[]): Promise<AIInsight[]> {
    const client = this.getClientForTask(this.config.patternModel || 'zai');

    if (!client) {
      logger.warn('⚠️ No AI client available for pattern analysis');
      return [];
    }

    try {
      const insights = await client.analyzePatterns(events);

      // Broadcast high-confidence patterns
      insights.forEach(insight => {
        if (insight.confidence > 75) {
          this.broadcastInsight(insight);
        }
      });

      return insights;
    } catch (error: any) {
      logger.error('❌ Pattern analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Predict outcome for given context
   */
  async predictOutcome(context: any): Promise<AIPrediction | null> {
    const client = this.getClientForTask(this.config.predictionModel || 'zai');

    if (!client) {
      logger.warn('⚠️ No AI client available for prediction');
      return null;
    }

    try {
      const prediction = await client.predictOutcome(context);

      // Broadcast if high confidence or high risk
      if (prediction.confidence > 80 || prediction.risk_factors.length > 2) {
        this.broadcastInsight({
          type: 'prediction',
          title: 'Outcome Prediction',
          description: `${prediction.outcome} (${prediction.probability}% probability)`,
          confidence: prediction.confidence,
          action_required: prediction.risk_factors.length > 2,
          priority: prediction.risk_factors.length > 2 ? 'HIGH' : 'MEDIUM'
        });
      }

      return prediction;
    } catch (error: any) {
      logger.error('❌ Prediction failed:', error.message);
      return null;
    }
  }

  /**
   * Suggest optimization for given context
   */
  async suggestOptimization(context: any): Promise<AIOptimization | null> {
    const client = this.getClientForTask(this.config.optimizationModel || 'zai');

    if (!client) {
      logger.warn('⚠️ No AI client available for optimization');
      return null;
    }

    try {
      const optimization = await client.suggestOptimization(context);

      // Broadcast high-impact optimizations
      if (optimization.impact === 'HIGH' || optimization.impact === 'MEDIUM') {
        this.broadcastInsight({
          type: 'optimization',
          title: 'Optimization Suggestion',
          description: optimization.suggestion,
          confidence: 85,
          action_required: optimization.impact === 'HIGH',
          priority: optimization.impact === 'HIGH' ? 'HIGH' : 'MEDIUM'
        });
      }

      return optimization;
    } catch (error: any) {
      logger.error('❌ Optimization suggestion failed:', error.message);
      return null;
    }
  }

  /**
   * Queue event for batch processing
   */
  queueEvent(event: Event): void {
    this.eventQueue.push(event);

    // Process immediately if queue is large
    if (this.eventQueue.length > 20 && !this.isProcessing) {
      this.processEventQueue();
    }
  }

  /**
   * Process event queue (batch analysis)
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];

      logger.info(`🧠 Processing ${eventsToProcess.length} queued events`);

      // Analyze patterns in batch
      const insights = await this.analyzePatterns(eventsToProcess);

      if (insights.length > 0) {
        logger.info(`✅ Found ${insights.length} patterns/insights`);
      }

    } catch (error: any) {
      logger.error('❌ Event queue processing failed:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get AI client for specific task
   */
  private getClientForTask(modelType: 'zai' | 'anthropic' | 'gemini' | 'openai' = 'zai'): BaseAIClient | undefined {
    switch (modelType) {
      case 'zai':
        return this.zaiClient;
      case 'anthropic':
        return this.anthropicClient;
      case 'gemini':
        return this.geminiClient;
      case 'openai':
        return this.openaiClient;
      default:
        return this.zaiClient; // Default fallback
    }
  }

  /**
   * Broadcast AI insight to all clients
   */
  private broadcastInsight(insight: AIInsight): void {
    this.eventBroadcaster.broadcast({
      type: 'intelligence_insight',
      timestamp: Date.now(),
      data: insight
    });

    logger.info(`💡 AI Insight: ${insight.title} (${insight.confidence}% confidence)`);
  }

  /**
   * Health check all AI providers
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    if (this.zaiClient) {
      results.zai = await this.zaiClient.healthCheck();
    }

    if (this.anthropicClient) {
      results.anthropic = await this.anthropicClient.healthCheck();
    }

    if (this.geminiClient) {
      results.gemini = await this.geminiClient.healthCheck();
    }

    if (this.openaiClient) {
      results.openai = await this.openaiClient.healthCheck();
    }

    return results;
  }

  /**
   * Get usage statistics for all providers
   */
  getStats(): IntelligenceStats {
    const providers: any = {};

    if (this.zaiClient) {
      providers.zai = this.zaiClient.getUsageStats();
    }

    if (this.anthropicClient) {
      providers.anthropic = this.anthropicClient.getUsageStats();
    }

    if (this.geminiClient) {
      providers.gemini = this.geminiClient.getUsageStats();
    }

    if (this.openaiClient) {
      providers.openai = this.openaiClient.getUsageStats();
    }

    const totalCalls = Object.values(providers).reduce(
      (sum: number, stats: any) => sum + stats.calls_made,
      0
    );

    const totalCost = Object.values(providers).reduce(
      (sum: number, stats: any) => sum + stats.estimated_cost,
      0
    );

    return {
      providers,
      totalCalls,
      totalCost,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset all usage statistics
   */
  resetStats(): void {
    if (this.zaiClient) this.zaiClient.resetStats();
    if (this.anthropicClient) this.anthropicClient.resetStats();
    if (this.geminiClient) this.geminiClient.resetStats();
    if (this.openaiClient) this.openaiClient.resetStats();

    logger.info('📊 Intelligence Engine stats reset');
  }
}
