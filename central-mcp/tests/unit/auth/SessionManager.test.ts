/**
 * 🧪 UNIT TESTS: SessionManager
 * ==============================
 *
 * Test secure session management functionality
 */

import { SessionManager } from '../../../src/auth/SessionManager.js';
import { TestUtils } from '../../setup.js';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

describe('SessionManager', () => {
  let db: Database.Database;
  let sessionManager: SessionManager;
  const testConfig = {
    jwtSecret: 'test-jwt-secret-for-testing',
    jwtExpiration: '15m',
    refreshTokenExpiration: '7d',
    maxSessionsPerUser: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    secureCookies: true,
    sameSitePolicy: 'strict' as const,
  };

  beforeEach(() => {
    db = TestUtils.createTestDatabase();
    sessionManager = new SessionManager(db, testConfig);
  });

  afterEach(() => {
    db.close();
  });

  describe('🔐 Session Creation', () => {
    test('should create a new session successfully', async () => {
      const result = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      expect(result).toBeDefined();
      expect(result.sessionId).toMatch(/^sess_\d+_[a-f0-9]+$/);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toBe(result.refreshToken);
    });

    test('should create session with device ID', async () => {
      const deviceId = 'test-device-123';
      const result = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1',
        deviceId
      );

      const sessionInfo = await sessionManager.getSessionInfo(result.sessionId);
      expect(sessionInfo?.deviceId).toBe(deviceId);
    });

    test('should create session with permissions', async () => {
      const permissions = ['read', 'write', 'admin'];
      const result = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1',
        undefined,
        permissions
      );

      const sessionInfo = await sessionManager.getSessionInfo(result.sessionId);
      expect(sessionInfo?.permissions).toEqual(permissions);
    });

    test('should enforce session limit per user', async () => {
      // Create maximum allowed sessions
      const sessions = [];
      for (let i = 0; i < testConfig.maxSessionsPerUser; i++) {
        const session = await sessionManager.createSession(
          'test-user',
          `Browser ${i}`,
          '127.0.0.1',
          `device-${i}`
        );
        sessions.push(session);
      }

      // All sessions should be valid
      for (const session of sessions) {
        const validated = await sessionManager.validateSession(session.accessToken, 'access');
        expect(validated).toBeDefined();
      }

      // Create one more session (should invalidate oldest)
      const newSession = await sessionManager.createSession(
        'test-user',
        'New Browser',
        '127.0.0.1',
        'device-new'
      );

      // Oldest session should be invalidated
      const oldestValidated = await sessionManager.validateSession(sessions[0].accessToken, 'access');
      expect(oldestValidated).toBeNull();

      // New session should be valid
      const newValidated = await sessionManager.validateSession(newSession.accessToken, 'access');
      expect(newValidated).toBeDefined();
    });
  });

  describe('🔒 Session Validation', () => {
    test('should validate access token successfully', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      const validated = await sessionManager.validateSession(session.accessToken, 'access');

      expect(validated).toBeDefined();
      expect(validated!.userId).toBe('test-user');
      expect(validated!.sessionId).toBe(session.sessionId);
      expect(validated!.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(validated!.ipAddress).toBe('127.0.0.1');
    });

    test('should validate refresh token successfully', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      const validated = await sessionManager.validateSession(session.refreshToken, 'refresh');

      expect(validated).toBeDefined();
      expect(validated!.userId).toBe('test-user');
    });

    test('should reject invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      const validated = await sessionManager.validateSession(invalidToken, 'access');
      expect(validated).toBeNull();
    });

    test('should reject expired token', async () => {
      // Create session manager with very short expiration
      const shortConfig = {
        ...testConfig,
        jwtExpiration: '1s',
      };
      const shortSessionManager = new SessionManager(db, shortConfig);

      const session = await shortSessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      // Wait for token to expire
      await TestUtils.wait(1100);

      const validated = await shortSessionManager.validateSession(session.accessToken, 'access');
      expect(validated).toBeNull();
    });

    test('should reject wrong token type', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      // Try to use access token as refresh token
      const validated = await sessionManager.validateSession(session.accessToken, 'refresh');
      expect(validated).toBeNull();

      // Try to use refresh token as access token
      const validated2 = await sessionManager.validateSession(session.refreshToken, 'access');
      expect(validated2).toBeNull();
    });

    test('should reject token for invalidated session', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      // Invalidate the session
      const invalidated = await sessionManager.invalidateSession(session.sessionId);
      expect(invalidated).toBe(true);

      // Try to validate token
      const validated = await sessionManager.validateSession(session.accessToken, 'access');
      expect(validated).toBeNull();
    });
  });

  describe('🔄 Session Refresh', () => {
    test('should refresh tokens successfully', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      const refreshed = await sessionManager.refreshSession(session.refreshToken);

      expect(refreshed).toBeDefined();
      expect(refreshed!.accessToken).not.toBe(session.accessToken);
      expect(refreshed!.refreshToken).not.toBe(session.refreshToken);

      // Old tokens should be invalid
      const oldAccessValidated = await sessionManager.validateSession(session.accessToken, 'access');
      const oldRefreshValidated = await sessionManager.validateSession(session.refreshToken, 'refresh');

      expect(oldAccessValidated).toBeNull();
      expect(oldRefreshValidated).toBeNull();

      // New tokens should be valid
      const newAccessValidated = await sessionManager.validateSession(refreshed!.accessToken, 'access');
      const newRefreshValidated = await sessionManager.validateSession(refreshed!.refreshToken, 'refresh');

      expect(newAccessValidated).toBeDefined();
      expect(newRefreshValidated).toBeDefined();
    });

    test('should reject refresh with invalid token', async () => {
      const refreshed = await sessionManager.refreshSession('invalid.refresh.token');
      expect(refreshed).toBeNull();
    });

    test('should reject refresh with access token', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      const refreshed = await sessionManager.refreshSession(session.accessToken);
      expect(refreshed).toBeNull();
    });
  });

  describe('🚫 Session Invalidation', () => {
    test('should invalidate session successfully', async () => {
      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1'
      );

      // Verify session is valid
      const validatedBefore = await sessionManager.validateSession(session.accessToken, 'access');
      expect(validatedBefore).toBeDefined();

      // Invalidate session
      const invalidated = await sessionManager.invalidateSession(session.sessionId);
      expect(invalidated).toBe(true);

      // Verify session is invalid
      const validatedAfter = await sessionManager.validateSession(session.accessToken, 'access');
      expect(validatedAfter).toBeNull();
    });

    test('should invalidate all user sessions', async () => {
      const userId = 'test-user';

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const session = await sessionManager.createSession(
          userId,
          `Browser ${i}`,
          '127.0.0.1',
          `device-${i}`
        );
        sessions.push(session);
      }

      // Verify all sessions are valid
      for (const session of sessions) {
        const validated = await sessionManager.validateSession(session.accessToken, 'access');
        expect(validated).toBeDefined();
      }

      // Invalidate all sessions
      const invalidatedCount = await sessionManager.invalidateAllUserSessions(userId);
      expect(invalidatedCount).toBe(5);

      // Verify all sessions are invalid
      for (const session of sessions) {
        const validated = await sessionManager.validateSession(session.accessToken, 'access');
        expect(validated).toBeNull();
      }
    });

    test('should return false for invalid session invalidation', async () => {
      const invalidated = await sessionManager.invalidateSession('non-existent-session');
      expect(invalidated).toBe(false);
    });
  });

  describe('📊 Session Information', () => {
    test('should get session info successfully', async () => {
      const permissions = ['read', 'write'];
      const metadata = { department: 'engineering', role: 'developer' };

      const session = await sessionManager.createSession(
        'test-user',
        'Mozilla/5.0 Test Browser',
        '127.0.0.1',
        'test-device',
        permissions,
        metadata
      );

      const sessionInfo = await sessionManager.getSessionInfo(session.sessionId);

      expect(sessionInfo).toBeDefined();
      expect(sessionInfo!.userId).toBe('test-user');
      expect(sessionInfo!.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(sessionInfo!.ipAddress).toBe('127.0.0.1');
      expect(sessionInfo!.deviceId).toBe('test-device');
      expect(sessionInfo!.permissions).toEqual(permissions);
      expect(sessionInfo!.metadata).toEqual(metadata);
      expect(sessionInfo!.isActive).toBe(true);
    });

    test('should return null for non-existent session', async () => {
      const sessionInfo = await sessionManager.getSessionInfo('non-existent-session');
      expect(sessionInfo).toBeNull();
    });

    test('should get all user sessions', async () => {
      const userId = 'test-user';

      // Create multiple sessions
      const sessionIds = [];
      for (let i = 0; i < 3; i++) {
        const session = await sessionManager.createSession(
          userId,
          `Browser ${i}`,
          '127.0.0.1',
          `device-${i}`
        );
        sessionIds.push(session.sessionId);
      }

      const userSessions = await sessionManager.getUserSessions(userId);
      expect(userSessions).toHaveLength(3);

      const sessionIdsFromDb = userSessions.map(s => s.sessionId);
      for (const sessionId of sessionIds) {
        expect(sessionIdsFromDb).toContain(sessionId);
      }
    });
  });

  describe('🛡️ Security Features', () => {
    test('should use unique JWT IDs for tokens', async () => {
      const sessions = [];
      const jtis = new Set<string>();

      // Create multiple sessions
      for (let i = 0; i < 10; i++) {
        const session = await sessionManager.createSession(
          `test-user-${i}`,
          'Browser',
          '127.0.0.1'
        );
        sessions.push(session);

        // Extract JWT ID from access token
        const decoded = jwt.decode(session.accessToken) as any;
        jtis.add(decoded.jti);
      }

      // All JWT IDs should be unique
      expect(jtis.size).toBe(10);
    });

    test('should handle malformed tokens gracefully', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // missing signature
        'header.payload.signature.extra',
        '',
        'a'.repeat(1000), // very long string
      ];

      for (const token of malformedTokens) {
        const validated = await sessionManager.validateSession(token, 'access');
        expect(validated).toBeNull();
      }
    });
  });
});