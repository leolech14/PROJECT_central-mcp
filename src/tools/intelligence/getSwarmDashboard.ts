/**
 * get_swarm_dashboard - Get real-time view of entire agent swarm
 */

import { z } from 'zod';
import Database from 'better-sqlite3';

const GetSwarmDashboardArgsSchema = z.object({
  project: z.string().optional()
});

export const getSwarmDashboardTool = {
  name: 'get_swarm_dashboard',
  description: 'Get real-time dashboard view of all agents and their current status',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project: {
        type: 'string',
        description: 'Filter by project ID (optional)'
      }
    }
  }
};

export async function handleGetSwarmDashboard(args: unknown, db: Database.Database) {
  const parsed = GetSwarmDashboardArgsSchema.parse(args);

  // Check for heartbeat timeouts (2 minutes)
  const HEARTBEAT_TIMEOUT_SECONDS = 120;
  db.prepare(`
    UPDATE agent_presence SET status = 'OFFLINE'
    WHERE status IN ('ONLINE', 'IDLE')
      AND datetime(last_seen) < datetime('now', '-' || ? || ' seconds')
  `).run(HEARTBEAT_TIMEOUT_SECONDS);

  // Get all agent presence
  const agents = db.prepare(`
    SELECT
      p.*,
      s.agent_model,
      s.connected_at,
      s.last_heartbeat,
      t.id as current_task_id,
      t.name as current_task_name
    FROM agent_presence p
    LEFT JOIN agent_sessions s ON p.current_session_id = s.id
    LEFT JOIN tasks t ON p.current_task_id = t.id
    ORDER BY p.agent_letter
  `).all() as any[];

  // Get task statistics
  const taskStats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM tasks
    GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  // Get recent activity
  const recentActivity = db.prepare(`
    SELECT
      agent_letter,
      activity_type,
      task_id,
      timestamp
    FROM agent_activity
    ORDER BY timestamp DESC
    LIMIT 10
  `).all() as any[];

  // Calculate swarm metrics
  const onlineAgents = agents.filter(a => a.status === 'ONLINE').length;
  const idleAgents = agents.filter(a => a.status === 'IDLE').length;
  const offlineAgents = agents.filter(a => a.status === 'OFFLINE').length;

  const totalTasks = taskStats.reduce((sum, s) => sum + s.count, 0);
  const inProgressTasks = taskStats.find(s => s.status === 'IN_PROGRESS')?.count || 0;
  const completedTasks = taskStats.find(s => s.status === 'COMPLETE')?.count || 0;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        project: parsed.project || 'LocalBrain',
        timestamp: new Date().toISOString(),
        swarmSummary: {
          totalAgents: agents.length,
          onlineAgents,
          idleAgents,
          offlineAgents
        },
        taskSummary: {
          totalTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          taskStats
        },
        agents: agents.map(a => ({
          letter: a.agent_letter,
          status: a.status,
          model: a.agent_model,
          lastSeen: a.last_seen,
          currentTask: a.current_task_id ? {
            id: a.current_task_id,
            name: a.current_task_name
          } : null,
          todayStats: {
            sessions: a.total_sessions_today,
            activeMinutes: a.total_active_time_minutes,
            tasksCompleted: a.tasks_today
          }
        })),
        recentActivity: recentActivity.map(a => ({
          agent: a.agent_letter,
          type: a.activity_type,
          taskId: a.task_id,
          timestamp: a.timestamp
        }))
      }, null, 2)
    }]
  };
}
