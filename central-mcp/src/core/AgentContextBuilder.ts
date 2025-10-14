/**
 * Agent Context Builder
 * ======================
 *
 * Builds standardized agent context for EVERY MCP response.
 *
 * 8 Required Fields:
 * 1. Agent ID & Model
 * 2. Current Role
 * 3. Current Project
 * 4. Project Progress % ⭐ KEY METRIC
 * 5. Agent's Personal Tasks
 * 6. Budget Status
 * 7. System Health
 * 8. Timestamp
 */

import Database from 'better-sqlite3';

export interface AgentContext {
  // 1. Agent Identity
  agentId: string;
  trackingId: string;
  modelId: string;
  modelName: string;
  contextSize: number;
  costPerHour: number;

  // 2. Role
  role: string;
  swarmName: string | null;

  // 3. Project
  project: {
    id: string;
    name: string;
    type: string;
    path: string;
  };

  // 4. Project Progress ⭐ KEY METRIC
  projectProgress: {
    percentage: number;
    tasksComplete: number;
    tasksTotal: number;
    breakdown: string;
  };

  // 5. Agent's Tasks
  yourTasks: {
    complete: number;
    claimed: number;
    available: number;
    currentTask: string | null;
    completionRate: string;
  };

  // 6. Budget
  budget: {
    hoursUsedToday: number;
    dailyLimit: number | null;
    percentUsed: number;
    canWork: boolean;
    alert?: string;
  };

  // 7. System Status
  systemStatus: {
    health: string;
    onlineAgents: number;
    totalAgents: number;
    timestamp: string;
  };
}

export class AgentContextBuilder {
  constructor(private db: Database.Database) {}

  /**
   * Build complete standardized context
   */
  buildContext(agentId: string, projectId: string): AgentContext {
    // 1. Agent + Model Info
    const agent = this.db.prepare(`
      SELECT a.*, m.name as model_name, m.context_size, m.cost_per_hour, m.daily_hour_limit
      FROM agents a
      LEFT JOIN model_catalog m ON a.model_id = m.model_id
      WHERE a.id = ?
    `).get(agentId) as any;

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // 2. Role Info
    const role = this.db.prepare(`
      SELECT ar.role_name, s.name as swarm_name
      FROM agent_roles ar
      LEFT JOIN swarms s ON ar.swarm_id = s.id
      WHERE ar.agent_id = ? AND ar.project_id = ? AND ar.active = 1
      ORDER BY ar.assigned_at DESC LIMIT 1
    `).get(agentId, projectId) as any;

    // 3. Project Info
    const project = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(projectId) as any;

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // 4. Project Progress (KEY METRIC!) ⭐
    const progress = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked
      FROM tasks
      WHERE project_id = ?
    `).get(projectId) as any;

    const percentage = progress.total > 0 ? Math.round((progress.complete / progress.total) * 100) : 0;

    // 5. Agent's Personal Tasks
    const agentLetter = agent.name?.match(/Agent-([A-F])/)?.[1] || agent.tracking_id.substring(0, 1).toUpperCase();

    const agentTasks = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress
      FROM tasks
      WHERE (agent = ? OR claimed_by = ?) AND project_id = ?
    `).get(agentLetter, agentLetter, projectId) as any;

    const currentTask = this.db.prepare(`
      SELECT id FROM tasks
      WHERE (agent = ? OR claimed_by = ?) AND status IN ('CLAIMED', 'IN_PROGRESS')
      ORDER BY priority LIMIT 1
    `).get(agentLetter, agentLetter) as { id: string } | undefined;

    const agentTotal = (agentTasks.complete || 0) + (agentTasks.claimed || 0) + (agentTasks.available || 0) + (agentTasks.in_progress || 0);
    const agentCompletionRate = agentTotal > 0 ? Math.round((agentTasks.complete / agentTotal) * 100) : 0;

