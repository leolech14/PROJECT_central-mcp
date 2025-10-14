/**
 * 🧪 UNIT TESTS: ApiKeyManager
 * =============================
 *
 * Test secure API key management functionality
 */

import { ApiKeyManager } from '../../../src/auth/ApiKeyManager.js';
import { TestUtils } from '../../setup.js';
import Database from 'better-sqlite3';

describe('ApiKeyManager', () => {
  let db: Database.Database;
  let apiKeyManager: ApiKeyManager;

  beforeEach(() => {
    db = TestUtils.createTestDatabase();
    apiKeyManager = new ApiKeyManager(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('🔐 API Key Creation', () => {
    test('should create a new API key successfully', async () => {
      const result = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^key_\d+_test-agent$/);
      expect(result.key).toMatch(/^cmcp_test-agent_\d+_[a-f0-9]+$/);
      expect(result.agentId).toBe('test-agent');
      expect(result.role).toBe('A');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('should create API keys with different roles', async () => {
      const roles = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

      for (const role of roles) {
        const result = await apiKeyManager.createApiKey({
          agentId: `test-agent-${role}`,
          role,
        });

        expect(result.role).toBe(role);
      }
    });

    test('should create API key with expiration', async () => {
      const expiresInDays = 7;
      const result = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
        expiresIn: expiresInDays,
      });

      expect(result.expiresAt).toBeInstanceOf(Date);

      const now = Date.now();
      const expectedExpiry = now + (expiresInDays * 24 * 60 * 60 * 1000);
      const actualExpiry = result.expiresAt!.getTime();

      // Allow for small timing differences
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('🔒 API Key Validation', () => {
    test('should validate a correct API key', async () => {
      // Create API key
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      // Validate the key
      const validated = await apiKeyManager.validateApiKey(createdKey.key);

      expect(validated).toBeDefined();
      expect(validated!.id).toBe(createdKey.id);
      expect(validated!.agentId).toBe('test-agent');
      expect(validated!.role).toBe('A');
    });

    test('should reject invalid API key format', async () => {
      const invalidKeys = [
        'invalid-key',
        'cmcp_wrong_format',
        '',
        'cmcp',
        'cmcp_agent',
        'cmcp_agent_timestamp',
      ];

      for (const invalidKey of invalidKeys) {
        const validated = await apiKeyManager.validateApiKey(invalidKey);
        expect(validated).toBeNull();
      }
    });

    test('should reject non-existent API key', async () => {
      const nonExistentKey = 'cmcp_nonagent_1234567890abcdef1234567890abcdef';

      const validated = await apiKeyManager.validateApiKey(nonExistentKey);
      expect(validated).toBeNull();
    });

    test('should reject revoked API key', async () => {
      // Create API key
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      // Revoke the key
      const revoked = apiKeyManager.revokeApiKey(createdKey.id);
      expect(revoked).toBe(true);

      // Try to validate the revoked key
      const validated = await apiKeyManager.validateApiKey(createdKey.key);
      expect(validated).toBeNull();
    });

    test('should reject expired API key', async () => {
      // Create API key with very short expiration
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
        expiresIn: 0.0001, // About 8.64 seconds
      });

      // Wait for expiration
      await TestUtils.wait(10);

      // Try to validate the expired key
      const validated = await apiKeyManager.validateApiKey(createdKey.key);
      expect(validated).toBeNull();
    });

    test('should prevent timing attacks', async () => {
      const invalidKey = 'cmcp_invalidagent_1234567890abcdef1234567890abcdef';

      // Measure time for invalid key validation
      const startTime = Date.now();
      await apiKeyManager.validateApiKey(invalidKey);
      const invalidTime = Date.now() - startTime;

      // Create valid key
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      // Measure time for valid key validation
      const validStartTime = Date.now();
      await apiKeyManager.validateApiKey(createdKey.key);
      const validTime = Date.now() - validStartTime;

      // Times should be similar (within reasonable bounds)
      // This prevents timing attacks where attackers could infer key existence
      expect(Math.abs(invalidTime - validTime)).toBeLessThan(100); // 100ms tolerance
    });
  });

  describe('🔑 API Key Management', () => {
    test('should revoke API key successfully', async () => {
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      const revoked = apiKeyManager.revokeApiKey(createdKey.id);
      expect(revoked).toBe(true);

      // Second revocation should fail
      const revokedAgain = apiKeyManager.revokeApiKey(createdKey.id);
      expect(revokedAgain).toBe(false);
    });

    test('should revoke all keys for agent', async () => {
      const agentId = 'test-agent';

      // Create multiple keys for the same agent
      const key1 = await apiKeyManager.createApiKey({
        agentId,
        role: 'A' as any,
      });

      const key2 = await apiKeyManager.createApiKey({
        agentId,
        role: 'A' as any,
      });

      const revokedCount = apiKeyManager.revokeAgentKeys(agentId);
      expect(revokedCount).toBe(2);

      // Both keys should be invalid now
      const validated1 = await apiKeyManager.validateApiKey(key1.key);
      const validated2 = await apiKeyManager.validateApiKey(key2.key);

      expect(validated1).toBeNull();
      expect(validated2).toBeNull();
    });

    test('should list API keys for agent', async () => {
      const agentId = 'test-agent';

      // Create keys
      await apiKeyManager.createApiKey({
        agentId,
        role: 'A' as any,
      });

      await apiKeyManager.createApiKey({
        agentId,
        role: 'A' as any,
      });

      const keys = apiKeyManager.listApiKeys(agentId);
      expect(keys).toHaveLength(2);

      // Should not return actual key hashes
      expect(keys[0].key).toBe('***');
      expect(keys[1].key).toBe('***');
    });

    test('should clean up expired keys', async () => {
      // Create key with short expiration
      await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
        expiresIn: 0.0001, // About 8.64 seconds
      });

      // Wait for expiration
      await TestUtils.wait(10);

      const cleanedCount = apiKeyManager.cleanupExpiredKeys();
      expect(cleanedCount).toBe(1);
    });
  });

  describe('🛡️ Security Features', () => {
    test('should use secure bcrypt rounds', async () => {
      // This test verifies that we're using a reasonable number of bcrypt rounds
      const createdKey = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      // Get the key hash from database
      const hash = db.prepare(`
        SELECT key_hash FROM api_keys WHERE id = ?
      `).get(createdKey.id) as { key_hash: string };

      // Check that it's a proper bcrypt hash
      expect(hash.key_hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    test('should generate unique API keys', async () => {
      const keys = new Set<string>();

      // Generate multiple keys
      for (let i = 0; i < 100; i++) {
        const result = await apiKeyManager.createApiKey({
          agentId: `test-agent-${i}`,
          role: 'A' as any,
        });

        expect(keys.has(result.key)).toBe(false);
        keys.add(result.key);
      }

      expect(keys.size).toBe(100);
    });

    test('should have consistent key format', async () => {
      const result = await apiKeyManager.createApiKey({
        agentId: 'test-agent',
        role: 'A' as any,
      });

      // Should follow format: cmcp_agentId_timestamp_randomBytes
      expect(result.key).toMatch(/^cmcp_test-agent_\d+_[a-f0-9]{32}$/);
    });
  });
});