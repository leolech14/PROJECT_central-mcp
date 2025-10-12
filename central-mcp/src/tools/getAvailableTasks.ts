/**
 * MCP Tool: get_available_tasks
 * ==============================
 *
 * Query available tasks for a specific agent.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { AgentIdSchema } from '../types/Task.js';
import { AgentContextBuilder } from '../core/AgentContextBuilder.js';

const GetAvailableTasksSchema = z.object({
  agent: AgentIdSchema,
  includeDetails: z.boolean().optional().default(true)
});

export function createGetAvailableTasksTool(registry: TaskRegistry, db: Database.Database): Tool {
  return {
    name: 'get_available_tasks',
    description: 'Get all tasks available for a specific agent (dependencies satisfied, ready to claim)',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D', 'E', 'F'],
          description: 'Agent ID (A=UI, B=Design, C=Backend, D=Integration, E=Supervisor, F=Strategic)'
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include full task details (default: true)',
          default: true
        }
      },
      required: ['agent']
    },
    handler: async (args: any) => {
      const { agent, includeDetails } = GetAvailableTasksSchema.parse(args);

      // Build agent context (8-field header)
      let agentContext = null;
      try {
        const contextBuilder = new AgentContextBuilder(db);
        agentContext = contextBuilder.buildContext(agent, 'LocalBrain');
      } catch (error) {
        // Agent not found in database - use fallback context
        console.warn(`⚠️ Agent ${agent} not found in database, using fallback context`);
        agentContext = {
          agentId: agent,
          trackingId: `Agent-${agent}-${Date.now()}`,
          modelId: agent === 'A' ? 'glm-4.6' : 'claude-sonnet-4-5',
          modelName: agent === 'A' ? 'GLM-4.6' : 'Sonnet-4.5',
          role: agent === 'A' ? 'UI Velocity Specialist' : 'Agent',
          projectProgress: {
            percentage: 0,
            tasksComplete: 0,
            tasksTotal: 0,
            breakdown: 'Agent not in database'
          },
          budget: {
            hoursUsedToday: 0,
            dailyLimit: 8,
            percentUsed: 0,
            canWork: true
          },
          systemStatus: {
            health: 'HEALTHY',
            onlineAgents: 1,
            totalAgents: 6,
            timestamp: new Date().toISOString()
          }
        };
      }

      const tasks = registry.getAvailableTasks(agent);

      if (tasks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              // ==== AGENT CONTEXT HEADER (8 FIELDS) ====
              context: {
                agentId: agentContext.agentId,
                trackingId: agentContext.trackingId,
                modelId: agentContext.modelId,
                modelName: agentContext.modelName,
                role: agentContext.role,
                projectProgress: agentContext.projectProgress,
                budget: agentContext.budget,
                systemStatus: agentContext.systemStatus
              },
              // ==== TASK DATA ====
              agent,
              availableTasks: 0,
              tasks: [],
              message: `✅ No available tasks for Agent ${agent} (either all complete or blocked on dependencies)`
            }, null, 2)
          }]
        };
      }

      const result = {
        // ==== AGENT CONTEXT HEADER (8 FIELDS) ====
        context: {
          agentId: agentContext.agentId,
          trackingId: agentContext.trackingId,
          modelId: agentContext.modelId,
          modelName: agentContext.modelName,
          role: agentContext.role,
          projectProgress: agentContext.projectProgress,
          budget: agentContext.budget,
          systemStatus: agentContext.systemStatus
        },
        // ==== TASK DATA ====
        agent,
        availableTasks: tasks.length,
        tasks: includeDetails
          ? tasks.map(t => ({
              id: t.id,
              name: t.name,
              priority: t.priority,
              phase: t.phase,
              timeline: t.timeline,
              dependencies: t.dependencies,
              deliverables: t.deliverables,
              location: t.location
            }))
          : tasks.map(t => ({ id: t.id, name: t.name, priority: t.priority })),
        message: `🎯 ${tasks.length} task(s) available for Agent ${agent}`
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  };
}
