/**
 * A2A Agent Registry
 * ===================
 *
 * Central registry for agent discovery across all frameworks
 * Supports: Google ADK, LangGraph, Crew.ai, MCP, custom frameworks
 */

import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { A2AAgent, A2AFramework, A2ARegistryStats } from './types.js';

export class A2AAgentRegistry {
  private db: Database.Database;
  private agents: Map<string, A2AAgent> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(db: Database.Database) {
    this.db = db;
    this.initDatabase();
    this.loadAgentsFromDatabase();
    this.startHeartbeatMonitor();

    logger.info('📋 A2A Agent Registry initialized');
  }

  /**
   * Initialize database schema
   */
  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS a2a_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        framework TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'offline',
        version TEXT,
        llm TEXT,
        last_heartbeat INTEGER NOT NULL,
        registered_at INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_a2a_agents_framework ON a2a_agents(framework);
      CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);
      CREATE INDEX IF NOT EXISTS idx_a2a_agents_capabilities ON a2a_agents(capabilities);
    `);
  }

  /**
   * Load agents from database on startup
   */
  private loadAgentsFromDatabase(): void {
    const rows = this.db.prepare('SELECT * FROM a2a_agents').all() as any[];

    for (const row of rows) {
      const agent: A2AAgent = {
        id: row.id,
        name: row.name,
        framework: row.framework as A2AFramework,
        endpoint: row.endpoint,
        capabilities: JSON.parse(row.capabilities),
        status: row.status,
        metadata: {
          version: row.version,
          llm: row.llm,
          last_heartbeat: row.last_heartbeat
        }
      };
      this.agents.set(agent.id, agent);
    }

    logger.info(`📥 Loaded ${this.agents.size} agents from database`);
  }

  /**
   * Register new agent
   */
  async register(agent: Omit<A2AAgent, 'status'> & { metadata?: Partial<A2AAgent['metadata']> }): Promise<A2AAgent> {
    const now = Date.now();

    const fullAgent: A2AAgent = {
      ...agent,
      status: 'online',
      metadata: {
        version: agent.metadata?.version || '1.0',
        llm: agent.metadata?.llm,
        last_heartbeat: agent.metadata?.last_heartbeat || now
      }
    };

    // Store in memory
    this.agents.set(fullAgent.id, fullAgent);

    // Store in database
    this.db.prepare(`
      INSERT OR REPLACE INTO a2a_agents
      (id, name, framework, endpoint, capabilities, status, version, llm, last_heartbeat, registered_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fullAgent.id,
      fullAgent.name,
      fullAgent.framework,
      fullAgent.endpoint,
      JSON.stringify(fullAgent.capabilities),
      fullAgent.status,
      fullAgent.metadata.version,
      fullAgent.metadata.llm || null,
      fullAgent.metadata.last_heartbeat,
      now,
      JSON.stringify(fullAgent.metadata)
    );

    logger.info(`✅ Registered agent: ${fullAgent.name} (${fullAgent.framework})`);

    // Broadcast agent_joined event
    await this.broadcast({
      type: 'agent_joined',
      agent: fullAgent
    });

    return fullAgent;
  }

  /**
   * Unregister agent
   */
  async unregister(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return false;
    }

    // Remove from memory
    this.agents.delete(agentId);

    // Remove from database
    this.db.prepare('DELETE FROM a2a_agents WHERE id = ?').run(agentId);

    logger.info(`🔌 Unregistered agent: ${agent.name}`);

    // Broadcast agent_left event
    await this.broadcast({
      type: 'agent_left',
      agentId
    });

    return true;
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<A2AAgent | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * Discover agents by capability
   */
  async discover(capability: string): Promise<A2AAgent[]> {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.capabilities.includes(capability) && agent.status === 'online'
    );
  }

  /**
   * Discover agents by framework
   */
  async discoverByFramework(framework: A2AFramework): Promise<A2AAgent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.framework === framework && agent.status === 'online'
    );
  }

  /**
   * List all agents
   */
  listAgents(): A2AAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Update agent heartbeat
   */
  async heartbeat(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return false;
    }

    agent.metadata.last_heartbeat = Date.now();
    agent.status = 'online';

    // Update database
    this.db.prepare(`
      UPDATE a2a_agents
      SET last_heartbeat = ?, status = 'online'
      WHERE id = ?
    `).run(agent.metadata.last_heartbeat, agentId);

    return true;
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId: string, status: 'online' | 'offline' | 'busy'): Promise<boolean> {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return false;
    }

    agent.status = status;

    // Update database
    this.db.prepare('UPDATE a2a_agents SET status = ? WHERE id = ?').run(status, agentId);

    logger.info(`🔄 Agent ${agent.name} status: ${status}`);

    return true;
  }

  /**
   * Broadcast event to all agents
   */
  private async broadcast(event: any): Promise<void> {
    // TODO: Implement WebSocket broadcast to all connected agents
    logger.debug('📢 Broadcasting event:', event.type);
  }

  /**
   * Start heartbeat monitor (checks for stale agents)
   */
  private startHeartbeatMonitor(): void {
    const HEARTBEAT_TIMEOUT = 60000; // 60 seconds
    const CHECK_INTERVAL = 30000; // 30 seconds

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      let staleCount = 0;

      for (const agent of this.agents.values()) {
        if (agent.status === 'online') {
          const timeSinceHeartbeat = now - agent.metadata.last_heartbeat;

          if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT) {
            agent.status = 'offline';
            this.db.prepare('UPDATE a2a_agents SET status = ? WHERE id = ?')
              .run('offline', agent.id);

            logger.warn(`💔 Agent ${agent.name} marked offline (no heartbeat)`);
            staleCount++;
          }
        }
      }

      if (staleCount > 0) {
        logger.info(`🔍 Heartbeat check: ${staleCount} agents marked offline`);
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Stop heartbeat monitor
   */
  stopHeartbeatMonitor(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): A2ARegistryStats {
    const frameworkCounts: Record<A2AFramework, number> = {
      adk: 0,
      langraph: 0,
      'crew.ai': 0,
      mcp: 0,
      custom: 0
    };

    let onlineCount = 0;
    const allCapabilities = new Set<string>();

    for (const agent of this.agents.values()) {
      frameworkCounts[agent.framework]++;

      if (agent.status === 'online') {
        onlineCount++;
      }

      agent.capabilities.forEach((cap) => allCapabilities.add(cap));
    }

    return {
      totalAgents: this.agents.size,
      onlineAgents: onlineCount,
      frameworkCounts,
      totalCapabilities: allCapabilities.size
    };
  }

  /**
   * Clean up offline agents (optional - removes from registry)
   */
  cleanupOfflineAgents(maxOfflineTimeMs: number = 86400000): void {
    const now = Date.now();
    const deleted: string[] = [];

    for (const [id, agent] of this.agents.entries()) {
      if (agent.status === 'offline') {
        const offlineTime = now - agent.metadata.last_heartbeat;

        if (offlineTime > maxOfflineTimeMs) {
          this.agents.delete(id);
          this.db.prepare('DELETE FROM a2a_agents WHERE id = ?').run(id);
          deleted.push(agent.name);
        }
      }
    }

    if (deleted.length > 0) {
      logger.info(`🧹 Cleaned up ${deleted.length} offline agents`);
    }
  }

  /**
   * Shutdown registry
   */
  shutdown(): void {
    this.stopHeartbeatMonitor();
    logger.info('🛑 A2A Agent Registry shutdown');
  }
}
