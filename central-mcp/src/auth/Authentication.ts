/**
 * Authentication System (Enhanced with JWT + RBAC)
 * ==================================================
 *
 * Complete authentication and authorization system:
 * - API key generation and validation
 * - JWT token management
 * - Role-based access control (RBAC)
 * - Agent authentication
 * - Session management
 */

import Database from 'better-sqlite3';
import { TokenManager, JWTPayload, AgentRole } from './TokenManager.js';
import { ApiKeyManager, ApiKeyResult } from './ApiKeyManager.js';
import { PermissionChecker } from './PermissionChecker.js';
import { logger } from '../utils/logger.js';

export interface AuthResult {
  authenticated: boolean;
  agentId?: string;
  role?: AgentRole;
  token?: string;
  error?: string;
}

export class Authentication {
  private tokenManager: TokenManager;
  private apiKeyManager: ApiKeyManager;
  private permissionChecker: PermissionChecker;

  constructor(private db: Database.Database) {
    this.tokenManager = new TokenManager();
    this.apiKeyManager = new ApiKeyManager(db);
    this.permissionChecker = new PermissionChecker();

    logger.info('🔐 Authentication system initialized');
  }

  /**
   * Authenticate with API key (returns JWT token)
   */
  async authenticateWithApiKey(apiKey: string): Promise<AuthResult> {
    try {
      const keyData = await this.apiKeyManager.validateApiKey(apiKey);

      if (!keyData) {
        return {
          authenticated: false,
          error: 'Invalid or expired API key'
        };
      }

      // Generate JWT token for this session
      const token = this.tokenManager.generateToken({
        agentId: keyData.agentId,
        role: keyData.role
      });

      logger.info(`✅ Agent authenticated: ${keyData.agentId} (${keyData.role})`);

      return {
        authenticated: true,
        agentId: keyData.agentId,
        role: keyData.role,
        token
      };
    } catch (error) {
      logger.error('❌ API key authentication error:', error);
      return {
        authenticated: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Authenticate with JWT token
   */
  authenticateWithToken(token: string): AuthResult {
    try {
      const payload = this.tokenManager.validateToken(token);

      return {
        authenticated: true,
        agentId: payload.sub,
        role: payload.role,
        token
      };
    } catch (error) {
      logger.error('❌ JWT authentication error:', error);
      return {
        authenticated: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate new API key for agent
   */
  async generateApiKey(agentId: string, role: AgentRole, expiresInDays?: number): Promise<ApiKeyResult> {
    return this.apiKeyManager.createApiKey({
      agentId,
      role,
      expiresIn: expiresInDays
    });
  }

  /**
   * Refresh JWT token
   */
  refreshToken(currentToken: string): string {
    return this.tokenManager.refreshToken(currentToken);
  }

  /**
   * Revoke API key
   */
  revokeApiKey(keyId: string): boolean {
    return this.apiKeyManager.revokeApiKey(keyId);
  }

  /**
   * Revoke all API keys for agent
   */
  revokeAgentKeys(agentId: string): number {
    return this.apiKeyManager.revokeAgentKeys(agentId);
  }

  /**
   * List API keys for agent
   */
  listApiKeys(agentId: string) {
    return this.apiKeyManager.listApiKeys(agentId);
  }

  /**
   * Check if agent has permission
   */
  checkPermission(jwtPayload: JWTPayload, action: string, resource?: string) {
    return this.permissionChecker.checkPermission(jwtPayload, action, resource);
  }

  /**
   * Require permission (throws if denied)
   */
  requirePermission(jwtPayload: JWTPayload, action: string, resource?: string): void {
    this.permissionChecker.requirePermission(jwtPayload, action, resource);
  }

  /**
   * Get role permissions
   */
  getRolePermissions(role: AgentRole): string[] {
    return this.permissionChecker.getRolePermissions(role);
  }

  /**
   * Clean up expired keys and tokens (run periodically)
   */
  async cleanup(): Promise<void> {
    this.apiKeyManager.cleanupExpiredKeys();
    this.tokenManager.cleanupRevokedTokens();
    logger.info('🧹 Authentication cleanup completed');
  }

  /**
   * Get TokenManager (for middleware)
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * Get ApiKeyManager (for middleware)
   */
  getApiKeyManager(): ApiKeyManager {
    return this.apiKeyManager;
  }

  /**
   * Get PermissionChecker (for middleware)
   */
  getPermissionChecker(): PermissionChecker {
    return this.permissionChecker;
  }
}
