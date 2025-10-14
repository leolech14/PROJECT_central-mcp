/**
 * Active Configuration Detector Unit Tests
 * =====================================
 *
 * Comprehensive unit tests for the reality-based configuration detection system.
 * Tests all detection methods: process inspection, endpoint verification,
 * file analysis, and cross-verification.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ActiveConfigurationDetector, ActiveConfigurationResult } from '../../../src/auto-proactive/ActiveConfigurationDetector.js';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync, statSync } from 'fs';

// Mock dependencies
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn()
  };
});

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock fetch for endpoint testing
global.fetch = vi.fn();

describe('ActiveConfigurationDetector', () => {
  let detector: ActiveConfigurationDetector;
  let mockExistsSync: Mock;
  let mockReadFileSync: Mock;
  let mockStatSync: Mock;
  let mockFetch: Mock;

  beforeEach(() => {
    detector = new ActiveConfigurationDetector();
    mockExistsSync = vi.mocked(existsSync);
    mockReadFileSync = vi.mocked(readFileSync);
    mockStatSync = vi.mocked(statSync);
    mockFetch = vi.mocked(global.fetch);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectActiveConfiguration', () => {
    it('should detect Z.AI configuration correctly', async () => {
      // Setup mock environment
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');

      const mockConfig = {
        model: 'glm-4.6',
        defaultModel: 'claude-sonnet-4-5-20250929',
        env: {
          ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
          ANTHROPIC_AUTH_TOKEN: 'test-token'
        }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('process');
      expect(result.actualModel).toBe('glm-4.6');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.activeConfigPath).toContain('settings-zai.json');
      expect(result.verificationStatus).toBe('verified');
    });

    it('should detect Anthropic configuration correctly', async () => {
      // Setup mock environment
      vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
      vi.stubEnv('ANTHROPIC_BETA', 'context-1m-2025-08-07');

      const mockConfig = {
        defaultModel: 'claude-sonnet-4-20250514',
        contextWindow: 1000000,
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BETA: 'context-1m-2025-08-07'
        }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('process');
      expect(result.actualModel).toBe('claude-sonnet-4-20250514');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.verificationStatus).toBe('verified');
    });

    it('should fallback to endpoint verification when process detection fails', async () => {
      // Mock endpoint response
      mockFetch.mockResolvedValueOnce({
        status: 401, // Auth required - indicates endpoint is accessible
        ok: false
      });

      const mockConfig = {
        model: 'claude-sonnet-4-5-20250929',
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('endpoint');
      expect(result.actualModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should use file analysis when other methods fail', async () => {
      const mockConfigs = [
        {
          file: 'settings-zai.json',
          config: {
            model: 'glm-4.6',
            env: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
          },
          priority: 95
        },
        {
          file: 'settings.json',
          config: {
            defaultModel: 'claude-sonnet-4-5-20250929',
            env: { ANTHROPIC_API_KEY: 'test-key' }
          },
          priority: 85
        }
      ];

      mockExistsSync.mockImplementation((path) => {
        return mockConfigs.some(config => path.includes(config.file));
      });

      mockReadFileSync.mockImplementation((path) => {
        const config = mockConfigs.find(c => path.includes(c.file));
        return JSON.stringify(config.config);
      });

      mockStatSync.mockImplementation((path) => {
        const config = mockConfigs.find(c => path.includes(c.file));
        return { mtime: new Date() } as any;
      });

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('file');
      expect(result.actualModel).toBe('glm-4.6'); // Higher priority
      expect(result.confidence).toBe(0.95);
    });

    it('should return fallback configuration when all methods fail', async () => {
      mockExistsSync.mockReturnValue(false);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('default');
      expect(result.actualModel).toBe('claude-sonnet-4-5-20250929');
      expect(result.confidence).toBe(0.10);
      expect(result.verificationStatus).toBe('error');
    });
  });

  describe('calculateConfigPriority', () => {
    it('should give highest priority to Z.AI configuration with explicit model', () => {
      const config = {
        model: 'glm-4.6',
        env: {
          ANTHROPIC_AUTH_TOKEN: 'test-token',
          ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic'
        }
      };

      // Access private method for testing
      const priority = (detector as any).calculateConfigPriority('settings-zai.json', config);
      expect(priority).toBe(100); // 80 (Z.AI) + 20 (explicit model) + 15 (auth) + 25 (custom endpoint)
    });

    it('should give priority to Anthropic configuration with 1M context', () => {
      const config = {
        defaultModel: 'claude-sonnet-4-20250514',
        contextWindow: 1000000,
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BETA: 'context-1m-2025-08-07'
        }
      };

      const priority = (detector as any).calculateConfigPriority('settings.json', config);
      expect(priority).toBe(95); // 70 (main config) + 10 (default model) + 15 (auth) + 10 (beta)
    });

    it('should handle unknown config files with minimal priority', () => {
      const config = {
        env: { ANTHROPIC_API_KEY: 'test-key' }
      };

      const priority = (detector as any).calculateConfigPriority('unknown.json', config);
      expect(priority).toBe(25); // 10 (unknown) + 15 (auth)
    });
  });

  describe('normalizeModelName', () => {
    it('should normalize common model aliases', () => {
      const testCases = [
        ['sonnet-4', 'claude-sonnet-4-20250514'],
        ['claude-sonnet-4', 'claude-sonnet-4-20250514'],
        ['claude-sonnet-4-5', 'claude-sonnet-4-5-20250929'],
        ['glm-4.6', 'glm-4.6'],
        ['claude-3-5-sonnet-20241022', 'claude-sonnet-4-5-20250929']
      ];

      for (const [input, expected] of testCases) {
        const result = (detector as any).normalizeModelName(input);
        expect(result).toBe(expected);
      }
    });

    it('should return original model name for unknown models', () => {
      const result = (detector as any).normalizeModelName('unknown-model-1.0');
      expect(result).toBe('unknown-model-1.0');
    });
  });

  describe('verifyConsistency', () => {
    it('should pass consistency check for identical models', () => {
      const candidates = [
        { actualModel: 'glm-4.6', confidence: 0.9 },
        { actualModel: 'glm-4.6', confidence: 0.85 }
      ];

      const result = (detector as any).verifyConsistency(candidates);
      expect(result.consistent).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect model inconsistencies', () => {
      const candidates = [
        { actualModel: 'glm-4.6', confidence: 0.9 },
        { actualModel: 'claude-sonnet-4-5-20250929', confidence: 0.8 }
      ];

      const result = (detector as any).verifyConsistency(candidates);
      expect(result.consistent).toBe(false);
      expect(result.warnings).toContain('Model inconsistency: glm-4.6 vs claude-sonnet-4-5-20250929');
    });

    it('should detect large confidence spreads', () => {
      const candidates = [
        { actualModel: 'glm-4.6', confidence: 0.95 },
        { actualModel: 'glm-4.6', confidence: 0.6 }
      ];

      const result = (detector as any).verifyConsistency(candidates);
      expect(result.consistent).toBe(true);
      expect(result.warnings).toContain('Large confidence spread: 95% vs 60%');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json content');

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('file'); // Falls back to file analysis
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should handle file system permission errors', async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('default');
      expect(result.verificationStatus).toBe('error');
    });

    it('should handle network timeouts in endpoint verification', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const mockConfig = {
        model: 'claude-sonnet-4-5-20250929',
        env: { ANTHROPIC_API_KEY: 'test-key' }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.detectionMethod).toBe('file');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle empty configuration files', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{}');
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.actualModel).toBe('claude-sonnet-4-5-20250929'); // Default fallback
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should prioritize explicit model over default model', async () => {
      const mockConfig = {
        model: 'glm-4.6',
        defaultModel: 'claude-sonnet-4-5-20250929'
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const result = await detector.detectActiveConfiguration();

      expect(result.actualModel).toBe('glm-4.6'); // Explicit model takes priority
    });
  });

  describe('performance and caching', () => {
    it('should complete detection within reasonable time', async () => {
      const mockConfig = {
        model: 'glm-4.6',
        env: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const startTime = Date.now();
      await detector.detectActiveConfiguration();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent detections', async () => {
      const mockConfig = {
        model: 'claude-sonnet-4-5-20250929',
        env: { ANTHROPIC_API_KEY: 'test-key' }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockStatSync.mockReturnValue({ mtime: new Date() } as any);

      const promises = Array(5).fill(null).map(() => detector.detectActiveConfiguration());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.actualModel).toBe('claude-sonnet-4-5-20250929');
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
  });
});