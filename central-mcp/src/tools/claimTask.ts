/**
 * MCP Tool: claim_task
 * =====================
 *
 * Atomically claim a task (prevents race conditions).
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { AgentIdSchema } from '../types/Task.js';
import { eventBroadcaster } from '../events/EventBroadcaster.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

const ClaimTaskSchema = z.object({
  taskId: z.string().regex(/^T\d{3}$/),
  agent: AgentIdSchema
});

export function createClaimTaskTool(registry: TaskRegistry): Tool {
  return {
    name: 'claim_task',
    description: 'Atomically claim a task to prevent conflicts. Task must be AVAILABLE and assigned to the claiming agent.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID (e.g., T001, T002)',
          pattern: '^T\\d{3}$'
        },
        agent: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D', 'E', 'F'],
          description: 'Agent claiming the task'
        }
      },
      required: ['taskId', 'agent']
    },
    handler: async (args: any) => {
      const { taskId, agent } = ClaimTaskSchema.parse(args);

      const result = await registry.claimTask(taskId, agent);

      if (result.success) {
        // Get task details for broadcasting
        const task = registry.getTask(taskId);

        // Broadcast task claimed event (legacy)
        if (task) {
          eventBroadcaster.taskClaimed(taskId, task.name, agent);
          eventBroadcaster.agentLog(agent, `Claimed task ${taskId}: ${task.name}`);
          eventBroadcaster.agentStatus(agent, 'busy', taskId);
        }

        // ⚡ EMIT EVENTS TO EVENT BUS - TRIGGERS INSTANT LOOP REACTIONS!
        const eventBus = AutoProactiveEventBus.getInstance();

        // PRIMARY EVENT: Task claimed
        eventBus.emitLoopEvent(
          LoopEvent.TASK_CLAIMED,
          {
            taskId,
            agent,
            claimedAt: result.claimedAt,
            taskName: task?.name
          },
          {
            tool: 'claim_task',
            priority: 'high',
            source: 'MCP Tool'
          }
        );

        // SECONDARY EVENT: Agent workload changed
        // (Triggers Loop 1 to update agent capacity)
        const workload = (registry as any).getAgentWorkload?.(agent) || 1;
        eventBus.emitLoopEvent(
          LoopEvent.AGENT_WORKLOAD_CHANGED,
          {
            agent,
            workload: typeof workload === 'number' ? workload : 1,
            capacity: typeof workload === 'number' ? (5 - workload) : 4,
            action: 'claimed'
          },
          {
            tool: 'claim_task',
            priority: 'normal',
            source: 'MCP Tool'
          }
        );

        // TERTIARY EVENT: Agent heartbeat
        // (Updates Loop 1 agent activity tracking)
        eventBus.emitLoopEvent(
          LoopEvent.AGENT_HEARTBEAT,
          {
            agent,
            timestamp: Date.now(),
            activity: 'claimed_task',
            taskId
          },
          {
            tool: 'claim_task',
            source: 'MCP Tool'
          }
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              taskId,
              agent,
              claimedAt: result.claimedAt,
              message: `✅ Task ${taskId} successfully claimed by Agent ${agent}`,
              nextSteps: [
                '1. Update task status to IN_PROGRESS when you start work',
                '2. Track files created in your implementation',
                '3. Call complete_task when finished with file list'
              ]
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
              message: `❌ Failed to claim task ${taskId}: ${result.error}`
            }, null, 2)
          }]
        };
      }
    }
  };
}
