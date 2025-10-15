/**
 * 🏛️ MCP TOOLS: CENTRAL SYSTEMS REGISTRY
 * ===================================
 *
 * MCP tools for querying the Central Systems Registry - the single source
 * of truth for all Central-MCP systems, components, and integration status.
 *
 * These tools enable agents to:
 * - Query existing systems before creating new ones
 * - Check system status and integration confidence
 * - Get system usage instructions
 * - Prevent duplicate system creation
 * - Make informed development decisions
 *
 * @author Central-MCP Architecture Team
 * @version 1.0.0
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { centralSystemsRegistry, SystemCategory, SystemStatus, ConfidenceLevel } from '../registry/CentralSystemsRegistry.js';
import { logger } from '../utils/logger.js';

// Schema definitions
const GetAvailableSystemsSchema = z.object({
  agentId: z.string().optional(),
  category: z.enum(Object.values(SystemCategory) as [SystemCategory, ...SystemCategory[]]).optional(),
  status: z.enum(Object.values(SystemStatus) as [SystemStatus, ...SystemStatus[]]).optional(),
  confidence: z.enum(Object.values(ConfidenceLevel) as [ConfidenceLevel, ...ConfidenceLevel[]]).optional(),
  integrated: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const CheckSystemExistsSchema = z.object({
  systemId: z.string().describe('System ID to check (e.g., "auto-proactive-engine")')
});

const CanCreateFeatureSchema = z.object({
  featureDescription: z.string().describe('Description of the feature you want to create')
});

const GetSystemDetailsSchema = z.object({
  systemId: z.string().describe('System ID to get details for')
});

const GetRegistryStatsSchema = z.object({});

/**
 * 🏛️ Get Available Systems Tool
 */
