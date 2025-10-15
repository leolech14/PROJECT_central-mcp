/**
 * Update Rule Tool
 * =================
 *
 * Updates an existing coordination rule in the Rules Registry.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskRegistry } from '../../registry/TaskRegistry.js';
import { logger } from '../../utils/logger.js';

export function registerUpdateRuleTool(server: Server, registry: TaskRegistry) {
  server.setRequestHandler('tools/call', async (request: any) => {
    if (request.params.name !== 'update_rule') return;

    try {
      const { id, type, name, condition, action, priority, enabled } = request.params.arguments || {};

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const rulesRegistry = registry.getRulesRegistry();

      const updates: any = {};
      if (type !== undefined) updates.type = type;
      if (name !== undefined) updates.name = name;
      if (condition !== undefined) updates.condition = condition;
      if (action !== undefined) updates.action = action;
      if (priority !== undefined) updates.priority = priority;
      if (enabled !== undefined) updates.enabled = enabled;

      const success = rulesRegistry.updateRule(id, updates);

      if (!success) {
        throw new Error(`Rule with ID ${id} not found`);
      }

      const updatedRule = rulesRegistry.getRule(id);

      logger.info(`✅ Updated rule: ${id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rule: updatedRule,
              message: `Rule ${id} updated successfully`
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('❌ Error updating rule:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }
        ]
      };
    }
  });

  // Register tool definition
  const existingTools = (server as any)._tools || [];
  (server as any)._tools = [
    ...existingTools,
    {
      name: 'update_rule',
      description: 'Update an existing coordination rule in the Rules Registry.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Rule ID to update'
          },
          type: {
            type: 'string',
            enum: ['ROUTING', 'DEPENDENCY', 'PRIORITY', 'PROJECT', 'CAPACITY'],
            description: 'Rule type'
          },
          name: {
            type: 'string',
            description: 'Rule name'
          },
          condition: {
            type: 'object',
            description: 'Condition object (JSON)'
          },
          action: {
            type: 'object',
            description: 'Action object (JSON)'
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Rule priority'
          },
          enabled: {
            type: 'boolean',
            description: 'Whether rule is enabled'
          }
        },
        required: ['id']
      }
    }
  ];

  logger.info('✅ Registered tool: update_rule');
}
