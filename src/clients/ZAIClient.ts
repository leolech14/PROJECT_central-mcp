/**
 * Z.AI Client (GLM-4.6 Integration)
 * ==================================
 *
 * Integrates with Z.AI API for real-time event analysis.
 * Uses GLM-4-Flash (200K) or GLM-4-Plus (1M) models.
 *
 * Auth: Already configured via environment variables!
 * API: Anthropic-compatible endpoint
 */

import axios from 'axios';
import { BaseAIClient, AIAnalysis, AIPrediction, AIOptimization, AIInsight, SystemPrompts } from './BaseAIClient.js';
import { Event } from '../events/EventBroadcaster.js';
import { logger } from '../utils/logger.js';

export class ZAIClient extends BaseAIClient {
  private anthropicVersion = '2023-06-01';

  constructor(modelVariant: 'flash' | 'plus' = 'flash') {
    const apiKey = process.env.ZAI_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '';
    const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/anthropic';
    const model = modelVariant === 'flash' ? 'glm-4-flash' : 'glm-4-plus';

    super('Z.AI', model, apiKey, baseUrl);

    if (!apiKey) {
      logger.warn('⚠️ ZAI_API_KEY not set - Z.AI client may not work');
    } else {
      logger.info(`✅ Z.AI Client initialized (${model})`);
    }
  }

  /**
   * Analyze a single event
   */
  async analyzeEvent(event: Event): Promise<AIAnalysis> {
    const prompt = `${SystemPrompts.EVENT_ANALYSIS}

Event to analyze:
${JSON.stringify(event, null, 2)}

Provide analysis in JSON format.`;

    try {
      const startTime = Date.now();
      const response = await this.callCompletion(prompt, { max_tokens: 1000 });
      const responseTime = Date.now() - startTime;

      // Parse JSON response
      const analysis = this.parseJSON<AIAnalysis>(response, {
        patterns_detected: [],
        anomalies: [],
        optimization_suggestions: [],
        confidence: 50,
        reasoning: 'Failed to parse AI response'
      });

      // Track usage (estimated)
      const tokens = Math.ceil(response.length / 4);
      const cost = (tokens / 1000000) * 0.10; // GLM-4-Flash pricing
      this.trackCall(tokens, cost, responseTime);

      return analysis;
    } catch (error: any) {
      logger.error('❌ Z.AI event analysis failed:', error.message);
      return {
        patterns_detected: [],
        anomalies: [`Error analyzing event: ${error.message}`],
        optimization_suggestions: [],
        confidence: 0,
        reasoning: 'Analysis failed due to API error'
      };
    }
  }

  /**
   * Analyze patterns in multiple events
   */
  async analyzePatterns(events: Event[]): Promise<AIInsight[]> {
    const prompt = `${SystemPrompts.PATTERN_DETECTION}

Events to analyze (last ${events.length} events):
${JSON.stringify(events.slice(-20), null, 2)}

Identify patterns and provide insights in JSON array format:
[
  {
    "type": "pattern",
    "title": "Pattern title",
    "description": "Detailed description",
    "confidence": 85,
    "action_required": true,
    "priority": "HIGH"
  }
]`;

    try {
      const startTime = Date.now();
      const response = await this.callCompletion(prompt, { max_tokens: 2000 });
      const responseTime = Date.now() - startTime;

      const insights = this.parseJSON<AIInsight[]>(response, []);

      const tokens = Math.ceil(response.length / 4);
      const cost = (tokens / 1000000) * 0.10;
      this.trackCall(tokens, cost, responseTime);

      return insights;
    } catch (error: any) {
      logger.error('❌ Z.AI pattern analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Predict outcome
   */
  async predictOutcome(context: any): Promise<AIPrediction> {
    const prompt = `${SystemPrompts.OUTCOME_PREDICTION}

Current context:
${JSON.stringify(context, null, 2)}

Provide prediction in JSON format:
{
  "outcome": "Task will complete successfully",
  "probability": 85,
  "estimated_completion_time": "2.5 hours",
  "risk_factors": ["Risk 1", "Risk 2"],
  "confidence": 80
}`;

    try {
      const startTime = Date.now();
      const response = await this.callCompletion(prompt, { max_tokens: 800 });
      const responseTime = Date.now() - startTime;

      const prediction = this.parseJSON<AIPrediction>(response, {
        outcome: 'Unable to predict',
        probability: 50,
        risk_factors: ['Prediction failed'],
        confidence: 0
      });

      const tokens = Math.ceil(response.length / 4);
      const cost = (tokens / 1000000) * 0.10;
      this.trackCall(tokens, cost, responseTime);

      return prediction;
    } catch (error: any) {
      logger.error('❌ Z.AI prediction failed:', error.message);
      return {
        outcome: 'Prediction unavailable',
        probability: 50,
        risk_factors: [`Error: ${error.message}`],
        confidence: 0
      };
    }
  }

  /**
   * Suggest optimization
   */
  async suggestOptimization(context: any): Promise<AIOptimization> {
    const prompt = `${SystemPrompts.OPTIMIZATION_SUGGESTION}

System context:
${JSON.stringify(context, null, 2)}

Provide optimization in JSON format:
{
  "suggestion": "Specific optimization suggestion",
  "impact": "HIGH",
  "effort": "MEDIUM",
  "expected_improvement": "30% faster task completion",
  "implementation_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    try {
      const startTime = Date.now();
      const response = await this.callCompletion(prompt, { max_tokens: 1000 });
      const responseTime = Date.now() - startTime;

      const optimization = this.parseJSON<AIOptimization>(response, {
        suggestion: 'No optimization available',
        impact: 'LOW',
        effort: 'LOW',
        expected_improvement: 'Unknown',
        implementation_steps: []
      });

      const tokens = Math.ceil(response.length / 4);
      const cost = (tokens / 1000000) * 0.10;
      this.trackCall(tokens, cost, responseTime);

      return optimization;
    } catch (error: any) {
      logger.error('❌ Z.AI optimization failed:', error.message);
      return {
        suggestion: 'Optimization unavailable',
        impact: 'LOW',
        effort: 'LOW',
        expected_improvement: 'Unknown',
        implementation_steps: [`Error: ${error.message}`]
      };
    }
  }

  /**
   * Call Z.AI API (Anthropic-compatible)
   */
  protected async callCompletion(prompt: string, options: any = {}): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/v1/messages`,
      {
        model: this.model,
        max_tokens: options.max_tokens || 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data && response.data.content && response.data.content[0]) {
      return response.data.content[0].text;
    }

    throw new Error('Invalid response format from Z.AI API');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callCompletion('Respond with "OK" if you can read this.', {
        max_tokens: 10
      });

      logger.info(`✅ Z.AI health check passed: ${response.substring(0, 50)}`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Z.AI health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse JSON with fallback
   */
  private parseJSON<T>(text: string, fallback: T): T {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      return JSON.parse(jsonText);
    } catch (error) {
      logger.warn('⚠️ Failed to parse JSON response, using fallback');
      return fallback;
    }
  }
}
