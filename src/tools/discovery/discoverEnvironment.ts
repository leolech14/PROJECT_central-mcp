/**
 * discover_environment - Complete plug-n-play discovery
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { DiscoveryEngine } from '../../discovery/index.js';
import type { ConnectionRequest } from '../../discovery/index.js';

const DiscoverEnvironmentArgsSchema = z.object({
  cwd: z.string(),
  modelId: z.string(),
  trackingId: z.string().optional(),
  apiKeyHash: z.string().optional(),
  machineId: z.string().optional()
});

export const discoverEnvironmentTool = {
  name: 'discover_environment',
  description: 'Automatically discover project, extract context, recognize agent, and generate job proposals',
  inputSchema: {
    type: 'object' as const,
    properties: {
      cwd: {
        type: 'string',
        description: 'Current working directory (where agent is running from)'
      },
      modelId: {
        type: 'string',
        description: 'Agent model ID (e.g., claude-sonnet-4-5)'
      },
      trackingId: {
        type: 'string',
        description: 'Optional tracking ID for agent recognition'
      },
      apiKeyHash: {
        type: 'string',
        description: 'Optional API key hash for signature matching'
      },
      machineId: {
        type: 'string',
        description: 'Optional machine ID for signature matching'
      }
    },
    required: ['cwd', 'modelId']
  }
};

export async function handleDiscoverEnvironment(args: unknown, db: Database.Database) {
  const parsed = DiscoverEnvironmentArgsSchema.parse(args);

  const discoveryEngine = new DiscoveryEngine(db);

  const request: ConnectionRequest = {
    cwd: parsed.cwd,
    modelId: parsed.modelId,
    trackingId: parsed.trackingId,
    apiKeyHash: parsed.apiKeyHash,
    machineId: parsed.machineId
  };

  // Run complete discovery
  const discovery = await discoveryEngine.discoverEnvironment(request);

  // Get beautiful summary
  const summary = discoveryEngine.getDiscoverySummary(discovery);

  console.log(summary);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        // Agent info
        agent: {
          id: discovery.agent.id,
          trackingId: discovery.agent.trackingId,
          name: discovery.agent.name,
          modelId: discovery.agent.modelId,
          capabilities: discovery.agent.capabilities
        },
        agentIdentity: {
          recognized: discovery.agentIdentity.recognized,
          method: discovery.agentIdentity.method,
          confidence: discovery.agentIdentity.confidence,
          previousSessions: discovery.agentIdentity.previousSessions
        },

        // Project info
        project: {
          id: discovery.project.id,
          name: discovery.project.name,
          path: discovery.project.path,
          type: discovery.project.type,
          gitRemote: discovery.project.gitRemote,
          vision: discovery.project.vision
        },
        projectRecognized: discovery.projectRecognized,

        // Context info
        context: {
          totalFiles: discovery.context.statistics.totalFiles,
          totalSize: discovery.context.statistics.totalSize,
          byType: discovery.context.statistics.byType,
          linesOfCode: discovery.context.statistics.linesOfCode,
          technologies: discovery.context.statistics.technologies
        },
        categories: {
          specs: discovery.context.categories.specs.length,
          docs: discovery.context.categories.docs.length,
          code: discovery.context.categories.code.length,
          architecture: discovery.context.categories.architecture.length
        },
        contextExtracted: discovery.contextExtracted,

        // Job proposals
        proposals: discovery.proposals.map(p => ({
          taskId: p.taskId,
          taskName: p.taskName,
          matchScore: p.matchScore,
          matchReason: p.matchReason,
          estimatedEffort: p.estimatedEffort,
          impact: p.impact,
          readyToStart: p.readyToStart,
          recommended: p.recommended,
          relevantContext: {
            specs: p.relevantContext.specs.length,
            docs: p.relevantContext.docs.length,
            codeExamples: p.relevantContext.codeExamples.length,
            total: p.relevantContext.total
          }
        })),
        proposalsGenerated: discovery.proposalsGenerated,

        // Metadata
        discoveryTime: discovery.discoveryTime,
        timestamp: discovery.timestamp
      }, null, 2)
    }]
  };
}
