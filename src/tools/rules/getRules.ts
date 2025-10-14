/**
 * Get Rules Tool
 * ===============
 *
 * Retrieves coordination rules from the Rules Registry.
 * Supports filtering by type and enabled status.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskRegistry } from '../../registry/TaskRegistry.js';
import { logger } from '../../utils/logger.js';

export function registerGetRulesTool(server: Server, registry: TaskRegistry) {
  server.setRequestHandler('tools/call', async (request: any) => {
    if (request.params.name !== 'get_rules') return;

    try {
      const { type, enabled_only } = request.params.arguments || {};

      const rulesRegistry = registry.getRulesRegistry();

      let rules;
      if (enabled_only) {
        rules = rulesRegistry.getEnabledRules();
      } else if (type) {
        rules = rulesRegistry.getRulesByType(type);
      } else {
        rules = rulesRegistry.getAllRules();
      }

      logger.info(`📋 Retrieved ${rules.length} rules${type ? ` (type: ${type})` : ''}${enabled_only ? ' (enabled only)' : ''}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rules,
              count: rules.length,
              filters: {
                type: type || 'all',
                enabled_only: enabled_only || false
              }
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('❌ Error retrieving rules:', error);
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
      name: 'get_rules',
      description: 'Get coordination rules from Rules Registry. Supports filtering by type and enabled status.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['ROUTING', 'DEPENDENCY', 'PRIORITY', 'PROJECT', 'CAPACITY'],
            description: 'Filter rules by type (optional)'
          },
          enabled_only: {
            type: 'boolean',
            description: 'Return only enabled rules (default: false)'
          }
        }
      }
    }
  ];

  logger.info('✅ Registered tool: get_rules');
}
