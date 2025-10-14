/**
 * Enhanced Model Detection System Unit Tests
 * ==========================================
 *
 * Comprehensive unit tests for the enhanced model detection system.
 * Tests integration of all components: active configuration detection,
 * capability verification, self-correction, and Central-MCP integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import Database from 'better-sqlite3';
import { EnhancedModelDetectionSystem, ModelDetectionResult } from '../../../src/auto-proactive/ModelDetectionSystem.js';
import { ActiveConfigurationDetector } from '../../../src/auto-proactive/ActiveConfigurationDetector.js';
import { ModelCapabilityVerifier } from '../../../src/auto-proactive/ModelCapabilityVerifier.js';
import { DetectionSelfCorrection } from '../../../src/auto-proactive/DetectionSelfCorrection.js';

// Mock dependencies
vi.mock('../../../src/auto-proactive/ActiveConfigurationDetector', () => ({
  ActiveConfigurationDetector: vi.fn()
}));

vi.mock('../../../src/auto-proactive/ModelCapabilityVerifier', () => ({
  ModelCapabilityVerifier: vi.fn()
}));

vi.mock('../../../src/auto-proactive/DetectionSelfCorrection', () => ({
  DetectionSelfCorrection: vi.fn()
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../src/api/universal-write', () => ({
  writeSystemEvent: vi.fn().mockResolvedValue(undefined)
}));

describe('EnhancedModelDetectionSystem', () => {
  let detectionSystem: EnhancedModelDetectionSystem;
  let db: Database.Database;
  let mockConfigDetector: any;
  let mockCapabilityVerifier: any;
  let mockSelfCorrection: any;
  let mockWriteSystemEvent: Mock;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Initialize schema
    db.exec(`
      CREATE TABLE enhanced_model_detections (
        id TEXT PRIMARY KEY,
        detected_model TEXT NOT NULL,
        provider TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        context_window INTEGER NOT NULL,
        config_source TEXT NOT NULL,
        config_path TEXT NOT NULL,
        detection_method TEXT NOT NULL,
        confidence REAL NOT NULL,
        verified INTEGER NOT NULL,
        agent_letter TEXT NOT NULL,
        agent_role TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        self_correction_applied INTEGER NOT NULL DEFAULT 0,
        self_correction_data TEXT,
        loop_integration TEXT NOT NULL,
        metadata TEXT,
        timestamp TEXT NOT NULL,
        detection_count INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE model_detections (
        id TEXT PRIMARY KEY,
        detected_model TEXT NOT NULL,
        provider TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        context_window INTEGER NOT NULL,
        config_source TEXT NOT NULL,
        config_path TEXT NOT NULL,
        detection_method TEXT NOT NULL,
        confidence REAL NOT NULL,
        verified INTEGER NOT NULL,
        agent_letter TEXT NOT NULL,
        agent_role TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        metadata TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE detection_corrections (
        id TEXT PRIMARY KEY,
        original_model TEXT NOT NULL,
        corrected_to TEXT NOT NULL,
        correction_reason TEXT NOT NULL,
        confidence_before REAL NOT NULL,
        confidence_after REAL NOT NULL,
        correction_applied INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE user_feedback (
        id TEXT PRIMARY KEY,
        detected_model TEXT NOT NULL,
        actual_model TEXT NOT NULL,
        user_confirmed INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        context TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);

    // Mock components
    mockConfigDetector = {
      detectActiveConfiguration: vi.fn()
    };

    mockCapabilityVerifier = {
      verifyModelCapabilities: vi.fn(),
      getModelInfo: vi.fn()
    };

    mockSelfCorrection = {
      correctDetection: vi.fn(),
      learnFromFeedback: vi.fn(),
      getCorrectionStats: vi.fn()
    };

    mockWriteSystemEvent = vi.mocked(await import('../../../src/api/universal-write')).writeSystemEvent;

    // Mock constructors
    vi.mocked(ActiveConfigurationDetector).mockImplementation(() => mockConfigDetector);
    vi.mocked(ModelCapabilityVerifier).mockImplementation(() => mockCapabilityVerifier);
    vi.mocked(DetectionSelfCorrection).mockImplementation(() => mockSelfCorrection);

    detectionSystem = new EnhancedModelDetectionSystem(db);
    vi.clearAllMocks();
  });

  afterEach(() => {
    db.close();
    vi.restoreAllMocks();
  });

  describe('detectCurrentModel', () => {
    it('should perform complete detection flow without correction', async () => {
      // Mock active configuration detection
      const mockActiveConfig = {
        activeConfig: {
          model: 'glm-4.6',
          env: {
            ANTHROPIC_AUTH_TOKEN: 'test-token',
            ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic'
          }
        },
        activeConfigPath: '/test/settings-zai.json',
        detectionMethod: 'process',
        confidence: 0.9,
        actualModel: 'glm-4.6',
        verificationStatus: 'verified'
      };

      // Mock capability verification
      const mockCapabilityResult = {
        model: 'glm-4.6',
        verified: true,
        confidence: 0.90,
        detectedCapabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192,
          supportedFeatures: ['vision', 'function-calling']
        },
        agentMapping: {
          letter: 'A',
          role: 'UI Velocity Specialist',
          confidence: 0.90
        },
        testResults: [
          {
            testType: 'api-access',
            success: true,
            responseTime: 500,
            capabilities: { toolUse: true }
          }
        ],
        verificationTime: 1000,
        metadata: {
          provider: 'zhipu',
          endpoint: 'https://api.z.ai/api/anthropic',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      // Mock self-correction (no correction needed)
      mockSelfCorrection.correctDetection.mockResolvedValue({
        originalModel: 'glm-4.6',
        correctedModel: 'glm-4.6',
        correctionApplied: false,
        confidence: 0.90,
        correctionReason: 'no-correction-needed'
      });

      mockConfigDetector.detectActiveConfiguration.mockResolvedValue(mockActiveConfig);
      mockCapabilityVerifier.verifyModelCapabilities.mockResolvedValue(mockCapabilityResult);

      const result = await detectionSystem.detectCurrentModel('test-session-123');

      expect(result.detectedModel).toBe('glm-4.6');
      expect(result.agentLetter).toBe('A');
      expect(result.agentRole).toBe('UI Velocity Specialist');
      expect(result.confidence).toBe(0.90);
      expect(result.verified).toBe(true);
      expect(result.selfCorrection).toBeUndefined();

      // Verify integration calls
      expect(mockConfigDetector.detectActiveConfiguration).toHaveBeenCalled();
      expect(mockCapabilityVerifier.verifyModelCapabilities).toHaveBeenCalledWith('glm-4.6', mockActiveConfig.activeConfig);
      expect(mockSelfCorrection.correctDetection).toHaveBeenCalled();
      expect(mockWriteSystemEvent).toHaveBeenCalled();

      // Verify database storage
      const storedDetection = db.prepare('SELECT * FROM enhanced_model_detections WHERE id = ?').get(result.loopIntegration.eventId) as any;
      expect(storedDetection).not.toBeNull();
      expect(storedDetection.detected_model).toBe('glm-4.6');
      expect(storedDetection.agent_letter).toBe('A');
      expect(storedDetection.self_correction_applied).toBe(0);
    });

    it('should apply self-correction when needed', async () => {
      // Mock active configuration detection
      const mockActiveConfig = {
        activeConfig: {
          model: 'claude-sonnet-4-5-20250929',
          env: {
            ANTHROPIC_API_KEY: 'test-key'
          }
        },
        activeConfigPath: '/test/settings.json',
        detectionMethod: 'file',
        confidence: 0.8,
        actualModel: 'claude-sonnet-4-5-20250929',
        verificationStatus: 'verified'
      };

      // Mock initial capability verification
      const mockInitialCapabilityResult = {
        model: 'claude-sonnet-4-5-20250929',
        verified: true,
        confidence: 0.80,
        detectedCapabilities: {
          reasoning: 'expert',
          coding: 'expert',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192
        },
        agentMapping: {
          letter: 'B',
          role: 'Design & Architecture Specialist',
          confidence: 0.80
        },
        testResults: [],
        verificationTime: 800,
        metadata: {
          provider: 'anthropic',
          endpoint: 'https://api.anthropic.com',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      // Mock self-correction (correction needed)
      mockSelfCorrection.correctDetection.mockResolvedValue({
        originalModel: 'claude-sonnet-4-5-20250929',
        correctedModel: 'claude-sonnet-4-20250514',
        correctionApplied: true,
        confidence: 0.85,
        correctionReason: 'historical',
        historicalData: {
          totalCorrections: 3,
          accuracyImprovement: 0.15
        }
      });

      // Mock corrected capability verification
      const mockCorrectedCapabilityResult = {
        model: 'claude-sonnet-4-20250514',
        verified: true,
        confidence: 0.95,
        detectedCapabilities: {
          reasoning: 'expert',
          coding: 'expert',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192
        },
        agentMapping: {
          letter: 'D',
          role: 'Integration Specialist',
          confidence: 0.95
        },
        testResults: [],
        verificationTime: 900,
        metadata: {
          provider: 'anthropic',
          endpoint: 'https://api.anthropic.com',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      mockConfigDetector.detectActiveConfiguration.mockResolvedValue(mockActiveConfig);
      mockCapabilityVerifier.verifyModelCapabilities
        .mockResolvedValueOnce(mockInitialCapabilityResult)
        .mockResolvedValueOnce(mockCorrectedCapabilityResult);

      const result = await detectionSystem.detectCurrentModel('test-session-456');

      expect(result.detectedModel).toBe('claude-sonnet-4-20250514'); // Corrected model
      expect(result.agentLetter).toBe('D'); // Updated agent mapping
      expect(result.agentRole).toBe('Integration Specialist'); // Updated role
      expect(result.confidence).toBe(0.85); // Updated confidence
      expect(result.selfCorrection).toBeDefined();
      expect(result.selfCorrection!.correctionApplied).toBe(true);
      expect(result.selfCorrection!.originalModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.selfCorrection!.correctedModel).toBe('claude-sonnet-4-20250514');

      // Verify database storage with correction
      const storedDetection = db.prepare('SELECT * FROM enhanced_model_detections WHERE id = ?').get(result.loopIntegration.eventId) as any;
      expect(storedDetection).not.toBeNull();
      expect(storedDetection.detected_model).toBe('claude-sonnet-4-20250514');
      expect(storedDetection.agent_letter).toBe('D');
      expect(storedDetection.self_correction_applied).toBe(1);
    });

    it('should handle detection errors gracefully', async () => {
      // Mock configuration detection error
      mockConfigDetector.detectActiveConfiguration.mockRejectedValue(new Error('Configuration detection failed'));

      const result = await detectionSystem.detectCurrentModel('test-session-error');

      expect(result.detectedModel).toBe('unknown');
      expect(result.confidence).toBe(0.1); // Very low confidence for fallback
      expect(result.verified).toBe(false);
      expect(result.agentLetter).toBe('B');
      expect(result.detectionMethod).toBe('enhanced-fallback');
      expect(result.verificationStatus).toBe('error');

      // Verify error event was still written
      expect(mockWriteSystemEvent).toHaveBeenCalled();
    });

    it('should include session ID in loop integration', async () => {
      const mockActiveConfig = {
        activeConfig: {
          model: 'glm-4.6',
          env: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
        },
        activeConfigPath: '/test/settings-zai.json',
        detectionMethod: 'process',
        confidence: 0.9,
        actualModel: 'glm-4.6',
        verificationStatus: 'verified'
      };

      const mockCapabilityResult = {
        model: 'glm-4.6',
        verified: true,
        confidence: 0.90,
        detectedCapabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192
        },
        agentMapping: {
          letter: 'A',
          role: 'UI Velocity Specialist',
          confidence: 0.90
        },
        testResults: [],
        verificationTime: 500,
        metadata: {
          provider: 'zhipu',
          endpoint: 'https://api.z.ai/api/anthropic',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      mockSelfCorrection.correctDetection.mockResolvedValue({
        originalModel: 'glm-4.6',
        correctedModel: 'glm-4.6',
        correctionApplied: false,
        confidence: 0.90,
        correctionReason: 'no-correction-needed'
      });

      mockConfigDetector.detectActiveConfiguration.mockResolvedValue(mockActiveConfig);
      mockCapabilityVerifier.verifyModelCapabilities.mockResolvedValue(mockCapabilityResult);

      const sessionId = 'user-session-789';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      expect(result.loopIntegration.sessionId).toBe(sessionId);
      expect(result.loopIntegration.loopId).toBe('model-detection');
      expect(result.loopIntegration.eventId).toBeDefined();
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', () => {
      // Insert test data
      db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-detection-1',
        'glm-4.6',
        'zhipu',
        'https://api.z.ai/api/anthropic',
        128000,
        'settings-zai.json',
        '/test/path',
        'enhanced-process',
        0.90,
        1,
        'A',
        'UI Velocity Specialist',
        '{}',
        '{}',
        '{}',
        new Date().toISOString(),
        1
      );

      db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-detection-2',
        'claude-sonnet-4-5-20250929',
        'anthropic',
        'https://api.anthropic.com',
        200000,
        'settings.json',
        '/test/path2',
        'enhanced-file',
        0.85,
        1,
        'B',
        'Design & Architecture Specialist',
        '{}',
        '{}',
        '{}',
        new Date().toISOString(),
        2
      );

      const stats = detectionSystem.getSystemStats();

      expect(stats.totalDetections).toBe(2);
      expect(stats.avgConfidence).toBeCloseTo(0.875, 3);
      expect(stats.accuracyRate).toBe(1.0);
      expect(stats.topModels).toHaveLength(2);
      expect(stats.topModels[0].model).toBe('glm-4.6');
      expect(stats.topModels[0].count).toBe(1);
      expect(stats.systemHealth).toBe('healthy');
    });

    it('should handle empty database gracefully', () => {
      const stats = detectionSystem.getSystemStats();

      expect(stats.totalDetections).toBe(0);
      expect(stats.avgConfidence).toBe(0);
      expect(stats.accuracyRate).toBe(0);
      expect(stats.topModels).toHaveLength(0);
      expect(stats.systemHealth).toBe('critical');
    });

    it('should detect degraded system health', () => {
      // Insert low-quality detections
      db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-detection-low',
        'unknown-model',
        'unknown',
        'unknown',
        200000,
        'fallback-error',
        'none',
        'enhanced-fallback',
        0.1,
        0,
        'B',
        'Unknown (fallback)',
        '{}',
        '{}',
        '{}',
        new Date().toISOString(),
        1
      );

      const stats = detectionSystem.getSystemStats();

      expect(stats.systemHealth).toBe('degraded');
    });
  });

  describe('provideFeedback', () => {
    it('should process user feedback correctly', async () => {
      // Insert a detection to provide feedback on
      const detectionId = 'test-detection-feedback';
      db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        detectionId,
        'glm-4.6',
        'zhipu',
        'https://api.z.ai/api/anthropic',
        128000,
        'settings-zai.json',
        '/test/path',
        'enhanced-process',
        0.90,
        1,
        'A',
        'UI Velocity Specialist',
        '{}',
        '{}',
        '{}',
        new Date().toISOString(),
        1
      );

      await detectionSystem.provideFeedback(
        detectionId,
        'claude-sonnet-4-5-20250929',
        false,
        'user-testing'
      );

      // Verify feedback was passed to self-correction system
      expect(mockSelfCorrection.learnFromFeedback).toHaveBeenCalledWith(
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        false,
        expect.any(Object), // ModelDetectionResult
        'user-testing'
      );
    });

    it('should handle feedback for non-existent detection', async () => {
      await detectionSystem.provideFeedback(
        'non-existent-id',
        'claude-sonnet-4-5-20250929',
        true,
        'testing'
      );

      // Should not call self-correction
      expect(mockSelfCorrection.learnFromFeedback).not.toHaveBeenCalled();
    });
  });

  describe('exportDetectionData', () => {
    it('should export detection data correctly', () => {
      // Insert test data
      db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'export-test-1',
        'glm-4.6',
        'zhipu',
        'https://api.z.ai/api/anthropic',
        128000,
        'settings-zai.json',
        '/test/path',
        'enhanced-process',
        0.90,
        1,
        'A',
        'UI Velocity Specialist',
        '{}',
        '{}',
        '{}',
        new Date().toISOString(),
        1
      );

      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'correction-test-1',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.7,
        0.9,
        1,
        new Date().toISOString()
      );

      db.prepare(`
        INSERT INTO user_feedback (id, detected_model, actual_model, user_confirmed,
          accuracy, context, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'feedback-test-1',
        'glm-4.6',
        'claude-sonnet-4-5-20250929',
        0,
        0.0,
        'testing',
        new Date().toISOString()
      );

      const exportedData = detectionSystem.exportDetectionData(24);

      expect(exportedData.detections).toHaveLength(1);
      expect(exportedData.corrections).toHaveLength(1);
      expect(exportedData.feedback).toHaveLength(1);
      expect(exportedData.summary).toBeDefined();

      expect(exportedData.detections[0].detected_model).toBe('glm-4.6');
      expect(exportedData.corrections[0].original_model).toBe('glm-4.6');
      expect(exportedData.feedback[0].detected_model).toBe('glm-4.6');
    });

    it('should handle empty export', () => {
      const exportedData = detectionSystem.exportDetectionData(1);

      expect(exportedData.detections).toHaveLength(0);
      expect(exportedData.corrections).toHaveLength(0);
      expect(exportedData.feedback).toHaveLength(0);
      expect(exportedData.summary).toBeDefined();
    });
  });

  describe('integration with Central-MCP systems', () => {
    it('should write Universal Write System events', async () => {
      const mockActiveConfig = {
        activeConfig: {
          model: 'glm-4.6',
          env: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
        },
        activeConfigPath: '/test/settings-zai.json',
        detectionMethod: 'process',
        confidence: 0.9,
        actualModel: 'glm-4.6',
        verificationStatus: 'verified'
      };

      const mockCapabilityResult = {
        model: 'glm-4.6',
        verified: true,
        confidence: 0.90,
        detectedCapabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192
        },
        agentMapping: {
          letter: 'A',
          role: 'UI Velocity Specialist',
          confidence: 0.90
        },
        testResults: [],
        verificationTime: 500,
        metadata: {
          provider: 'zhipu',
          endpoint: 'https://api.z.ai/api/anthropic',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      mockSelfCorrection.correctDetection.mockResolvedValue({
        originalModel: 'glm-4.6',
        correctedModel: 'glm-4.6',
        correctionApplied: false,
        confidence: 0.90,
        correctionReason: 'no-correction-needed'
      });

      mockConfigDetector.detectActiveConfiguration.mockResolvedValue(mockActiveConfig);
      mockCapabilityVerifier.verifyModelCapabilities.mockResolvedValue(mockCapabilityResult);

      await detectionSystem.detectCurrentModel('test-integration');

      expect(mockWriteSystemEvent).toHaveBeenCalledWith({
        eventType: 'model-detection',
        eventCategory: 'agent-discovery',
        eventActor: 'Agent-A',
        eventAction: 'Model detected: glm-4.6',
        eventDescription: 'Enhanced model detection completed with verification',
        systemHealth: 'healthy',
        activeLoops: 9,
        avgResponseTimeMs: expect.any(Number),
        successRate: 1.0,
        tags: ['model-detection', 'agent-mapping', 'enhanced-system', 'enhanced-process'],
        metadata: expect.objectContaining({
          detectionId: expect.any(String),
          sessionId: 'test-integration',
          detectedModel: 'glm-4.6',
          agentLetter: 'A',
          agentRole: 'UI Velocity Specialist',
          confidence: 0.90,
          verified: true,
          provider: 'zhipu',
          contextWindow: 128000,
          capabilities: expect.any(Object),
          selfCorrectionApplied: false
        })
      });
    });

    it('should maintain backward compatibility with legacy table', async () => {
      const mockActiveConfig = {
        activeConfig: {
          model: 'glm-4.6',
          env: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
        },
        activeConfigPath: '/test/settings-zai.json',
        detectionMethod: 'process',
        confidence: 0.9,
        actualModel: 'glm-4.6',
        verificationStatus: 'verified'
      };

      const mockCapabilityResult = {
        model: 'glm-4.6',
        verified: true,
        confidence: 0.90,
        detectedCapabilities: {
          reasoning: 'advanced',
          coding: 'advanced',
          multimodal: true,
          toolUse: true,
          maxTokens: 8192
        },
        agentMapping: {
          letter: 'A',
          role: 'UI Velocity Specialist',
          confidence: 0.90
        },
        testResults: [],
        verificationTime: 500,
        metadata: {
          provider: 'zhipu',
          endpoint: 'https://api.z.ai/api/anthropic',
          testsPassed: 1,
          testsTotal: 1,
          warnings: []
        }
      };

      mockSelfCorrection.correctDetection.mockResolvedValue({
        originalModel: 'glm-4.6',
        correctedModel: 'glm-4.6',
        correctionApplied: false,
        confidence: 0.90,
        correctionReason: 'no-correction-needed'
      });

      mockConfigDetector.detectActiveConfiguration.mockResolvedValue(mockActiveConfig);
      mockCapabilityVerifier.verifyModelCapabilities.mockResolvedValue(mockCapabilityResult);

      const result = await detectionSystem.detectCurrentModel('test-compatibility');

      // Check both tables have the data
      const enhancedRow = db.prepare('SELECT * FROM enhanced_model_detections WHERE id = ?').get(result.loopIntegration.eventId);
      const legacyRow = db.prepare('SELECT * FROM model_detections WHERE id = ?').get(result.loopIntegration.eventId);

      expect(enhancedRow).not.toBeNull();
      expect(legacyRow).not.toBeNull();

      expect((enhancedRow as any).detected_model).toBe('glm-4.6');
      expect((legacyRow as any).detected_model).toBe('glm-4.6');
    });
  });
});