/**
 * Detection Self-Correction Unit Tests
 * ====================================
 *
 * Comprehensive unit tests for the self-learning correction system.
 * Tests historical pattern detection, user feedback integration,
 * automatic correction application, and confidence adjustment.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import Database from 'better-sqlite3';
import { DetectionSelfCorrection, SelfCorrectionResult } from '../../../src/auto-proactive/DetectionSelfCorrection.js';
import { ModelCapabilityVerifier } from '../../../src/auto-proactive/ModelCapabilityVerifier.js';
import { ModelDetectionResult } from '../../../src/auto-proactive/ModelDetectionSystem.js';

// Mock dependencies
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('DetectionSelfCorrection', () => {
  let selfCorrection: DetectionSelfCorrection;
  let capabilityVerifier: ModelCapabilityVerifier;
  let db: Database.Database;
  let mockCapabilityVerifier: any;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Initialize schema
    db.exec(`
      CREATE TABLE detection_corrections (
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

      CREATE TABLE user_feedback (
        id TEXT PRIMARY KEY,
        detected_model TEXT NOT NULL,
        actual_model TEXT NOT NULL,
        user_confirmed BOOLEAN NOT NULL,
        accuracy REAL NOT NULL,
        context TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE model_performance_metrics (
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

      CREATE INDEX idx_corrections_original ON detection_corrections(original_model);
      CREATE INDEX idx_corrections_timestamp ON detection_corrections(timestamp);
      CREATE INDEX idx_feedback_detected ON user_feedback(detected_model);
      CREATE INDEX idx_feedback_timestamp ON user_feedback(timestamp);
      CREATE INDEX idx_metrics_model ON model_performance_metrics(model);
    `);

    // Mock ModelCapabilityVerifier
    mockCapabilityVerifier = {
      getModelInfo: vi.fn(),
      getAllModels: vi.fn(),
      getAgentMapping: vi.fn()
    };

    capabilityVerifier = mockCapabilityVerifier as any;
    selfCorrection = new DetectionSelfCorrection(db, capabilityVerifier);

    vi.clearAllMocks();
  });

  afterEach(() => {
    db.close();
    vi.restoreAllMocks();
  });

  describe('correctDetection', () => {
    it('should apply historical correction when pattern exists', async () => {
      // Setup historical corrections
      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-id-1',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.7,
        0.9,
        1,
        new Date(Date.now() - 1000000).toISOString()
      );

      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-id-2',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.6,
        0.85,
        1,
        new Date(Date.now() - 2000000).toISOString()
      );

      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.7,
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      const result = await selfCorrection.correctDetection('glm-4.6', detectionResult);

      expect(result.correctionApplied).toBe(true);
      expect(result.originalModel).toBe('glm-4.6');
      expect(result.correctedModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.correctionReason).toBe('historical');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should not apply correction when no historical pattern exists', async () => {
      const detectionResult: ModelDetectionResult = {
        detectedModel: 'claude-sonnet-4-5-20250929',
        modelProvider: 'anthropic',
        actualEndpoint: 'https://api.anthropic.com',
        contextWindow: 200000,
        configSource: 'settings.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.9,
        verified: true,
        agentLetter: 'B',
        agentRole: 'Design & Architecture Specialist',
        capabilities: {
          reasoning: 'expert',
          coding: 'expert',
          context: '200K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      const result = await selfCorrection.correctDetection('claude-sonnet-4-5-20250929', detectionResult);

      expect(result.correctionApplied).toBe(false);
      expect(result.originalModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.correctedModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.correctionReason).toBe('no-correction-needed');
    });

    it('should apply family pattern corrections', async () => {
      // Setup family pattern corrections
      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-id-3',
        'claude-sonnet-4-v1',
        'claude-sonnet-4-5-20250929',
        'pattern',
        0.6,
        0.85,
        1,
        new Date(Date.now() - 500000).toISOString()
      );

      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-id-4',
        'claude-sonnet-4-v2',
        'claude-sonnet-4-5-20250929',
        'pattern',
        0.65,
        0.88,
        1,
        new Date(Date.now() - 400000).toISOString()
      );

      const detectionResult: ModelDetectionResult = {
        detectedModel: 'claude-sonnet-4-v3',
        modelProvider: 'anthropic',
        actualEndpoint: 'https://api.anthropic.com',
        contextWindow: 200000,
        configSource: 'settings.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.7,
        verified: true,
        agentLetter: 'B',
        agentRole: 'Design & Architecture Specialist',
        capabilities: {
          reasoning: 'expert',
          coding: 'expert',
          context: '200K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      const result = await selfCorrection.correctDetection('claude-sonnet-4-v3', detectionResult);

      expect(result.correctionApplied).toBe(true);
      expect(result.originalModel).toBe('claude-sonnet-4-v3');
      expect(result.correctedModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.correctionReason).toBe('pattern');
    });

    it('should apply confidence mismatch corrections', async () => {
      // Setup performance metrics showing poor accuracy
      db.prepare(`
        INSERT INTO model_performance_metrics (id, model, total_detections, correct_detections,
          accuracy, avg_confidence, confidence_accuracy, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-metrics-1',
        'glm-4.6',
        10,
        3,
        0.3, // 30% accuracy
        0.9,  // 90% confidence
        0.4,  // Poor confidence accuracy
        new Date().toISOString()
      );

      // Mock model info for alternatives
      mockCapabilityVerifier.getModelInfo.mockImplementation((model: string) => {
        if (model === 'claude-sonnet-4-5-20250929') {
          return {
            model: 'claude-sonnet-4-5-20250929',
            capabilities: { reasoning: 'expert', coding: 'expert' },
            agentMapping: { letter: 'B', confidence: 0.95 }
          };
        }
        return null;
      });

      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.9, // High confidence but poor accuracy
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      const result = await selfCorrection.correctDetection('glm-4.6', detectionResult);

      expect(result.correctionApplied).toBe(true);
      expect(result.correctionReason).toBe('confidence');
    });
  });

  describe('learnFromFeedback', () => {
    it('should record user feedback correctly', async () => {
      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.7,
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      await selfCorrection.learnFromFeedback(
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        false, // User did not confirm
        detectionResult,
        'user-testing'
      );

      // Check feedback was recorded
      const feedback = db.prepare('SELECT * FROM user_feedback').get() as any;
      expect(feedback).not.toBeNull();
      expect(feedback.detected_model).toBe('glm-4.6');
      expect(feedback.actual_model).toBe('claude-sonnet-4-5-20250929');
      expect(feedback.user_confirmed).toBe(0);
      expect(feedback.accuracy).toBe(0.0);
      expect(feedback.context).toBe('user-testing');

      // Check performance metrics were updated
      const metrics = db.prepare('SELECT * FROM model_performance_metrics WHERE model = ?').get('glm-4.6') as any;
      expect(metrics).not.toBeNull();
      expect(metrics.total_detections).toBe(1);
      expect(metrics.correct_detections).toBe(0);
      expect(metrics.accuracy).toBe(0.0);
    });

    it('should update performance metrics for confirmed detections', async () => {
      const detectionResult: ModelDetectionResult = {
        detectedModel: 'claude-sonnet-4-5-20250929',
        modelProvider: 'anthropic',
        actualEndpoint: 'https://api.anthropic.com',
        contextWindow: 200000,
        configSource: 'settings.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.9,
        verified: true,
        agentLetter: 'B',
        agentRole: 'Design & Architecture Specialist',
        capabilities: {
          reasoning: 'expert',
          coding: 'expert',
          context: '200K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      await selfCorrection.learnFromFeedback(
        'claude-sonnet-4-5-20250929',
        'claude-sonnet-4-5-20250929',
        true, // User confirmed
        detectionResult,
        'production'
      );

      const metrics = db.prepare('SELECT * FROM model_performance_metrics WHERE model = ?').get('claude-sonnet-4-5-20250929') as any;
      expect(metrics).not.toBeNull();
      expect(metrics.total_detections).toBe(1);
      expect(metrics.correct_detections).toBe(1);
      expect(metrics.accuracy).toBe(1.0);
      expect(metrics.avg_confidence).toBe(0.9);
    });

    it('should handle multiple feedback entries for same model', async () => {
      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.8,
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      // Add multiple feedback entries
      await selfCorrection.learnFromFeedback('glm-4.6', 'glm-4.6', true, detectionResult);
      await selfCorrection.learnFromFeedback('glm-4.6', 'glm-4.6', true, detectionResult);
      await selfCorrection.learnFromFeedback('glm-4.6', 'claude-sonnet-4-5-20250929', false, detectionResult);

      const metrics = db.prepare('SELECT * FROM model_performance_metrics WHERE model = ?').get('glm-4.6') as any;
      expect(metrics.total_detections).toBe(3);
      expect(metrics.correct_detections).toBe(2);
      expect(metrics.accuracy).toBeCloseTo(0.67, 2);
    });
  });

  describe('pattern detection', () => {
    it('should detect emerging correction patterns', async () => {
      // Add several similar corrections
      for (let i = 0; i < 3; i++) {
        await selfCorrection.learnFromFeedback(
          'glm-4.6-mistaken',
          'claude-sonnet-4-5-20250929',
          false,
          {
            detectedModel: 'glm-4.6-mistaken',
            modelProvider: 'zhipu',
            actualEndpoint: 'https://api.z.ai/api/anthropic',
            contextWindow: 128000,
            configSource: 'settings-zai.json',
            configPath: '/test/path',
            detectionMethod: 'file',
            confidence: 0.7,
            verified: true,
            agentLetter: 'A',
            agentRole: 'UI Velocity Specialist',
            capabilities: {
              reasoning: 'advanced',
              coding: 'advanced',
              context: '128K',
              multimodal: true,
              toolUse: true
            },
            timestamp: new Date().toISOString(),
            metadata: {},
            loopIntegration: {
              loopId: 'test-loop',
              sessionId: 'test-session',
              eventId: `test-event-${i}`
            }
          } as any
        );
      }

      // Check if pattern is detected
      const corrections = db.prepare(`
        SELECT COUNT(*) as count, corrected_to
        FROM detection_corrections
        WHERE original_model LIKE 'glm-4.6%'
        GROUP BY corrected_to
      `).all() as any[];

      expect(corrections).toHaveLength(1);
      expect(corrections[0].count).toBe(3);
      expect(corrections[0].corrected_to).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('cache management', () => {
    it('should cache correction results', async () => {
      // Setup historical correction
      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-cache',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.7,
        0.9,
        1,
        new Date().toISOString()
      );

      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.7,
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      // First call should query database
      const result1 = await selfCorrection.correctDetection('glm-4.6', detectionResult);
      expect(result1.correctionApplied).toBe(true);

      // Second call should use cache (no additional database queries)
      const result2 = await selfCorrection.correctDetection('glm-4.6', detectionResult);
      expect(result2.correctionApplied).toBe(true);
    });
  });

  describe('getCorrectionStats', () => {
    it('should return correction statistics', () => {
      // Add test corrections
      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'stats-test-1',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.7,
        0.9,
        1,
        new Date().toISOString()
      );

      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'stats-test-2',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'feedback',
        0.6,
        0.85,
        1,
        new Date().toISOString()
      );

      const stats = selfCorrection.getCorrectionStats();

      expect(stats.totalCorrections).toBe(2);
      expect(stats.accuracyImprovement).toBeCloseTo(0.225, 3); // (0.2 + 0.25) / 2
      expect(stats.topCorrectedModels).toHaveLength(1);
      expect(stats.topCorrectedModels[0].model).toBe('glm-4.6');
      expect(stats.topCorrectedModels[0].corrections).toBe(2);
    });

    it('should return empty stats when no corrections exist', () => {
      const stats = selfCorrection.getCorrectionStats();

      expect(stats.totalCorrections).toBe(0);
      expect(stats.accuracyImprovement).toBe(0);
      expect(stats.topCorrectedModels).toHaveLength(0);
      expect(stats.recentPatterns).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Close database to simulate error
      db.close();

      const detectionResult: ModelDetectionResult = {
        detectedModel: 'glm-4.6',
        modelProvider: 'zhipu',
        actualEndpoint: 'https://api.z.ai/api/anthropic',
        contextWindow: 128000,
        configSource: 'settings-zai.json',
        configPath: '/test/path',
        detectionMethod: 'file',
        confidence: 0.7,
        verified: true,
        agentLetter: 'A',
        agentRole: 'UI Velocity Specialist',
        capabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          context: '128K',
          multimodal: true,
          toolUse: true
        },
        timestamp: new Date().toISOString(),
        metadata: {},
        loopIntegration: {
          loopId: 'test-loop',
          sessionId: 'test-session',
          eventId: 'test-event'
        }
      };

      const result = await selfCorrection.correctDetection('glm-4.6', detectionResult);

      expect(result.correctionApplied).toBe(false);
      expect(result.correctionReason).toBe('correction-failed');
    });

    it('should handle malformed detection results', async () => {
      const malformedResult = {
        detectedModel: 'glm-4.6',
        confidence: 0.7
        // Missing required fields
      } as any;

      const result = await selfCorrection.correctDetection('glm-4.6', malformedResult);

      expect(result.correctionApplied).toBe(false);
    });
  });
});