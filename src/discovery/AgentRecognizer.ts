/**
 * Agent Recognizer (Persistent Identity)
 * =======================================
 *
 * Recognizes agents across sessions using multiple signals.
 *
 * Features:
 * - Tracking ID recognition (primary)
 * - Model signature matching (secondary)
 * - Session history lookup
 * - Agent capability extraction
 * - New agent creation with tracking ID
 *
 * T003 - CRITICAL PATH - DISCOVERY ENGINE FOUNDATION
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

export interface Agent {
  id: string;
  trackingId: string;
  name: string;
  modelId: string;
  modelSignature: string;
  capabilities: AgentCapabilities;
  createdAt: string;
  lastSeen: string;
  totalSessions: number;
  totalTasks: number;
  metadata: AgentMetadata;
}

export interface AgentCapabilities {
  ui: boolean;
  backend: boolean;
  design: boolean;
  integration: boolean;
  contextSize: number;
  multimodal: boolean;
  languages: string[];
}

export interface AgentMetadata {
  preferredProjects?: string[];
  knownRoles?: string[];
  averageVelocity?: number;
  qualityScore?: number;
}

export interface AgentIdentity {
  recognized: boolean;
  method: 'TRACKING_ID' | 'SIGNATURE' | 'NEW_AGENT';
  agent: Agent;
  confidence: number;
  previousSessions: number;
}

export interface ConnectionRequest {
  trackingId?: string;
  modelId: string;
  apiKeyHash?: string;
  machineId?: string;
  cwd: string;
}

export class AgentRecognizer {
  private readonly CONFIG_DIR = path.join(os.homedir(), '.brain');
  private readonly CONFIG_FILE = path.join(this.CONFIG_DIR, 'config.json');

  constructor(private db: Database.Database) {
    this.ensureConfigDirectory();
  }

  /**
   * Recognize agent from connection request
   */
  async recognizeAgent(request: ConnectionRequest): Promise<AgentIdentity> {
    console.log(`🔍 Recognizing agent...`);

    // SIGNAL 1: Tracking ID (highest confidence)
    if (request.trackingId) {
      const agent = this.findByTrackingId(request.trackingId);
      if (agent) {
        console.log(`✅ Recognized by tracking ID: ${agent.name}`);
        return {
          recognized: true,
          method: 'TRACKING_ID',
          agent: this.updateLastSeen(agent),
          confidence: 100,
          previousSessions: agent.totalSessions
        };
      }
    }

    // SIGNAL 2: Model Signature (medium confidence)
    const signature = this.createSignature(request);
    const matchedAgent = this.findBySignature(signature);

    if (matchedAgent) {
      console.log(`✅ Recognized by signature: ${matchedAgent.name}`);
      return {
        recognized: true,
        method: 'SIGNATURE',
        agent: this.updateLastSeen(matchedAgent),
        confidence: 90,
        previousSessions: matchedAgent.totalSessions
      };
    }

    // SIGNAL 3: No match - Create new agent
    console.log(`🆕 New agent detected, creating...`);
    const newAgent = await this.createNewAgent(request);

    return {
      recognized: false,
      method: 'NEW_AGENT',
      agent: newAgent,
      confidence: 0,
      previousSessions: 0
    };
  }

  /**
   * Find agent by tracking ID
   */
  private findByTrackingId(trackingId: string): Agent | null {
    const row = this.db.prepare(`
      SELECT * FROM agents WHERE tracking_id = ?
    `).get(trackingId) as any;

    return row ? this.rowToAgent(row) : null;
  }

  /**
   * Find agent by model signature
   */
  private findBySignature(signature: string): Agent | null {
    const row = this.db.prepare(`
      SELECT * FROM agents WHERE model_signature = ?
    `).get(signature) as any;

    return row ? this.rowToAgent(row) : null;
  }

  /**
   * Create model signature for matching
   */
  private createSignature(request: ConnectionRequest): string {
    const components = [
      request.modelId,
      request.apiKeyHash || '',
      request.machineId || os.hostname()
    ];

    return crypto.createHash('sha256')
      .update(components.join('::'))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Create new agent
   */
  private async createNewAgent(request: ConnectionRequest): Promise<Agent> {
    const trackingId = uuidv4();
    const capabilities = this.extractCapabilitiesFromModel(request.modelId);

    const agent: Agent = {
      id: uuidv4(),
      trackingId,
      name: this.generateAgentName(request.modelId),
      modelId: request.modelId,
      modelSignature: this.createSignature(request),
      capabilities,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      totalSessions: 0,
      totalTasks: 0,
      metadata: {}
    };

    // Insert into database
    this.db.prepare(`
      INSERT INTO agents (
        id, tracking_id, name, model_id, model_signature,
        capabilities, created_at, last_seen, total_sessions,
        total_tasks, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agent.id,
      agent.trackingId,
      agent.name,
      agent.modelId,
      agent.modelSignature,
      JSON.stringify(agent.capabilities),
      agent.createdAt,
      agent.lastSeen,
      agent.totalSessions,
      agent.totalTasks,
      JSON.stringify(agent.metadata)
    );

    // Save tracking ID to local config
    await this.saveTrackingIdToConfig(trackingId, agent.id);

    console.log(`✅ New agent created: ${agent.name} (${trackingId})`);

    return agent;
  }

  /**
   * Extract agent capabilities from model ID
   */
  private extractCapabilitiesFromModel(modelId: string): AgentCapabilities {
    const modelLower = modelId.toLowerCase();

    return {
      ui: modelLower.includes('gpt-4') || modelLower.includes('sonnet'),
      backend: modelLower.includes('sonnet') || modelLower.includes('gemini'),
      design: modelLower.includes('sonnet') || modelLower.includes('gpt-4'),
      integration: modelLower.includes('sonnet') || modelLower.includes('gemini'),
      contextSize: this.getContextSize(modelId),
      multimodal: modelLower.includes('gpt-4') || modelLower.includes('gemini') || modelLower.includes('sonnet'),
      languages: ['JavaScript', 'TypeScript', 'Python', 'Swift']
    };
  }

  /**
   * Get context size for model
   */
  private getContextSize(modelId: string): number {
    const modelLower = modelId.toLowerCase();

    if (modelLower.includes('sonnet-4')) return 1000000; // 1M
    if (modelLower.includes('gemini-2')) return 1000000; // 1M
    if (modelLower.includes('gpt-4')) return 128000; // 128K
    if (modelLower.includes('glm-4')) return 200000; // 200K

    return 100000; // Default 100K
  }

  /**
   * Generate agent name from model
   */
  private generateAgentName(modelId: string): string {
    const modelLower = modelId.toLowerCase();

    if (modelLower.includes('sonnet')) return `Agent-Sonnet-${Date.now()}`;
    if (modelLower.includes('gpt')) return `Agent-GPT-${Date.now()}`;
    if (modelLower.includes('gemini')) return `Agent-Gemini-${Date.now()}`;
    if (modelLower.includes('glm')) return `Agent-GLM-${Date.now()}`;

    return `Agent-${Date.now()}`;
  }

  /**
   * Update agent last seen timestamp
   */
  private updateLastSeen(agent: Agent): Agent {
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE agents SET last_seen = ? WHERE id = ?
    `).run(now, agent.id);

    return {
      ...agent,
      lastSeen: now
    };
  }

  /**
   * Save tracking ID to local config file
   */
  private async saveTrackingIdToConfig(trackingId: string, agentId: string): Promise<void> {
    const config = {
      trackingId,
      agentId,
      registeredAt: new Date().toISOString(),
      version: '2.0.0'
    };

    writeFileSync(this.CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`💾 Tracking ID saved to: ${this.CONFIG_FILE}`);
  }

  /**
   * Read tracking ID from local config
   */
  readTrackingIdFromConfig(): string | null {
    if (!existsSync(this.CONFIG_FILE)) {
      return null;
    }

    try {
      const config = JSON.parse(readFileSync(this.CONFIG_FILE, 'utf-8'));
      return config.trackingId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDirectory(): void {
    if (!existsSync(this.CONFIG_DIR)) {
      mkdirSync(this.CONFIG_DIR, { recursive: true });
    }
  }

  /**
   * Convert database row to Agent object
   */
  private rowToAgent(row: any): Agent {
    return {
      id: row.id,
      trackingId: row.tracking_id,
      name: row.name,
      modelId: row.model_id,
      modelSignature: row.model_signature,
      capabilities: row.capabilities ? JSON.parse(row.capabilities) : {},
      createdAt: row.created_at,
      lastSeen: row.last_seen,
      totalSessions: row.total_sessions,
      totalTasks: row.total_tasks,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | null {
    const row = this.db.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).get(agentId) as any;

    return row ? this.rowToAgent(row) : null;
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    const rows = this.db.prepare(`
      SELECT * FROM agents
      ORDER BY last_seen DESC
    `).all() as any[];

    return rows.map(row => this.rowToAgent(row));
  }

  /**
   * Get agent session history
   */
  getAgentSessions(agentId: string, limit = 20): any[] {
    return this.db.prepare(`
      SELECT
        s.*,
        p.name as project_name
      FROM agent_sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.agent_letter = (SELECT name FROM agents WHERE id = ? LIMIT 1)
      ORDER BY s.connected_at DESC
      LIMIT ?
    `).all(agentId, limit) as any[];
  }

  /**
   * Increment agent session/task counters
   */
  incrementCounters(agentId: string, sessions = 0, tasks = 0): void {
    this.db.prepare(`
      UPDATE agents
      SET total_sessions = total_sessions + ?,
          total_tasks = total_tasks + ?
      WHERE id = ?
    `).run(sessions, tasks, agentId);
  }
}
