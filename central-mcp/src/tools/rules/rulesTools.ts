/**
 * Rules Tools (CRUD Operations)
 * ==============================
 *
 * MCP tools for managing coordination rules.
 */

import Database from 'better-sqlite3';
import { RulesRegistry } from '../../registry/RulesRegistry.js';
import { logger } from '../../utils/logger.js';
import { eventBroadcaster } from '../../events/EventBroadcaster.js';

// Initialize rules registry from database
function getRulesRegistry(db: Database.Database): RulesRegistry {
  return new RulesRegistry(db);
}

// GET /api/rules - Get all rules or filter by type
export const getRulesTool = {
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
};

export async function handleGetRules(args: unknown, db: Database.Database) {
  try {
    const { type, enabled_only } = args as any || {};
    const rulesRegistry = getRulesRegistry(db);

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
      content: [{
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
      }]
    };
  } catch (error: any) {
    logger.error('❌ Error retrieving rules:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }, null, 2)
      }],
      isError: true
    };
  }
}

// POST /api/rules - Create new rule
export const createRuleTool = {
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
};

export async function handleCreateRule(args: unknown, db: Database.Database) {
  try {
    const { type, name, condition, action, priority, enabled } = args as any || {};

    if (!type || !name || !priority) {
      throw new Error('Missing required fields: type, name, priority');
    }

    const rulesRegistry = getRulesRegistry(db);

    const ruleId = rulesRegistry.createRule({
      type,
      name,
      condition: condition || undefined,
      action: action || undefined,
      priority,
      enabled: enabled !== false
    });

    const createdRule = rulesRegistry.getRule(ruleId);

    logger.info(`✅ Created rule: ${name} (ID: ${ruleId})`);

    // Broadcast rule created event
    if (createdRule) {
      eventBroadcaster.ruleEvent('rule_created', ruleId, name);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          rule: createdRule,
          message: `Rule created successfully with ID ${ruleId}`
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('❌ Error creating rule:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }, null, 2)
      }],
      isError: true
    };
  }
}

// PUT /api/rules/:id - Update rule
export const updateRuleTool = {
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
};

export async function handleUpdateRule(args: unknown, db: Database.Database) {
  try {
    const { id, type, name, condition, action, priority, enabled } = args as any || {};

    if (!id) {
      throw new Error('Missing required field: id');
    }

    const rulesRegistry = getRulesRegistry(db);

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

    // Broadcast rule updated event
    if (updatedRule) {
      eventBroadcaster.ruleEvent('rule_updated', id, updatedRule.name);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          rule: updatedRule,
          message: `Rule ${id} updated successfully`
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('❌ Error updating rule:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }, null, 2)
      }],
      isError: true
    };
  }
}

// DELETE /api/rules/:id - Delete rule
export const deleteRuleTool = {
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
};

export async function handleDeleteRule(args: unknown, db: Database.Database) {
  try {
    const { id } = args as any || {};

    if (!id) {
      throw new Error('Missing required field: id');
    }

    const rulesRegistry = getRulesRegistry(db);

    const rule = rulesRegistry.getRule(id);
    if (!rule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    const success = rulesRegistry.deleteRule(id);

    if (!success) {
      throw new Error(`Failed to delete rule ${id}`);
    }

    logger.info(`🗑️ Deleted rule: ${rule.name} (ID: ${id})`);

    // Broadcast rule deleted event
    eventBroadcaster.ruleEvent('rule_deleted', id, rule.name);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          deleted_rule: rule,
          message: `Rule ${id} deleted successfully`
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('❌ Error deleting rule:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }, null, 2)
      }],
      isError: true
    };
  }
}
