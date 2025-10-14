/**
 * Permission Checker (RBAC)
 * Validates permissions for actions
 */

import { AgentRole, JWTPayload } from './TokenManager.js';
import { logger } from '../utils/logger.js';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export class PermissionChecker {
  /**
   * Check if agent has permission for action
   */
  checkPermission(payload: JWTPayload, action: string, resource?: string): PermissionCheckResult {
    const { role, permissions, sub: agentId } = payload;

    // Admin has all permissions
    if (role === 'admin') {
      return { allowed: true };
    }

    // Check exact permission
    if (permissions.includes(action)) {
      return { allowed: true };
    }

    // Check wildcard permissions (e.g., "task:*" matches "task:read")
    const [category] = action.split(':');
    const wildcardPermission = `${category}:*`;
    if (permissions.includes(wildcardPermission)) {
      return { allowed: true };
    }

    // Check self-only permissions (e.g., "agent:update:self")
    if (action.includes(':self') && resource === agentId) {
      return { allowed: true };
    }

    logger.warn(`🚫 Permission denied: ${agentId} (${role}) attempted ${action}`);
    return {
      allowed: false,
      reason: `Role ${role} does not have permission for ${action}`
    };
  }

  /**
   * Require permission (throws if denied)
   */
  requirePermission(payload: JWTPayload, action: string, resource?: string): void {
    const result = this.checkPermission(payload, action, resource);
    if (!result.allowed) {
      throw new Error(result.reason || 'Permission denied');
    }
  }

  /**
   * Check multiple permissions (all must be allowed)
   */
  checkPermissions(payload: JWTPayload, actions: string[]): PermissionCheckResult {
    for (const action of actions) {
      const result = this.checkPermission(payload, action);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }

  /**
   * Get all permissions for role
   */
  getRolePermissions(role: AgentRole): string[] {
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
   * Check if role can perform action (without JWT)
   */
  roleCanPerform(role: AgentRole, action: string): boolean {
    const permissions = this.getRolePermissions(role);

    if (permissions.includes(action)) return true;

    const [category] = action.split(':');
    const wildcardPermission = `${category}:*`;
    return permissions.includes(wildcardPermission);
  }
}
