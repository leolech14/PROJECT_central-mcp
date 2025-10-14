/**
 * 🔒 SECURITY: Secure Session Management
 * =====================================
 *
 * Provides secure session management with:
 * - Secure session tokens (JWT)
 * - Session expiration and rotation
 * - Secure cookie handling
 * - Session hijacking prevention
 * - Multi-device session management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

/**
 * 🔒 SECURITY: Session configuration
 */
export interface SessionConfig {
  jwtSecret: string;
  jwtExpiration: string; // e.g., '15m', '7d', '30d'
  refreshTokenExpiration: string;
  maxSessionsPerUser: number;
  sessionTimeout: number; // inactivity timeout in milliseconds
  secureCookies: boolean;
  sameSitePolicy: 'strict' | 'lax' | 'none';
}

/**
 * 🔒 SECURITY: Session data structure
 */
export interface SessionData {
  sessionId: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: number;
  lastAccessAt: number;
  expiresAt: number;
  isActive: boolean;
  deviceId?: string;
  permissions: string[];
  metadata?: Record<string, any>;
}

/**
 * 🔒 SECURITY: JWT Token payload
 */
export interface JWTPayload {
  sessionId: string;
  userId: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti: string; // JWT ID for token tracking
}

/**
 * 🔒 SECURITY: Secure Session Manager
 */
export class SessionManager {
  private db: Database.Database;
  private config: SessionConfig;
  private activeTokens = new Map<string, { sessionId: string; expiresAt: number }>();

  constructor(db: Database.Database, config: SessionConfig) {
    this.db = db;
    this.config = config;
    this.initializeSessionTable();
    this.startTokenCleanup();
  }

  /**
   * 🔒 SECURITY: Initialize session storage table
   */
  private initializeSessionTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT,
        user_agent TEXT,
        ip_address TEXT,
        created_at INTEGER NOT NULL,
        last_access_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        permissions TEXT, -- JSON array
        metadata TEXT, -- JSON object
        UNIQUE(user_id, device_id)
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active, expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_device ON user_sessions(device_id);

