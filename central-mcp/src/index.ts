#!/usr/bin/env node
/**
 * LocalBrain Task Registry MCP Server
 * ====================================
 *
 * Real-time task coordination for multi-agent development.
 *
 * Built by: Agent D (Integration Specialist + Ground Supervisor)
 * Purpose: Enable seamless agent coordination via MCP protocol
 *
 * Architecture:
 * - Local stdio transport (standard MCP)
 * - SQLite persistence (simple + reliable)
 * - Atomic operations (no race conditions)
 * - Automatic dependency resolution
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';

async function main() {
  logger.info('🚀 Starting LocalBrain Task Registry MCP Server...');
  logger.info('📍 Built by Agent D (Integration + Ground Supervision)');
  logger.info('⭐ Enhanced with Git Tracking by Lech (HITL)');

  try {
    // Import dependencies
    const { TaskRegistry } = await import('./registry/TaskRegistry.js');
    const { GitTracker } = await import('./registry/GitTracker.js');
    const { registerTools } = await import('./tools/index.js');

    // Initialize task registry
    logger.info('📊 Initializing task registry...');
    const registry = new TaskRegistry('./data/registry.db');
    await registry.initialize();

    // Get database instance for intelligence tools
    const db = registry.getDatabase();

    // ════════════════════════════════════════════════════════════════════
    // INITIALIZE 11 REVOLUTIONARY SYSTEMS
    // ════════════════════════════════════════════════════════════════════
    logger.info('🏗️  Initializing 11 revolutionary systems...');

    // 1. MODEL REGISTRY
    const { ModelRegistry } = await import('./ai/ModelRegistry.js');
    const modelRegistry = new ModelRegistry(db);
    logger.info('✅ System 1: ModelRegistry (8 models)');

    // 2. LLM ORCHESTRATOR
    const { LLMOrchestrator } = await import('./ai/LLMOrchestrator.js');
    const llmOrchestrator = new LLMOrchestrator(db);
    logger.info('✅ System 2: LLMOrchestrator (intelligent routing)');

    // 3. GIT INTELLIGENCE ENGINE
    const { GitIntelligenceEngine } = await import('./git/GitIntelligenceEngine.js');
    const gitIntelligence = new GitIntelligenceEngine(process.cwd());
    logger.info('✅ System 3: GitIntelligenceEngine (conventional commits)');

    // 4. AUTO DEPLOYER
    const { AutoDeployer } = await import('./deployment/AutoDeployer.js');
    const autoDeployer = new AutoDeployer({
      projectName: 'central-mcp',
      repoPath: process.cwd(),
      buildCommand: 'npm run build',
      deployCommand: 'echo "Deployment not configured"',
      healthCheckTimeout: 300000,
      rollbackOnFailure: true,
      environments: [
        {
          name: 'development',
          branch: 'develop',
          deployCommand: 'echo "Dev deploy"',
          requiresApproval: false
        },
        {
          name: 'staging',
          branch: 'staging',
          deployCommand: 'echo "Staging deploy"',
          requiresApproval: false
        },
        {
          name: 'production',
          branch: 'main',
          deployCommand: 'echo "Prod deploy"',
          requiresApproval: true
        }
      ]
    });
    logger.info('✅ System 4: AutoDeployer (4-phase pipeline)');

    // 5. SPEC LIFECYCLE VALIDATOR
    const { SpecLifecycleValidator } = await import('./validation/SpecLifecycleValidator.js');
    const specValidator = new SpecLifecycleValidator();
    logger.info('✅ System 5: SpecLifecycleValidator (4-layer validation)');

    // 6. TOTALITY VERIFICATION SYSTEM
    const { TotalityVerificationSystem } = await import('./validation/TotalityVerificationSystem.js');
    const totalityVerification = new TotalityVerificationSystem(db);
    logger.info('✅ System 6: TotalityVerificationSystem (completeness checking)');

    // 7. AGENT DEPLOYMENT ORCHESTRATOR
    const { AgentDeploymentOrchestrator } = await import('./orchestration/AgentDeploymentOrchestrator.js');
    const agentOrchestrator = new AgentDeploymentOrchestrator(db, {
      host: '34.41.115.199',
      user: 'lech_walesa2000',
      port: 22,
      sshKey: '~/.ssh/id_rsa',
      workspaceRoot: '/home/lech_walesa2000'
    });
    logger.info('✅ System 7: AgentDeploymentOrchestrator (VM agent deployment)');

    // 8. CURATED CONTENT MANAGER
    const { CuratedContentManager } = await import('./orchestration/CuratedContentManager.js');
    const contentManager = new CuratedContentManager(db, process.cwd());
    logger.info('✅ System 8: CuratedContentManager (Ground/VM architecture)');

    // 9. INTELLIGENT TASK GENERATOR
    const { IntelligentTaskGenerator } = await import('./intelligence/IntelligentTaskGenerator.js');
    const taskGenerator = new IntelligentTaskGenerator(db);
    logger.info('✅ System 9: IntelligentTaskGenerator (spec → tasks)');

    // 10. SPEC FRONTMATTER PARSER
    const { SpecFrontmatterParser } = await import('./validation/SpecFrontmatterParser.js');
    const specParser = new SpecFrontmatterParser();
    logger.info('✅ System 10: SpecFrontmatterParser (executable specs)');

    logger.info('🎉 ALL 10 CRITICAL SYSTEMS INITIALIZED!');
    logger.info('   GitPushMonitor/Loop 9: READY TO ACTIVATE! ⚡');
    logger.info('');

    // Initialize Auto-Proactive Engine (THE LIVING SYSTEM!)
    logger.info('⚡ Starting Auto-Proactive Engine...');
    const { AutoProactiveEngine } = await import('./auto-proactive/AutoProactiveEngine.js');

    const autoProactive = new AutoProactiveEngine(db, {
      // LAYER 0: Foundation
      enableLoop0: true,  // System Status - ON! ⚡
      enableLoop1: true,  // Agent Auto-Discovery - ON! ⚡

      // LAYER 1: Observation
      enableLoop2: true,  // Project Discovery - ON! ⚡
      enableLoop4: true,  // Progress Monitoring - ON! ⚡
      enableLoop5: true,  // Status Analysis - ON! ⚡
      enableLoop9: true,  // Git Push Monitor - ON! ⚡
      enableLoop10: false, // RunPod Monitor - OFF (needs RUNPOD_API_KEY) 🖥️

      // LAYER 2: Planning
      enableLoop6: true,  // Opportunity Scanning - ON! ⚡
      enableLoop7: true,  // Spec Generation - ON! ⚡

      // LAYER 3: Execution
      enableLoop8: true,  // Task Assignment - ON! ⚡

      // Loop 0 config
      dbPath: './data/registry.db',
      criticalPaths: [
        './data',
        './src/auto-proactive'
      ],

      // Loop 2 config
      projectScanPaths: [
        '/Users/lech/PROJECTS_all'  // Will be configured per deployment
      ],

      // Intervals
      loop0Interval: 5,    // Every 5 seconds (foundation health)
      loop1Interval: 60,   // Every 60 seconds (agent discovery)
      loop2Interval: 60,   // Every 60 seconds (project discovery)
      loop4Interval: 30,   // Every 30 seconds (progress monitoring)
      loop5Interval: 300,  // Every 5 minutes (status analysis)
      loop9Interval: 60,   // Every 60 seconds (git push monitor)
      loop10Interval: 60,  // Every 60 seconds (runpod monitor) - NEW! 🖥️
      loop6Interval: 900,  // Every 15 minutes (opportunity scanning)
      loop7Interval: 600,  // Every 10 minutes (spec generation)
      loop8Interval: 120,  // Every 2 minutes (task assignment)

      // ════════════════════════════════════════════════════════════════
      // REVOLUTIONARY SYSTEMS - THE INTELLIGENCE LAYER! 🧠
      // ════════════════════════════════════════════════════════════════
      systems: {
        modelRegistry,
        llmOrchestrator,
        gitIntelligence,
        autoDeployer,
        specValidator,
        totalityVerification,
        agentOrchestrator,
        contentManager,
        taskGenerator,
        specParser
      }
    });

    await autoProactive.start();

    // Initialize git tracker
    logger.info('🔍 Initializing git tracker...');
    const gitTracker = new GitTracker(process.cwd());

    // Create MCP server
    const server = new Server(
      {
        name: 'localbrain-task-registry',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    logger.info('✅ MCP Server initialized');

    // Register all tools (task + intelligence)
    registerTools(server, registry, gitTracker, db);

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('🎯 MCP Server running and ready for agent connections');
    logger.info('📊 Agents can now coordinate via MCP protocol');
    logger.info('⚡ Features: Atomic claiming, Auto-unblocking, Git verification, Real-time progress');

    // Graceful shutdown handler
    const shutdown = () => {
      logger.info('🛑 Shutting down gracefully...');
      autoProactive.stop();
      registry.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('❌ Fatal error starting MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('💥 Unhandled error:', error);
  process.exit(1);
});
