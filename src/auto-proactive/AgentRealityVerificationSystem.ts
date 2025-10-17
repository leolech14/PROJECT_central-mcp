/**
 * Agent Reality Verification System
 * ================================
 *
 * PREVENTS FALSE ASSUMPTIONS ABOUT AGENT CONNECTIONS
 *
 * This system ensures no agent can mistake historical data for live connections.
 * It provides crystal-clear temporal awareness and real-time verification.
 *
 * Created after Agent D's beautiful but false assumption about "connecting" to Central-MCP.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { writeSystemEvent } from '../api/universal-write.js';

export interface AgentRealityConfig {
  enableTemporalDisclaimers: boolean;    // Show time-aware warnings
  enableLiveVerification: boolean;       // Require real-time proof
  maxHistoricalInterpretationMinutes: number; // Threshold for "live" data
  strictModeEnabled: boolean;            // Prevent any false assumptions
}

export interface AgentRealityCheck {
  agentId: string;
  isLiveConnection: boolean;
  lastActualActivity: Date;
  timeSinceLastActivity: number;         // minutes
  connectionType: 'live' | 'historical' | 'unknown';
  realityScore: number;                  // 0.0-1.0 confidence
  warnings: string[];
  disclaimers: string[];
}

export class AgentRealityVerificationSystem {
  private db: Database.Database;
  private config: AgentRealityConfig;
  private verificationCache: Map<string, AgentRealityCheck> = new Map();

  constructor(db: Database.Database, config: AgentRealityConfig) {
    this.db = db;
    this.config = config;

    logger.info('🛡️ AgentRealityVerificationSystem initialized');
    logger.info('   Purpose: Prevent false assumptions about agent connections');
    logger.info(`   Strict mode: ${this.config.strictModeEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Verify agent reality - prevents false assumptions
   */
  async verifyAgentReality(agentLetter: string, context?: string): Promise<AgentRealityCheck> {
    const cacheKey = `${agentLetter}-${context || 'default'}`;

    // Check cache first
    if (this.verificationCache.has(cacheKey)) {
      const cached = this.verificationCache.get(cacheKey)!;
      if (Date.now() - cached.lastActualActivity.getTime() < 30000) { // 30 second cache
        return cached;
      }
    }

    logger.info(`🔍 REALITY CHECK: Agent ${agentLetter}`);
    const check = await this.performRealityCheck(agentLetter, context);

    // Cache the result
    this.verificationCache.set(cacheKey, check);

    // Log reality verification
    this.logRealityVerification(check);

    return check;
  }

  /**
   * Perform comprehensive reality check
   */
  private async performRealityCheck(agentLetter: string, context?: string): Promise<AgentRealityCheck> {
    const warnings: string[] = [];
    const disclaimers: string[] = [];

    // 1. Check agent sessions
    const lastSession = this.getLastAgentSession(agentLetter);
    const lastActivity = this.getLastAgentActivity(agentLetter);

    const now = new Date();
    const timeSinceLastActivity = lastSession ?
      (now.getTime() - new Date(lastSession.last_heartbeat).getTime()) / (1000 * 60) :
      Infinity;

    // 2. Determine connection type
    let connectionType: 'live' | 'historical' | 'unknown' = 'unknown';
    let isLiveConnection = false;
    let realityScore = 0.0;

    if (timeSinceLastActivity <= 5) { // Within 5 minutes = LIVE
      connectionType = 'live';
      isLiveConnection = true;
      realityScore = 1.0;
    } else if (timeSinceLastActivity <= this.config.maxHistoricalInterpretationMinutes) {
      connectionType = 'historical';
      isLiveConnection = false;
      realityScore = 0.5;
      warnings.push(`Agent ${agentLetter} last seen ${Math.round(timeSinceLastActivity)} minutes ago`);
      disclaimers.push('This is HISTORICAL data, not a live connection');
    } else {
      connectionType = 'historical';
      isLiveConnection = false;
      realityScore = 0.1;
      warnings.push(`Agent ${agentLetter} last seen ${Math.round(timeSinceLastActivity)} minutes ago (HISTORICAL)`);
      disclaimers.push('This is ANCIENT data - agent is likely disconnected');
    }

    // 3. Add context-specific warnings
    if (context && context.includes('exploration')) {
      warnings.push('You are EXPLORING HISTORICAL DATA, not making live connections');
      disclaimers.push('Exploration ≠ Live Connection');
    }

    // 4. Strict mode enforcement
    if (this.config.strictModeEnabled && !isLiveConnection) {
      warnings.push('⚠️  STRICT MODE: This is NOT a live connection!');
      disclaimers.push('Historical data can feel alive - stay grounded in reality');
    }

    return {
      agentId: agentLetter,
      isLiveConnection,
      lastActualActivity: lastSession ? new Date(lastSession.last_heartbeat) : new Date(0),
      timeSinceLastActivity,
      connectionType,
      realityScore,
      warnings,
      disclaimers
    };
  }

  /**
   * Get last agent session from database
   */
  private getLastAgentSession(agentLetter: string): any {
    try {
      return this.db.prepare(`
        SELECT * FROM agent_sessions
        WHERE agent_letter = ?
        ORDER BY last_heartbeat DESC
        LIMIT 1
      `).get(agentLetter);
    } catch (err) {
      return null;
    }
  }

  /**
   * Get last agent activity
   */
  private getLastAgentActivity(agentLetter: string): any {
    try {
      return this.db.prepare(`
        SELECT * FROM agent_activity
        WHERE agent_letter = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `).get(agentLetter);
    } catch (err) {
      return null;
    }
  }

  /**
   * Generate temporal disclaimer for agent data
   */
  generateTemporalDisclaimer(agentLetter: string, dataType: string): string {
    const lastSession = this.getLastAgentSession(agentLetter);
    if (!lastSession) {
      return `⚠️  No data found for Agent ${agentLetter}`;
    }

    const now = new Date();
    const lastSeen = new Date(lastSession.last_heartbeat);
    const minutesAgo = Math.round((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (minutesAgo <= 5) {
      return `✅ Agent ${agentLetter} ${dataType} (LIVE - ${minutesAgo} min ago)`;
    } else if (minutesAgo <= 60) {
      return `⚠️  Agent ${agentLetter} ${dataType} (RECENT - ${minutesAgo} min ago)`;
    } else if (minutesAgo <= 1440) { // 24 hours
      return `📚 Agent ${agentLetter} ${dataType} (HISTORICAL - ${minutesAgo} min ago)`;
    } else {
      return `🏛️  Agent ${agentLetter} ${dataType} (ANCIENT - ${minutesAgo} min ago)`;
    }
  }

  /**
   * Verify if current exploration is real-time
   */
  async verifyExplorationReality(agentLetter: string, explorationContext: string): Promise<{
    isRealTime: boolean;
    realityMessage: string;
    correctiveActions: string[];
  }> {
    const reality = await this.verifyAgentReality(agentLetter, explorationContext);
    const correctiveActions: string[] = [];

    if (!reality.isLiveConnection) {
      correctiveActions.push('Remember: You are reading historical data');
      correctiveActions.push('Historical data ≠ Live connection');
      correctiveActions.push('Check timestamps before assuming connections');

      if (reality.timeSinceLastActivity > 1440) { // More than 24 hours
        correctiveActions.push('This is ANCIENT data - treat as archival');
      }
    }

    const realityMessage = reality.isLiveConnection ?
      `✅ LIVE CONNECTION: Agent ${agentLetter} is currently active (${reality.timeSinceLastActivity.toFixed(1)} min ago)` :
      `⚠️  HISTORICAL DATA: Agent ${agentLetter} last seen ${reality.timeSinceLastActivity.toFixed(1)} minutes ago`;

    return {
      isRealTime: reality.isLiveConnection,
      realityMessage,
      correctiveActions
    };
  }

  /**
   * Log reality verification event
   */
  private logRealityVerification(check: AgentRealityCheck): void {
    writeSystemEvent({
      eventType: 'health_check' as const,
      eventCategory: 'system' as const,
      eventActor: 'RealitySystem',
      eventAction: `Agent ${check.agentId} reality check: ${check.connectionType}`,
      eventDescription: `Reality Score: ${check.realityScore.toFixed(2)} | Warnings: ${check.warnings.length}`,
      systemHealth: 'healthy',
      activeLoops: 9,
      activeAgents: 1,
      avgResponseTimeMs: 10,
      errorRate: 0.0,
      successRate: 1.0,
      tags: ['reality-verification', 'agent-awareness', 'temporal-clarity'],
      metadata: {
        agentId: check.agentId,
        isLiveConnection: check.isLiveConnection,
        connectionType: check.connectionType,
        realityScore: check.realityScore,
        timeSinceLastActivity: check.timeSinceLastActivity,
        warnings: check.warnings,
        disclaimers: check.disclaimers
      }
    });
  }

  /**
   * Get system statistics
   */
  getStats(): any {
    return {
      config: this.config,
      cacheSize: this.verificationCache.size,
      recentVerifications: Array.from(this.verificationCache.entries()).slice(-5)
    };
  }
}