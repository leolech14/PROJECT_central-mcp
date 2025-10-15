/**
 * JWT Token Manager
 * Handles JWT generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export type AgentRole = 'admin' | 'supervisor' | 'agent' | 'readonly';

export interface JWTPayload {
  sub: string;           // Agent ID
  role: AgentRole;       // Agent role
  permissions: string[]; // Allowed actions
  iat: number;           // Issued at
  exp: number;           // Expiry
  jti: string;           // JWT ID (for revocation)
}

export interface TokenGenerationOptions {
  agentId: string;
  role: AgentRole;
  permissions?: string[];
  expiresIn?: string;    // Default: '24h'
}

export class TokenManager {
  private secret: string;
  private revokedTokens: Set<string> = new Set();

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'dev-secret-change-in-production';

    if (this.secret === 'dev-secret-change-in-production' && process.env.NODE_ENV === 'production') {
      logger.error('🚨 CRITICAL: Using default JWT secret in production!');
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(options: TokenGenerationOptions): string {
    const {
      agentId,
      role,
      permissions = this.getDefaultPermissions(role),
      expiresIn = '24h'
    } = options;

    const jti = this.generateJTI();

    const payload: JWTPayload = {
      sub: agentId,
      role,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(expiresIn),
      jti
    };

    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256'
    });

    logger.info(`🔑 JWT generated for agent ${agentId} (${role})`);
    return token;
  }

  /**
   * Validate and decode JWT token
   */
  validateToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ['HS256']
      }) as JWTPayload;

      // Check if token is revoked
      if (this.revokedTokens.has(payload.jti)) {
        throw new Error('Token has been revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Refresh token (issues new token, revokes old)
   */
  refreshToken(currentToken: string): string {
    const payload = this.validateToken(currentToken);

    // Revoke old token
    this.revokeToken(payload.jti);

    // Generate new token
    return this.generateToken({
      agentId: payload.sub,
      role: payload.role,
      permissions: payload.permissions
    });
  }

  /**
   * Revoke token by JTI
   */
  revokeToken(jti: string): void {
    this.revokedTokens.add(jti);
    logger.info(`🔒 Token revoked: ${jti}`);
  }

  /**
   * Check if token is revoked
   */
  isRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: AgentRole): string[] {
    const permissions: Record<AgentRole, string[]> = {
      admin: [
        'task:*',
        'agent:*',
        'rule:*',
        'intelligence:*',
        'system:*'
      ],
      supervisor: [
        'task:read',
        'task:create',
        'task:update',
        'agent:read',
        'agent:update',
        'rule:read',
        'rule:create',
        'intelligence:*'
      ],
      agent: [
        'task:read',
        'task:claim',
        'task:update',
        'agent:read',
        'agent:update:self',
        'intelligence:read'
      ],
      readonly: [
        'task:read',
        'agent:read',
        'rule:read',
        'intelligence:read'
      ]
    };

    return permissions[role] || [];
  }

  /**
   * Generate unique JWT ID
   */
  private generateJTI(): string {
    return `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Clean up expired revoked tokens (run periodically)
   */
  cleanupRevokedTokens(): void {
    // In production, this should be backed by a database with TTL
    // For now, clear all after 24 hours
    this.revokedTokens.clear();
    logger.info('🧹 Revoked tokens cleaned up');
  }
}
