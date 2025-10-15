/**
 * Delete Rule Tool
 * =================
 *
 * Deletes a coordination rule from the Rules Registry.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskRegistry } from '../../registry/TaskRegistry.js';
import { logger } from '../../utils/logger.js';

export function registerDeleteRuleTool(server: Server, registry: TaskRegistry) {
  server.setRequestHandler('tools/call', async (request: any) => {
    if (request.params.name !== 'delete_rule') return;

    try {
      const { id } = request.params.arguments || {};

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const rulesRegistry = registry.getRulesRegistry();

      // Get rule before deleting for response
      const rule = rulesRegistry.getRule(id);
      if (!rule) {
        throw new Error(`Rule with ID ${id} not found`);
      }

      const success = rulesRegistry.deleteRule(id);

      if (!success) {
        throw new Error(`Failed to delete rule ${id}`);
      }

      logger.info(`🗑️ Deleted rule: ${rule.name} (ID: ${id})`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deleted_rule: rule,
              message: `Rule ${id} deleted successfully`
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('❌ Error deleting rule:', error);
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
      name: 'delete_rule',
      description: 'Delete a coordination rule from the Rules Registry.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Rule ID to delete'
          }
        },
        required: ['id']
      }
    }
  ];

  logger.info('✅ Registered tool: delete_rule');
}
