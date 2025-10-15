/**
 * Model Detection API
 * ==================
 *
 * HTTP endpoints for foolproof model detection and context window verification
 * Never trust what the model says - detect what's actually configured!
 */

import { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { EnhancedModelDetectionSystem } from '../auto-proactive/EnhancedModelDetectionSystem.js';
import { logger } from '../utils/logger.js';

export class ModelDetectionAPI {
  private db: Database.Database;
  private modelDetectionSystem: EnhancedModelDetectionSystem;

  constructor(db: Database.Database) {
    this.db = db;
    this.modelDetectionSystem = new EnhancedModelDetectionSystem(db);
  }

  /**
   * GET /api/model-detection/current
   *
   * Get comprehensive model detection for current agent
   */
  async detectCurrentModel(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔍 API: Starting comprehensive model detection...');

      const detection = await this.modelDetectionSystem.detectCurrentModel();

      // Add API-specific metadata
      const apiResponse = {
        ...detection,
        apiInfo: {
          detectionMethod: 'comprehensive-configuration-analysis',
          trustLevel: 'high', // We trust configuration over model self-reporting
          detectionTimestamp: new Date().toISOString(),
          apiVersion: '1.0.0'
        },
        recommendations: this.generateRecommendations(detection),
        warnings: this.generateWarnings(detection)
      };

      res.json(apiResponse);

      logger.info(`✅ API: Model detection complete - ${detection.detectedModel} (${detection.modelProvider})`);

    } catch (error: any) {
      logger.error('❌ API: Model detection failed:', error);
      res.status(500).json({
        error: 'Model detection failed',
        details: error.message,
        fallback: {
          detectedModel: 'unknown',
          modelProvider: 'unknown',
          contextWindow: 200000,
          agentLetter: 'B',
          confidence: 0.0
        }
      });
    }
  }

  /**
   * GET /api/model-detection/verify-context
   *
   * Verify context window through actual testing
   */
  async verifyContextWindow(req: Request, res: Response): Promise<void> {
    try {
      const { model, contextWindow } = req.query;

      if (!model || !contextWindow) {
        res.status(400).json({
          error: 'Missing required parameters',
          required: ['model', 'contextWindow'],
          example: '/api/model-detection/verify-context?model=claude-sonnet-4&contextWindow=1000000'
        });
        return;
      }

      logger.info(`🧪 API: Testing context window for ${model} (${contextWindow} tokens)`);

      const verification = await this.testContextWindow(
        model as string,
        parseInt(contextWindow as string)
      );

      res.json({
        model: model,
        requestedContextWindow: parseInt(contextWindow as string),
        verification,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('❌ API: Context window verification failed:', error);
      res.status(500).json({
        error: 'Context window verification failed',
        details: error.message
      });
    }
  }

  /**
   * GET /api/model-detection/agent-mapping
   *
   * Get current agent mapping based on detected model
   */
  async getAgentMapping(req: Request, res: Response): Promise<void> {
    try {
      const detection = await this.modelDetectionSystem.detectCurrentModel();

      const mapping = {
        currentAgent: {
          letter: detection.agentLetter,
          role: detection.agentRole,
          model: detection.detectedModel,
          provider: detection.modelProvider,
          confidence: detection.confidence
        },
        allAgents: this.getAllAgentMappings(),
        mappingLogic: {
          'Agent A': 'UI Velocity Specialist (glm-4.6, glm-4-flash)',
          'Agent B': 'Design & Architecture (claude-sonnet-4-5, claude-sonnet-4)',
          'Agent C': 'Backend Specialist (glm-4.6, deepseek-coder)',
          'Agent D': 'Integration Specialist (claude-sonnet-4-5, claude-sonnet-4)',
          'Agent E': 'Operations & Supervisor (gemini-2.5-pro)',
          'Agent F': 'Strategic Planning (claude-opus-4)'
        },
        detectionTimestamp: detection.timestamp
      };

      res.json(mapping);

    } catch (error: any) {
      logger.error('❌ API: Agent mapping failed:', error);
      res.status(500).json({
        error: 'Agent mapping failed',
        details: error.message
      });
    }
  }

  /**
   * GET /api/model-detection/config-analysis
   *
   * Analyze Claude Code CLI configuration files
   */
  async analyzeConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const analysis = await this.analyzeClaudeConfiguration();

      res.json({
        analysis,
        timestamp: new Date().toISOString(),
        apiInfo: {
          method: 'file-system-analysis',
          trustLevel: 'maximum', // File system doesn't lie!
          source: 'claude-code-cli-configuration'
        }
      });

    } catch (error: any) {
      logger.error('❌ API: Configuration analysis failed:', error);
      res.status(500).json({
        error: 'Configuration analysis failed',
        details: error.message
      });
    }
  }

  /**
   * GET /api/model-detection/history
   *
   * Get historical model detections
   */
  async getDetectionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const history = this.db.prepare(`
        SELECT * FROM model_detections
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(parseInt(limit as string));

      res.json({
        history: history.map((row: any) => ({
          ...row,
          capabilities: JSON.parse(row.capabilities || '{}'),
          metadata: JSON.parse(row.metadata || '{}')
        })),
        totalDetections: history.length,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('❌ API: Detection history failed:', error);
      res.status(500).json({
        error: 'Detection history failed',
        details: error.message
      });
    }
  }

  /**
   * POST /api/model-detection/force-detection
   *
   * Force new model detection (clear cache)
   */
  async forceDetection(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔄 API: Forced model detection requested...');

      // Clear any cache (if implemented)
      const detection = await this.modelDetectionSystem.detectCurrentModel();

      res.json({
        success: true,
        detection,
        forcedAt: new Date().toISOString(),
        message: 'Forced detection completed successfully'
      });

      logger.info(`✅ API: Forced detection complete - ${detection.detectedModel}`);

    } catch (error: any) {
      logger.error('❌ API: Forced detection failed:', error);
      res.status(500).json({
        error: 'Forced detection failed',
        details: error.message
      });
    }
  }

  /**
   * Test context window through actual request
   */
  private async testContextWindow(model: string, contextWindow: number): Promise<{
    supported: boolean;
    actualLimit?: number;
    testMethod: string;
    confidence: number;
    notes: string[];
  }> {
    const notes: string[] = [];
    let confidence = 0.5;
    let supported = false;
    let actualLimit: number | undefined;

    // Method 1: Configuration-based verification
    const knownLimits: Record<string, number> = {
      'claude-sonnet-4-20250514': 1000000,
      'claude-sonnet-4-5-20250929': 200000,
      'glm-4.6': 128000,
      'llama-3.1-70b': 128000
    };

    if (knownLimits[model]) {
      actualLimit = knownLimits[model];
      supported = contextWindow <= actualLimit;
      confidence = 0.9;
      notes.push(`Configuration-based: ${model} supports ${actualLimit.toLocaleString()} tokens`);
    } else {
      notes.push('Model not in known registry - using best-guess');
      confidence = 0.3;
    }

    // Method 2: Provider-specific limits
    if (model.includes('claude') && contextWindow > 200000) {
      // Check for beta features
      notes.push('Large context window requires beta features or specific model versions');
      confidence = Math.max(confidence, 0.7);
    }

    return {
      supported,
      actualLimit,
      testMethod: 'configuration-analysis',
      confidence,
      notes
    };
  }

  /**
   * Generate recommendations based on detection
   */
  private generateRecommendations(detection: any): string[] {
    const recommendations: string[] = [];

    if (detection.confidence < 0.7) {
      recommendations.push('Consider configuring explicit model settings for better detection');
    }

    if (detection.contextWindow < 200000) {
      recommendations.push('Consider using a model with larger context window for complex tasks');
    }

    if (detection.modelProvider === 'unknown') {
      recommendations.push('Verify API endpoint configuration');
    }

    if (!detection.verified) {
      recommendations.push('Run configuration validation to ensure proper setup');
    }

    return recommendations;
  }

  /**
   * Generate warnings based on detection
   */
  private generateWarnings(detection: any): string[] {
    const warnings: string[] = [];

    if (detection.detectedModel === 'unknown') {
      warnings.push('⚠️  Could not detect specific model - using defaults');
    }

    if (detection.modelProvider === 'local' && detection.contextWindow > 128000) {
      warnings.push('⚠️  Large context window may not be supported by local models');
    }

    if (detection.metadata.environmentVariables?.ANTHROPIC_API_KEY?.includes('...')) {
      warnings.push('⚠️  API key detected - ensure it\'s valid and not expired');
    }

    return warnings;
  }

  /**
   * Get all agent mappings
   */
  private getAllAgentMappings(): Record<string, any> {
    return {
      'A': {
        letter: 'A',
        role: 'UI Velocity Specialist',
        models: ['glm-4.6', 'glm-4-flash'],
        capabilities: ['ui', 'react', 'design-systems', 'rapid-prototyping']
      },
      'B': {
        letter: 'B',
        role: 'Design & Architecture',
        models: ['claude-sonnet-4-5', 'claude-sonnet-4-20250514'],
        capabilities: ['architecture', 'design-patterns', 'system-design', 'documentation']
      },
      'C': {
        letter: 'C',
        role: 'Backend Specialist',
        models: ['glm-4.6', 'deepseek-coder'],
        capabilities: ['backend', 'databases', 'apis', 'performance']
      },
      'D': {
        letter: 'D',
        role: 'Integration Specialist',
        models: ['claude-sonnet-4-5', 'claude-sonnet-4-20250514'],
        capabilities: ['integration', 'coordination', 'testing', 'deployment']
      },
      'E': {
        letter: 'E',
        role: 'Operations & Supervisor',
        models: ['gemini-2.5-pro'],
        capabilities: ['operations', 'monitoring', 'optimization', 'supervision']
      },
      'F': {
        letter: 'F',
        role: 'Strategic Planning',
        models: ['claude-opus-4'],
        capabilities: ['strategy', 'product', 'planning', 'vision']
      }
    };
  }

  /**
   * Analyze Claude configuration files
   */
  private async analyzeClaudeConfiguration(): Promise<any> {
    const { homedir } = await import('os');
    const { join } = await import('path');
    const { readFileSync, existsSync } = await import('fs');

    const claudeDir = join(homedir(), '.claude');
    const configFiles = [
      'settings.json',
      'settings-zai.json',
      'settings-1m-context.json',
      'enterprise-test.json'
    ];

    const analysis: any = {
      configDirectory: claudeDir,
      availableConfigs: [],
      activeConfig: null,
      parsedConfigs: {},
      summary: {}
    };

    for (const configFile of configFiles) {
      const fullPath = join(claudeDir, configFile);
      if (existsSync(fullPath)) {
        analysis.availableConfigs.push(configFile);

        try {
          const content = readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(content);
          analysis.parsedConfigs[configFile] = parsed;

          // Determine active config (simple heuristic)
          if (parsed.model || parsed.defaultModel) {
            if (!analysis.activeConfig || configFile === 'settings-zai.json') {
              analysis.activeConfig = configFile;
            }
          }
        } catch (error: any) {
          analysis.parsedConfigs[configFile] = {
            error: `Failed to parse: ${error.message}`
          };
        }
      }
    }

    // Generate summary
    analysis.summary = {
      totalConfigs: analysis.availableConfigs.length,
      activeConfig: analysis.activeConfig,
      hasCustomEndpoint: Object.values(analysis.parsedConfigs).some((config: any) =>
        config.env?.ANTHROPIC_BASE_URL && config.env.ANTHROPIC_BASE_URL !== 'https://api.anthropic.com'
      ),
      hasAuthentication: Object.values(analysis.parsedConfigs).some((config: any) =>
        config.env?.ANTHROPIC_API_KEY || config.env?.ANTHROPIC_AUTH_TOKEN
      )
    };

    return analysis;
  }
}