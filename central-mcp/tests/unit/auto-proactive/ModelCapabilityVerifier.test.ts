/**
 * Model Capability Verifier Unit Tests
 * ====================================
 *
 * Comprehensive unit tests for the model capability verification system.
 * Tests model registry lookup, API testing, capability detection,
 * and agent mapping logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ModelCapabilityVerifier, ModelVerificationResult } from '../../../src/auto-proactive/ModelCapabilityVerifier.js';
import { ClaudeConfig } from '../../../src/auto-proactive/ActiveConfigurationDetector.js';

// Mock dependencies
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock fetch for API testing
global.fetch = vi.fn();

describe('ModelCapabilityVerifier', () => {
  let verifier: ModelCapabilityVerifier;
  let mockFetch: Mock;

  beforeEach(() => {
    verifier = new ModelCapabilityVerifier();
    mockFetch = vi.mocked(global.fetch);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyModelCapabilities', () => {
    it('should verify GLM-4.6 model correctly', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
          ANTHROPIC_AUTH_TOKEN: 'test-token'
        }
      };

      const result = await verifier.verifyModelCapabilities('glm-4.6', config);

      expect(result.model).toBe('glm-4.6');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(0.90);
      expect(result.agentMapping.letter).toBe('A');
      expect(result.agentMapping.role).toBe('UI Velocity Specialist');
      expect(result.detectedCapabilities.reasoning).toBe('advanced');
      expect(result.detectedCapabilities.coding).toBe('advanced');
      expect(result.detectedCapabilities.multimodal).toBe(true);
      expect(result.detectedCapabilities.maxTokens).toBe(8192);
    });

    it('should verify Claude Sonnet-4.5 model correctly', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      const result = await verifier.verifyModelCapabilities('claude-sonnet-4-5-20250929', config);

      expect(result.model).toBe('claude-sonnet-4-5-20250929');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.agentMapping.letter).toBe('B');
      expect(result.agentMapping.role).toBe('Design & Architecture Specialist');
      expect(result.detectedCapabilities.reasoning).toBe('expert');
      expect(result.detectedCapabilities.coding).toBe('expert');
      expect(result.detectedCapabilities.multimodal).toBe(true);
    });

    it('should verify Claude Sonnet-4 (1M context) model correctly', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      const result = await verifier.verifyModelCapabilities('claude-sonnet-4-20250514', config);

      expect(result.model).toBe('claude-sonnet-4-20250514');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.agentMapping.letter).toBe('D');
      expect(result.agentMapping.role).toBe('Integration Specialist');
      expect(result.metadata.provider).toBe('anthropic');
      expect(result.testsPassed).toBe(1);
      expect(result.testsTotal).toBe(1);
    });

    it('should verify Gemini-2.5-Pro model correctly', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.google.com',
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      const result = await verifier.verifyModelCapabilities('gemini-2.5-pro', config);

      expect(result.model).toBe('gemini-2.5-pro');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.agentMapping.letter).toBe('E');
      expect(result.agentMapping.role).toBe('Operations & Supervisor');
      expect(result.detectedCapabilities.reasoning).toBe('expert');
    });

    it('should handle unknown models with capability detection', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      // Mock successful API test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          content: [{ text: 'OK' }]
        })
      });

      const result = await verifier.verifyModelCapabilities('unknown-model-1.0', config);

      expect(result.model).toBe('unknown-model-1.0');
      expect(result.confidence).toBeLessThan(0.8); // Lower confidence for unknown models
      expect(result.agentMapping.letter).toBe('B'); // Default to Design
      expect(result.agentMapping.role).toBe('General Purpose (Default)');
      expect(result.testResults.length).toBeGreaterThan(1); // API test + analysis
    });

    it('should handle API authentication failures gracefully', async () => {
      const config: ClaudeConfig = {
        env: {} // No authentication
      };

      const result = await verifier.verifyModelCapabilities('claude-sonnet-4-5-20250929', config);

      expect(result.verified).toBe(false);
      expect(result.confidence).toBe(0.0);
      expect(result.metadata.warnings).toContain('API access failed');
    });

    it('should handle network errors during API testing', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await verifier.verifyModelCapabilities('claude-sonnet-4-5-20250929', config);

      expect(result.verified).toBe(false);
      expect(result.confidence).toBe(0.0);
      expect(result.metadata.warnings).toContain('API access failed');
    });
  });

  describe('verifyModelAccess', () => {
    it('should handle 401 authentication errors as success', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'invalid-key'
        }
      };

      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false
      });

      const result = await (verifier as any).verifyModelAccess('claude-sonnet-4-5-20250929', config);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.metadata.reason).toBe('auth-required');
      expect(result.metadata.modelAccessible).toBe(true);
    });

    it('should handle 403 forbidden errors as success', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_AUTH_TOKEN: 'expired-token'
        }
      };

      mockFetch.mockResolvedValueOnce({
        status: 403,
        ok: false
      });

      const result = await (verifier as any).verifyModelAccess('claude-sonnet-4-5-20250929', config);

      expect(result.success).toBe(true);
      expect(result.metadata.reason).toBe('auth-required');
    });

    it('should handle successful API responses', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'valid-key'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          content: [{ text: 'OK' }]
        })
      });

      const result = await (verifier as any).verifyModelAccess('claude-sonnet-4-5-20250929', config);

      expect(result.success).toBe(true);
      expect(result.metadata.reason).toBe('success');
      expect(result.response).toBeDefined();
    });

    it('should handle missing authentication', async () => {
      const config: ClaudeConfig = {};

      const result = await (verifier as any).verifyModelAccess('claude-sonnet-4-5-20250929', config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No authentication available');
      expect(result.metadata.reason).toBe('missing-auth');
    });

    it('should handle timeout errors', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await (verifier as any).verifyModelAccess('claude-sonnet-4-5-20250929', config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: Request timeout');
      expect(result.metadata.errorType).toBe('timeout');
    });
  });

  describe('analyzeCapabilities', () => {
    it('should correctly analyze Claude model capabilities', () => {
      const testCases = [
        {
          model: 'claude-opus-4-1-20250805',
          expected: {
            reasoning: 'expert',
            coding: 'advanced',
            multimodal: true,
            maxTokens: 4096
          }
        },
        {
          model: 'claude-sonnet-4-20250514',
          expected: {
            reasoning: 'expert',
            coding: 'expert',
            multimodal: true,
            maxTokens: 8192
          }
        },
        {
          model: 'claude-sonnet-3-5-20240620',
          expected: {
            reasoning: 'advanced',
            coding: 'advanced',
            multimodal: true,
            maxTokens: 4096
          }
        }
      ];

      for (const { model, expected } of testCases) {
        const result = (verifier as any).analyzeCapabilities(model);
        expect(result.reasoning).toBe(expected.reasoning);
        expect(result.coding).toBe(expected.coding);
        expect(result.multimodal).toBe(expected.multimodal);
        expect(result.maxTokens).toBe(expected.maxTokens);
      }
    });

    it('should correctly analyze GLM model capabilities', () => {
      const testCases = [
        {
          model: 'glm-4.6',
          expected: {
            reasoning: 'advanced',
            coding: 'advanced',
            multimodal: true,
            maxTokens: 8192
          }
        },
        {
          model: 'glm-4-flash',
          expected: {
            reasoning: 'advanced',
            coding: 'advanced',
            multimodal: true,
            maxTokens: 4096
          }
        }
      ];

      for (const { model, expected } of testCases) {
        const result = (verifier as any).analyzeCapabilities(model);
        expect(result.reasoning).toBe(expected.reasoning);
        expect(result.coding).toBe(expected.coding);
        expect(result.multimodal).toBe(expected.multimodal);
        expect(result.maxTokens).toBe(expected.maxTokens);
      }
    });

    it('should correctly analyze Gemini model capabilities', () => {
      const result = (verifier as any).analyzeCapabilities('gemini-2.5-pro');

      expect(result.reasoning).toBe('expert');
      expect(result.coding).toBe('advanced');
      expect(result.multimodal).toBe(true);
      expect(result.maxTokens).toBe(8192);
      expect(result.supportedFeatures).toContain('operations');
      expect(result.supportedFeatures).toContain('2m-context');
    });

    it('should correctly analyze DeepSeek model capabilities', () => {
      const result = (verifier as any).analyzeCapabilities('deepseek-coder');

      expect(result.reasoning).toBe('advanced');
      expect(result.coding).toBe('expert');
      expect(result.multimodal).toBe(false);
      expect(result.supportedFeatures).toContain('specialized-coding');
      expect(result.supportedFeatures).toContain('backend-development');
    });

    it('should handle unknown models with basic capabilities', () => {
      const result = (verifier as any).analyzeCapabilities('unknown-model-1.0');

      expect(result.reasoning).toBe('basic');
      expect(result.coding).toBe('basic');
      expect(result.multimodal).toBe(false);
      expect(result.maxTokens).toBe(4096);
    });
  });

  describe('detectProvider', () => {
    it('should detect Zhipu AI provider', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('zhipu');
    });

    it('should detect DeepSeek provider', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.deepseek.com'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('deepseek');
    });

    it('should detect Google provider', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.google.com'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('google');
    });

    it('should detect local provider', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'http://localhost:8080'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('local');
    });

    it('should detect Anthropic provider by default', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('anthropic');
    });

    it('should detect unknown provider for custom endpoints', () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_BASE_URL: 'https://custom.api.example.com'
        }
      };

      const result = (verifier as any).detectProvider(config);
      expect(result).toBe('unknown');
    });
  });

  describe('mapCapabilitiesToAgent', () => {
    it('should map expert reasoning and coding to Design & Architecture', () => {
      const capabilities = {
        reasoning: 'expert',
        coding: 'expert',
        multimodal: true,
        maxTokens: 8192
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('B');
      expect(result.role).toBe('Design & Architecture Specialist');
      expect(result.confidence).toBe(0.90);
    });

    it('should map strong all-around capabilities to Integration Specialist', () => {
      const capabilities = {
        reasoning: 'advanced',
        coding: 'advanced',
        multimodal: true,
        maxTokens: 8192
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('D');
      expect(result.role).toBe('Integration Specialist');
      expect(result.confidence).toBe(0.85);
    });

    it('should map expert coding without vision to Backend Specialist', () => {
      const capabilities = {
        reasoning: 'basic',
        coding: 'expert',
        multimodal: false,
        maxTokens: 4096
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('C');
      expect(result.role).toBe('Backend Specialist');
      expect(result.confidence).toBe(0.80);
    });

    it('should map strong reasoning with UI features to UI Velocity', () => {
      const capabilities = {
        reasoning: 'advanced',
        coding: 'basic',
        multimodal: true,
        maxTokens: 4096,
        supportedFeatures: ['ui-development', 'rapid-prototyping']
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('A');
      expect(result.role).toBe('UI Velocity Specialist');
      expect(result.confidence).toBe(0.75);
    });

    it('should map operations capabilities to Operations & Supervisor', () => {
      const capabilities = {
        reasoning: 'expert',
        coding: 'advanced',
        multimodal: true,
        maxTokens: 8192,
        supportedFeatures: ['operations', 'monitoring', 'optimization']
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('E');
      expect(result.role).toBe('Operations & Supervisor');
      expect(result.confidence).toBe(0.80);
    });

    it('should default to Design for basic capabilities', () => {
      const capabilities = {
        reasoning: 'basic',
        coding: 'basic',
        multimodal: false,
        maxTokens: 4096
      };

      const result = (verifier as any).mapCapabilitiesToAgent(capabilities);
      expect(result.letter).toBe('B');
      expect(result.role).toBe('General Purpose (Default)');
      expect(result.confidence).toBe(0.40);
    });
  });

  describe('registry management', () => {
    it('should return model info from registry', () => {
      const result = verifier.getModelInfo('glm-4.6');

      expect(result).not.toBeNull();
      expect(result!.model).toBe('glm-4.6');
      expect(result!.provider).toBe('zhipu');
      expect(result!.agentMapping.letter).toBe('A');
    });

    it('should return null for unknown models', () => {
      const result = verifier.getModelInfo('unknown-model');

      expect(result).toBeNull();
    });

    it('should return all models in registry', () => {
      const result = verifier.getAllModels();

      expect(result).toHaveProperty('glm-4.6');
      expect(result).toHaveProperty('claude-sonnet-4-5-20250929');
      expect(result).toHaveProperty('claude-sonnet-4-20250514');
      expect(result).toHaveProperty('unknown'); // Fallback model
    });

    it('should update model performance data', () => {
      const performanceData = {
        avgResponseTime: 1500,
        reliability: 0.98
      };

      verifier.updateModelPerformance('glm-4.6', performanceData);

      const modelInfo = verifier.getModelInfo('glm-4.6');
      expect(modelInfo!.performance.avgResponseTime).toBe(1500);
      expect(modelInfo!.performance.reliability).toBe(0.98);
    });

    it('should get agent mapping for model', () => {
      const result = verifier.getAgentMapping('glm-4.6');

      expect(result).not.toBeNull();
      expect(result!.letter).toBe('A');
      expect(result!.role).toBe('UI Velocity Specialist');
      expect(result!.confidence).toBe(0.90);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty model names', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      await expect(verifier.verifyModelCapabilities('', config)).rejects.toThrow();
    });

    it('should handle null/undefined config', async () => {
      await expect(verifier.verifyModelCapabilities('glm-4.6', null as any)).rejects.toThrow();
      await expect(verifier.verifyModelCapabilities('glm-4.6', undefined as any)).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      mockFetch.mockRejectedValueOnce(new Error('Malformed response'));

      const result = await verifier.verifyModelCapabilities('glm-4.6', config);

      expect(result.verified).toBe(true); // From registry
      expect(result.testResults.some(t => t.error)).toBe(true);
    });

    it('should handle slow API responses', async () => {
      const config: ClaudeConfig = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      // Mock slow response
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          status: 401,
          ok: false
        }), 6000))
      );

      const result = await verifier.verifyModelCapabilities('glm-4.6', config);

      expect(result.verified).toBe(true); // From registry, API test times out
    });
  });
});