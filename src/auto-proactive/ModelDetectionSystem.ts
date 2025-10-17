/**
 * Enhanced Model Detection System
 * ==============================
 *
 * BULLETPROOF MODEL DETECTION FOR CENTRAL-MCP
 *
 * This system detects the ACTUAL model and capabilities through:
 * 1. ACTIVE configuration detection (not just file parsing)
 * 2. Real-time API endpoint verification
 * 3. Comprehensive capability testing
 * 4. Self-correction from historical patterns
 * 5. Full integration with Central-MCP loops and registry
 * 6. Universal Write System event logging
 *
 * VERSION: 2.0 - ENHANCED WITH REALITY VERIFICATION
 * INTEGRATION: Full Central-MCP ecosystem compatibility
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';
import {
  ActiveConfigurationDetector,
  ActiveConfigurationResult
} from './ActiveConfigurationDetector.js';
import {
  ModelCapabilityVerifier,
  ModelVerificationResult
} from './ModelCapabilityVerifier.js';
import {
  DetectionSelfCorrection,
  SelfCorrectionResult
} from './DetectionSelfCorrection.js';
import { writeSystemEvent } from '../api/universal-write.js';

export interface ClaudeConfig {
  env: {
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_BASE_URL?: string;
    ANTHROPIC_BETA?: string;
    ANTHROPIC_ORGANIZATION?: string;
    CLAUDE_CODE_CUSTOM_LIMITS?: string;
  };
  defaultModel?: string;
  model?: string;
  contextWindow?: number;
  alwaysThinkingEnabled?: boolean;
}

export interface ModelDetectionResult {
  // Core model info
  detectedModel: string;                    // e.g., "claude-sonnet-4-20250514"
  modelProvider: string;                    // "anthropic", "zhipu", "local", "openai"
  actualEndpoint: string;                   // The actual API URL being used
  contextWindow: number;                    // Actual context window size

  // Configuration source
  configSource: string;                     // Which config file was used
  configPath: string;                       // Full path to config file

  // Verification status
  detectionMethod: string;                  // How we detected it
  confidence: number;                       // 0.0-1.0 confidence level
  verified: boolean;                        // Have we verified this works?

  // Agent mapping
  agentLetter: string;                      // A-F mapping based on model
  agentRole: string;                        // Role description

  // Capabilities
  capabilities: {
    reasoning: 'basic' | 'advanced' | 'expert';
    coding: 'basic' | 'advanced' | 'expert';
    context: string;                        // "100K", "1M", etc.
    multimodal: boolean;
    toolUse: boolean;
  };

  // Self-correction info
  selfCorrection?: {
    correctionApplied: boolean;
    originalModel: string;
    correctedModel: string;
    correctionReason: string;
  };

  // Central-MCP Integration
  loopIntegration: {
    loopId: string;
    sessionId: string;
    eventId: string;
  };

  // Metadata
  timestamp: string;
  metadata: Record<string, any>;
}

export class EnhancedModelDetectionSystem {
  private db: Database.Database;
  private configDetector: ActiveConfigurationDetector;
  private capabilityVerifier: ModelCapabilityVerifier;
  private selfCorrection: DetectionSelfCorrection;
  private detectionCount: number = 0;

  constructor(db: Database.Database) {
    this.db = db;
    this.configDetector = new ActiveConfigurationDetector();
    this.capabilityVerifier = new ModelCapabilityVerifier();
    this.selfCorrection = new DetectionSelfCorrection(db, this.capabilityVerifier);

    logger.info('🔍 EnhancedModelDetectionSystem v2.0 initialized');
    logger.info('   🔧 Active configuration detector: READY');
    logger.info('   🎯 Model capability verifier: READY');
    logger.info('   🧠 Self-correction system: READY');
    logger.info('   📊 Central-MCP integration: ACTIVE');
  }

  /**
   * Perform comprehensive model detection with reality verification and self-correction
   */
  async detectCurrentModel(sessionId?: string): Promise<ModelDetectionResult> {
    this.detectionCount++;
    const detectionId = randomUUID();
    const startTime = Date.now();

    logger.info(`🔍 Starting ENHANCED model detection #${this.detectionCount}...`);
    logger.info(`   🆔 Detection ID: ${detectionId}`);
    if (sessionId) logger.info(`   🔄 Session ID: ${sessionId}`);

    try {
      // Step 1: Detect ACTIVELY USED configuration (not just available files) with enhanced error handling
      let activeConfig;
      try {
        activeConfig = await this.configDetector.detectActiveConfiguration();

        // Validate activeConfig structure
        if (!activeConfig || typeof activeConfig !== 'object') {
          throw new Error('Invalid configuration detection result');
        }

        if (!activeConfig.activeConfig || !activeConfig.actualModel) {
          logger.warn('⚠️  Incomplete configuration detection, applying fallback');
          throw new Error('Missing essential configuration data');
        }

        logger.info(`   📄 Active config: ${activeConfig.activeConfigPath}`);
        logger.info(`   🔍 Detection method: ${activeConfig.detectionMethod}`);
        logger.info(`   ✅ Confidence: ${(activeConfig.confidence * 100).toFixed(0)}%`);

      } catch (configError: any) {
        logger.warn(`⚠️  Configuration detection failed:`, configError.message);

        // Create safe fallback configuration
        activeConfig = {
          activeConfig: {
            model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
            defaultModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'
          },
          activeConfigPath: 'fallback-environment',
          detectionMethod: 'environment',
          confidence: 0.3,
          actualModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
          verificationStatus: 'unverified',
          metadata: {
            fallbackReason: configError.message,
            fallbackApplied: true,
            detectionError: true
          }
        };
      }

      // Step 2: Extract actual model from ACTIVE configuration
      const actualModel = this.extractActualModel(activeConfig);

      logger.info(`   🤖 Actual model: ${actualModel}`);

      // Step 3: Verify model capabilities through API testing with enhanced error handling
      let capabilities;
      try {
        capabilities = await this.capabilityVerifier.verifyModelCapabilities(
          actualModel,
          activeConfig.activeConfig
        );

        // Validate capabilities structure
        if (!capabilities || typeof capabilities !== 'object') {
          throw new Error('Invalid capabilities structure returned');
        }

        if (!capabilities.agentMapping || !capabilities.agentMapping.letter) {
          logger.warn(`⚠️  Invalid agent mapping for model ${actualModel}, using fallback`);
          capabilities.agentMapping = {
            letter: 'B', // Default fallback
            role: 'General Purpose',
            confidence: 0.5
          };
        }

      } catch (capabilityError: any) {
        logger.warn(`⚠️  Capability verification failed for ${actualModel}:`, capabilityError.message);

        // Create safe fallback capabilities
        capabilities = {
          model: actualModel,
          provider: 'unknown',
          contextWindow: 200000,
          capabilities: {
            reasoning: 'basic',
            coding: 'basic',
            multimodal: false,
            toolUse: false,
            maxTokens: 4096,
            supportedFeatures: []
          },
          agentMapping: {
            letter: 'B',
            role: 'General Purpose',
            confidence: 0.3
          },
          performance: {
            avgResponseTime: 5000,
            reliability: 0.5,
            lastVerified: new Date().toISOString()
          },
          verified: false,
          testResults: [{
            testType: 'capability-verification',
            success: false,
            responseTime: 0,
            capabilities: {},
            error: capabilityError.message,
            metadata: { fallbackApplied: true }
          }]
        };
      }

      logger.info(`   🎯 Mapped to Agent: ${capabilities.agentMapping.letter} (${capabilities.agentMapping.role})`);
      logger.info(`   📊 Capability confidence: ${(capabilities.agentMapping.confidence * 100).toFixed(0)}%`);

      // Step 4: Apply self-correction based on historical patterns
      const initialResult: ModelDetectionResult = {
        detectedModel: actualModel,
        modelProvider: 'provider' in capabilities ? capabilities.provider : 'unknown',
        actualEndpoint: activeConfig.activeConfig.env?.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
        contextWindow: 'contextWindow' in capabilities ? capabilities.contextWindow : 200000,
        configSource: activeConfig.activeConfigPath.split('/').pop() || 'unknown',
        configPath: activeConfig.activeConfigPath,
        detectionMethod: `enhanced-${activeConfig.detectionMethod}`,
        confidence: Math.min(activeConfig.confidence, capabilities.agentMapping.confidence),
        verified: ('verified' in capabilities ? capabilities.verified : false) && activeConfig.confidence > 0.7,
        agentLetter: capabilities.agentMapping.letter,
        agentRole: capabilities.agentMapping.role,
        capabilities: {
          reasoning: 'capabilities' in capabilities ? capabilities.capabilities.reasoning : 'basic',
          coding: 'capabilities' in capabilities ? capabilities.capabilities.coding : 'basic',
          context: `${('contextWindow' in capabilities ? capabilities.contextWindow : 200000).toLocaleString()} tokens`,
          multimodal: 'capabilities' in capabilities ? capabilities.capabilities.multimodal : false,
          toolUse: 'capabilities' in capabilities ? capabilities.capabilities.toolUse : false
        },
        timestamp: new Date().toISOString(),
        metadata: {
          configDetection: {
            method: activeConfig.detectionMethod,
            confidence: activeConfig.confidence,
            allConfigs: activeConfig.allConfigs || []
          },
          capabilityVerification: {
            modelVerified: capabilities.verified,
            endpointTested: capabilities.testResults.some(t => t.testType === 'api-access'),
            testsPassed: capabilities.testResults.filter(t => t.success).length,
            testsTotal: capabilities.testResults.length
          },
          selfCorrectionEnabled: true,
          detectionId,
          detectionCount: this.detectionCount
        },
        loopIntegration: {
          loopId: 'model-detection',
          sessionId: sessionId || 'unknown',
          eventId: detectionId
        }
      };

      // Step 5: Apply self-correction if needed
      const correctionResult = await this.selfCorrection.correctDetection(
        initialResult.detectedModel,
        initialResult
      );

      let finalResult = initialResult;

      if (correctionResult.correctionApplied) {
        // Update result with corrected information
        const correctedCapabilities = await this.capabilityVerifier.verifyModelCapabilities(
          correctionResult.correctedModel,
          activeConfig.activeConfig
        );

        finalResult = {
          ...initialResult,
          detectedModel: correctionResult.correctedModel,
          agentLetter: correctedCapabilities.agentMapping.letter,
          agentRole: correctedCapabilities.agentMapping.role,
          confidence: correctionResult.confidence,
          verified: true,
          selfCorrection: {
            correctionApplied: true,
            originalModel: correctionResult.originalModel,
            correctedModel: correctionResult.correctedModel,
            correctionReason: correctionResult.correctionReason
          },
          metadata: {
            ...initialResult.metadata,
            selfCorrectionApplied: true,
            correctionData: correctionResult
          }
        };

        logger.info(`   🧠 Self-correction applied: ${correctionResult.originalModel} → ${correctionResult.correctedModel}`);
        logger.info(`   📊 Updated Agent: ${finalResult.agentLetter} (${finalResult.agentRole})`);
      }

      // Step 6: Write event to Universal Write System (Central-MCP integration)
      await this.writeDetectionEvent(finalResult, Date.now() - startTime);

      // Step 7: Store in database with enhanced schema
      await this.storeEnhancedDetectionResult(finalResult);

      // Step 8: Log final result
      this.logEnhancedDetectionResult(finalResult, Date.now() - startTime);

      return finalResult;

    } catch (error: any) {
      logger.error(`❌ Enhanced model detection failed:`, error);
      const fallbackResult = await this.createFallbackDetection(error, detectionId, sessionId);
      await this.writeDetectionEvent(fallbackResult, Date.now() - startTime);
      return fallbackResult;
    }
  }

  /**
   * Extract actual model from ACTIVE configuration (fixed version)
   */
  private extractActualModel(activeConfig: ActiveConfigurationResult): string {
    const config = activeConfig.activeConfig;

    // Priority: explicit model > default model > inferred from endpoint
    let model = config.model || config.defaultModel;

    // If still no model, try to infer from provider
    if (!model) {
      const baseUrl = config.env?.ANTHROPIC_BASE_URL;
      if (baseUrl?.includes('z.ai')) {
        model = 'glm-4.6'; // Most likely model for Z.AI
      } else if (config.env?.ANTHROPIC_BETA?.includes('context-1m')) {
        model = 'claude-sonnet-4-20250514'; // 1M context model
      } else {
        model = 'claude-sonnet-4-5-20250929'; // Most common Anthropic model
      }
    }

    // Normalize model name
    return this.normalizeModelName(model);
  }

  /**
   * Normalize model name to standard format
   */
  private normalizeModelName(model: string): string {
    const modelAliases: Record<string, string> = {
      'sonnet-4': 'claude-sonnet-4-20250514',
      'claude-sonnet-4': 'claude-sonnet-4-20250514',
      'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
      'glm-4.6': 'glm-4.6',
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929' // Handle legacy naming
    };

    return modelAliases[model] || model;
  }

  /**
   * Format context window size for display
   */
  private formatContextWindow(contextWindow: number): string {
    if (contextWindow >= 1000000) return '1M';
    if (contextWindow >= 200000) return '200K';
    if (contextWindow >= 100000) return '100K';
    return `${Math.round(contextWindow / 1000)}K`;
  }

  /**
   * Write detection event to Universal Write System (Central-MCP integration)
   */
  private async writeDetectionEvent(result: ModelDetectionResult, executionTime: number): Promise<void> {
    try {
      await writeSystemEvent({
        eventType: 'model-detection',
        eventCategory: 'agent-discovery',
        eventActor: `Agent-${result.agentLetter}`,
        eventAction: `Model detected: ${result.detectedModel}`,
        eventDescription: `Enhanced model detection completed with ${result.verified ? 'verification' : 'inference'}`,
        systemHealth: 'healthy',
        activeLoops: 9,
        avgResponseTimeMs: executionTime,
        successRate: result.verified ? 1.0 : 0.8,
        tags: ['model-detection', 'agent-mapping', 'enhanced-system', result.detectionMethod],
        metadata: {
          detectionId: result.loopIntegration.eventId,
          sessionId: result.loopIntegration.sessionId,
          detectedModel: result.detectedModel,
          agentLetter: result.agentLetter,
          agentRole: result.agentRole,
          confidence: result.confidence,
          verified: result.verified,
          provider: result.modelProvider,
          contextWindow: result.contextWindow,
          capabilities: result.capabilities,
          selfCorrectionApplied: !!result.selfCorrection?.correctionApplied,
          correctionData: result.selfCorrection,
          detectionMetadata: result.metadata
        }
      });

      logger.info('   📝 Detection event written to Universal Write System');

    } catch (error: any) {
      logger.warn('Failed to write detection event to Universal Write System:', error.message);
    }
  }

  /**
   * Store enhanced detection result in database with new schema
   */
  private async storeEnhancedDetectionResult(result: ModelDetectionResult): Promise<void> {
    try {
      // Store in enhanced model_detections table
      this.db.prepare(`
        INSERT OR REPLACE INTO enhanced_model_detections (
          id, detected_model, provider, endpoint, context_window,
          config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities,
          self_correction_applied, self_correction_data, loop_integration,
          metadata, timestamp, detection_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        result.loopIntegration.eventId,
        result.detectedModel,
        result.modelProvider,
        result.actualEndpoint,
        result.contextWindow,
        result.configSource,
        result.configPath,
        result.detectionMethod,
        result.confidence,
        result.verified ? 1 : 0,
        result.agentLetter,
        result.agentRole,
        JSON.stringify(result.capabilities),
        result.selfCorrection?.correctionApplied ? 1 : 0,
        JSON.stringify(result.selfCorrection),
        JSON.stringify(result.loopIntegration),
        JSON.stringify(result.metadata),
        result.timestamp,
        this.detectionCount
      );

      // Also store in legacy table for backward compatibility
      this.db.prepare(`
        INSERT OR REPLACE INTO model_detections (
          id, detected_model, provider, endpoint, context_window,
          config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, metadata,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        result.loopIntegration.eventId,
        result.detectedModel,
        result.modelProvider,
        result.actualEndpoint,
        result.contextWindow,
        result.configSource,
        result.configPath,
        result.detectionMethod,
        result.confidence,
        result.verified ? 1 : 0,
        result.agentLetter,
        result.agentRole,
        JSON.stringify(result.capabilities),
        JSON.stringify(result.metadata),
        result.timestamp
      );

      logger.info('   💾 Enhanced detection result stored in database');

    } catch (error: any) {
      logger.warn('Could not store enhanced detection result:', error.message);
    }
  }

  /**
   * Log enhanced detection result with comprehensive information
   */
  private logEnhancedDetectionResult(result: ModelDetectionResult, executionTime: number): void {
    logger.info('🎯 ENHANCED MODEL DETECTION COMPLETE:');
    logger.info(`   🤖 Model: ${result.detectedModel} (${result.modelProvider})`);
    logger.info(`   👤 Agent: ${result.agentLetter} - ${result.agentRole}`);
    logger.info(`   🌐 Endpoint: ${result.actualEndpoint}`);
    logger.info(`   📚 Context: ${result.capabilities.context} tokens`);
    logger.info(`   ✅ Verified: ${result.verified ? 'YES' : 'NO'} (${(result.confidence * 100).toFixed(0)}% confidence)`);
    logger.info(`   📄 Config: ${result.configSource} (${result.detectionMethod})`);
    logger.info(`   🧠 Self-Correction: ${result.selfCorrection?.correctionApplied ? 'APPLIED' : 'NOT NEEDED'}`);
    logger.info(`   ⏱️  Execution Time: ${executionTime}ms`);
    logger.info(`   🆔 Detection ID: ${result.loopIntegration.eventId}`);

    if (result.selfCorrection?.correctionApplied) {
      logger.info(`   🔄 Correction: ${result.selfCorrection.originalModel} → ${result.selfCorrection.correctedModel}`);
      logger.info(`   📋 Reason: ${result.selfCorrection.correctionReason}`);
    }

    // Log capabilities
    const caps = result.capabilities;
    logger.info(`   🎯 Capabilities: ${caps.reasoning} reasoning, ${caps.coding} coding, ${caps.multimodal ? 'multimodal' : 'text-only'}`);
  }

  /**
   * Create enhanced fallback detection when all methods fail
   */
  private async createFallbackDetection(
    error: any,
    detectionId: string,
    sessionId?: string
  ): Promise<ModelDetectionResult> {
    logger.warn('Using enhanced fallback detection due to error:', error.message);

    const fallbackResult: ModelDetectionResult = {
      detectedModel: 'unknown',
      modelProvider: 'unknown',
      actualEndpoint: 'unknown',
      contextWindow: 200000,
      configSource: 'fallback-error',
      configPath: 'none',
      detectionMethod: 'enhanced-fallback',
      confidence: 0.1, // Very low confidence for fallback
      verified: false,
      agentLetter: 'B',
      agentRole: 'Unknown (fallback)',
      capabilities: {
        reasoning: 'basic',
        coding: 'basic',
        context: '200K',
        multimodal: false,
        toolUse: false
      },
      timestamp: new Date().toISOString(),
      metadata: {
        error: error.message,
        fallbackReason: 'Enhanced detection system failed',
        detectionId,
        detectionCount: this.detectionCount,
        originalError: error.stack || error.message
      },
      loopIntegration: {
        loopId: 'model-detection',
        sessionId: sessionId || 'unknown',
        eventId: detectionId
      }
    };

    logger.warn('   ⚠️  Enhanced fallback detection created');
    return fallbackResult;
  }

  /**
   * Get system statistics and health metrics
   */
  getSystemStats(): {
    totalDetections: number;
    avgConfidence: number;
    accuracyRate: number;
    topModels: Array<{ model: string; count: number }>;
    selfCorrectionStats: any;
    systemHealth: 'healthy' | 'degraded' | 'critical';
  } {
    try {
      // Get total detections and average confidence
      const stats = this.db.prepare(`
        SELECT COUNT(*) as total,
               AVG(confidence) as avg_confidence,
               AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as accuracy_rate
        FROM enhanced_model_detections
        WHERE timestamp > datetime('now', '-24 hours')
      `).get() as any;

      // Get top detected models
      const topModels = this.db.prepare(`
        SELECT detected_model, COUNT(*) as count
        FROM enhanced_model_detections
        WHERE timestamp > datetime('now', '-24 hours')
        GROUP BY detected_model
        ORDER BY count DESC
        LIMIT 5
      `).all() as Array<{ detected_model: string; count: number }>;

      // Get self-correction stats
      const selfCorrectionStats = this.selfCorrection.getCorrectionStats();

      // Determine system health
      let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';

      if (stats.avg_confidence < 0.7 || stats.accuracy_rate < 0.8) {
        systemHealth = 'degraded';
      }

      if (stats.avg_confidence < 0.5 || stats.accuracy_rate < 0.6) {
        systemHealth = 'critical';
      }

      return {
        totalDetections: stats.total || 0,
        avgConfidence: stats.avg_confidence || 0,
        accuracyRate: stats.accuracy_rate || 0,
        topModels: topModels.map(m => ({ model: m.detected_model, count: m.count })),
        selfCorrectionStats,
        systemHealth
      };

    } catch (error: any) {
      logger.error('Failed to get system stats:', error);
      return {
        totalDetections: this.detectionCount,
        avgConfidence: 0,
        accuracyRate: 0,
        topModels: [],
        selfCorrectionStats: { totalCorrections: 0, accuracyImprovement: 0 },
        systemHealth: 'critical'
      };
    }
  }

  /**
   * Provide user feedback for learning (integrated with self-correction)
   */
  async provideFeedback(
    detectionId: string,
    actualModel: string,
    userConfirmed: boolean,
    context: string = 'user-feedback'
  ): Promise<void> {
    try {
      // Get the original detection
      const detection = this.db.prepare(`
        SELECT * FROM enhanced_model_detections WHERE id = ?
      `).get(detectionId) as any;

      if (!detection) {
        logger.warn(`Detection not found for feedback: ${detectionId}`);
        return;
      }

      const detectedModel = detection.detected_model;

      // Create detection result for feedback
      const detectionResult: ModelDetectionResult = {
        detectedModel,
        modelProvider: detection.provider,
        actualEndpoint: detection.endpoint,
        contextWindow: detection.context_window,
        configSource: detection.config_source,
        configPath: detection.config_path,
        detectionMethod: detection.detection_method,
        confidence: detection.confidence,
        verified: detection.verified === 1,
        agentLetter: detection.agent_letter,
        agentRole: detection.agent_role,
        capabilities: JSON.parse(detection.capabilities),
        timestamp: detection.timestamp,
        metadata: JSON.parse(detection.metadata),
        loopIntegration: JSON.parse(detection.loop_integration)
      };

      // Send feedback to self-correction system
      await this.selfCorrection.learnFromFeedback(
        detectedModel,
        actualModel,
        userConfirmed,
        detectionResult,
        context
      );

      logger.info(`📚 Feedback processed for ${detectionId}: ${detectedModel} → ${actualModel} (confirmed: ${userConfirmed})`);

    } catch (error: any) {
      logger.error('Failed to process feedback:', error);
    }
  }

  /**
   * Export detection data for analysis
   */
  exportDetectionData(hours: number = 24): {
    detections: any[];
    corrections: any[];
    feedback: any[];
    summary: any;
  } {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Get detections
      const detections = this.db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE timestamp > ?
        ORDER BY timestamp DESC
      `).all(cutoff);

      // Get corrections
      const corrections = this.db.prepare(`
        SELECT * FROM detection_corrections
        WHERE timestamp > ?
        ORDER BY timestamp DESC
      `).all(cutoff);

      // Get feedback
      const feedback = this.db.prepare(`
        SELECT * FROM user_feedback
        WHERE timestamp > ?
        ORDER BY timestamp DESC
      `).all(cutoff);

      // Generate summary
      const summary = this.getSystemStats();

      return {
        detections,
        corrections,
        feedback,
        summary
      };

    } catch (error: any) {
      logger.error('Failed to export detection data:', error);
      return {
        detections: [],
        corrections: [],
        feedback: [],
        summary: {}
      };
    }
  }
}