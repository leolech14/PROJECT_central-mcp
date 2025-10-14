/**
 * MCP Tool: update_task_progress
 * ===============================
 *
 * LECH'S ENHANCEMENT: Real-time progress tracking!
 * Update task progress with completion % and file tracking.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { GitTracker } from '../registry/GitTracker.js';
import { AgentIdSchema, TaskStatusSchema } from '../types/Task.js';
import { eventBroadcaster } from '../events/EventBroadcaster.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

const UpdateProgressSchema = z.object({
  taskId: z.string().regex(/^T\d{3}$/),
  agent: AgentIdSchema,
  status: TaskStatusSchema.optional(),
  filesCreated: z.array(z.string()).optional(),
  completionPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

export function createUpdateProgressTool(registry: TaskRegistry, gitTracker: GitTracker): Tool {
  return {
    name: 'update_task_progress',
    description: 'Update task progress in real-time (status, completion %, files created). Enables live tracking of implementation work.',
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
          description: 'Agent updating progress'
        },
        status: {
          type: 'string',
          enum: ['CLAIMED', 'IN_PROGRESS', 'COMPLETE', 'NEEDS_REVIEW'],
          description: 'New task status (optional)'
        },
        filesCreated: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files created/modified (optional)'
        },
        completionPercent: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Estimated completion percentage (0-100)'
        },
        notes: {
          type: 'string',
          description: 'Progress notes or blockers'
        }
      },
      required: ['taskId', 'agent']
    },
    handler: async (args: any) => {
      const { taskId, agent, status, filesCreated, completionPercent, notes } = UpdateProgressSchema.parse(args);

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

      if (task.claimedBy !== agent) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Task claimed by Agent ${task.claimedBy}, not Agent ${agent}`
            }, null, 2)
          }]
        };
      }

      // Update status if provided
      if (status) {
        // TODO: Update task status in store
        // registry.store.updateTaskStatus(taskId, status, agent);
      }

      // Verify files exist via git
      const fileVerification = filesCreated ? {
        expected: filesCreated,
        verified: filesCreated.map(f => ({
          path: f,
          tracking: gitTracker.getFileTracking(f)
        }))
      } : undefined;

      // Get auto-completion score
      const completionEvidence = gitTracker.verifyTaskCompletion(task);

      const finalCompletionPercent = completionPercent || completionEvidence.completionScore;

      // Broadcast progress update event (legacy)
      eventBroadcaster.agentProgress(agent, taskId, finalCompletionPercent, notes);

      // Broadcast log event
      if (notes) {
        eventBroadcaster.agentLog(agent, `Progress update on ${taskId}: ${notes}`);
      }

      // Broadcast status change if updated
      if (status) {
        eventBroadcaster.taskUpdate(taskId, status, agent, finalCompletionPercent);
      }

      // ⚡ EMIT EVENTS TO EVENT BUS - TRIGGERS LOOP REACTIONS!
      const eventBus = AutoProactiveEventBus.getInstance();

      // PRIMARY EVENT: Task progress updated
      eventBus.emitLoopEvent(
        LoopEvent.TASK_PROGRESS_UPDATED,
        {
          taskId,
          agent,
          completionPercent: finalCompletionPercent,
          status,
          filesCreated,
          notes,
          timestamp: Date.now()
        },
        {
          tool: 'update_task_progress',
          priority: 'normal',
          source: 'MCP Tool'
        }
      );

      // SECONDARY EVENT: Agent heartbeat (agent is active)
      eventBus.emitLoopEvent(
        LoopEvent.AGENT_HEARTBEAT,
        {
          agent,
          timestamp: Date.now(),
          activity: 'progress_update',
          taskId,
          completionPercent: finalCompletionPercent
        },
        {
          tool: 'update_task_progress',
          source: 'MCP Tool'
        }
      );

      // CONDITIONAL EVENT: Potential blocker detected
      if (notes && (
        notes.toLowerCase().includes('blocked') ||
        notes.toLowerCase().includes('stuck') ||
        notes.toLowerCase().includes('issue') ||
        notes.toLowerCase().includes('problem')
      )) {
        eventBus.emitLoopEvent(
          LoopEvent.BLOCKER_DETECTED,
          {
            taskId,
            agent,
            description: notes,
            completionPercent: finalCompletionPercent,
            detectedAt: Date.now()
          },
          {
            tool: 'update_task_progress',
            priority: 'high', // Triggers Loop 5 for analysis!
            source: 'MCP Tool'
          }
        );
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            taskId,
            agent,
            progress: {
              status: status || task.status,
              completionPercent: finalCompletionPercent,
              filesTracked: filesCreated?.length || 0,
              autoVerified: completionEvidence.autoVerified
            },
            fileVerification,
            notes,
            message: `📊 Progress updated for task ${taskId} (${finalCompletionPercent}% complete)`,
            tracking: {
              gitCommits: completionEvidence.gitCommits.length,
              filesFound: completionEvidence.filesFound.length,
              filesMissing: completionEvidence.filesMissing.length
            }
          }, null, 2)
        }]
      };
    }
  };
}
