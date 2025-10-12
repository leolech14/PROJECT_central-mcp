/**
 * WebSocket Authentication Middleware
 * Authenticates WebSocket connections using JWT or API key
 */

import { IncomingMessage } from 'http';
import { TokenManager } from '../TokenManager.js';
import { ApiKeyManager } from '../ApiKeyManager.js';
import { logger } from '../../utils/logger.js';

export interface AuthenticatedRequest extends IncomingMessage {
  agentId?: string;
  role?: string;
  permissions?: string[];
  jwtPayload?: any;
}

/**
 * Authenticate WebSocket connection
 * Checks for JWT token or API key in headers
 */
export async function authenticateWebSocket(
  request: IncomingMessage,
  tokenManager: TokenManager,
  apiKeyManager: ApiKeyManager
): Promise<{ authenticated: boolean; agentId?: string; role?: string; error?: string }> {

  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' };
    }

    // Check if it's a Bearer token (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = tokenManager.validateToken(token);

        logger.info(`✅ WebSocket authenticated: ${payload.sub} (${payload.role}) via JWT`);

        return {
          authenticated: true,
          agentId: payload.sub,
          role: payload.role
        };
      } catch (error) {
        return { authenticated: false, error: (error as Error).message };
      }
    }

    // Check if it's an API key
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);

      const keyData = await apiKeyManager.validateApiKey(apiKey);

      if (!keyData) {
        return { authenticated: false, error: 'Invalid API key' };
      }

      // Generate JWT for this session
      const token = tokenManager.generateToken({
        agentId: keyData.agentId,
        role: keyData.role
      });

      logger.info(`✅ WebSocket authenticated: ${keyData.agentId} (${keyData.role}) via API key`);

      return {
        authenticated: true,
        agentId: keyData.agentId,
        role: keyData.role
      };
    }

    return { authenticated: false, error: 'Invalid authorization format' };

  } catch (error) {
    logger.error('❌ WebSocket authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Extract agent info from request
 */
export function getAgentFromRequest(request: AuthenticatedRequest): {
  agentId: string;
  role: string;
} | null {
  if (request.agentId && request.role) {
    return {
      agentId: request.agentId,
      role: request.role
    };
  }
  return null;
}
