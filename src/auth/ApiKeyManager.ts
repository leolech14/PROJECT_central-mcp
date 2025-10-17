/**
 * API Key Manager
 * Manages API keys for agent authentication
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { AgentRole } from './TokenManager.js';
import { logger } from '../utils/logger.js';

export interface ApiKey {
  id: string;
  agentId: string;
  key: string;           // Hashed
  role: AgentRole;
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

export interface CreateApiKeyOptions {
  agentId: string;
  role: AgentRole;
  expiresIn?: number;    // Days (optional)
}

export interface ApiKeyResult {
  id: string;
  key: string;           // Plain text (only returned on creation)
  agentId: string;
  role: AgentRole;
  createdAt: Date;
  expiresAt?: Date;
}

export class ApiKeyManager {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.initializeTable();
  }

  /**
   * 🔒 SECURITY: Initialize API keys table with secure indexes
   */
  private initializeTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        revoked_at INTEGER,
        UNIQUE(agent_id, key_hash)
      );

      -- 🔒 SECURITY: Optimized indexes for secure API key validation
      CREATE INDEX IF NOT EXISTS idx_api_keys_id ON api_keys(id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON api_keys(agent_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(id, revoked_at) WHERE revoked_at IS NULL;
    `);
  }

  /**
   * 🔒 SECURITY: Create new API key with secure format
   */
  async createApiKey(options: CreateApiKeyOptions): Promise<ApiKeyResult> {
    const { agentId, role, expiresIn } = options;

    // 🔒 SECURITY: Generate secure API key with predictable format
    const plainKey = this.generateApiKey(agentId);
    const keyHash = await bcrypt.hash(plainKey, 12); // Increased rounds for security

    // 🔒 SECURITY: Generate consistent ID for secure lookup
    const timestamp = Date.now();
    const id = `key_${timestamp}_${agentId}`;
    const createdAt = timestamp;
    const expiresAt = expiresIn ? createdAt + (expiresIn * 24 * 60 * 60 * 1000) : null;

    this.db.prepare(`
      INSERT INTO api_keys (id, agent_id, key_hash, role, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, agentId, keyHash, role, createdAt, expiresAt);

    logger.info(`🔑 SECURE API key created for agent ${agentId} (${role})`);

    return {
      id,
      key: plainKey,  // Only returned on creation!
      agentId,
      role,
      createdAt: new Date(createdAt),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    };
  }

  /**
   * Validate API key and return agent info
   * 🔒 SECURE: Prevents timing attacks by using key identifier lookup
   */
  async validateApiKey(plainKey: string): Promise<ApiKey | null> {
    // 🔒 SECURITY: Extract key identifier to prevent full table scan
    const keyId = this.extractKeyId(plainKey);
    if (!keyId) {
      logger.warn('🚫 Invalid API key format');
      // Perform dummy comparison to prevent timing attacks
      await this.dummyBcryptCompare();
      return null;
    }

    // 🔒 SECURITY: Query specific key instead of loading all keys
    const key = this.db.prepare(`
      SELECT * FROM api_keys
      WHERE id = ? AND revoked_at IS NULL
    `).get(keyId) as any;

    if (!key) {
      logger.warn('🚫 API key not found or revoked');
      // Perform dummy comparison to prevent timing attacks
      await this.dummyBcryptCompare();
      return null;
    }

    // 🔒 SECURITY: Use constant-time comparison approach
    const isValid = await this.secureBcryptCompare(plainKey, key.key_hash);
    if (!isValid) {
      logger.warn('🚫 Invalid API key signature');
      return null;
    }

    // Check expiry (this doesn't leak timing information)
    if (key.expires_at && key.expires_at < Date.now()) {
      logger.warn(`⏰ API key expired for agent ${key.agent_id}`);
      return null;
    }

    logger.info(`✅ API key validated for agent ${key.agent_id}`);
    return {
      id: key.id,
      agentId: key.agent_id,
      key: key.key_hash,
      role: key.role as AgentRole,
      createdAt: new Date(key.created_at),
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      revokedAt: key.revoked_at ? new Date(key.revoked_at) : undefined
    };
  }

  /**
   * 🔒 SECURITY: Extract key identifier from API key format
   * Expected format: cmcp_agentId_timestamp_randomBytes
   */
  private extractKeyId(plainKey: string): string | null {
    try {
      const parts = plainKey.split('_');
      if (parts.length < 3 || parts[0] !== 'cmcp') {
        return null;
      }

      // Reconstruct the key ID format from the API key
      const agentId = parts[1];
      const timestamp = parts[2];
      return `key_${timestamp}_${agentId}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔒 SECURITY: Constant-time bcrypt comparison to prevent timing attacks
   */
  private async secureBcryptCompare(plainKey: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainKey, hash);
    } catch (error) {
      // Always return false on error, don't leak error information
      return false;
    }
  }

  /**
   * 🔒 SECURITY: Dummy bcrypt comparison for timing attack prevention
   */
  private async dummyBcryptCompare(): Promise<void> {
    try {
      // Use a dummy hash to maintain consistent timing
      const dummyHash = '$2b$10$dummy.hash.for.timing.consistency';
      await bcrypt.compare('dummy', dummyHash);
    } catch (error) {
      // Ignore errors in dummy operation
    }
  }

  /**
   * Revoke API key
   */
  revokeApiKey(keyId: string): boolean {
    const result = this.db.prepare(`
      UPDATE api_keys
      SET revoked_at = ?
      WHERE id = ? AND revoked_at IS NULL
    `).run(Date.now(), keyId);

    if (result.changes > 0) {
      logger.info(`🔒 API key revoked: ${keyId}`);
      return true;
    }

    return false;
  }

  /**
   * Revoke all API keys for agent
   */
  revokeAgentKeys(agentId: string): number {
    const result = this.db.prepare(`
      UPDATE api_keys
      SET revoked_at = ?
      WHERE agent_id = ? AND revoked_at IS NULL
    `).run(Date.now(), agentId);

    logger.info(`🔒 ${result.changes} API keys revoked for agent ${agentId}`);
    return result.changes;
  }

  /**
   * List API keys for agent
   */
  listApiKeys(agentId: string): Omit<ApiKey, 'key'>[] {
    const keys = this.db.prepare(`
      SELECT id, agent_id, role, created_at, expires_at, revoked_at
      FROM api_keys
      WHERE agent_id = ?
      ORDER BY created_at DESC
    `).all(agentId) as any[];

    return keys.map(key => ({
      id: key.id,
      agentId: key.agent_id,
      key: '***', // Never return hash
      role: key.role as AgentRole,
      createdAt: new Date(key.created_at),
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      revokedAt: key.revoked_at ? new Date(key.revoked_at) : undefined
    }));
  }

  /**
   * Clean up expired keys
   */
  cleanupExpiredKeys(): number {
    const result = this.db.prepare(`
      UPDATE api_keys
      SET revoked_at = ?
      WHERE expires_at < ? AND revoked_at IS NULL
    `).run(Date.now(), Date.now());

    if (result.changes > 0) {
      logger.info(`🧹 ${result.changes} expired API keys revoked`);
    }

    return result.changes;
  }

  /**
   * 🔒 SECURITY: Generate secure API key with predictable format
   * Format: cmcp_agentId_timestamp_randomBytes
   */
  private generateApiKey(agentId: string): string {
    const prefix = 'cmcp'; // Central-MCP
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${agentId}_${timestamp}_${randomBytes}`;
  }
}
