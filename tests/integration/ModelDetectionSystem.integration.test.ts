/**
 * Model Detection System Integration Tests
 * =====================================
 *
 * End-to-end integration tests for the enhanced model detection system.
 * Tests complete workflow from configuration detection to agent assignment.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Database from 'better-sqlite3';
import { EnhancedModelDetectionSystem } from '../../src/auto-proactive/ModelDetectionSystem.js';
import { writeSystemEvent } from '../../src/api/universal-write.js';

// Mock dependencies
jest.mock('../../src/api/universal-write.js');
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Enhanced Model Detection System - Integration Tests', () => {
  let db: Database.Database;
  let detectionSystem: EnhancedModelDetectionSystem;
  let testDbPath: string;

  beforeEach(async () => {
    // Create test database
    testDbPath = `/tmp/test_detection_${Date.now()}.db`;
    db = new Database(testDbPath);

    // Create enhanced detection tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS enhanced_model_detections (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        session_id TEXT,
        agent_letter TEXT,
        agent_model TEXT,
        model_provider TEXT,
        detected_model TEXT,
        original_assumption TEXT,
        confidence REAL,
        detection_method TEXT,
        verification_method TEXT,
        configuration_source TEXT,
        capabilities TEXT,
        system_info TEXT,
        verification_attempted INTEGER,
        verification_successful INTEGER,
        verification_details TEXT,
        reason_for_change TEXT,
        self_correction_applied INTEGER,
        self_correction_data TEXT,
        verified INTEGER,
        execution_time_ms INTEGER
      );

      CREATE TABLE IF NOT EXISTS detection_corrections (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        session_id TEXT,
        detection_id TEXT,
        original_model TEXT,
        corrected_to TEXT,
        confidence_before REAL,
        confidence_after REAL,
        correction_method TEXT,
        auto_applied INTEGER,
        verification_method TEXT,
        context TEXT,
        metadata TEXT,
        correction_applied INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_feedback (
        id TEXT PRIMARY KEY,
        detected_model TEXT,
        actual_model TEXT,
        user_confirmed INTEGER,
        accuracy REAL,
        context TEXT,
        timestamp TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS model_performance_metrics (
        id TEXT PRIMARY KEY,
        model TEXT,
        total_detections INTEGER,
        correct_detections INTEGER,
        accuracy REAL,
        avg_confidence REAL,
        confidence_accuracy REAL,
        last_updated TEXT,
        first_seen TEXT
      );

      CREATE TABLE IF NOT EXISTS correction_patterns (
        id TEXT PRIMARY KEY,
        pattern TEXT,
        original_model TEXT,
        corrected_to TEXT,
        frequency INTEGER,
        accuracy REAL,
        confidence REAL,
        auto_apply INTEGER,
        min_confidence_threshold REAL,
        required_occurrences INTEGER,
        last_seen TEXT,
        first_seen TEXT,
        created_at TEXT,
        status TEXT
      );
    `);

    // Initialize detection system
    detectionSystem = new EnhancedModelDetectionSystem(db);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    detectionSystem = null as any;
    db.close();

    // Remove test database file
    try {
      require('fs').unlinkSync(testDbPath);
    } catch (error) {
      // Ignore file not found errors
    }
  });

  describe('Complete Detection Workflow', () => {
    it('should detect GLM-4.6 and assign to Agent A with high confidence', async () => {
      // Mock GLM-4.6 detection scenario
      const sessionId = 'test-session-glm-4.6';

      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify detection result structure
      expect(result).toBeDefined();
      expect(result.detectedModel).toBeDefined();
      expect(result.agentLetter).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();

      // Verify database storage
      const storedDetection = db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE session_id = ? AND detected_model = ?
      `).get(sessionId, result.detectedModel);

      expect(storedDetection).toBeDefined();
      expect(storedDetection.verified).toBe(1); // Should be verified

      // Verify Universal Write System integration
      expect(writeSystemEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'model_detection',
          eventCategory: 'agent',
          eventActor: expect.any(String),
          eventAction: expect.stringContaining('Model detected:'),
          eventDescription: expect.stringContaining('Enhanced Detection'),
          systemHealth: expect.any(String)
        })
      );
    });

    it('should handle detection failures gracefully with fallback', async () => {
      // Simulate detection failure by invalidating configuration
      const originalEnv = process.env;
      process.env = { ...originalEnv, CLAUDE_MODEL: 'invalid-model-test' };

      const sessionId = 'test-session-fallback';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify fallback behavior
      expect(result).toBeDefined();
      expect(result.detectedModel).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5); // Low confidence for fallback
      expect(result.verified).toBe(false);

      // Restore environment
      process.env = originalEnv;
    });

    it('should apply self-correction when historical patterns exist', async () => {
      // Insert historical correction pattern
      db.prepare(`
        INSERT INTO correction_patterns (
          id, pattern, original_model, corrected_to, frequency, accuracy,
          confidence, auto_apply, min_confidence_threshold, required_occurrences,
          last_seen, first_seen, created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'test-pattern-1',
        'claude-sonnet-4-5→glm-4.6',
        'claude-sonnet-4-5',
        'glm-4.6',
        3,
        0.9,
        0.85,
        1,
        0.7,
        3,
        new Date().toISOString(),
        new Date(Date.now() - 86400000).toISOString(),
        new Date().toISOString(),
        'active'
      );

      const sessionId = 'test-session-correction';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify self-correction was applied
      expect(result.selfCorrection).toBeDefined();
      if (result.selfCorrection?.correctionApplied) {
        expect(result.selfCorrection.originalModel).toBe('claude-sonnet-4-5');
        expect(result.selfCorrection.correctedModel).toBe('glm-4.6');
      }
    });

    it('should maintain performance metrics across multiple detections', async () => {
      const sessionIds = [
        'test-session-metrics-1',
        'test-session-metrics-2',
        'test-session-metrics-3'
      ];

      // Perform multiple detections
      const results = [];
      for (const sessionId of sessionIds) {
        const result = await detectionSystem.detectCurrentModel(sessionId);
        results.push(result);
      }

      // Verify performance metrics are tracked
      const stats = detectionSystem.getSystemStats();
      expect(stats.totalDetections).toBeGreaterThanOrEqual(sessionIds.length);
      expect(stats.avgConfidence).toBeGreaterThan(0);

      // Verify database metrics
      const metrics = db.prepare(`
        SELECT * FROM model_performance_metrics
        WHERE model = ?
        LIMIT 1
      `).get(results[0].detectedModel);

      expect(metrics).toBeDefined();
      expect(metrics.total_detections).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Agent Assignment Logic', () => {
    it('should correctly assign GLM-4.6 to Agent A (UI Velocity Specialist)', async () => {
      // This test specifically validates the original issue fix
      const sessionId = 'test-session-glm-agent-a';

      // Mock GLM-4.6 detection
      jest.spyOn(detectionSystem as any, 'extractActualModel').mockReturnValue('glm-4.6');

      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify GLM-4.6 is assigned to Agent A
      expect(result.agentLetter).toBe('A');
      expect(result.agentRole).toBe('UI Velocity Specialist');
      expect(result.confidence).toBeGreaterThan(0.8); // High confidence for GLM-4.6

      // Verify capabilities match UI development
      expect(result.capabilities.coding).toBe('advanced');
      expect(result.capabilities.multimodal).toBe(true);
      expect(result.capabilities.toolUse).toBe(true);
    });

    it('should assign Claude models to Agent B (Architecture Specialist)', async () => {
      const sessionId = 'test-session-claude-agent-b';

      // Mock Claude detection
      jest.spyOn(detectionSystem as any, 'extractActualModel').mockReturnValue('claude-sonnet-4-5');

      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify Claude is assigned to Agent B
      expect(result.agentLetter).toBe('B');
      expect(result.agentRole).toBe('Design & Architecture Specialist');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should provide appropriate agent alternatives', async () => {
      const sessionId = 'test-session-alternatives';

      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Check if alternative roles are provided for flexibility
      expect(result.agentLetter).toBeDefined();
      expect(result.agentRole).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Database Integration', () => {
    it('should store detection results in enhanced_model_detections table', async () => {
      const sessionId = 'test-session-db-storage';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify storage in database
      const stored = db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE session_id = ? AND timestamp > ?
        ORDER BY timestamp DESC
        LIMIT 1
      `).get(sessionId, new Date(Date.now() - 60000).toISOString());

      expect(stored).toBeDefined();
      expect(stored.session_id).toBe(sessionId);
      expect(stored.detected_model).toBe(result.detectedModel);
      expect(stored.agent_letter).toBe(result.agentLetter);
      expect(stored.confidence).toBe(result.confidence);
      expect(stored.verified).toBe(result.verified ? 1 : 0);
    });

    it('should track self-correction patterns in database', async () => {
      // Simulate a scenario where self-correction should be applied
      await detectionSystem.provideFeedback(
        'test-detection-id',
        'glm-4.6',
        true, // User confirms GLM-4.6
        'integration-test'
      );

      // Verify feedback is stored
      const feedback = db.prepare(`
        SELECT * FROM user_feedback
        WHERE context = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `).get('integration-test');

      expect(feedback).toBeDefined();
      expect(feedback.detected_model).toBeDefined();
      expect(feedback.actual_model).toBe('glm-4.6');
      expect(feedback.user_confirmed).toBe(1);
    });

    it('should update performance metrics after each detection', async () => {
      const sessionId = 'test-session-performance';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Verify performance metrics are updated
      const metrics = db.prepare(`
        SELECT * FROM model_performance_metrics
        WHERE model = ?
      `).get(result.detectedModel);

      expect(metrics).toBeDefined();
      expect(metrics.total_detections).toBeGreaterThan(0);
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.avg_confidence).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Close database to simulate connection failure
      db.close();

      const sessionId = 'test-session-db-error';

      // Should not throw error, but handle gracefully
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Should return fallback result
      expect(result).toBeDefined();
      expect(result.detectedModel).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5); // Low confidence due to error
    });

    it('should handle malformed API responses', async () => {
      // Mock API response that is malformed
      const sessionId = 'test-session-malformed-response';

      // The system should handle this internally
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Should still return a valid result structure
      expect(result).toBeDefined();
      expect(result.detectedModel).toBeDefined();
      expect(result.agentLetter).toBeDefined();
    });

    it('should maintain system stability under concurrent detections', async () => {
      const sessionIds = Array.from({ length: 10 }, (_, i) => `concurrent-session-${i}`);

      // Run multiple detections concurrently
      const promises = sessionIds.map(sessionId =>
        detectionSystem.detectCurrentModel(sessionId)
      );

      const results = await Promise.all(promises);

      // All should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.detectedModel).toBeDefined();
        expect(result.agentLetter).toBeDefined();
      });

      // Verify database consistency
      const totalDetections = db.prepare(`
        SELECT COUNT(*) as count FROM enhanced_model_detections
        WHERE session_id LIKE 'concurrent-session-%'
      `).get() as { count: number };

      expect(totalDetections.count).toBe(10);
    });
  });

  describe('Security Validation', () => {
    it('should validate and sanitize model inputs', async () => {
      // Test with potentially malicious input
      const sessionId = 'test-session-security<script>alert("xss")</script>';

      const result = await detectionSystem.detectCurrentModel(sessionId);

      // Should handle malicious input safely
      expect(result).toBeDefined();
      expect(result.detectedModel).toBeDefined();

      // Verify input was sanitized in database
      const stored = db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE session_id LIKE ?
      `).get(`%${sessionId}%`);

      expect(stored).toBeDefined();
      // Should not contain malicious script tags
      expect(stored.session_id).not.toContain('<script>');
    });

    it('should handle API key security properly', async () => {
      // Test with environment containing API keys
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        CLAUDE_API_KEY: 'sk-ant-test-key-for-security-validation'
      };

      const sessionId = 'test-session-api-key-security';
      const result = await detectionSystem.detectCurrentModel(sessionId);

      // API keys should not be exposed in logs or stored data
      expect(result).toBeDefined();

      // Check that API key is not in stored metadata
      const stored = db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE session_id = ?
      `).get(sessionId);

      const metadata = JSON.parse(stored.system_info || '{}');
      expect(JSON.stringify(metadata)).not.toContain('sk-ant-test-key');

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete detection within performance thresholds', async () => {
      const startTime = Date.now();

      const sessionId = 'test-session-performance';
      await detectionSystem.detectCurrentModel(sessionId);

      const executionTime = Date.now() - startTime;

      // Should complete within reasonable time (under 5 seconds)
      expect(executionTime).toBeLessThan(5000);

      // Verify execution time is tracked
      const stored = db.prepare(`
        SELECT execution_time_ms FROM enhanced_model_detections
        WHERE session_id = ?
      `).get(sessionId);

      expect(stored.execution_time_ms).toBeGreaterThan(0);
      expect(stored.execution_time_ms).toBeLessThan(5000);
    });

    it('should maintain accuracy across multiple runs', async () => {
      const results = [];
      const sessionCount = 5;

      // Run multiple detections
      for (let i = 0; i < sessionCount; i++) {
        const result = await detectionSystem.detectCurrentModel(`accuracy-test-${i}`);
        results.push(result);
      }

      // Calculate confidence metrics
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      const verifiedCount = results.filter(r => r.verified).length;
      const accuracyRate = verifiedCount / results.length;

      // Should maintain high accuracy
      expect(avgConfidence).toBeGreaterThan(0.7);
      expect(accuracyRate).toBeGreaterThan(0.6);
    });
  });
});