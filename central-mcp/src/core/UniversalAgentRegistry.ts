/**
 * Universal Agent Registry
 * =========================
 *
 * Multi-project agent tracking and management.
 *
 * Features:
 * - Track agents across all projects
 * - Multi-swarm management per project
 * - Role assignment based on capabilities
 * - Agent capability tracking per model
 * - Cross-project agent movement
 *
 * T012 - CRITICAL PATH - UNIVERSAL COORDINATION
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Agent, AgentCapabilities } from '../discovery/AgentRecognizer.js';

export interface AgentRole {
  id: string;
  agentId: string;
  projectId: string;
  swarmId: string | null;
  roleName: string; // 'UI_SPECIALIST', 'BACKEND_SPECIALIST', etc.
  assignedAt: string;
  active: boolean;
}

export interface Swarm {
  id: string;
  projectId: string;
  name: string; // 'Frontend Team', 'Backend Team', etc.
  specialization: string;
  agentCount: number;
  active: boolean;
  createdAt: string;
}

export interface AgentAssignment {
  agent: Agent;
  project: string;
  swarms: Swarm[];
  roles: AgentRole[];
  currentTask: string | null;
}

export class UniversalAgentRegistry {
  constructor(private db: Database.Database) {
    this.createTables();
  }

  /**
   * Create registry tables
   */
  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS swarms (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, name)
      );

      CREATE TABLE IF NOT EXISTS agent_roles (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        swarm_id TEXT,
        role_name TEXT NOT NULL,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (swarm_id) REFERENCES swarms(id) ON DELETE SET NULL,
        UNIQUE(agent_id, project_id, role_name)
      );

      CREATE INDEX IF NOT EXISTS idx_swarms_project ON swarms(project_id);
      CREATE INDEX IF NOT EXISTS idx_swarms_active ON swarms(active);
      CREATE INDEX IF NOT EXISTS idx_roles_agent ON agent_roles(agent_id);
      CREATE INDEX IF NOT EXISTS idx_roles_project ON agent_roles(project_id);
      CREATE INDEX IF NOT EXISTS idx_roles_swarm ON agent_roles(swarm_id);
    `);
  }

  /**
   * Assign agent to project (auto-determines role)
   */
  async assignToProject(agentId: string, projectId: string): Promise<AgentAssignment> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Determine best role for agent in this project
    const role = this.determineRole(agent, project);

    // Find or create appropriate swarm
    const swarm = await this.getOrCreateSwarm(projectId, role);

    // Create role assignment
    const roleId = uuidv4();
    this.db.prepare(`
      INSERT OR REPLACE INTO agent_roles (
        id, agent_id, project_id, swarm_id, role_name, assigned_at, active
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
    `).run(roleId, agentId, projectId, swarm.id, role);

    console.log(`✅ Assigned Agent ${agent.name} to ${project.name} as ${role}`);

    return {
      agent,
      project: project.name,
      swarms: [swarm],
      roles: [{
        id: roleId,
        agentId,
        projectId,
        swarmId: swarm.id,
        roleName: role,
        assignedAt: new Date().toISOString(),
        active: true
      }],
      currentTask: null
    };
  }

  /**
   * Determine role based on agent capabilities and project needs
   */
  private determineRole(agent: Agent, project: any): string {
    const caps = agent.capabilities;

    // Match capabilities to roles
    if (caps.ui && project.type === 'COMMERCIAL_APP') {
      return 'UI_SPECIALIST';
    }

    if (caps.backend) {
      return 'BACKEND_SPECIALIST';
    }

    if (caps.design) {
      return 'DESIGN_SPECIALIST';
    }

    if (caps.integration) {
      return 'INTEGRATION_SPECIALIST';
    }

    // Default role
    return 'GENERAL_CONTRIBUTOR';
  }

  /**
   * Get or create swarm for role
   */
  private async getOrCreateSwarm(projectId: string, roleName: string): Promise<Swarm> {
    // Map role to swarm specialization
    const specializationMap: Record<string, string> = {
      UI_SPECIALIST: 'Frontend Development',
      BACKEND_SPECIALIST: 'Backend Services',
      DESIGN_SPECIALIST: 'Design System',
      INTEGRATION_SPECIALIST: 'System Integration',
      GENERAL_CONTRIBUTOR: 'General Development'
    };

    const specialization = specializationMap[roleName] || 'General';
    const swarmName = `${specialization} Team`;

    // Check if swarm exists
    const existing = this.db.prepare(`
      SELECT * FROM swarms
      WHERE project_id = ? AND specialization = ?
    `).get(projectId, specialization) as any;

    if (existing) {
      return this.rowToSwarm(existing);
    }

    // Create new swarm
    const swarmId = uuidv4();
    this.db.prepare(`
      INSERT INTO swarms (id, project_id, name, specialization, active)
      VALUES (?, ?, ?, ?, 1)
    `).run(swarmId, projectId, swarmName, specialization);

    console.log(`🆕 Created swarm: ${swarmName} for project ${projectId}`);

    return {
      id: swarmId,
      projectId,
      name: swarmName,
      specialization,
      agentCount: 0,
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get agents in swarm
   */
  getSwarmAgents(swarmId: string): Agent[] {
    const rows = this.db.prepare(`
      SELECT a.*
      FROM agents a
      JOIN agent_roles ar ON a.id = ar.agent_id
      WHERE ar.swarm_id = ? AND ar.active = 1
    `).all(swarmId) as any[];

    return rows.map(row => this.rowToAgent(row));
  }

  /**
   * Get swarms for project
   */
  getProjectSwarms(projectId: string): Swarm[] {
    const rows = this.db.prepare(`
      SELECT
        s.*,
        COUNT(ar.id) as agent_count
      FROM swarms s
      LEFT JOIN agent_roles ar ON s.id = ar.swarm_id AND ar.active = 1
      WHERE s.project_id = ?
      GROUP BY s.id
    `).all(projectId) as any[];

    return rows.map(row => ({
      ...this.rowToSwarm(row),
      agentCount: row.agent_count || 0
    }));
  }

  /**
   * Get agent assignments across all projects
   */
  getAgentAssignments(agentId: string): AgentAssignment[] {
    const rows = this.db.prepare(`
      SELECT
        ar.*,
        p.name as project_name,
        s.name as swarm_name
      FROM agent_roles ar
      JOIN projects p ON ar.project_id = p.id
      LEFT JOIN swarms s ON ar.swarm_id = s.id
      WHERE ar.agent_id = ? AND ar.active = 1
    `).all(agentId) as any[];

    const agent = this.getAgent(agentId);
    if (!agent) return [];

    // Group by project
    const byProject = new Map<string, any>();

    for (const row of rows) {
      if (!byProject.has(row.project_id)) {
        byProject.set(row.project_id, {
          project: row.project_name,
          swarms: [],
          roles: []
        });
      }

      const projectData = byProject.get(row.project_id);
      projectData.roles.push({
        id: row.id,
        agentId: row.agent_id,
        projectId: row.project_id,
        swarmId: row.swarm_id,
        roleName: row.role_name,
        assignedAt: row.assigned_at,
        active: true
      });
    }

    return Array.from(byProject.values()).map(data => ({
      agent,
      project: data.project,
      swarms: data.swarms,
      roles: data.roles,
      currentTask: null
    }));
  }

  /**
   * Get all active agents across all projects
   */
  getAllActiveAgents(): Agent[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT a.*
      FROM agents a
      JOIN agent_presence ap ON a.id = ap.agent_letter
      WHERE ap.status IN ('ONLINE', 'IDLE')
    `).all() as any[];

    return rows.map(row => this.rowToAgent(row));
  }

  /**
   * Helper: Get agent
   */
  private getAgent(agentId: string): Agent | null {
    const row = this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agentId) as any;
    return row ? this.rowToAgent(row) : null;
  }

  /**
   * Helper: Get project
   */
  private getProject(projectId: string): any | null {
    return this.db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as any;
  }

  /**
   * Helper: Row to Agent
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
   * Helper: Row to Swarm
   */
  private rowToSwarm(row: any): Swarm {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      specialization: row.specialization,
      agentCount: row.agent_count || 0,
      active: row.active === 1,
      createdAt: row.created_at
    };
  }
}
