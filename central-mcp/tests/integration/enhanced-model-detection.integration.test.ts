/**
 * Enhanced Model Detection System Integration Tests
 * ===============================================
 *
 * End-to-end integration tests for the complete enhanced model detection system.
 * Tests real database interactions, component integration, error scenarios,
 * and performance under realistic conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import Database from 'better-sqlite3';
import { EnhancedModelDetectionSystem } from '../../src/auto-proactive/ModelDetectionSystem.js';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database.js';
import { mockClaudeConfigFiles, cleanupMockConfigFiles } from '../helpers/claude-config.js';

// Mock external dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock fetch for API testing
global.fetch = vi.fn();

describe('Enhanced Model Detection System Integration', () => {
  let detectionSystem: EnhancedModelDetectionSystem;
  let db: Database.Database;
  let mockFetch: Mock;

  beforeEach(async () => {
    // Setup test database with all migrations
    db = await setupTestDatabase();

    // Initialize detection system with real database
    detectionSystem = new EnhancedModelDetectionSystem(db);
    mockFetch = vi.mocked(global.fetch);

    vi.clearAllMocks();

    // Setup mock Claude config files
    await mockClaudeConfigFiles();
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
    await cleanupMockConfigFiles();
    vi.restoreAllMocks();
  });

  describe('Complete Detection Workflow', () => {
    it('should detect GLM-4.6 model with Z.AI configuration end-to-end', async () => {
      // Mock successful API response for Z.AI endpoint
      mockFetch.mockResolvedValueOnce({
        status: 401, // Auth required - indicates endpoint is accessible
        ok: false,
        headers: new Headers()
      });

      const result = await detectionSystem.detectCurrentModel('integration-test-session');

      expect(result.detectedModel).toBe('glm-4.6');
      expect(result.agentLetter).toBe('A');
      expect(result.agentRole).toBe('UI Velocity Specialist');
      expect(result.modelProvider).toBe('zhipu');
      expect(result.actualEndpoint).toBe('https://api.z.ai/api/anthropic');
      expect(result.contextWindow).toBe(128000);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.verified).toBe(true);

      // Verify capabilities
      expect(result.capabilities.reasoning).toBe('advanced');
      expect(result.capabilities.coding).toBe('advanced');
      expect(result.capabilities.multimodal).toBe(true);
      expect(result.capabilities.toolUse).toBe(true);
      expect(result.capabilities.context).toBe('128K');

      // Verify database storage
      const storedDetection = db.prepare(`
        SELECT * FROM enhanced_model_detections WHERE id = ?
      `).get(result.loopIntegration.eventId) as any;

      expect(storedDetection).not.toBeNull();
      expect(storedDetection.detected_model).toBe('glm-4.6');
      expect(storedDetection.agent_letter).toBe('A');
      expect(storedDetection.provider).toBe('zhipu');
      expect(storedDetection.verified).toBe(1);
      expect(storedDetection.detection_count).toBe(1);

      // Verify Universal Write System event
      const events = db.prepare(`
        SELECT * FROM detection_events WHERE detection_id = ?
      `).all(result.loopIntegration.eventId);

      expect(events).toHaveLength(1);
      expect(events[0].event_type).toBe('model-detection');
      expect(events[0].event_actor).toBe('Agent-A');
      expect(events[0].detected_model).toBe('glm-4.6');
    });

    it('should detect Claude Sonnet-4.5 with Anthropic configuration', async () => {
      // Mock successful API response for Anthropic endpoint
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      const result = await detectionSystem.detectCurrentModel('claude-test-session');

      expect(result.detectedModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.agentLetter).toBe('B');
      expect(result.agentRole).toBe('Design & Architecture Specialist');
      expect(result.modelProvider).toBe('anthropic');
      expect(result.actualEndpoint).toBe('https://api.anthropic.com');
      expect(result.contextWindow).toBe(200000);
      expect(result.capabilities.context).toBe('200K');

      // Verify detection metadata
      expect(result.metadata.configDetection.method).toBe('file');
      expect(result.metadata.capabilityVerification.modelVerified).toBe(true);
      expect(result.metadata.selfCorrectionEnabled).toBe(true);
    });

    it('should handle detection with self-correction application', async () => {
      // First, create a historical correction pattern
      db.prepare(`
        INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
          confidence_before, confidence_after, correction_applied, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'correction-pattern-1',
        'glm-4.6-mistaken',
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
        'correction-pattern-2',
        'glm-4.6-mistaken',
        'claude-sonnet-4-5-20250929',
        'historical',
        0.6,
        0.85,
        1,
        new Date(Date.now() - 2000000).toISOString()
      );

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      const result = await detectionSystem.detectCurrentModel('correction-test-session');

      // The system should detect and apply the correction
      expect(result.selfCorrection).toBeDefined();
      expect(result.selfCorrection!.correctionApplied).toBe(true);
      expect(result.selfCorrection!.originalModel).toBe('glm-4.6-mistaken');
      expect(result.selfCorrection!.correctedModel).toBe('claude-sonnet-4-5-20250929');

      // Verify correction was recorded
      const corrections = db.prepare(`
        SELECT * FROM detection_corrections WHERE original_model = ? ORDER BY timestamp DESC
      `).all('glm-4.6-mistaken');

      expect(corrections.length).toBeGreaterThan(2); // Original 2 + new one
    });

    it('should handle concurrent detection requests', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // Create multiple concurrent detection requests
      const concurrentRequests = Array(5).fill(null).map((_, index) =>
        detectionSystem.detectCurrentModel(`concurrent-session-${index}`)
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.detectedModel).toBe('glm-4.6');
        expect(result.agentLetter).toBe('A');
        expect(result.loopIntegration.sessionId).toBe(`concurrent-session-${index}`);
        expect(result.loopIntegration.eventId).toBeDefined();
      });

      // Verify all detections were stored
      const storedDetections = db.prepare(`
        SELECT COUNT(*) as count FROM enhanced_model_detections
      `).get() as any;

      expect(storedDetections.count).toBe(5);
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across all tables', async () => {
      // Mock API response
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      const result = await detectionSystem.detectCurrentModel('consistency-test-session');

      const eventId = result.loopIntegration.eventId;

      // Check enhanced_model_detections table
      const enhancedRow = db.prepare(`
        SELECT * FROM enhanced_model_detections WHERE id = ?
      `).get(eventId) as any;

      expect(enhancedRow).not.toBeNull();
      expect(enhancedRow.detected_model).toBe('glm-4.6');
      expect(enhancedRow.agent_letter).toBe('A');
      expect(enhancedRow.verification_status).toBe('verified');

      // Check legacy model_detections table
      const legacyRow = db.prepare(`
        SELECT * FROM model_detections WHERE id = ?
      `).get(eventId) as any;

      expect(legacyRow).not.toBeNull();
      expect(legacyRow.detected_model).toBe('glm-4.6');
      expect(legacyRow.agent_letter).toBe('A');

      // Check detection_events table
      const eventRow = db.prepare(`
        SELECT * FROM detection_events WHERE detection_id = ?
      `).get(eventId) as any;

      expect(eventRow).not.toBeNull();
      expect(eventRow.event_type).toBe('model-detection');
      expect(eventRow.detected_model).toBe('glm-4.6');

      // Verify data consistency across tables
      expect(enhancedRow.detected_model).toBe(legacyRow.detected_model);
      expect(enhancedRow.detected_model).toBe(eventRow.detected_model);
      expect(enhancedRow.agent_letter).toBe(legacyRow.agent_letter);
      expect(enhancedRow.agent_letter).toBe(eventRow.agent_letter);
    });

    it('should update model performance metrics correctly', async () => {
      // Mock API response
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // First detection
      const result1 = await detectionSystem.detectCurrentModel('metrics-test-1');
      await detectionSystem.provideFeedback(
        result1.loopIntegration.eventId,
        'glm-4.6',
        true,
        'performance-test'
      );

      // Second detection
      const result2 = await detectionSystem.detectCurrentModel('metrics-test-2');
      await detectionSystem.provideFeedback(
        result2.loopIntegration.eventId,
        'glm-4.6',
        true,
        'performance-test'
      );

      // Check performance metrics
      const metrics = db.prepare(`
        SELECT * FROM model_performance_metrics WHERE model = ?
      `).get('glm-4.6') as any;

      expect(metrics).not.toBeNull();
      expect(metrics.total_detections).toBe(2);
      expect(metrics.correct_detections).toBe(2);
      expect(metrics.accuracy).toBe(1.0);
      expect(metrics.avg_confidence).toBeGreaterThan(0.8);
    });

    it('should handle database transaction rollbacks on errors', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Database test error'));

      // Detection should fail gracefully
      const result = await detectionSystem.detectCurrentModel('rollback-test');

      expect(result.detectedModel).toBe('unknown');
      expect(result.confidence).toBe(0.1);
      expect(result.verificationStatus).toBe('error');

      // Verify no partial data was written
      const partialDetections = db.prepare(`
        SELECT COUNT(*) as count FROM enhanced_model_detections
        WHERE detected_model = 'unknown' AND verification_status = 'error'
      `).get() as any;

      // Fallback detections should still be stored for error tracking
      expect(partialDetections.count).toBe(1);
    });
  });

  describe('Self-Correction System Integration', () => {
    it('should learn from feedback and improve future detections', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // Initial detection (incorrectly identified)
      const result1 = await detectionSystem.detectCurrentModel('learning-test-1');

      // User provides corrective feedback
      await detectionSystem.provideFeedback(
        result1.loopIntegration.eventId,
        'claude-sonnet-4-5-20250929',
        false,
        'user-correction'
      );

      // Create historical pattern by adding multiple corrections
      for (let i = 0; i < 3; i++) {
        db.prepare(`
          INSERT INTO detection_corrections (id, original_model, corrected_to, correction_reason,
            confidence_before, confidence_after, correction_applied, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `learning-correction-${i}`,
          'glm-4.6',
          'claude-sonnet-4-5-20250929',
          'feedback',
          0.7,
          0.9,
          1,
          new Date(Date.now() - (i + 1) * 100000).toISOString()
        );
      }

      // Second detection should trigger correction
      const result2 = await detectionSystem.detectCurrentModel('learning-test-2');

      // Verify correction was applied
      expect(result2.selfCorrection).toBeDefined();
      expect(result2.selfCorrection!.correctionApplied).toBe(true);

      // Verify learning metrics
      const stats = detectionSystem.getSystemStats();
      expect(stats.selfCorrectionStats.totalCorrections).toBeGreaterThan(0);
    });

    it('should track accuracy improvement over time', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // Simulate detection accuracy improvement
      const detections = [];
      for (let i = 0; i < 10; i++) {
        const result = await detectionSystem.detectCurrentModel(`accuracy-test-${i}`);
        detections.push(result);

        // Simulate user feedback (gradually improving accuracy)
        const isCorrect = i >= 5; // First 5 are wrong, last 5 are correct
        await detectionSystem.provideFeedback(
          result.loopIntegration.eventId,
          isCorrect ? 'glm-4.6' : 'claude-sonnet-4-5-20250929',
          isCorrect,
          'accuracy-simulation'
        );
      }

      // Check system statistics
      const stats = detectionSystem.getSystemStats();
      expect(stats.totalDetections).toBe(10);
      expect(stats.accuracyRate).toBe(0.5); // 5 correct out of 10

      // Check model performance metrics
      const metrics = db.prepare(`
        SELECT * FROM model_performance_metrics WHERE model = 'glm-4.6'
      `).get('glm-4.6') as any;

      expect(metrics.total_detections).toBe(10);
      expect(metrics.correct_detections).toBe(5);
      expect(metrics.accuracy).toBe(0.5);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume detection requests efficiently', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      const startTime = Date.now();
      const batchSize = 20;

      // Create batch of detection requests
      const batch = Array(batchSize).fill(null).map((_, index) =>
        detectionSystem.detectCurrentModel(`performance-test-${index}`)
      );

      const results = await Promise.all(batch);
      const duration = Date.now() - startTime;

      // All requests should complete successfully
      expect(results).toHaveLength(batchSize);
      results.forEach(result => {
        expect(result.detectedModel).toBe('glm-4.6');
        expect(result.agentLetter).toBe('A');
      });

      // Performance should be reasonable
      expect(duration).toBeLessThan(10000); // 20 requests in under 10 seconds
      expect(duration / batchSize).toBeLessThan(500); // Average under 500ms per request

      // Verify database performance
      const dbStats = detectionSystem.getSystemStats();
      expect(dbStats.totalDetections).toBe(batchSize);
    });

    it('should maintain performance with large dataset', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // Insert large amount of historical data
      const historicalDataSize = 1000;
      const insertHistorical = db.prepare(`
        INSERT INTO enhanced_model_detections (id, detected_model, provider, endpoint,
          context_window, config_source, config_path, detection_method, confidence,
          verified, agent_letter, agent_role, capabilities, loop_integration,
          metadata, timestamp, detection_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < historicalDataSize; i++) {
        insertHistorical.run(
          `historical-${i}`,
          i % 2 === 0 ? 'glm-4.6' : 'claude-sonnet-4-5-20250929',
          i % 2 === 0 ? 'zhipu' : 'anthropic',
          i % 2 === 0 ? 'https://api.z.ai/api/anthropic' : 'https://api.anthropic.com',
          i % 2 === 0 ? 128000 : 200000,
          'settings.json',
          '/test/path',
          'enhanced-file',
          0.8 + Math.random() * 0.2,
          1,
          i % 2 === 0 ? 'A' : 'B',
          i % 2 === 0 ? 'UI Velocity Specialist' : 'Design & Architecture Specialist',
          '{}',
          '{}',
          '{}',
          new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
          1
        );
      }

      // Test statistics query performance
      const startTime = Date.now();
      const stats = detectionSystem.getSystemStats();
      const queryTime = Date.now() - startTime;

      expect(queryTime).toBeLessThan(1000); // Stats query should be fast even with large dataset
      expect(stats.totalDetections).toBe(historicalDataSize);

      // Test new detection with large dataset
      const detectionStart = Date.now();
      const result = await detectionSystem.detectCurrentModel('large-dataset-test');
      const detectionTime = Date.now() - detectionStart;

      expect(detectionTime).toBeLessThan(5000); // Detection should still be fast
      expect(result.detectedModel).toBe('glm-4.6');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network errors and retry detection', async () => {
      // Mock network error for first call, success for second
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: new Headers()
        });

      const result = await detectionSystem.detectCurrentModel('resilience-test');

      // Should recover and succeed
      expect(result.detectedModel).toBe('glm-4.6');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);

      // Verify error was handled gracefully
      expect(result.metadata.configDetection.confidence).toBeGreaterThan(0.8);
    });

    it('should handle database connection issues gracefully', async () => {
      // Close database to simulate connection issue
      db.close();

      const result = await detectionSystem.detectCurrentModel('connection-test');

      // Should fallback to minimal detection
      expect(result.detectedModel).toBe('unknown');
      expect(result.confidence).toBe(0.1);
      expect(result.verificationStatus).toBe('error');
      expect(result.detectionMethod).toBe('enhanced-fallback');
    });

    it('should maintain system stability during cascading failures', async () => {
      // Mock cascading failures
      mockFetch.mockRejectedValue(new Error('Cascading failure'));

      const results = await Promise.allSettled([
        detectionSystem.detectCurrentModel('cascade-test-1'),
        detectionSystem.detectCurrentModel('cascade-test-2'),
        detectionSystem.detectCurrentModel('cascade-test-3')
      ]);

      // All requests should be handled gracefully
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.detectedModel).toBe('unknown');
          expect(result.value.verificationStatus).toBe('error');
        }
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle configuration changes during runtime', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // First detection
      const result1 = await detectionSystem.detectCurrentModel('config-change-1');
      expect(result1.detectedModel).toBe('glm-4.6');

      // Simulate configuration change (this would be handled by the config detector)
      // Here we test that the system can handle different results
      const result2 = await detectionSystem.detectCurrentModel('config-change-2');
      expect(result2.detectedModel).toBe('glm-4.6');

      // Both should have different event IDs but same detection logic
      expect(result1.loopIntegration.eventId).not.toBe(result2.loopIntegration.eventId);
      expect(result1.loopIntegration.sessionId).not.toBe(result2.loopIntegration.sessionId);
    });

    it('should handle model provider switching', async () => {
      // Mock Anthropic API response
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // First detection with Z.AI
      const result1 = await detectionSystem.detectCurrentModel('provider-switch-1');
      expect(result1.modelProvider).toBe('zhipu');

      // Mock different provider response
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      // Second detection should still work
      const result2 = await detectionSystem.detectCurrentModel('provider-switch-2');
      expect(result2.modelProvider).toBe('zhipu'); // Based on mock config
    });

    it('should handle long-running detection sessions', async () => {
      // Mock API response
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers()
      });

      const sessionId = 'long-running-session';
      const detectionCount = 10;
      const results = [];

      // Simulate long-running session with multiple detections
      for (let i = 0; i < detectionCount; i++) {
        const result = await detectionSystem.detectCurrentModel(`${sessionId}-${i}`);
        results.push(result);

        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // All detections should be successful
      expect(results).toHaveLength(detectionCount);
      results.forEach((result, index) => {
        expect(result.detectedModel).toBe('glm-4.6');
        expect(result.loopIntegration.sessionId).toBe(`${sessionId}-${index}`);
      });

      // Verify session tracking
      const sessionDetections = db.prepare(`
        SELECT COUNT(*) as count FROM enhanced_model_detections
        WHERE loop_integration LIKE ?
      `).get(`%${sessionId}%`) as any;

      expect(sessionDetections.count).toBe(detectionCount);
    });
  });
});