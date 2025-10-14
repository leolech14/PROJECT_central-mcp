/**
 * request_completion_permission - Request permission to complete task
 *
 * CRITICAL: This is called by complete_task tool BEFORE allowing completion
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { KeepInTouchEnforcer } from '../../core/KeepInTouchEnforcer.js';

const RequestPermissionArgsSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  sessionId: z.string().optional()
});

export const requestCompletionPermissionTool = {
  name: 'request_completion_permission',
  description: 'Request permission to complete task (required before completion)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID to complete'
      },
      agentId: {
        type: 'string',
        description: 'Agent requesting permission'
      },
      sessionId: {
        type: 'string',
        description: 'Optional Keep-in-Touch session ID'
      }
    },
    required: ['taskId', 'agentId']
  }
};

export async function handleRequestCompletionPermission(args: unknown, db: Database.Database) {
  const parsed = RequestPermissionArgsSchema.parse(args);

  const enforcer = new KeepInTouchEnforcer(db);

  // Check permission (will create request if needed)
  const result = await enforcer.checkPermission(parsed.taskId, parsed.agentId);

  if (result.granted) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          permissionStatus: 'GRANTED',
          taskId: parsed.taskId,
          agentId: parsed.agentId,
          grantedAt: result.permission?.grantedAt,
          grantedBy: result.permission?.grantedBy,
          message: '✅ Permission granted! You may now complete the task.'
        }, null, 2)
      }]
    };
  }

  if (result.blocked) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          permissionStatus: 'PENDING',
          taskId: parsed.taskId,
          agentId: parsed.agentId,
          reason: result.reason,
          message: result.message,
          retryAfter: result.retryAfter,
          action: '⏳ Please wait for permission or try again after timeout'
        }, null, 2)
      }]
    };
  }

  // Need action (check-in required)
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        permissionStatus: 'ACTION_REQUIRED',
        taskId: parsed.taskId,
        agentId: parsed.agentId,
        requiredAction: result.requiredAction,
        message: result.message,
        action: '⚠️  Please check in before requesting permission'
      }, null, 2)
    }]
  };
}
