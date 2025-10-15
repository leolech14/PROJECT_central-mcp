/**
 * Loop 1: Agent Auto-Discovery
 * =============================
 *
 * THE IDENTITY LAYER - WHO IS AVAILABLE TO WORK?
 *
 * Runs on startup and every 60 seconds:
 * 1. Detects available AI agent models
 * 2. Maps agents to capability letters (A-F)
 * 3. Registers agent working directories
 * 4. Tracks active agent sessions
 * 5. Updates agent-project-location matrix
 * 6. Monitors agent heartbeats
 *
 * This enables all other loops to know WHO can do WHAT and WHERE!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { writeSystemEvent } from '../api/universal-write.js';
import { AgentRealityVerificationSystem, AgentRealityConfig } from './AgentRealityVerificationSystem.js';
import { EnhancedModelDetectionSystem, ModelDetectionResult } from './ModelDetectionSystem.js';

export interface AgentAutoDiscoveryConfig {
  intervalSeconds: number;     // How often to run (default: 60)
  autoRegister: boolean;       // Auto-register discovered agents (default: true)
  trackHeartbeats: boolean;    // Monitor agent activity (default: true)
  sessionTimeoutMinutes: number; // Consider agent offline after (default: 10)
}

export interface AgentModel {
  id: string;                  // "claude-sonnet-4-5", "glm-4.6", etc.
  provider: string;            // "anthropic", "zhipu", "google", etc.
  capabilities: string[];      // ["reasoning", "coding", "vision", etc.]
}

export interface AgentSession {
  agentLetter: string;         // "A", "B", "C", "D", "E", "F"
  modelId: string;             // Current model being used
  workingDirectory: string;    // Current pwd
  projectName: string;         // Which project context
  capabilities: string[];      // Agent specializations
  sessionStarted: string;      // ISO timestamp
  lastHeartbeat: string;       // ISO timestamp
  status: 'active' | 'idle' | 'offline';
}

// Agent capability mapping (from SPECBASE 0016)
const AGENT_CAPABILITIES: Record<string, {
  letter: string;
  role: string;
  models: string[];
  specializations: string[];
}> = {
  'A': {
    letter: 'A',
    role: 'UI Velocity Specialist',
    models: ['glm-4.6', 'glm-4-flash'],
    specializations: ['ui', 'react', 'design-systems', 'rapid-prototyping']
  },
  'B': {
    letter: 'B',
    role: 'Design & Architecture',
    models: ['claude-sonnet-4-5'],
    specializations: ['architecture', 'design-patterns', 'system-design', 'documentation']
  },
  'C': {
    letter: 'C',
    role: 'Backend Specialist',
    models: ['glm-4.6', 'deepseek-coder'],
    specializations: ['backend', 'databases', 'apis', 'performance']
  },
  'D': {
    letter: 'D',
    role: 'Integration Specialist',
    models: ['claude-sonnet-4-5'],
    specializations: ['integration', 'coordination', 'testing', 'deployment']
  },
  'E': {
    letter: 'E',
    role: 'Operations & Supervisor',
    models: ['gemini-2.5-pro'],
    specializations: ['operations', 'monitoring', 'optimization', 'supervision']
  },
  'F': {
    letter: 'F',
    role: 'Strategic Planning',
    models: ['claude-opus-4'],
    specializations: ['strategy', 'product', 'planning', 'vision']
  }
};

export class AgentAutoDiscoveryLoop {
  private db: Database.Database;
  private config: AgentAutoDiscoveryConfig;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private loopCount: number = 0;
  private agentsDiscovered: number = 0;
  private realitySystem: AgentRealityVerificationSystem;
  private enhancedModelDetectionSystem: EnhancedModelDetectionSystem;

  constructor(db: Database.Database, config: AgentAutoDiscoveryConfig) {
    this.db = db;
    this.config = config;

    // Initialize Reality Verification System
    const realityConfig: AgentRealityConfig = {
      enableTemporalDisclaimers: true,
      enableLiveVerification: true,
      maxHistoricalInterpretationMinutes: 10, // 10 minutes threshold for "live"
      strictModeEnabled: true // Prevent false assumptions
    };
    this.realitySystem = new AgentRealityVerificationSystem(db, realityConfig);

    // Initialize Enhanced Model Detection System
    this.enhancedModelDetectionSystem = new EnhancedModelDetectionSystem(db);
  }

  /**
   * Start agent discovery loop
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️  Agent auto-discovery loop already running');
      return;
    }

    logger.info(`🔄 Starting Agent Auto-Discovery Loop (every ${this.config.intervalSeconds}s)`);

    this.isRunning = true;

    // Run immediately
    this.runDiscovery();

    // Then on interval
    this.intervalHandle = setInterval(
      () => this.runDiscovery(),
      this.config.intervalSeconds * 1000
    );

    logger.info('✅ Loop 1: Agent Auto-Discovery ACTIVE');
  }

  /**
   * Stop discovery loop
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    logger.info('🛑 Loop 1: Agent Auto-Discovery STOPPED');
  }

  /**
   * Run agent discovery cycle
   */
  private async runDiscovery(): Promise<void> {
    this.loopCount++;
    const startTime = Date.now();

    logger.info(`🔍 Loop 1 Execution #${this.loopCount}: Discovering agents...`);

    try {
      // 1. Detect current agent (this process)
      const currentAgent = this.detectCurrentAgent();

      if (currentAgent) {
        logger.info(`   Identified: Agent ${currentAgent.agentLetter} (${currentAgent.modelId})`);
        logger.info(`   Working in: ${currentAgent.projectName}`);
        logger.info(`   Capabilities: ${currentAgent.capabilities.join(', ')}`);

        // 🔍 ENHANCED MODEL DETECTION: Reality-based model identification
        const sessionId = `loop-1-session-${this.loopCount}`;
        const modelDetection = await this.enhancedModelDetectionSystem.detectCurrentModel(sessionId);

        logger.info(`   🤖 ENHANCED MODEL DETECTION COMPLETE`);
        logger.info(`   📊 DETECTED MODEL: ${modelDetection.detectedModel}`);
        logger.info(`   🏢 PROVIDER: ${modelDetection.modelProvider}`);
        logger.info(`   📚 CONTEXT WINDOW: ${modelDetection.contextWindow.toLocaleString()} tokens`);
        logger.info(`   ✅ CONFIDENCE: ${(modelDetection.confidence * 100).toFixed(0)}% (${modelDetection.verified ? 'VERIFIED' : 'UNVERIFIED'})`);
        logger.info(`   🔍 DETECTION METHOD: ${modelDetection.detectionMethod}`);

        // Log self-correction if applied
        if (modelDetection.selfCorrection?.correctionApplied) {
          logger.info(`   🧠 SELF-CORRECTION APPLIED: ${modelDetection.selfCorrection.originalModel} → ${modelDetection.selfCorrection.correctedModel}`);
          logger.info(`   📋 CORRECTION REASON: ${modelDetection.selfCorrection.correctionReason}`);
        }

        // Update agent info with enhanced model detection results
        if (modelDetection.verified && modelDetection.confidence > 0.7) {
          currentAgent.agentLetter = modelDetection.agentLetter;
          currentAgent.modelId = modelDetection.detectedModel;
          currentAgent.capabilities = Object.values(modelDetection.capabilities);

          logger.info(`   🔄 UPDATED: Agent ${modelDetection.agentLetter} (${modelDetection.agentRole})`);
          logger.info(`   🎯 CAPABILITIES: ${modelDetection.capabilities.reasoning} reasoning, ${modelDetection.capabilities.coding} coding, ${modelDetection.capabilities.multimodal ? 'multimodal' : 'text-only'}`);
        }

        // 🔍 REALITY CHECK: Prevent false assumptions
        const realityCheck = await this.realitySystem.verifyAgentReality(
          currentAgent.agentLetter,
          'agent-discovery'
        );

        // Display temporal warnings
        if (realityCheck.warnings.length > 0) {
          logger.warn(`   ⚠️  ${realityCheck.warnings.join(' | ')}`);
        }

        // Display disclaimers
        if (realityCheck.disclaimers.length > 0) {
          logger.info(`   📚 ${realityCheck.disclaimers.join(' | ')}`);
        }

        // Add temporal disclaimer to logs
        const temporalDisclaimer = this.realitySystem.generateTemporalDisclaimer(
          currentAgent.agentLetter,
          'Discovery'
        );
        logger.info(`   ${temporalDisclaimer}`);

        // 2. Register or update agent session
        if (this.config.autoRegister) {
          this.registerAgentSession(currentAgent);
        }

        this.agentsDiscovered++;
      }

      // 3. Check for other active agents (via heartbeats)
      if (this.config.trackHeartbeats) {
        this.updateHeartbeats();
        this.detectStaleAgents();
      }

      // 4. Get all active agents
      const activeAgents = this.getActiveAgents();
      logger.info(`   Active agents: ${activeAgents.length}`);

      // 🔍 REALITY CHECK: All active agents
      if (activeAgents.length > 0) {
        logger.info(`   🔍 REALITY VERIFICATION FOR ALL ACTIVE AGENTS:`);
        for (const agent of activeAgents) {
          const agentReality = await this.realitySystem.verifyAgentReality(
            agent.agentLetter,
            'active-agents-check'
          );
          const status = agentReality.isLiveConnection ? '🟢 LIVE' : '📚 HISTORICAL';
          logger.info(`      ${status} Agent ${agent.agentLetter}: ${agentReality.timeSinceLastActivity.toFixed(1)} min ago`);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ Loop 1 Complete: ${activeAgents.length} agents active in ${duration}ms`);

      // Get enhanced model detection system statistics
      const systemStats = this.enhancedModelDetectionSystem.getSystemStats();

      // Write enhanced event to Universal Write System
      writeSystemEvent({
        eventType: 'loop_execution',
        eventCategory: 'system',
        eventActor: 'Loop-1',
        eventAction: `Enhanced agent discovery: ${activeAgents.length} agents active`,
        eventDescription: `Loop #${this.loopCount} - Current agent: ${currentAgent?.agentLetter || 'unknown'} (Enhanced Detection)`,
        systemHealth: systemStats.systemHealth,
        activeLoops: 9,
        activeAgents: activeAgents.length,
        avgResponseTimeMs: duration,
        successRate: 1.0,
        tags: ['loop-1', 'agent-discovery', 'auto-proactive', 'enhanced-detection'],
        metadata: {
          loopCount: this.loopCount,
          currentAgent: currentAgent?.agentLetter,
          activeAgentsCount: activeAgents.length,
          enhancedDetectionStats: {
            totalDetections: systemStats.totalDetections,
            avgConfidence: systemStats.avgConfidence,
            accuracyRate: systemStats.accuracyRate,
            topModels: systemStats.topModels,
            selfCorrectionStats: systemStats.selfCorrectionStats
          },
          sessionId: `loop-1-session-${this.loopCount}`,
          detectionMethod: currentAgent ? 'enhanced-model-detection' : 'fallback-detection'
        }
      });

    } catch (err: any) {
      logger.error(`❌ Loop 1 Error:`, err);
    }
  }

  /**
   * Detect current agent model and map to letter
   */
  private detectCurrentAgent(): AgentSession | null {
    try {
      // Try to detect from environment or config
      const modelId = process.env.AGENT_MODEL_ID || this.guessModelFromContext();
      const agentLetter = this.mapModelToAgentLetter(modelId);

      if (!agentLetter) {
        logger.warn('   Could not map model to agent letter');
        return null;
      }

      const agentConfig = AGENT_CAPABILITIES[agentLetter];
      const cwd = process.cwd();
      const projectName = this.extractProjectName(cwd);

      return {
        agentLetter,
        modelId,
        workingDirectory: cwd,
        projectName,
        capabilities: agentConfig.specializations,
        sessionStarted: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        status: 'active'
      };

    } catch (err: any) {
      logger.warn(`   Agent detection failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Guess model from context (placeholder - would use API detection in production)
   */
  private guessModelFromContext(): string {
    // In production, this would detect from:
    // - API response headers
    // - MCP server connection info
    // - Process environment

    // For now, default to Sonnet-4.5 (Agent D)
    return 'claude-sonnet-4-5';
  }

  /**
   * Map model ID to agent letter
   */
  private mapModelToAgentLetter(modelId: string): string | null {
    for (const [letter, config] of Object.entries(AGENT_CAPABILITIES)) {
      if (config.models.some(model => modelId.includes(model))) {
        return letter;
      }
    }
    return null;
  }

  /**
   * Extract project name from working directory
   */
  private extractProjectName(cwd: string): string {
    const parts = cwd.split('/');
    const projectIndex = parts.findIndex(p => p.startsWith('PROJECT_'));

    if (projectIndex >= 0) {
      return parts[projectIndex];
    }

    // Fallback to directory name
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Register or update agent session in database
   */
  private registerAgentSession(agent: AgentSession): void {
    try {
      // Use existing agent_sessions table (already created by TaskStore)
      // Database schema: agent_letter, agent_model, project_id, connected_at, last_heartbeat, status

      // Upsert agent session
      const existing = this.db.prepare(`
        SELECT id FROM agent_sessions WHERE agent_letter = ? AND project_id = ?
      `).get(agent.agentLetter, agent.projectName) as any;

      if (existing) {
        // Update existing session
        this.db.prepare(`
          UPDATE agent_sessions
          SET last_heartbeat = ?,
              status = ?
          WHERE id = ?
        `).run(
          agent.lastHeartbeat,
          agent.status.toUpperCase(), // Database expects ACTIVE/IDLE/DISCONNECTED in uppercase
          existing.id
        );
      } else {
        // Insert new session using actual database columns
        this.db.prepare(`
          INSERT INTO agent_sessions (
            id, agent_letter, agent_model,
            project_id, connected_at,
            last_heartbeat, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          agent.agentLetter,
          agent.modelId,
          agent.projectName,
          agent.sessionStarted, // Maps to connected_at
          agent.lastHeartbeat,
          agent.status.toUpperCase() // Database expects ACTIVE/IDLE/DISCONNECTED
        );

        logger.info(`   ✅ Registered new agent session: ${agent.agentLetter}`);
      }

    } catch (err: any) {
      logger.warn(`   ⚠️  Could not register agent session: ${err.message}`);
    }
  }

  /**
   * Update heartbeats for current agent
   */
  private updateHeartbeats(): void {
    try {
      const currentAgent = this.detectCurrentAgent();
      if (currentAgent) {
        this.db.prepare(`
          UPDATE agent_sessions
          SET last_heartbeat = ?,
              status = 'active',
              updated_at = ?
          WHERE agent_letter = ? AND project_id = ?
        `).run(
          new Date().toISOString(),
          Date.now(),
          currentAgent.agentLetter,
          currentAgent.projectName
        );
      }
    } catch (err: any) {
      // Ignore heartbeat errors
    }
  }

  /**
   * Detect and mark stale agent sessions
   */
  private detectStaleAgents(): void {
    try {
      const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
      const cutoff = new Date(Date.now() - timeoutMs).toISOString();

      this.db.prepare(`
        UPDATE agent_sessions
        SET status = 'offline',
            updated_at = ?
        WHERE last_heartbeat < ?
          AND status != 'offline'
      `).run(Date.now(), cutoff);

    } catch (err: any) {
      // Ignore stale detection errors
    }
  }

  /**
   * Get all active agent sessions
   */
  private getActiveAgents(): AgentSession[] {
    try {
      const rows = this.db.prepare(`
        SELECT * FROM agent_sessions
        WHERE status = 'ACTIVE'
        ORDER BY last_heartbeat DESC
      `).all() as any[];

      return rows.map(row => ({
        agentLetter: row.agent_letter,
        modelId: row.agent_model, // Database column is agent_model
        workingDirectory: process.cwd(), // Not in database, use current working directory
        projectName: row.project_id,
        capabilities: [], // Not in database, return empty array
        sessionStarted: row.connected_at, // Database column is connected_at
        lastHeartbeat: row.last_heartbeat,
        status: row.status.toLowerCase() // Convert ACTIVE to active for consistency
      }));

    } catch (err: any) {
      return [];
    }
  }

  /**
   * Log loop execution
   */
  private logLoopExecution(result: any): void {
    try {
      this.db.prepare(`
        INSERT INTO auto_proactive_logs (
          id, loop_name, action, result, timestamp, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        'AGENT_AUTO_DISCOVERY',
        'DISCOVER_AND_REGISTER',
        JSON.stringify(result),
        new Date().toISOString(),
        result.durationMs
      );
    } catch (err: any) {
      // Ignore logging errors
    }
  }

  /**
   * Get loop statistics
   */
  getStats(): any {
    const activeAgents = this.getActiveAgents();
    const enhancedStats = this.enhancedModelDetectionSystem.getSystemStats();

    return {
      isRunning: this.isRunning,
      loopCount: this.loopCount,
      agentsDiscovered: this.agentsDiscovered,
      activeAgents: activeAgents.length,
      agents: activeAgents,
      intervalSeconds: this.config.intervalSeconds,
      enhancedModelDetection: enhancedStats,
      integration: {
        realityVerificationEnabled: true,
        selfCorrectionEnabled: true,
        universalWriteEnabled: true
      }
    };
  }

  /**
   * Provide feedback to enhanced model detection system
   */
  async provideAgentDetectionFeedback(
    detectionId: string,
    actualModel: string,
    userConfirmed: boolean,
    context: string = 'agent-discovery-feedback'
  ): Promise<void> {
    try {
      await this.enhancedModelDetectionSystem.provideFeedback(
        detectionId,
        actualModel,
        userConfirmed,
        context
      );

      logger.info(`📚 Agent discovery feedback processed: ${detectionId} → ${actualModel} (confirmed: ${userConfirmed})`);

      // Write feedback event to Universal Write System
      await writeSystemEvent({
        eventType: 'agent-feedback',
        eventCategory: 'learning',
        eventActor: 'Loop-1',
        eventAction: `Agent detection feedback: ${actualModel}`,
        eventDescription: `User feedback for agent detection - ${userConfirmed ? 'confirmed' : 'corrected'}`,
        systemHealth: 'healthy',
        activeLoops: 9,
        avgResponseTimeMs: 0,
        successRate: 1.0,
        tags: ['loop-1', 'agent-feedback', 'learning', 'enhanced-detection'],
        metadata: {
          detectionId,
          actualModel,
          userConfirmed,
          context,
          loopCount: this.loopCount,
          feedbackSource: 'agent-auto-discovery'
        }
      });

    } catch (error: any) {
      logger.error(`❌ Failed to process agent detection feedback:`, error);
    }
  }

  /**
   * Get enhanced model detection statistics for monitoring
   */
  getModelDetectionStatistics(): any {
    return this.enhancedModelDetectionSystem.getSystemStats();
  }

  /**
   * Export model detection data for analysis
   */
  exportModelDetectionData(hours: number = 24): any {
    return this.enhancedModelDetectionSystem.exportDetectionData(hours);
  }
}
