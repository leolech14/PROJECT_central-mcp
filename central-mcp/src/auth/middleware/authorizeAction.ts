/**
 * Authorization Middleware
 * Checks permissions for MCP tool calls
 */

import { JWTPayload } from '../TokenManager.js';
import { PermissionChecker } from '../PermissionChecker.js';
import { logger } from '../../utils/logger.js';

const permissionChecker = new PermissionChecker();

/**
 * Map MCP tool names to required permissions
 */
const TOOL_PERMISSIONS: Record<string, string> = {
  // Task operations
  'getAvailableTasks': 'task:read',
  'claimTask': 'task:claim',
  'updateProgress': 'task:update',
  'completeTask': 'task:update',
  'getDashboard': 'task:read',

  // Agent operations
  'getAgentStatus': 'agent:read',
  'agentConnect': 'agent:update:self',
  'agentDisconnect': 'agent:update:self',
  'agentHeartbeat': 'agent:update:self',
  'getSwarmDashboard': 'agent:read',

  // Rule operations
  'getRules': 'rule:read',
  'createRule': 'rule:create',
  'updateRule': 'rule:update',
  'deleteRule': 'rule:delete',

  // Intelligence operations
  'analyze_events': 'intelligence:read',
  'detect_patterns': 'intelligence:read',
  'predict_outcome': 'intelligence:read',
  'suggest_optimizations': 'intelligence:write',

  // Discovery operations
  'discoverEnvironment': 'system:read',
  'uploadContext': 'system:write',
  'retrieveContext': 'system:read',
  'searchContext': 'system:read',
  'getContextStats': 'system:read',

  // Cost operations
  'estimateTaskCost': 'task:read',
  'checkUsageLimits': 'system:read',

  // Health operations
  'getSystemHealth': 'system:read'
};

/**
 * Authorize MCP tool call
 */
export function authorizeToolCall(
  toolName: string,
  jwtPayload: JWTPayload,
  resourceId?: string
): { authorized: boolean; reason?: string } {

  const requiredPermission = TOOL_PERMISSIONS[toolName];

  if (!requiredPermission) {
    logger.warn(`⚠️ Unknown tool: ${toolName} (allowing by default)`);
    return { authorized: true };
  }

  const result = permissionChecker.checkPermission(jwtPayload, requiredPermission, resourceId);

  if (!result.allowed) {
    logger.warn(`🚫 Authorization failed: ${jwtPayload.sub} (${jwtPayload.role}) attempted ${toolName}`);
    return {
      authorized: false,
      reason: result.reason || `Insufficient permissions for ${toolName}`
    };
  }

  return { authorized: true };
}

/**
 * Require specific permission
 */
export function requirePermission(jwtPayload: JWTPayload, action: string, resource?: string): void {
  permissionChecker.requirePermission(jwtPayload, action, resource);
}

/**
 * Check if agent can perform action
 */
export function canPerform(jwtPayload: JWTPayload, action: string, resource?: string): boolean {
  const result = permissionChecker.checkPermission(jwtPayload, action, resource);
  return result.allowed;
}