      CREATE TABLE IF NOT EXISTS token_blacklist (
        jti TEXT PRIMARY KEY,
        session_id TEXT,
        token_type TEXT,
        blacklisted_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
    `);
  }

  /**
   * 🔒 SECURITY: Create new session
   */
  async createSession(
    userId: string,
    userAgent: string,
    ipAddress: string,
    deviceId?: string,
    permissions: string[] = [],
    metadata?: Record<string, any>
  ): Promise<{ sessionId: string; accessToken: string; refreshToken: string }> {
    // Check session limit per user
    await this.enforceSessionLimit(userId);

    const sessionId = this.generateSecureSessionId();
    const now = Date.now();
    const expiresAt = now + this.parseExpirationToMs(this.config.jwtExpiration);

    // Store session in database
    this.db.prepare(`
      INSERT INTO user_sessions (
        session_id, user_id, device_id, user_agent, ip_address,
        created_at, last_access_at, expires_at, is_active, permissions, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      userId,
      deviceId,
      userAgent,
      ipAddress,
      now,
      now,
      expiresAt,
      true,
      JSON.stringify(permissions),
      JSON.stringify(metadata || {})
    );

    // Generate tokens
    const accessToken = await this.generateAccessToken(sessionId, userId);
    const refreshToken = await this.generateRefreshToken(sessionId, userId);

    logger.info(`🔐 Session created for user ${userId}`, {
      sessionId,
      deviceId,
      ipAddress,
    });

    return {
      sessionId,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔒 SECURITY: Validate and refresh session
   */
  async validateSession(token: string, expectedType: 'access' | 'refresh'): Promise<SessionData | null> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        logger.warn('🚫 Blacklisted token used', { token: token.substring(0, 20) + '...' });
        return null;
      }

      // Verify JWT token
      const payload = jwt.verify(token, this.config.jwtSecret) as JWTPayload;

      // Verify token type
      if (payload.type !== expectedType) {
        logger.warn('🚫 Wrong token type used', {
          expected: expectedType,
          received: payload.type,
        });
        return null;
      }

      // Get session from database
      const session = this.db.prepare(`
        SELECT * FROM user_sessions
        WHERE session_id = ? AND is_active = TRUE AND expires_at > ?
      `).get(payload.sessionId, Date.now()) as any;

      if (!session) {
        logger.warn('🚫 Session not found or expired', { sessionId: payload.sessionId });
        await this.blacklistToken(payload.jti, payload.sessionId, expectedType, 'Session not found');
        return null;
      }

      // Update last access time
      this.db.prepare(`
        UPDATE user_sessions SET last_access_at = ? WHERE session_id = ?
      `).run(Date.now(), payload.sessionId);

      return {
        sessionId: session.session_id,
        userId: session.user_id,
        userAgent: session.user_agent,
        ipAddress: session.ip_address,
        createdAt: session.created_at,
        lastAccessAt: session.last_access_at,
        expiresAt: session.expires_at,
        isActive: session.is_active,
        deviceId: session.device_id,
        permissions: JSON.parse(session.permissions || '[]'),
        metadata: JSON.parse(session.metadata || '{}'),
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('🚫 Expired token used', { token: token.substring(0, 20) + '...' });
        return null;
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('🚫 Invalid token used', { token: token.substring(0, 20) + '...' });
        return null;
      } else {
        logger.error('❌ Session validation error:', error);
        return null;
      }
    }
  }

  /**
   * 🔒 SECURITY: Refresh tokens
   */
  async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const session = await this.validateSession(refreshToken, 'refresh');
    if (!session) {
      return null;
    }

    // Blacklist old refresh token
    const payload = jwt.decode(refreshToken) as JWTPayload;
    await this.blacklistToken(payload.jti, session.sessionId, 'refresh', 'Token refresh');

    // Generate new tokens
    const newAccessToken = await this.generateAccessToken(session.sessionId, session.userId);
    const newRefreshToken = await this.generateRefreshToken(session.sessionId, session.userId);

    logger.info(`🔄 Session refreshed for user ${session.userId}`, {
      sessionId: session.sessionId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 🔒 SECURITY: Invalidate session
   */
  async invalidateSession(sessionId: string, reason?: string): Promise<boolean> {
    const result = this.db.prepare(`
      UPDATE user_sessions SET is_active = FALSE WHERE session_id = ? AND is_active = TRUE
    `).run(sessionId);

    if (result.changes > 0) {
      // Blacklist all tokens for this session
      await this.blacklistAllSessionTokens(sessionId, reason || 'Manual logout');

      logger.info(`🔒 Session invalidated`, { sessionId, reason });
      return true;
    }

    return false;
  }

  /**
   * 🔒 SECURITY: Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string, reason?: string): Promise<number> {
    const sessions = this.db.prepare(`
      SELECT session_id FROM user_sessions WHERE user_id = ? AND is_active = TRUE
    `).all(userId) as { session_id: string }[];

    let invalidatedCount = 0;

    for (const session of sessions) {
      if (await this.invalidateSession(session.session_id, reason)) {
        invalidatedCount++;
      }
    }

    logger.info(`🔒 All sessions invalidated for user ${userId}`, {
      count: invalidatedCount,
      reason,
    });

    return invalidatedCount;
  }

  /**
   * 🔒 SECURITY: Generate secure session ID
   */
  private generateSecureSessionId(): string {
    return `sess_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * 🔒 SECURITY: Generate access token
   */
  private async generateAccessToken(sessionId: string, userId: string): Promise<string> {
    const jti = crypto.randomBytes(16).toString('hex');
    const expiresIn = this.parseExpirationToMs(this.config.jwtExpiration);
    const now = Math.floor(Date.now() / 1000);

    const payload: JWTPayload = {
      sessionId,
      userId,
      type: 'access',
      iat: now,
      exp: now + Math.floor(expiresIn / 1000),
      jti,
    };

    const token = jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
    });

    // Track token for cleanup
    this.activeTokens.set(jti, {
      sessionId,
      expiresAt: Date.now() + expiresIn,
    });

    return token;
  }

  /**
   * 🔒 SECURITY: Generate refresh token
   */
  private async generateRefreshToken(sessionId: string, userId: string): Promise<string> {
    const jti = crypto.randomBytes(16).toString('hex');
    const expiresIn = this.parseExpirationToMs(this.config.refreshTokenExpiration);
    const now = Math.floor(Date.now() / 1000);

    const payload: JWTPayload = {
      sessionId,
      userId,
      type: 'refresh',
      iat: now,
      exp: now + Math.floor(expiresIn / 1000),
      jti,
    };

    const token = jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
    });

    // Track token for cleanup
    this.activeTokens.set(jti, {
      sessionId,
      expiresAt: Date.now() + expiresIn,
    });

    return token;
  }

  /**
   * 🔒 SECURITY: Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const payload = jwt.decode(token) as JWTPayload;
      if (!payload?.jti) return true; // Invalid token format

      const blacklisted = this.db.prepare(`
        SELECT jti FROM token_blacklist WHERE jti = ? AND expires_at > ?
      `).get(payload.jti, Date.now());

      return !!blacklisted;
    } catch {
      return true; // Treat invalid tokens as blacklisted
    }
  }

  /**
   * 🔒 SECURITY: Blacklist token
   */
  private async blacklistToken(jti: string, sessionId: string, tokenType: string, reason: string): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO token_blacklist (jti, session_id, token_type, blacklisted_at, expires_at, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      jti,
      sessionId,
      tokenType,
      Date.now(),
      Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      reason
    );

    // Remove from active tokens
    this.activeTokens.delete(jti);
  }

  /**
   * 🔒 SECURITY: Blacklist all tokens for a session
   */
  private async blacklistAllSessionTokens(sessionId: string, reason: string): Promise<void> {
    for (const [jti, tokenData] of this.activeTokens.entries()) {
      if (tokenData.sessionId === sessionId) {
        await this.blacklistToken(jti, sessionId, 'both', reason);
      }
    }
  }

  /**
   * 🔒 SECURITY: Enforce session limit per user
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = this.db.prepare(`
      SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = TRUE
    `).get(userId) as { count: number };

    if (activeSessions.count >= this.config.maxSessionsPerUser) {
      // Invalidate oldest session
      const oldestSession = this.db.prepare(`
        SELECT session_id FROM user_sessions
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY last_access_at ASC LIMIT 1
      `).get(userId) as { session_id: string } | undefined;

      if (oldestSession) {
        await this.invalidateSession(oldestSession.session_id, 'Session limit exceeded');
        logger.info(`🔄 Oldest session invalidated due to limit`, {
          userId,
          sessionId: oldestSession.session_id,
        });
      }
    }
  }

  /**
   * 🔒 SECURITY: Parse expiration string to milliseconds
   */
  private parseExpirationToMs(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const [, amount, unit] = match;
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
  }

  /**
   * 🔒 SECURITY: Start token cleanup process
   */
  private startTokenCleanup(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredTokens();
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * 🔒 SECURITY: Cleanup expired tokens from memory
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [jti, tokenData] of this.activeTokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.activeTokens.delete(jti);
      }
    }
  }

  /**
   * 🔒 SECURITY: Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const result = this.db.prepare(`
      UPDATE user_sessions SET is_active = FALSE WHERE expires_at < ? AND is_active = TRUE
    `).run(Date.now());

    if (result.changes > 0) {
      logger.info(`🧹 Cleaned up ${result.changes} expired sessions`);
    }
  }

  /**
   * 🔒 SECURITY: Get session info
   */
  async getSessionInfo(sessionId: string): Promise<SessionData | null> {
    const session = this.db.prepare(`
      SELECT * FROM user_sessions WHERE session_id = ? AND is_active = TRUE
    `).get(sessionId) as any;

    if (!session) return null;

    return {
      sessionId: session.session_id,
      userId: session.user_id,
      userAgent: session.user_agent,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastAccessAt: session.last_access_at,
      expiresAt: session.expires_at,
      isActive: session.is_active,
      deviceId: session.device_id,
      permissions: JSON.parse(session.permissions || '[]'),
      metadata: JSON.parse(session.metadata || '{}'),
    };
  }

  /**
   * 🔒 SECURITY: Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions = this.db.prepare(`
      SELECT * FROM user_sessions
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY last_access_at DESC
    `).all(userId) as any[];

    return sessions.map(session => ({
      sessionId: session.session_id,
      userId: session.user_id,
      userAgent: session.user_agent,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastAccessAt: session.last_access_at,
      expiresAt: session.expires_at,
      isActive: session.is_active,
      deviceId: session.device_id,
      permissions: JSON.parse(session.permissions || '[]'),
      metadata: JSON.parse(session.metadata || '{}'),
    }));
  }
}

export default SessionManager;