/**
 * 🔒 SECURITY: Secure Session Middleware
 * ====================================
 *
 * Provides Express middleware for secure session management:
 * - Secure cookie configuration
 * - CSRF protection
 * - Session validation middleware
 * - Secure logout handling
 */

import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { SessionManager, SessionData } from '../auth/SessionManager.js';
import { logger } from '../utils/logger.js';

/**
 * 🔒 SECURITY: Cookie configuration options
 */
export interface SecureCookieOptions {
  secret: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

/**
 * 🔒 SECURITY: Extend Request interface with session data
 */
declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
      sessionId?: string;
      userId?: string;
      isAuthenticated: boolean;
    }
  }
}

/**
 * 🔒 SECURITY: Create secure cookie configuration
 */
export function createSecureCookieOptions(options: SecureCookieOptions) {
  return {
    maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours default
    httpOnly: options.httpOnly !== false, // Default to true
    secure: options.secure !== false, // Default to true in production
    sameSite: options.sameSite || 'strict',
    domain: options.domain,
    path: options.path || '/',
    signed: true, // Always sign cookies
  };
}

/**
 * 🔒 SECURITY: Session authentication middleware
 */
export function authenticateSession(sessionManager: SessionManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get access token from cookie or Authorization header
      const token = getTokenFromRequest(req);

      if (!token) {
        // No token provided, continue as unauthenticated
        req.isAuthenticated = false;
        return next();
      }

      // Validate session
      const session = await sessionManager.validateSession(token, 'access');

      if (!session) {
        // Invalid session, clear cookies
        clearAuthCookies(res);
        req.isAuthenticated = false;
        return next();
      }

      // Check for session hijacking
      if (isSessionHijacked(req, session)) {
        logger.warn('🚨 Potential session hijacking detected', {
          sessionId: session.sessionId,
          userId: session.userId,
          currentIP: req.ip,
          sessionIP: session.ipAddress,
        });

        // Invalidate session
        await sessionManager.invalidateSession(session.sessionId, 'Potential hijacking');
        clearAuthCookies(res);
        req.isAuthenticated = false;
        return next();
      }

      // Attach session data to request
      req.session = session;
      req.sessionId = session.sessionId;
      req.userId = session.userId;
      req.isAuthenticated = true;

      // Update last access time is handled in SessionManager.validateSession

      next();
    } catch (error: any) {
      logger.error('❌ Session authentication error:', error);
      req.isAuthenticated = false;
      next();
    }
  };
}

/**
 * 🔒 SECURITY: Require authentication middleware
 */
export function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.session) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be authenticated to access this resource',
    });
  }

  next();
}

/**
 * 🔒 SECURITY: Require permission middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.session) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
    }

    if (!req.session.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Permission '${permission}' is required to access this resource`,
      });
    }

    next();
  };
}

/**
 * 🔒 SECURITY: Set authentication cookies
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  cookieOptions: SecureCookieOptions
): void {
  const secureOptions = createSecureCookieOptions(cookieOptions);

  // Set access token cookie (shorter expiration)
  res.cookie('access_token', accessToken, {
    ...secureOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set refresh token cookie (longer expiration)
  res.cookie('refresh_token', refreshToken, {
    ...secureOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });

  logger.debug('🍪 Authentication cookies set');
}

/**
 * 🔒 SECURITY: Clear authentication cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  res.clearCookie('user_session');

  logger.debug('🧹 Authentication cookies cleared');
}

/**
 * 🔒 SECURITY: Extract token from request
 */
function getTokenFromRequest(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try signed cookie
  if (req.signedCookies && req.signedCookies.access_token) {
    return req.signedCookies.access_token;
  }

  // Try regular cookie (fallback)
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * 🔒 SECURITY: Check for session hijacking
 */
function isSessionHijacked(req: Request, session: SessionData): boolean {
  // Check IP address (allow for some changes due to mobile networks)
  if (session.ipAddress && req.ip) {
    const sessionIP = session.ipAddress;
    const currentIP = req.ip;

    // Extract IP parts for comparison
    const sessionIPParts = sessionIP.split('.').slice(0, 3).join('.');
    const currentIPParts = currentIP.split('.').slice(0, 3).join('.');

    if (sessionIPParts !== currentIPParts) {
      logger.warn('🚨 IP address mismatch detected', {
        sessionIP: sessionIPParts,
        currentIP: currentIPParts,
      });
      return true;
    }
  }

  // Check User-Agent (allow for minor variations)
  if (session.userAgent && req.get('User-Agent')) {
    const sessionUA = session.userAgent.toLowerCase();
    const currentUA = req.get('User-Agent')!.toLowerCase();

    // Simple similarity check (can be enhanced)
    const similarity = calculateStringSimilarity(sessionUA, currentUA);
    if (similarity < 0.7) { // 70% similarity threshold
      logger.warn('🚨 User-Agent mismatch detected', {
        sessionUA: sessionUA.substring(0, 50),
        currentUA: currentUA.substring(0, 50),
        similarity,
      });
      return true;
    }
  }

  return false;
}

/**
 * 🔒 SECURITY: Calculate string similarity (simple implementation)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * 🔒 SECURITY: Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 🔒 SECURITY: Logout handler middleware
 */
export function logoutHandler(sessionManager: SessionManager) {
  return async (req: Request, res: Response) => {
    try {
      if (req.session) {
        await sessionManager.invalidateSession(req.session.sessionId, 'User logout');
        logger.info(`👋 User logged out`, {
          userId: req.session.userId,
          sessionId: req.session.sessionId,
        });
      }

      clearAuthCookies(res);

      res.json({
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      logger.error('❌ Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Logout all devices handler
 */
export function logoutAllDevicesHandler(sessionManager: SessionManager) {
  return async (req: Request, res: Response) => {
    try {
      if (req.session) {
        const count = await sessionManager.invalidateAllUserSessions(
          req.session.userId,
          'Logout all devices'
        );

        logger.info(`👋 User logged out from all devices`, {
          userId: req.session.userId,
          sessionsInvalidated: count,
        });
      }

      clearAuthCookies(res);

      res.json({
        message: 'Logged out from all devices successfully',
      });
    } catch (error: any) {
      logger.error('❌ Logout all devices error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Get session info handler
 */
export function sessionInfoHandler() {
  return (req: Request, res: Response) => {
    if (!req.isAuthenticated || !req.session) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    res.json({
      session: {
        sessionId: req.session.sessionId,
        userId: req.session.userId,
        createdAt: new Date(req.session.createdAt).toISOString(),
        lastAccessAt: new Date(req.session.lastAccessAt).toISOString(),
        expiresAt: new Date(req.session.expiresAt).toISOString(),
        deviceId: req.session.deviceId,
        permissions: req.session.permissions,
      },
    });
  };
}

export default {
  createSecureCookieOptions,
  authenticateSession,
  requireAuthentication,
  requirePermission,
  setAuthCookies,
  clearAuthCookies,
  logoutHandler,
  logoutAllDevicesHandler,
  sessionInfoHandler,
};