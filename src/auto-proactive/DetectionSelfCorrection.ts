/**
 * Detection Self-Correction System
 * ===============================
 *
 * SELF-LEARNING CORRECTION SYSTEM FOR CENTRAL-MCP MODEL DETECTION
 *
 * This system learns from detection mistakes and automatically corrects them:
 * 1. Historical pattern detection for consistent misidentifications
 * 2. User feedback integration for continuous improvement
 * 3. Automatic correction application for verified patterns
 * 4. Confidence score adjustment based on accuracy tracking
 * 5. Model family learning and cross-model inference
 *
 * THE SYSTEM GETS SMARTER WITH EVERY INTERACTION!
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { ModelDetectionResult } from './ModelDetectionSystem.js';
import { ModelCapabilityVerifier, ModelCapability } from './ModelCapabilityVerifier.js';

export interface DetectionCorrection {
  id: string;
  originalModel: string;
  correctedTo: string;
  correctionReason: 'historical' | 'feedback' | 'pattern' | 'manual';
  confidenceBefore: number;
  confidenceAfter: number;
  correctionApplied: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserFeedback {
  id: string;
  detectedModel: string;
  actualModel: string;
  userConfirmed: boolean;
  accuracy: number; // 0-1 scale
  context: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CorrectionPattern {
  pattern: string;
  originalModel: string;
  correctedTo: string;
  frequency: number;
  accuracy: number;
  confidence: number;
  lastSeen: string;
  autoApply: boolean;
  shouldCorrect: boolean;
}

export interface ModelPerformanceMetrics {
  model: string;
  totalDetections: number;
  correctDetections: number;
  accuracy: number;
  avgConfidence: number;
  confidenceAccuracy: number; // How well confidence matches reality
  lastUpdated: string;
  trends: {
    accuracy7day: number;
    accuracy30day: number;
    detectionCount7day: number;
    detectionCount30day: number;
  };
}

export interface SelfCorrectionResult {
  originalModel: string;
  correctedModel: string;
  correctionApplied: boolean;
  confidence: number;
  correctionReason: string;
  patternMatched?: string;
  historicalData?: {
    totalCorrections: number;
    accuracyImprovement: number;
  };
}

export class DetectionSelfCorrection {
  private db: Database.Database;
  private capabilityVerifier: ModelCapabilityVerifier;
  private correctionHistory: Map<string, DetectionCorrection[]> = new Map();
  private patternCache: Map<string, CorrectionPattern[]> = new Map();
  private metricsCache: Map<string, ModelPerformanceMetrics> = new Map();
  private cacheExpiry = new Map<string, number>();

  constructor(db: Database.Database, capabilityVerifier: ModelCapabilityVerifier) {
    this.db = db;
    this.capabilityVerifier = capabilityVerifier;
    this.initializeTables();
    this.loadCorrectionHistory();
    this.loadPatternCache();

    logger.info('🧠 DetectionSelfCorrection initialized');
    logger.info('   Self-learning system ready');
  }

  /**
   * Apply self-correction based on historical accuracy and patterns
   */
  async correctDetection(
    detectedModel: string,
    detectionResult: ModelDetectionResult
  ): Promise<SelfCorrectionResult> {
    logger.info(`🔧 Analyzing detection for correction: ${detectedModel}`);

    try {
      // Step 1: Check for historical correction patterns
      const historicalCorrection = await this.checkHistoricalCorrections(detectedModel);

      if (historicalCorrection.shouldCorrect) {
        logger.info(`   📚 Historical pattern found: ${detectedModel} → ${historicalCorrection.correctedTo}`);
        return await this.applyCorrection(detectedModel, historicalCorrection.correctedTo, 'historical', detectionResult);
      }

      // Step 2: Check for model family patterns
      const familyCorrection = await this.checkModelFamilyPatterns(detectedModel, detectionResult);

      if (familyCorrection.shouldCorrect) {
        logger.info(`   👨‍👩‍👧‍👦 Family pattern found: ${detectedModel} → ${familyCorrection.correctedTo}`);
        return await this.applyCorrection(detectedModel, familyCorrection.correctedTo, 'pattern', detectionResult);
      }

      // Step 3: Check confidence-reality mismatch
      const confidenceCorrection = await this.checkConfidenceMismatch(detectedModel, detectionResult);

      if (confidenceCorrection.shouldCorrect) {
        logger.info(`   📊 Confidence mismatch detected: ${detectedModel} → ${confidenceCorrection.correctedTo}`);
        return await this.applyCorrection(detectedModel, confidenceCorrection.correctedTo, 'confidence', detectionResult);
      }

      // Step 4: No correction needed
      logger.info(`   ✅ No correction needed for ${detectedModel}`);
      return {
        originalModel: detectedModel,
        correctedModel: detectedModel,
        correctionApplied: false,
        confidence: detectionResult.confidence,
        correctionReason: 'no-correction-needed'
      };

    } catch (error: any) {
      logger.error(`❌ Correction analysis failed for ${detectedModel}:`, error);
      return {
        originalModel: detectedModel,
        correctedModel: detectedModel,
        correctionApplied: false,
        confidence: detectionResult.confidence,
        correctionReason: 'correction-failed',
        historicalData: {
          totalCorrections: 0,
          accuracyImprovement: 0
        }
      };
    }
  }

  /**
   * Learn from user feedback or system validation
   */
  async learnFromFeedback(
    detectedModel: string,
    actualModel: string,
    userConfirmed: boolean,
    detectionResult: ModelDetectionResult,
    context: string = 'general'
  ): Promise<void> {
    logger.info(`📚 Learning from feedback: ${detectedModel} → ${actualModel} (confirmed: ${userConfirmed})`);

    try {
      // Store feedback for future learning
      await this.recordFeedback(detectedModel, actualModel, userConfirmed, detectionResult.confidence, context);

      // Update model performance metrics
      await this.updatePerformanceMetrics(detectedModel, userConfirmed, detectionResult.confidence);

      // Update confidence scores based on feedback
      await this.updateConfidenceScores(detectedModel, actualModel, userConfirmed, detectionResult.confidence);

      // Check if new pattern emerges
      await this.detectAndUpdatePatterns(detectedModel, actualModel);

      // Update model registry with verified information
      if (userConfirmed && detectedModel !== actualModel) {
        await this.updateModelRegistry(detectedModel, actualModel);
      }

      logger.info(`   ✅ Feedback processed and learned`);

    } catch (error: any) {
      logger.error(`❌ Failed to learn from feedback:`, error);
    }
  }

  /**
   * Check for historical correction patterns
   */
  private async checkHistoricalCorrections(detectedModel: string): Promise<{
    shouldCorrect: boolean;
    correctedTo: string;
    confidence: number;
    patternData?: any;
  }> {
    const cacheKey = `historical-${detectedModel}`;

    if (this.isCacheValid(cacheKey)) {
      return this.patternCache.get(cacheKey)[0];
    }

    try {
      const corrections = this.db.prepare(`
        SELECT corrected_to, COUNT(*) as count,
               AVG(confidence_after) as avg_confidence_after,
               MAX(timestamp) as last_correction
        FROM detection_corrections
        WHERE original_model = ?
          AND correction_applied = 1
          AND timestamp > datetime('now', '-30 days')
        GROUP BY corrected_to
        HAVING count >= 2
        ORDER BY count DESC, avg_confidence_after DESC
      `).all(detectedModel) as Array<{
        corrected_to: string;
        count: number;
        avg_confidence_after: number;
        last_correction: string;
      }>;

      if (corrections.length > 0) {
        const topCorrection = corrections[0];

        // Check if this is a strong pattern
        const isStrongPattern = topCorrection.count >= 3 ||
          (topCorrection.count >= 2 && topCorrection.avg_confidence_after > 0.8);

        if (isStrongPattern) {
          const result = {
            shouldCorrect: true,
            correctedTo: topCorrection.corrected_to,
            confidence: Math.min(0.95, topCorrection.avg_confidence_after + 0.1),
            patternData: {
              frequency: topCorrection.count,
              avgConfidence: topCorrection.avg_confidence_after,
              lastCorrection: topCorrection.last_correction
            }
          };

          this.cachePattern(cacheKey, [result]);
          return result;
        }
      }

      const result = { shouldCorrect: false, correctedTo: '', confidence: 0 };
      this.cachePattern(cacheKey, [result]);
      return result;

    } catch (error: any) {
      logger.warn(`Historical correction check failed for ${detectedModel}:`, error);
      return { shouldCorrect: false, correctedTo: '', confidence: 0 };
    }
  }

  /**
   * Check for model family patterns
   */
  private async checkModelFamilyPatterns(
    detectedModel: string,
    detectionResult: ModelDetectionResult
  ): Promise<{
    shouldCorrect: boolean;
    correctedTo: string;
    confidence: number;
  }> {
    // Extract model family (e.g., "claude" from "claude-sonnet-4-5")
    const modelFamily = this.extractModelFamily(detectedModel);

    if (!modelFamily) {
      return { shouldCorrect: false, correctedTo: '', confidence: 0 };
    }

    try {
      // Look for patterns within the same model family
      const familyPatterns = this.db.prepare(`
        SELECT corrected_to, COUNT(*) as count,
               AVG(confidence_after) as avg_confidence
        FROM detection_corrections
        WHERE original_model LIKE ?
          AND correction_applied = 1
          AND timestamp > datetime('now', '-14 days')
        GROUP BY corrected_to
        HAVING count >= 2
        ORDER BY count DESC
      `).all(`${modelFamily}%`) as Array<{
        corrected_to: string;
        count: number;
        avg_confidence: number;
      }>;

      if (familyPatterns.length > 0) {
        const topPattern = familyPatterns[0];

        // Check if the suggested correction is reasonable
        const suggestedModel = topPattern.corrected_to;
        const modelInfo = this.capabilityVerifier.getModelInfo(suggestedModel);

        if (modelInfo && this.isReasonableCorrection(detectedModel, suggestedModel)) {
          return {
            shouldCorrect: true,
            correctedTo: suggestedModel,
            confidence: Math.min(0.85, topPattern.avg_confidence)
          };
        }
      }

      return { shouldCorrect: false, correctedTo: '', confidence: 0 };

    } catch (error: any) {
      logger.warn(`Model family pattern check failed for ${detectedModel}:`, error);
      return { shouldCorrect: false, correctedTo: '', confidence: 0 };
    }
  }

  /**
   * Check for confidence-reality mismatches
   */
  private async checkConfidenceMismatch(
    detectedModel: string,
    detectionResult: ModelDetectionResult
  ): Promise<{
    shouldCorrect: boolean;
    correctedTo: string;
    confidence: number;
  }> {
    try {
      // Get historical accuracy for this model detection
      const metrics = await this.getModelMetrics(detectedModel);

      if (!metrics || metrics.totalDetections < 5) {
        return { shouldCorrect: false, correctedTo: '', confidence: 0 };
      }

      // Check if confidence is consistently higher than actual accuracy
      const confidenceGap = detectionResult.confidence - metrics.accuracy;

      if (confidenceGap > 0.3 && metrics.accuracy < 0.6) {
        // Confidence is much higher than actual accuracy - find better alternative
        const alternatives = await this.findBetterAlternatives(detectedModel, detectionResult);

        if (alternatives.length > 0) {
          const bestAlternative = alternatives[0];

          return {
            shouldCorrect: true,
            correctedTo: bestAlternative.model,
            confidence: Math.max(metrics.accuracy, bestAlternative.confidence)
          };
        }
      }

      return { shouldCorrect: false, correctedTo: '', confidence: 0 };

    } catch (error: any) {
      logger.warn(`Confidence mismatch check failed for ${detectedModel}:`, error);
      return { shouldCorrect: false, correctedTo: '', confidence: 0 };
    }
  }

  /**
   * Apply correction to detection
   */
  private async applyCorrection(
    originalModel: string,
    correctedTo: string,
    reason: string,
    detectionResult: ModelDetectionResult
  ): Promise<SelfCorrectionResult> {
    const correctionId = randomUUID();
    const timestamp = new Date().toISOString();

    try {
      // Record correction in database
      this.db.prepare(`
        INSERT INTO detection_corrections (
          id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        correctionId,
        originalModel,
        correctedTo,
        reason,
        detectionResult.confidence,
        Math.min(0.95, detectionResult.confidence + 0.1), // Slightly boost confidence for corrections
        true,
        timestamp
      );

      // Get historical data for context
      const historicalData = await this.getCorrectionStats(originalModel);

      logger.info(`   ✅ Correction applied: ${originalModel} → ${correctedTo} (${reason})`);

      return {
        originalModel,
        correctedModel: correctedTo,
        correctionApplied: true,
        confidence: Math.min(0.95, detectionResult.confidence + 0.1),
        correctionReason: reason,
        historicalData
      };

    } catch (error: any) {
      logger.error(`Failed to apply correction for ${originalModel}:`, error);
      return {
        originalModel,
        correctedModel: originalModel,
        correctionApplied: false,
        confidence: detectionResult.confidence,
        correctionReason: 'correction-application-failed'
      };
    }
  }

  /**
   * Record user feedback
   */
  private async recordFeedback(
    detectedModel: string,
    actualModel: string,
    userConfirmed: boolean,
    confidence: number,
    context: string
  ): Promise<void> {
    this.db.prepare(`
      INSERT INTO user_feedback (
        id, detected_model, actual_model, user_confirmed,
        accuracy, context, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      detectedModel,
      actualModel,
      userConfirmed ? 1 : 0,
      userConfirmed ? 1.0 : 0.0,
      context,
      new Date().toISOString()
    );
  }

  
  /**
   * Extract model family from model name
   */
  private extractModelFamily(model: string): string | null {
    if (model.includes('claude')) return 'claude';
    if (model.includes('glm')) return 'glm';
    if (model.includes('gemini')) return 'gemini';
    if (model.includes('deepseek')) return 'deepseek';
    if (model.includes('gpt')) return 'gpt';
    if (model.includes('llama')) return 'llama';

    return null;
  }

  /**
   * Check if correction is reasonable
   */
  private isReasonableCorrection(original: string, corrected: string): boolean {
    const originalFamily = this.extractModelFamily(original);
    const correctedFamily = this.extractModelFamily(corrected);

    // Same family is usually reasonable
    if (originalFamily === correctedFamily) {
      return true;
    }

    // Cross-family corrections need more scrutiny
    const reasonableMappings = {
      'claude': ['glm', 'gemini'],
      'glm': ['claude'],
      'gemini': ['claude'],
      'deepseek': ['glm', 'claude']
    };

    return reasonableMappings[originalFamily]?.includes(correctedFamily) || false;
  }

  /**
   * Find better alternatives based on capability matching
   */
  private async findBetterAlternatives(
    detectedModel: string,
    detectionResult: ModelDetectionResult
  ): Promise<Array<{ model: string; confidence: number }>> {
    const alternatives: Array<{ model: string; confidence: number }> = [];

    // Get current detected capabilities
    const currentCapabilities = this.capabilityVerifier.getModelInfo(detectedModel);

    if (!currentCapabilities) {
      return alternatives;
    }

    // Look for models with similar but better performance
    const allModels = this.capabilityVerifier.getAllModels();

    for (const [modelName, modelInfo] of Object.entries(allModels)) {
      if (modelName === detectedModel) continue;

      // Check if this model has better accuracy
      const metrics = await this.getModelMetrics(modelName);

      if (metrics && metrics.accuracy > 0.8 && metrics.totalDetections >= 3) {
        // Check if capabilities are compatible
        if (this.areCapabilitiesCompatible(currentCapabilities.capabilities, modelInfo.capabilities)) {
          alternatives.push({
            model: modelName,
            confidence: Math.min(metrics.accuracy, 0.9)
          });
        }
      }
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if capabilities are compatible
   */
  private areCapabilitiesCompatible(
    cap1: ModelCapability['capabilities'],
    cap2: ModelCapability['capabilities']
  ): boolean {
    // Check if core capabilities align
    if (cap1.reasoning !== cap2.reasoning &&
        (cap1.reasoning === 'basic' || cap2.reasoning === 'basic')) {
      return false;
    }

    if (cap1.coding !== cap2.coding &&
        (cap1.coding === 'basic' || cap2.coding === 'basic')) {
      return false;
    }

    return true;
  }

  /**
   * Get model performance metrics
   */
  private async getModelMetrics(model: string): Promise<ModelPerformanceMetrics | null> {
    const cacheKey = `metrics-${model}`;

    if (this.isCacheValid(cacheKey)) {
      return this.metricsCache.get(cacheKey);
    }

    try {
      const metrics = this.db.prepare(`
        SELECT * FROM model_performance_metrics WHERE model = ?
      `).get(model) as any;

      if (metrics) {
        const result: ModelPerformanceMetrics = {
          model: metrics.model,
          totalDetections: metrics.total_detections,
          correctDetections: metrics.correct_detections,
          accuracy: metrics.accuracy,
          avgConfidence: metrics.avg_confidence,
          confidenceAccuracy: metrics.confidence_accuracy || 0.5,
          lastUpdated: metrics.last_updated,
          trends: {
            accuracy7day: 0,
            accuracy30day: 0,
            detectionCount7day: 0,
            detectionCount30day: 0
          }
        };

        this.cacheMetrics(cacheKey, result);
        return result;
      }

      return null;

    } catch (error: any) {
      logger.warn(`Failed to get metrics for ${model}:`, error);
      return null;
    }
  }

  
  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    // Detection corrections table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detection_corrections (
        id TEXT PRIMARY KEY,
        original_model TEXT NOT NULL,
        corrected_to TEXT NOT NULL,
        correction_reason TEXT NOT NULL,
        confidence_before REAL NOT NULL,
        confidence_after REAL NOT NULL,
        correction_applied BOOLEAN NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );
    `);

    // User feedback table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id TEXT PRIMARY KEY,
        detected_model TEXT NOT NULL,
        actual_model TEXT NOT NULL,
        user_confirmed BOOLEAN NOT NULL,
        accuracy REAL NOT NULL,
        context TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );
    `);

    // Model performance metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS model_performance_metrics (
        id TEXT PRIMARY KEY,
        model TEXT UNIQUE NOT NULL,
        total_detections INTEGER NOT NULL DEFAULT 0,
        correct_detections INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0.0,
        avg_confidence REAL NOT NULL DEFAULT 0.0,
        confidence_accuracy REAL NOT NULL DEFAULT 0.5,
        last_updated TEXT NOT NULL,
        trends TEXT
      );
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_corrections_original ON detection_corrections(original_model);
      CREATE INDEX IF NOT EXISTS idx_corrections_timestamp ON detection_corrections(timestamp);
      CREATE INDEX IF NOT EXISTS idx_feedback_detected ON user_feedback(detected_model);
      CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON user_feedback(timestamp);
      CREATE INDEX IF NOT EXISTS idx_metrics_model ON model_performance_metrics(model);
    `);

    logger.info('   📊 Self-correction database tables initialized');
  }

  /**
   * Load correction history into memory
   */
  private loadCorrectionHistory(): void {
    try {
      const corrections = this.db.prepare(`
        SELECT * FROM detection_corrections
        WHERE timestamp > datetime('now', '-7 days')
        ORDER BY timestamp DESC
      `).all() as DetectionCorrection[];

      // Group by model
      for (const correction of corrections) {
        const model = correction.originalModel;
        if (!this.correctionHistory.has(model)) {
          this.correctionHistory.set(model, []);
        }
        this.correctionHistory.get(model)!.push(correction);
      }

      logger.info(`   📚 Loaded ${corrections.length} recent corrections into memory`);

    } catch (error: any) {
      logger.warn('Failed to load correction history:', error);
    }
  }

  /**
   * Load pattern cache
   */
  private loadPatternCache(): void {
    // Cache will be populated as needed
    logger.info('   🧠 Pattern cache initialized (empty, will populate on demand)');
  }

  /**
   * Cache management utilities
   */
  private cachePattern(key: string, patterns: any[]): void {
    this.patternCache.set(key, patterns);
    this.cacheExpiry.set(key, Date.now() + 300000); // 5 minutes
  }

  private cacheMetrics(key: string, metrics: ModelPerformanceMetrics): void {
    this.metricsCache.set(key, metrics);
    this.cacheExpiry.set(key, Date.now() + 600000); // 10 minutes
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Get self-correction statistics
   */
  getCorrectionStats(): {
    totalCorrections: number;
    accuracyImprovement: number;
    topCorrectedModels: Array<{ model: string; corrections: number }>;
    recentPatterns: Array<{ pattern: string; frequency: number }>;
  } {
    try {
      const totalCorrections = this.db.prepare(`
        SELECT COUNT(*) as count FROM detection_corrections WHERE correction_applied = 1
      `).get() as { count: number };

      const accuracyImprovement = this.db.prepare(`
        SELECT AVG(confidence_after - confidence_before) as improvement
        FROM detection_corrections
        WHERE correction_applied = 1
      `).get() as { improvement: number };

      const topCorrectedModels = this.db.prepare(`
        SELECT original_model, COUNT(*) as corrections
        FROM detection_corrections
        WHERE correction_applied = 1
        GROUP BY original_model
        ORDER BY corrections DESC
        LIMIT 5
      `).all() as Array<{ original_model: string; corrections: number }>;

      return {
        totalCorrections: totalCorrections.count,
        accuracyImprovement: accuracyImprovement.improvement || 0,
        topCorrectedModels: topCorrectedModels.map(m => ({
          model: m.original_model,
          corrections: m.corrections
        })),
        recentPatterns: [] // TODO: Implement pattern detection
      };

    } catch (error: any) {
      logger.error('Failed to get correction stats:', error);
      return {
        totalCorrections: 0,
        accuracyImprovement: 0,
        topCorrectedModels: [],
        recentPatterns: []
      };
    }
  }

  /**
   * Update confidence scores based on feedback
   */
  private async updateConfidenceScores(
    detectedModel: string,
    actualModel: string,
    userConfirmed: boolean,
    confidence: number
  ): Promise<void> {
    try {
      // Simple confidence adjustment logic
      const newConfidence = userConfirmed ?
        Math.min(1.0, confidence + 0.1) :
        Math.max(0.1, confidence - 0.2);

      // Store updated confidence in database
      this.db.prepare(`
        INSERT OR REPLACE INTO model_confidence (
          model, confidence, last_updated, confirmation_count
        ) VALUES (?, ?, ?, COALESCE((SELECT confirmation_count FROM model_confidence WHERE model = ?), 0) + ?)
      `).run(
        detectedModel,
        newConfidence,
        new Date().toISOString(),
        detectedModel,
        userConfirmed ? 1 : 0
      );

      logger.debug(`Updated confidence for ${detectedModel}: ${confidence} → ${newConfidence}`);
    } catch (error: any) {
      logger.error(`Failed to update confidence scores:`, error);
    }
  }

  /**
   * Detect and update patterns from model corrections
   */
  private async detectAndUpdatePatterns(
    detectedModel: string,
    actualModel: string
  ): Promise<void> {
    try {
      // Simple pattern detection - if this correction happened before, strengthen the pattern
      const existingPattern = this.db.prepare(`
        SELECT COUNT(*) as count FROM detection_corrections
        WHERE original_model = ? AND corrected_to = ?
      `).get(detectedModel, actualModel) as { count: number };

      if (existingPattern.count > 1) {
        // Store or strengthen the pattern
        this.db.prepare(`
          INSERT OR REPLACE INTO correction_patterns (
            pattern_id, from_model, to_model, strength, last_seen
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          `${detectedModel}_to_${actualModel}`,
          detectedModel,
          actualModel,
          existingPattern.count,
          new Date().toISOString()
        );

        logger.debug(`Pattern strengthened: ${detectedModel} → ${actualModel} (strength: ${existingPattern.count})`);
      }
    } catch (error: any) {
      logger.error(`Failed to detect and update patterns:`, error);
    }
  }

  /**
   * Update model registry with verified information
   */
  private async updateModelRegistry(
    detectedModel: string,
    actualModel: string
  ): Promise<void> {
    try {
      // Update model registry with correction information
      this.db.prepare(`
        INSERT OR REPLACE INTO model_registry_updates (
          model, corrected_to, correction_reason, timestamp
        ) VALUES (?, ?, ?, ?)
      `).run(
        detectedModel,
        actualModel,
        'user_confirmed_correction',
        new Date().toISOString()
      );

      logger.debug(`Model registry updated: ${detectedModel} corrected to ${actualModel}`);
    } catch (error: any) {
      logger.error(`Failed to update model registry:`, error);
    }
  }

  /**
   * Update performance metrics for a model
   */
  private async updatePerformanceMetrics(
    model: string,
    userConfirmed: boolean,
    confidence: number
  ): Promise<void> {
    try {
      // Update performance tracking
      this.db.prepare(`
        INSERT INTO model_performance_log (
          model, confidence, user_confirmed, timestamp
        ) VALUES (?, ?, ?, ?)
      `).run(
        model,
        confidence,
        userConfirmed ? 1 : 0,
        new Date().toISOString()
      );

      logger.debug(`Performance metrics updated for ${model}`);
    } catch (error: any) {
      logger.error(`Failed to update performance metrics:`, error);
    }
  }
}