    // 6. Budget Status
    const today = new Date().toISOString().split('T')[0];
    const usage = this.db.prepare(`
      SELECT COALESCE(SUM(hours_used), 0) as hours
      FROM agent_usage
      WHERE agent_id = ? AND date = ?
    `).get(agentId, today) as { hours: number };

    const dailyLimit = agent.daily_hour_limit;
    const percentUsed = dailyLimit ? Math.round((usage.hours / dailyLimit) * 100) : 0;

    // 7. System Status
    const systemHealth = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status IN ('ONLINE', 'IDLE') THEN 1 ELSE 0 END) as online,
        COUNT(*) as total
      FROM agent_presence
    `).get() as any;

    // Build complete context
    return {
      agentId: agent.id,
      trackingId: agent.tracking_id,
      modelId: agent.model_id,
      modelName: agent.model_name || agent.model_id,
      contextSize: agent.context_size || 200000,
      costPerHour: agent.cost_per_hour || 0,

      role: role?.role_name || 'GENERAL_CONTRIBUTOR',
      swarmName: role?.swarm_name || null,

      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        path: project.path
      },

      projectProgress: {
        percentage,
        tasksComplete: progress.complete,
        tasksTotal: progress.total,
        breakdown: `${progress.complete} done, ${progress.in_progress || 0} in progress, ${progress.claimed || 0} claimed, ${progress.blocked || 0} blocked`
      },

      yourTasks: {
        complete: agentTasks.complete || 0,
        claimed: (agentTasks.claimed || 0) + (agentTasks.in_progress || 0),
        available: agentTasks.available || 0,
        currentTask: currentTask?.id || null,
        completionRate: `${agentCompletionRate}%`
      },

      budget: {
        hoursUsedToday: usage.hours,
        dailyLimit,
        percentUsed,
        canWork: dailyLimit ? usage.hours < dailyLimit : true,
        alert: dailyLimit && percentUsed > 80 ? `⚠️ ${percentUsed}% of daily limit used` : undefined
      },

      systemStatus: {
        health: 'HEALTHY', // TODO: Get from HealthChecker
        onlineAgents: systemHealth.online || 0,
        totalAgents: systemHealth.total || 6,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format context as beautiful header
   */
  formatHeader(context: AgentContext): string {
    const lines = [
      '',
      '┌─────────────────────────────────────────────────────────────┐',
      '│  🧠 CENTRAL INTELLIGENCE - Agent Context                    │',
      '├─────────────────────────────────────────────────────────────┤',
      `│  Agent: ${this.pad(context.modelName, 50)} │`,
      `│  Role: ${this.pad(context.role, 51)} │`,
      `│  Project: ${this.pad(context.project.name + ` (${context.project.type})`, 46)} │`,
      `│  Progress: ${context.projectProgress.percentage}% (${context.projectProgress.tasksComplete}/${context.projectProgress.tasksTotal} complete) ⭐${' '.repeat(26 - context.projectProgress.percentage.toString().length)} │`,
      `│  Your Tasks: ${context.yourTasks.completionRate} complete (${context.yourTasks.complete} done, ${context.yourTasks.claimed} active)${' '.repeat(15)} │`,
      `│  Budget: ${context.budget.hoursUsedToday.toFixed(1)}h/${context.budget.dailyLimit || '∞'}h today (${context.budget.canWork ? '✅ Can work' : '❌ Limit hit'})${' '.repeat(10)} │`,
      `│  System: ${context.systemStatus.health} (${context.systemStatus.onlineAgents}/${context.systemStatus.totalAgents} online)${' '.repeat(30)} │`,
      '└─────────────────────────────────────────────────────────────┘',
      ''
    ];

    return lines.join('\n');
  }

  /**
   * Pad string to length
   */
  private pad(str: string, length: number): string {
    if (str.length > length) {
      return str.substring(0, length - 3) + '...';
    }
    return str + ' '.repeat(Math.max(0, length - str.length));
  }
}
