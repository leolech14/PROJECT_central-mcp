/**
 * Swarm Coordinator
 * ==================
 *
 * Coordinates multiple agent swarms per project.
 *
 * Features:
 * - Multi-swarm management
 * - Workload balancing
 * - Swarm-scoped task assignment
 * - Cross-swarm collaboration
 *
 * T014 - SWARM ORCHESTRATION
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface SwarmStatus {
  swarmId: string;
  swarmName: string;
  agentCount: number;
  onlineAgents: number;
  tasksInProgress: number;
  tasksCompleted: number;
  workload: number; // 0-100%
}

export class SwarmCoordinator {
  constructor(private db: Database.Database) {}

  /**
   * Get swarm status
   */
  getSwarmStatus(swarmId: string): SwarmStatus | null {
    const swarm = this.db.prepare(`SELECT * FROM swarms WHERE id = ?`).get(swarmId) as any;
    if (!swarm) return null;

    const agentCount = this.db.prepare(`
      SELECT COUNT(DISTINCT agent_id) as count
      FROM agent_roles
      WHERE swarm_id = ? AND active = 1
    `).get(swarmId) as { count: number };

    const onlineCount = this.db.prepare(`
      SELECT COUNT(DISTINCT ap.agent_letter) as count
      FROM agent_presence ap
      JOIN agent_roles ar ON ap.agent_letter = ar.agent_id
      WHERE ar.swarm_id = ? AND ap.status IN ('ONLINE', 'IDLE')
    `).get(swarmId) as { count: number };

    const taskStats = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status IN ('CLAIMED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as completed
      FROM tasks t
      JOIN agent_roles ar ON t.agent = ar.agent_id
      WHERE ar.swarm_id = ? AND t.project_id = ?
    `).get(swarmId, swarm.project_id) as { in_progress: number; completed: number };

    return {
      swarmId: swarm.id,
      swarmName: swarm.name,
      agentCount: agentCount.count,
      onlineAgents: onlineCount.count,
      tasksInProgress: taskStats?.in_progress || 0,
      tasksCompleted: taskStats?.completed || 0,
      workload: this.calculateWorkload(taskStats?.in_progress || 0, agentCount.count)
    };
  }

  /**
   * Balance workload across swarms
   */
  balanceWorkload(projectId: string): void {
    const swarms = this.db.prepare(`
      SELECT * FROM swarms WHERE project_id = ? AND active = 1
    `).all(projectId) as any[];

    for (const swarm of swarms) {
      const status = this.getSwarmStatus(swarm.id);
      if (!status) continue;

      // If workload > 80%, suggest adding agents
      if (status.workload > 80) {
        console.log(`⚠️  Swarm ${swarm.name} overloaded (${status.workload}%)`);
        console.log(`   Suggestion: Add more agents or redistribute tasks`);
      }

      // If workload < 20%, swarm is underutilized
      if (status.workload < 20 && status.agentCount > 0) {
        console.log(`💡 Swarm ${swarm.name} underutilized (${status.workload}%)`);
        console.log(`   Suggestion: Assign more tasks or merge swarms`);
      }
    }
  }

  /**
   * Calculate workload percentage
   */
  private calculateWorkload(tasksInProgress: number, agentCount: number): number {
    if (agentCount === 0) return 0;

    // Assume each agent can handle 2-3 tasks optimally
    const optimalLoad = agentCount * 2.5;
    const workload = (tasksInProgress / optimalLoad) * 100;

    return Math.min(100, Math.round(workload));
  }

  /**
   * Get all swarms for project
   */
  getProjectSwarms(projectId: string): SwarmStatus[] {
    const swarms = this.db.prepare(`
      SELECT * FROM swarms WHERE project_id = ? AND active = 1
    `).all(projectId) as any[];

    return swarms.map(s => this.getSwarmStatus(s.id)).filter(s => s !== null) as SwarmStatus[];
  }

  /**
   * Suggest task reassignment for balance
   */
  suggestReassignments(projectId: string): any[] {
    const suggestions: any[] = [];

    const swarms = this.getProjectSwarms(projectId);

    // Find overloaded and underloaded swarms
    const overloaded = swarms.filter(s => s.workload > 80);
    const underloaded = swarms.filter(s => s.workload < 40 && s.agentCount > 0);

    for (const heavy of overloaded) {
      for (const light of underloaded) {
        suggestions.push({
          from: heavy.swarmName,
          to: light.swarmName,
          reason: `Balance workload (${heavy.workload}% → ${light.workload}%)`,
          impact: 'Improve team efficiency'
        });
      }
    }

    return suggestions;
  }
}