export const getAvailableSystemsTool: Tool = {
  name: 'central.get_available_systems',
  description: '🏛️ Query the Central Systems Registry to discover available systems, their status, and integration confidence',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'Optional agent ID for personalized results'
      },
      category: {
        type: 'string',
        enum: Object.values(SystemCategory),
        description: 'Filter by system category'
      },
      status: {
        type: 'string',
        enum: Object.values(SystemStatus),
        description: 'Filter by system status'
      },
      confidence: {
        type: 'string',
        enum: Object.values(ConfidenceLevel),
        description: 'Filter by confidence level'
      },
      integrated: {
        type: 'boolean',
        description: 'Filter by integration status'
      },
      search: {
        type: 'string',
        description: 'Search term to filter systems'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags'
      }
    }
  },
  handler: async (args: any) => {
    const parsed = GetAvailableSystemsSchema.parse(args);

    try {
      logger.info(`🔍 Agent querying available systems: ${parsed.search || 'all'}`);

      const result = centralSystemsRegistry.getAvailableSystemsForAgent(parsed.agentId);

      // Apply filters
      let systems = result.systems;

      if (parsed.category) {
        systems = systems.filter(s => s.category === parsed.category);
      }

      if (parsed.status) {
        systems = systems.filter(s => s.status === parsed.status);
      }

      if (parsed.confidence) {
        systems = systems.filter(s => s.confidence === parsed.confidence);
      }

      if (parsed.integrated !== undefined) {
        const integratedSystems = centralSystemsRegistry.getIntegratedSystems().map(s => s.id);
        systems = systems.filter(s =>
          parsed.integrated ? integratedSystems.includes(s.id) : !integratedSystems.includes(s.id)
        );
      }

      if (parsed.tags && parsed.tags.length > 0) {
        systems = systems.filter(s =>
          parsed.tags!.some(tag => {
            const system = centralSystemsRegistry.getSystem(s.id);
            return system?.tags.includes(tag);
          })
        );
      }

      if (parsed.search) {
        const searchLower = parsed.search.toLowerCase();
        systems = systems.filter(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
        );
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            registry: {
              totalSystems: result.total,
              availableSystems: systems.length,
              categories: result.categories,
              lastUpdated: new Date().toISOString()
            },
            systems: systems.map(s => ({
              id: s.id,
              name: s.name,
              category: s.category,
              status: s.status,
              confidence: s.confidence,
              canUse: s.canUse,
              description: s.description,
              usage: s.usage
            })),
            message: `🏛️ Found ${systems.length} available systems${parsed.search ? ` matching "${parsed.search}"` : ''}`,
            recommendations: [
              '📋 Use existing systems when possible',
              '🔍 Check system details with central.get_system_details',
              '🚫 Avoid creating duplicate systems',
              '📞 Contact system maintainers for extensions'
            ]
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.error('❌ Error querying Central Systems Registry:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: String(error),
            message: '❌ Failed to query Central Systems Registry'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

/**
 * 🔍 Check if System Exists Tool
 */
export const checkSystemExistsTool: Tool = {
  name: 'central.check_system_exists',
  description: '🔍 Check if a system already exists in Central-MCP to prevent duplicates',
  inputSchema: {
    type: 'object',
    properties: {
      systemId: {
        type: 'string',
        description: 'System ID to check (e.g., "auto-proactive-engine")'
      }
    },
    required: ['systemId']
  },
  handler: async (args: any) => {
    const parsed = CheckSystemExistsSchema.parse(args);

    try {
      logger.info(`🔍 Checking if system exists: ${parsed.systemId}`);

      const exists = centralSystemsRegistry.systemExists(parsed.systemId);

      if (exists) {
        const system = centralSystemsRegistry.getSystem(parsed.systemId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              exists: true,
              systemId: parsed.systemId,
              system: {
                name: system?.name,
                category: system?.category,
                status: system?.status,
                confidence: system?.confidence,
                integrated: system?.integrated,
                description: system?.description,
                location: system?.location
              },
              message: `✅ System "${parsed.systemId}" already exists`,
              recommendations: [
                '📋 Use existing system instead of creating duplicate',
                '🔧 Extend existing system if needed',
                '📞 Contact system maintainers for modifications',
                '🚫 Do not create parallel duplicate system'
              ]
            }, null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              exists: false,
              systemId: parsed.systemId,
              message: `✅ System "${parsed.systemId}" does not exist - can be created`,
              recommendations: [
                '🆙 Proceed with system development',
                '📝 Register system in Central Systems Registry when complete',
                '🔗 Ensure integration with existing systems',
                '📋 Follow established patterns and interfaces'
              ]
            }, null, 2)
          }]
        };
      }

    } catch (error) {
      logger.error('❌ Error checking system existence:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: String(error),
            message: '❌ Failed to check system existence'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

/**
 * 🚫 Can Create Feature Tool
 */
export const canCreateFeatureTool: Tool = {
  name: 'central.can_create_feature',
  description: '🚫 Check if you can create a new feature or if similar systems already exist',
  inputSchema: {
    type: 'object',
    properties: {
      featureDescription: {
        type: 'string',
        description: 'Description of the feature you want to create'
      }
    },
    required: ['featureDescription']
  },
  handler: async (args: any) => {
    const parsed = CanCreateFeatureSchema.parse(args);

    try {
      logger.info(`🚫 Checking if feature can be created: "${parsed.featureDescription}"`);

      const analysis = centralSystemsRegistry.canCreateFeature(parsed.featureDescription);

      if (analysis.allowed) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              allowed: true,
              featureDescription: parsed.featureDescription,
              analysis: analysis,
              message: `✅ Feature can be created - no conflicts detected`,
              nextSteps: [
                '🆙 Proceed with feature development',
                '🔗 Ensure integration with existing systems',
                '📝 Register in Central Systems Registry when complete',
                '📋 Follow established patterns and interfaces'
              ]
            }, null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              allowed: false,
              featureDescription: parsed.featureDescription,
              analysis: analysis,
              message: `🚫 Feature cannot be created - conflicts detected`,
              existingSystems: analysis.existingSystems.map(id => {
                const system = centralSystemsRegistry.getSystem(id);
                return {
                  id: system?.id,
                  name: system?.name,
                  description: system?.description,
                  status: system?.status
                };
              }),
              recommendations: analysis.recommendations
            }, null, 2)
          }]
        };
      }

    } catch (error) {
      logger.error('❌ Error analyzing feature creation:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: String(error),
            message: '❌ Failed to analyze feature creation'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

/**
 * 📋 Get System Details Tool
 */
export const getSystemDetailsTool: Tool = {
  name: 'central.get_system_details',
  description: '📋 Get detailed information about a specific system in Central-MCP',
  inputSchema: {
    type: 'object',
    properties: {
      systemId: {
        type: 'string',
        description: 'System ID to get details for'
      }
    },
    required: ['systemId']
  },
  handler: async (args: any) => {
    const parsed = GetSystemDetailsSchema.parse(args);

    try {
      logger.info(`📋 Getting system details: ${parsed.systemId}`);

      const system = centralSystemsRegistry.getSystem(parsed.systemId);

      if (!system) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'System not found',
              systemId: parsed.systemId,
              message: `❌ System "${parsed.systemId}" not found in registry`,
              suggestions: [
                '🔍 Use central.get_available_systems to list all systems',
                '📝 Check system ID spelling and format',
                '🔍 Use central.check_system_exists to verify system exists'
              ]
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            system: {
              // Basic info
              id: system.id,
              name: system.name,
              category: system.category,
              version: system.version,
              description: system.description,
              purpose: system.purpose,

              // Status and confidence
              status: system.status,
              confidence: system.confidence,
              integrated: system.integrated,
              globalAccess: system.globalAccess,

              // Integration info
              dependencies: system.dependencies,
              dependents: system.dependents,
              location: system.location,
              interfaces: system.interfaces,

              // Health and performance
              health: system.health,
              lastUpdated: system.lastUpdated,
              tags: system.tags,

              // Agent access
              agentAccess: system.agentAccess
            },
            message: `📋 Details for system: ${system.name}`,
            usageInstructions: system.agentAccess.usageInstructions,
            recommendations: [
              '📋 Review system integration status before use',
              '🔗 Check dependencies are available',
              '📞 Contact maintainers for extensions',
              '📚 Use existing interfaces when possible'
            ]
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.error('❌ Error getting system details:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: String(error),
            message: '❌ Failed to get system details'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

/**
 * 📊 Get Registry Statistics Tool
 */
export const getRegistryStatsTool: Tool = {
  name: 'central.get_registry_stats',
  description: '📊 Get comprehensive statistics about the Central Systems Registry',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => {
    try {
      logger.info('📊 Getting registry statistics');

      const stats = centralSystemsRegistry.getRegistryStats();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            stats: {
              // Basic counts
              totalSystems: stats.totalSystems,
              activeSystems: stats.activeSystems,
              integratedSystems: stats.integratedSystems,

              // Category breakdown
              systemsByCategory: stats.systemsByCategory,

              // Quality metrics
              averageConfidence: Math.round(stats.averageConfidence),
              healthDistribution: stats.healthDistribution,

              // Registry info
              lastUpdated: stats.lastUpdated,
              registryVersion: '1.0.0'
            },
            insights: {
              integrationRate: Math.round((stats.integratedSystems / stats.totalSystems) * 100),
              activeRate: Math.round((stats.activeSystems / stats.totalSystems) * 100),
              healthScore: stats.healthDistribution.healthy
                ? Math.round((stats.healthDistribution.healthy / stats.totalSystems) * 100)
                : 0
            },
            message: '📊 Central Systems Registry statistics retrieved',
            recommendations: [
              '🎯 Focus on integrating remaining systems',
              '🔧 Address systems with ERROR status',
              '📈 Monitor health metrics regularly',
              '🔄 Keep registry information up to date'
            ]
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.error('❌ Error getting registry stats:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: String(error),
            message: '❌ Failed to get registry statistics'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

// Export all tools
export const centralSystemsTools = [
  getAvailableSystemsTool,
  checkSystemExistsTool,
  canCreateFeatureTool,
  getSystemDetailsTool,
  getRegistryStatsTool
];