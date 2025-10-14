/**
 * Create Rule Tool
 * =================
 *
 * Creates a new coordination rule in the Rules Registry.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskRegistry } from '../../registry/TaskRegistry.js';
import { logger } from '../../utils/logger.js';

export function registerCreateRuleTool(server: Server, registry: TaskRegistry) {
  server.setRequestHandler('tools/call', async (request: any) => {
    if (request.params.name !== 'create_rule') return;

    try {
      const { type, name, condition, action, priority, enabled } = request.params.arguments || {};

      if (!type || !name || !priority) {
        throw new Error('Missing required fields: type, name, priority');
      }

      const rulesRegistry = registry.getRulesRegistry();

      const ruleId = rulesRegistry.createRule({
        type,
        name,
        condition: condition || undefined,
        action: action || undefined,
        priority,
        enabled: enabled !== false // Default to enabled
      });

      const createdRule = rulesRegistry.getRule(ruleId);

      logger.info(`✅ Created rule: ${name} (ID: ${ruleId})`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rule: createdRule,
              message: `Rule created successfully with ID ${ruleId}`
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('❌ Error creating rule:', error);
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
      name: 'create_rule',
      description: 'Create a new coordination rule in the Rules Registry.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['ROUTING', 'DEPENDENCY', 'PRIORITY', 'PROJECT', 'CAPACITY'],
            description: 'Rule type'
          },
          name: {
            type: 'string',
            description: 'Rule name (e.g., "UI tasks → Agent A")'
          },
          condition: {
            type: 'object',
            description: 'Condition object (JSON) - when this rule applies'
          },
          action: {
            type: 'object',
            description: 'Action object (JSON) - what to do when rule matches'
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Rule priority'
          },
          enabled: {
            type: 'boolean',
            description: 'Whether rule is enabled (default: true)'
          }
        },
        required: ['type', 'name', 'priority']
      }
    }
  ];

  logger.info('✅ Registered tool: create_rule');
}
