/**
 * API Key Manager
 * Manages API keys for agent authentication
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Database } from 'better-sqlite3';
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
   * Initialize API keys table
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

      CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON api_keys(agent_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);
    `);
  }

  /**
   * Create new API key
   */
  async createApiKey(options: CreateApiKeyOptions): Promise<ApiKeyResult> {
    const { agentId, role, expiresIn } = options;

    // Generate random API key
    const plainKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(plainKey, 10);

    const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();
    const expiresAt = expiresIn ? createdAt + (expiresIn * 24 * 60 * 60 * 1000) : null;

    this.db.prepare(`
      INSERT INTO api_keys (id, agent_id, key_hash, role, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, agentId, keyHash, role, createdAt, expiresAt);

    logger.info(`🔑 API key created for agent ${agentId} (${role})`);

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
   */
  async validateApiKey(plainKey: string): Promise<ApiKey | null> {
    const keys = this.db.prepare(`
      SELECT * FROM api_keys WHERE revoked_at IS NULL
    `).all() as any[];

    for (const key of keys) {
      const isValid = await bcrypt.compare(plainKey, key.key_hash);
      if (isValid) {
        // Check expiry
        if (key.expires_at && key.expires_at < Date.now()) {
          logger.warn(`⏰ API key expired for agent ${key.agent_id}`);
          return null;
        }

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
    }

    logger.warn('🚫 Invalid API key attempt');
    return null;
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
   * Generate random API key
   */
  private generateApiKey(): string {
    const prefix = 'cmcp'; // Central-MCP
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
  }
}
