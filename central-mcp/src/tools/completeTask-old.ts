/**
 * MCP Tool: complete_task
 * ========================
 *
 * Complete task with automatic verification and dependency unblocking.
 * LECH'S ENHANCEMENT: Deterministic completion with git verification!
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { GitTracker } from '../registry/GitTracker.js';
import { AgentIdSchema } from '../types/Task.js';

const CompleteTaskSchema = z.object({
  taskId: z.string().regex(/^T\d{3}$/),
  agent: AgentIdSchema,
  filesCreated: z.array(z.string()).optional(),
  velocity: z.number().min(0).optional(),
  requireVerification: z.boolean().optional().default(true)
});

export function createCompleteTaskTool(registry: TaskRegistry, gitTracker: GitTracker): Tool {
  return {
    name: 'complete_task',
    description: 'Mark task as complete with automatic git verification and dependency unblocking. Validates deliverables exist.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID (e.g., T001)',
          pattern: '^T\\d{3}$'
        },
        agent: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D', 'E', 'F'],
          description: 'Agent completing the task'
        },
        filesCreated: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files created/modified during implementation'
        },
        velocity: {
          type: 'number',
          minimum: 0,
          description: 'Task velocity % (e.g., 3200 = completed in 1/32 of estimated time)'
        },
        requireVerification: {
          type: 'boolean',
          description: 'Require git verification before completion (default: true)',
          default: true
        }
      },
      required: ['taskId', 'agent']
    },
    handler: async (args: any) => {
      const { taskId, agent, filesCreated, velocity, requireVerification } = CompleteTaskSchema.parse(args);

      const task = registry.getTask(taskId);
      if (!task) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Task not found'
            }, null, 2)
          }]
        };
      }

      // Verify task completion (LECH'S ENHANCEMENT)
      const evidence = gitTracker.verifyTaskCompletion(task);

      if (requireVerification && !evidence.autoVerified) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Task verification failed',
              evidence: {
                completionScore: evidence.completionScore,
                filesExpected: evidence.filesExpected.length,
                filesFound: evidence.filesFound.length,
                filesMissing: evidence.filesMissing,
                gitCommits: evidence.gitCommits.length
              },
              message: `❌ Task ${taskId} verification failed (score: ${evidence.completionScore}/100)`,
              suggestion: 'Ensure all deliverables are committed to git, or set requireVerification=false to override'
            }, null, 2)
          }]
        };
      }

      // Complete task with auto-unblocking
      const result = await registry.completeTask(taskId, agent, filesCreated, velocity);

      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              taskId,
              agent,
              velocity: velocity || null,
              verification: {
                autoVerified: evidence.autoVerified,
                completionScore: evidence.completionScore,
                filesVerified: evidence.filesFound.length,
                gitCommits: evidence.gitCommits.length
              },
              unblocked: {
                count: result.unblocked?.length || 0,
                tasks: result.unblocked || []
              },
              message: `✅ Task ${taskId} completed by Agent ${agent}`,
              impact: result.unblocked && result.unblocked.length > 0
                ? `🔓 Auto-unblocked ${result.unblocked.length} dependent task(s): ${result.unblocked.join(', ')}`
                : 'No dependent tasks to unblock'
            }, null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              taskId,
              agent,
              error: result.error,
              message: `❌ Failed to complete task ${taskId}: ${result.error}`
            }, null, 2)
          }]
        };
      }
    }
  };
}
