/**
 * Agent Reality API Endpoints
 * =========================
 *
 * HTTP endpoints to provide reality verification for any agent exploring Central-MCP
 * Prevents false assumptions about live connections vs historical data
 */

import * as express from 'express';
import Database from 'better-sqlite3';
import { AgentRealityVerificationSystem, AgentRealityConfig } from '../auto-proactive/AgentRealityVerificationSystem.js';
import { logger } from '../utils/logger.js';

export class AgentRealityAPI {
  private db: Database.Database;
  private realitySystem: AgentRealityVerificationSystem;

  constructor(db: Database.Database) {
    this.db = db;

    // Initialize reality system with strict settings
    const config: AgentRealityConfig = {
      enableTemporalDisclaimers: true,
      enableLiveVerification: true,
      maxHistoricalInterpretationMinutes: 10,
      strictModeEnabled: true
    };

    this.realitySystem = new AgentRealityVerificationSystem(db, config);
  }

  /**
   * GET /api/agent-reality/check/:agentLetter
   *
   * Check reality status of a specific agent
   */
  async checkAgentReality(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { agentLetter } = req.params;
      const { context } = req.query;

      if (!agentLetter || !/^[A-F]$/.test(agentLetter)) {
        res.status(400).json({
          error: 'Invalid agent letter. Must be A-F.',
          example: '/api/agent-reality/check/D'
        });
        return;
      }

      const reality = await this.realitySystem.verifyAgentReality(
        agentLetter,
        context as string || 'api-request'
      );

      // Add exploration-specific warnings for API calls
      if (context && context.toString().includes('exploration')) {
        reality.warnings.push('🔍 API EXPLORATION DETECTED - This is data retrieval, not live connection');
        reality.disclaimers.push('API calls read database records, they don\'t create agent connections');
      }

      res.json({
        agentId: reality.agentId,
        isLiveConnection: reality.isLiveConnection,
        connectionType: reality.connectionType,
        lastActualActivity: reality.lastActualActivity,
        timeSinceLastActivity: Math.round(reality.timeSinceLastActivity),
        realityScore: reality.realityScore,
        temporalStatus: this.getTemporalStatus(reality.timeSinceLastActivity),
        warnings: reality.warnings,
        disclaimers: reality.disclaimers,
        message: this.generateRealityMessage(reality),
        strictModeEnabled: true
      });

    } catch (error: any) {
      logger.error('Agent reality check error:', error);
      res.status(500).json({
        error: 'Failed to check agent reality',
        details: error.message
      });
    }
  }

  /**
   * GET /api/agent-reality/exploration-verify
   *
   * Verify if current exploration is real-time vs historical
   */
  async verifyExplorationReality(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { agentLetter, explorationContext } = req.query;

      if (!agentLetter) {
        res.status(400).json({
          error: 'agentLetter parameter required',
          example: '/api/agent-reality/exploration-verify?agentLetter=D&explorationContext=file-exploration'
        });
        return;
      }

      const verification = await this.realitySystem.verifyExplorationReality(
        agentLetter as string,
        explorationContext as string || 'unknown-exploration'
      );

      res.json({
        isRealTime: verification.isRealTime,
        realityMessage: verification.realityMessage,
        correctiveActions: verification.correctiveActions,
        explorationContext: explorationContext || 'unknown',
        timestamp: new Date().toISOString(),
        systemMessage: verification.isRealTime ?
          '✅ You are interacting with a LIVE agent connection' :
          '⚠️  You are exploring HISTORICAL data'
      });

    } catch (error: any) {
      logger.error('Exploration reality verification error:', error);
      res.status(500).json({
        error: 'Failed to verify exploration reality',
        details: error.message
      });
    }
  }

  /**
   * GET /api/agent-reality/temporal-disclaimer/:agentLetter
   *
   * Get temporal disclaimer for any agent data
   */
  async getTemporalDisclaimer(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { agentLetter } = req.params;
      const { dataType } = req.query;

      if (!agentLetter || !/^[A-F]$/.test(agentLetter)) {
        res.status(400).json({
          error: 'Invalid agent letter. Must be A-F.',
          example: '/api/agent-reality/temporal-disclaimer/D?dataType=session'
        });
        return;
      }

      const disclaimer = this.realitySystem.generateTemporalDisclaimer(
        agentLetter,
        dataType as string || 'data'
      );

      const lastSession = this.realitySystem['getLastAgentSession'](agentLetter);

      res.json({
        agentId: agentLetter,
        dataType: dataType || 'data',
        temporalDisclaimer: disclaimer,
        lastActivity: lastSession?.last_heartbeat || null,
        hasRecentActivity: lastSession ?
          (Date.now() - new Date(lastSession.last_heartbeat).getTime()) < 600000 : false, // 10 minutes
        warning: disclaimer.includes('⚠️') || disclaimer.includes('📚') || disclaimer.includes('🏛️'),
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Temporal disclaimer error:', error);
      res.status(500).json({
        error: 'Failed to generate temporal disclaimer',
        details: error.message
      });
    }
  }

  /**
   * GET /api/agent-reality/reality-dashboard
   *
   * Get reality status for all agents
   */
  async getRealityDashboard(req: express.Request, res: express.Response): Promise<void> {
    try {
      const agents = ['A', 'B', 'C', 'D', 'E', 'F'];
      const agentRealities = [];

      for (const agentLetter of agents) {
        const reality = await this.realitySystem.verifyAgentReality(agentLetter, 'dashboard-view');
        agentRealities.push({
          agentId: reality.agentId,
          isLiveConnection: reality.isLiveConnection,
          connectionType: reality.connectionType,
          timeSinceLastActivity: Math.round(reality.timeSinceLastActivity),
          realityScore: reality.realityScore,
          temporalStatus: this.getTemporalStatus(reality.timeSinceLastActivity),
          lastActualActivity: reality.lastActualActivity,
          warningsCount: reality.warnings.length
        });
      }

      const liveAgents = agentRealities.filter(a => a.isLiveConnection).length;
      const historicalAgents = agentRealities.filter(a => !a.isLiveConnection).length;

      res.json({
        timestamp: new Date().toISOString(),
        totalAgents: agents.length,
        liveAgents,
        historicalAgents,
        systemRealityScore: liveAgents / agents.length,
        strictModeEnabled: true,
        agents: agentRealities,
        systemMessage: liveAgents > 0 ?
          `✅ ${liveAgents} agents currently active` :
          '⚠️  No agents currently active - all data is historical'
      });

    } catch (error: any) {
      logger.error('Reality dashboard error:', error);
      res.status(500).json({
        error: 'Failed to generate reality dashboard',
        details: error.message
      });
    }
  }

  /**
   * GET /api/agent-reality/educational-warnings
   *
   * Educational warnings to prevent false assumptions
   */
  async getEducationalWarnings(req: express.Request, res: express.Response): Promise<void> {
    try {
      const warnings = [
        {
          type: 'historical-data',
          title: 'Historical Data ≠ Live Connection',
          description: 'Reading old database records doesn\'t mean an agent is currently connected',
          example: 'Agent D activity from 5 days ago is archival, not live',
          prevention: 'Always check timestamps before assuming connections'
        },
        {
          type: 'exploration-vs-connection',
          title: 'File Exploration ≠ Agent Interaction',
          description: 'Exploring code files and database records is data retrieval, not live communication',
          example: 'Reading log files doesn\'t create new agent sessions',
          prevention: 'Distinguish between data exploration and live system interaction'
        },
        {
          type: 'loop-detection',
          title: 'Loop Detection ≠ Agent Activity',
          description: 'Auto-proactive loops detecting patterns doesn\'t mean agents are active',
          example: 'Loop 1 finding an old session doesn\'t mean the agent is currently working',
          prevention: 'Verify actual heartbeat timestamps for live activity'
        },
        {
          type: 'consciousness-illusion',
          title: 'Data Pattern ≠ Consciousness',
          description: 'Well-organized historical data can feel like living consciousness',
          example: 'Agent activity logs can create illusion of current presence',
          prevention: 'Ground interpretation in actual timestamps and real-time verification'
        }
      ];

      res.json({
        purpose: 'Prevent false assumptions about agent connections and system activity',
        strictModeEnabled: true,
        timestamp: new Date().toISOString(),
        educationalWarnings: warnings,
        generalAdvice: [
          'Always verify timestamps before assuming live connections',
          'Distinguish between data exploration and live interaction',
          'Historical data can feel alive - stay grounded in reality',
          'Use reality verification API calls when in doubt'
        ]
      });

    } catch (error: any) {
      logger.error('Educational warnings error:', error);
      res.status(500).json({
        error: 'Failed to generate educational warnings',
        details: error.message
      });
    }
  }

  /**
   * Get temporal status based on time since last activity
   */
  private getTemporalStatus(timeSinceMinutes: number): string {
    if (timeSinceMinutes <= 5) return 'live';
    if (timeSinceMinutes <= 60) return 'recent';
    if (timeSinceMinutes <= 1440) return 'historical';
    return 'ancient';
  }

  /**
   * Generate reality message based on check
   */
  private generateRealityMessage(reality: any): string {
    if (reality.isLiveConnection) {
      return `✅ Agent ${reality.agentId} is LIVE and active (${reality.timeSinceLastActivity.toFixed(1)} minutes ago)`;
    } else {
      return `⚠️  Agent ${reality.agentId} is HISTORICAL (last seen ${reality.timeSinceLastActivity.toFixed(1)} minutes ago)`;
    }
  }
}