
// 999-X-Ray-Tool imports
import { analyzeRecentFilesTool, handleAnalyzeRecentFiles } from './xray-tool/analyzeRecentFiles.js';
import { getFileSummaryTool, handleGetFileSummary } from './xray-tool/getFileSummary.js';
import { searchFileAnalysisTool, handleSearchFileAnalysis } from './xray-tool/searchFileAnalysis.js';
import { getAnalysisStatsTool, handleGetAnalysisStats } from './xray-tool/getAnalysisStats.js';
import { checkOllamaStatusTool, handleCheckOllamaStatus } from './xray-tool/checkOllamaStatus.js';

/**
 * MCP Tools Registry
 * ==================
 *
 * Register all MCP tools with the server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { GitTracker } from '../registry/GitTracker.js';
import { createGetAvailableTasksTool } from './getAvailableTasks.js';
import { createClaimTaskTool } from './claimTask.js';
import { createUpdateProgressTool } from './updateProgress.js';
import { createCompleteTaskToolIntegrated } from './completeTask.js';
import { createGetDashboardTool } from './getDashboard.js';
import { createGetAgentStatusTool } from './getAgentStatus.js';
import { agentConnectTool, handleAgentConnect } from './intelligence/agentConnect.js';
import { connectToMCPTool, handleConnectToMCP } from './intelligence/connectToMCP.js';
import { uploadProjectContextTool, handleUploadProjectContext } from './intelligence/uploadProjectContext.js';
import { agentHeartbeatTool, handleAgentHeartbeat } from './intelligence/agentHeartbeat.js';
import { agentDisconnectTool, handleAgentDisconnect } from './intelligence/agentDisconnect.js';
import { getSwarmDashboardTool, handleGetSwarmDashboard } from './intelligence/getSwarmDashboard.js';
import { captureMessageTool, handleCaptureMessage } from './intelligence/captureMessage.js';
import { discoverEnvironmentTool, handleDiscoverEnvironment } from './discovery/discoverEnvironment.js';
import { uploadContextTool, handleUploadContext, searchContextTool, handleSearchContext, retrieveContextTool, handleRetrieveContext, getContextStatsTool, handleGetContextStats } from './discovery/contextTools.js';
import { analyzeProjectTool, handleAnalyzeProject } from './discovery/analyzeProject.js';
import { processYouTubeTool, handleProcessYouTube } from './youtube/processYouTube.js';
import { getSystemHealthTool, handleGetSystemHealth } from './health/getSystemHealth.js';
import { agentCheckInTool, handleAgentCheckIn } from './keepintouch/agentCheckIn.js';
import { requestCompletionPermissionTool, handleRequestCompletionPermission } from './keepintouch/requestCompletionPermission.js';
import { estimateTaskCostTool, handleEstimateTaskCost } from './cost/estimateTaskCost.js';
import { checkUsageLimitsTool, handleCheckUsageLimits } from './cost/checkUsageLimits.js';
import { getRulesTool, handleGetRules, createRuleTool, handleCreateRule, updateRuleTool, handleUpdateRule, deleteRuleTool, handleDeleteRule } from './rules/rulesTools.js';
import { getKnowledge } from './ui/getKnowledge.js';
import { uiConfigProTool, handleUIConfigPro } from './ui/uiConfigPro.js';
import { getSystemStatus } from './mcp/getSystemStatus.js';
import { centralSystemsTools } from './centralSystems.js';
import { generateImage, generateImageTool } from './visual/generateImage.js';
import { mcpTools as multiRegistryTools, CentralMCPMultiRegistryTools } from '../multi-registry-tools.js';
import { getRunPodStatus, getRunPodStatusTool, controlPod, controlPodTool } from './runpod/runpodIntegration.js';
import { logger } from '../utils/logger.js';

export function registerTools(
  server: Server,
  registry: TaskRegistry,
  gitTracker: GitTracker,
  db: Database.Database
): void {
  logger.info('🔧 Registering MCP tools...');

  // Get project path for Best Practices validation
  const projectPath = process.cwd();

  // Initialize Multi-Registry Tools
  const multiRegistryToolsHandler = new CentralMCPMultiRegistryTools(db);

  // Task management tools (existing)
  const taskTools = [
    createGetAvailableTasksTool(registry, db),
    createClaimTaskTool(registry),
    createUpdateProgressTool(registry, gitTracker),
    createCompleteTaskToolIntegrated(registry, gitTracker, db, projectPath),  // FULLY INTEGRATED ⭐
    createGetDashboardTool(registry, gitTracker),
    createGetAgentStatusTool(registry, gitTracker),
  ];

  // Intelligence tools (existing + agent context sharing!)
  const intelligenceTools = [
    { ...connectToMCPTool, handler: (args: unknown) => handleConnectToMCP(args, db) }, // SEAMLESS!
    { ...uploadProjectContextTool, handler: (args: unknown) => handleUploadProjectContext(args, db) }, // AGENTS TEACH AGENTS!
    { ...agentConnectTool, handler: (args: unknown) => handleAgentConnect(args, db) },
    { ...agentHeartbeatTool, handler: (args: unknown) => handleAgentHeartbeat(args, db) },
    { ...agentDisconnectTool, handler: (args: unknown) => handleAgentDisconnect(args, db) },
    { ...getSwarmDashboardTool, handler: (args: unknown) => handleGetSwarmDashboard(args, db) },
    { ...captureMessageTool, handler: (args: unknown) => handleCaptureMessage(args, db) },
  ];

  // Discovery tools (NEW - PLUG-N-PLAY)
  const discoveryTools = [
    { ...discoverEnvironmentTool, handler: (args: unknown) => handleDiscoverEnvironment(args, db) },
    { ...uploadContextTool, handler: (args: unknown) => handleUploadContext(args, db) },
    { ...searchContextTool, handler: (args: unknown) => handleSearchContext(args, db) },
    { ...retrieveContextTool, handler: (args: unknown) => handleRetrieveContext(args, db) },
    { ...getContextStatsTool, handler: (args: unknown) => handleGetContextStats(args, db) },
    { ...analyzeProjectTool, handler: (args: unknown) => handleAnalyzeProject(args, db) }, // 🔧 MR. FIX MY PROJECT PLEASE
  ];

  // YouTube tools (NEW - VIDEO CONTENT PROCESSING) 🎬
  const youtubeTools = [
    { ...processYouTubeTool, handler: (args: unknown) => handleProcessYouTube(args, db) }, // 🎬 YTPIPE INTEGRATION
  ];

  // Health tools (NEW - SELF-HEALING)
  const healthTools = [
    { ...getSystemHealthTool, handler: (args: unknown) => handleGetSystemHealth(args, db, './data/registry.db') },
  ];

  // Keep-in-Touch tools (NEW - COMPLETION GATING) ⭐
  const keepInTouchTools = [
    { ...agentCheckInTool, handler: (args: unknown) => handleAgentCheckIn(args, db) },
    { ...requestCompletionPermissionTool, handler: (args: unknown) => handleRequestCompletionPermission(args, db) },
  ];

  // Cost Management tools (NEW - BUDGET OPTIMIZATION) ⭐
  const costTools = [
    { ...estimateTaskCostTool, handler: (args: unknown) => handleEstimateTaskCost(args, db) },
    { ...checkUsageLimitsTool, handler: (args: unknown) => handleCheckUsageLimits(args, db) },
  ];

  // Rules Management tools (NEW - COORDINATION RULES) ⭐
  const rulesTools = [
    { ...getRulesTool, handler: (args: unknown) => handleGetRules(args, db) },
    { ...createRuleTool, handler: (args: unknown) => handleCreateRule(args, db) },
    { ...updateRuleTool, handler: (args: unknown) => handleUpdateRule(args, db) },
    { ...deleteRuleTool, handler: (args: unknown) => handleDeleteRule(args, db) },
  ];

  // UI tools (NEW - UI KNOWLEDGE BASE + CONFIG PRO)
  const uiTools = [
    {
      name: 'ui.getKnowledge',
      description: 'Get knowledge from the UI Engine knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to get knowledge about (e.g., "oklch")',
          },
          asset_type: {
            type: 'string',
            description: 'The type of asset to get (e.g., "all", "interactive_guide", "components", "documentation")',
          },
        },
        required: ['topic', 'asset_type'],
      },
      handler: (args: unknown) => getKnowledge(args as any),
    },
    { ...uiConfigProTool, handler: (args: unknown) => handleUIConfigPro(args, db) }, // 🎨 OKLCH UI CONFIGURATION PRO
  ];

  // MCP tools (NEW - SYSTEM STATUS)
  const mcpTools = [
    {
      name: 'mcp.getSystemStatus',
      description: 'Get the current status of the Central-MCP system',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: () => getSystemStatus(db),
    },
  ];

  // 🏛️ Central Systems Registry Tools (NEW - SINGLE SOURCE OF TRUTH)
  const centralRegistryTools = centralSystemsTools;

  // Visual tools (NEW - IMAGE GENERATION VIA COMFYUI) 🎨
  const visualTools = [
    {
      ...generateImageTool,
      handler: async (args: unknown) => generateImage(args as any),
    },
  ];

  // RunPod tools (NEW - INFRASTRUCTURE MONITORING & CONTROL) 🖥️
  const runpodTools = [
    {
      ...getRunPodStatusTool,
      handler: async () => getRunPodStatus(),
    },
    {
      ...controlPodTool,
      handler: async (args: unknown) => {
        const params = args as { pod_id: string; action: 'start' | 'stop' | 'restart' };
        return controlPod(params.pod_id, params.action);
      },
    },
  ];

  // 🚀 Multi-Registry Tools (NEW - STANDARDIZED COMPLETION & HONEST ASSESSMENT)
  const registryTools = Object.entries(multiRegistryTools).map(([toolName, toolConfig]) => ({
    name: toolName,
    description: toolConfig.description,
    inputSchema: toolConfig.inputSchema,
    handler: (args: unknown) => toolConfig.handler(args, multiRegistryToolsHandler),
  }));

  const allTools = [...taskTools, ...intelligenceTools, ...discoveryTools, ...youtubeTools, ...healthTools, ...keepInTouchTools, ...costTools, ...rulesTools, ...uiTools, ...mcpTools, ...centralRegistryTools, ...visualTools, ...runpodTools, ...registryTools];

  // Register handler for listing tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });

  // Register handler for calling tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = allTools.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await (tool.handler as any)(args || {});
    } catch (error) {
      logger.error(`Tool execution error for ${name}:`, error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: String(error) }, null, 2)
        }],
        isError: true
      };
    }
  });

  logger.info(`✅ ${allTools.length} MCP tools registered successfully:`);
  logger.info(`   - Task management: ${taskTools.length}`);
  logger.info(`   - Intelligence: ${intelligenceTools.length}`);
  logger.info(`   - Discovery: ${discoveryTools.length}`);
  logger.info(`   - YouTube Processing: ${youtubeTools.length} 🎬 YTPIPE VIDEO ANALYSIS ACTIVE`);
  logger.info(`   - Health: ${healthTools.length}`);
  logger.info(`   - Keep-in-Touch: ${keepInTouchTools.length}`);
  logger.info(`   - Cost Management: ${costTools.length} ⭐ BUDGET OPTIMIZATION ACTIVE`);
  logger.info(`   - Rules Management: ${rulesTools.length} ⭐ COORDINATION RULES ACTIVE`);
  logger.info(`   - UI Tools: ${uiTools.length} ⭐ UI KNOWLEDGE BASE + OKLCH CONFIG PRO ACTIVE`);
  logger.info(`   - MCP: ${mcpTools.length} ⭐ SYSTEM STATUS ACTIVE`);
    logger.info(`   - 🏛️ Central Systems Registry: ${centralRegistryTools.length} ⭐ SINGLE SOURCE OF TRUTH ACTIVE`);
  logger.info(`   - Visual Generation: ${visualTools.length} 🎨 COMFYUI IMAGE GENERATION ACTIVE`);
  logger.info(`   - RunPod Infrastructure: ${runpodTools.length} 🖥️ RUNPOD MONITORING & CONTROL ACTIVE`);
  logger.info(`   - 🚀 Multi-Registry: ${registryTools.length} ⭐ STANDARDIZED COMPLETION & HONEST ASSESSMENT ACTIVE`);
}
