import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Force Node.js runtime for better-sqlite3 support
export const runtime = 'nodejs';

const DB_PATH = process.env.DATABASE_PATH || '/opt/central-mcp/data/registry.db';

/**
 * GET /api/agents
 *
 * Returns REAL agent data from Central-MCP database:
 * - agent_sessions (8 rows)
 * - agent_activity (16 rows)
 * - agent_metrics (3 rows)
 */
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all agent sessions with details
    const sessions = db.prepare(`
      SELECT
        id,
        agent_letter,
        agent_model,
        project_id,
        status,
        connected_at,
        last_heartbeat,
        disconnected_at,
        tasks_claimed,
        tasks_completed,
        total_queries,
        session_duration_minutes,
        machine_id
      FROM agent_sessions
      ORDER BY connected_at DESC
    `).all();

    // Get agent metrics
    const metrics = db.prepare(`
      SELECT
        agent_letter,
        metric_date,
        total_sessions,
        total_active_minutes,
        tasks_claimed,
        tasks_completed,
        average_task_minutes,
        velocity_score,
        quality_score,
        collaboration_score
      FROM agent_metrics
      ORDER BY metric_date DESC
    `).all();

    // Get recent agent activity
    const activity = db.prepare(`
      SELECT
        id,
        session_id,
        agent_letter,
        timestamp,
        activity_type,
        task_id,
        details,
        duration_ms
      FROM agent_activity
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    // Group metrics by agent
    const metricsByAgent: Record<string, any[]> = metrics.reduce((acc: Record<string, any[]>, m: any) => {
      if (!acc[m.agent_letter]) {
        acc[m.agent_letter] = [];
      }
      acc[m.agent_letter].push(m);
      return acc;
    }, {});

    // Group activity by agent
    const activityByAgent: Record<string, any[]> = activity.reduce((acc: Record<string, any[]>, a: any) => {
      if (!acc[a.agent_letter]) {
        acc[a.agent_letter] = [];
      }
      acc[a.agent_letter].push(a);
      return acc;
    }, {});

    // Build comprehensive agent stats
    const agentStats = sessions.map((session: any) => {
      const agentMetrics = metricsByAgent[session.agent_letter] || [];
      const agentActivity = activityByAgent[session.agent_letter] || [];

      // Calculate uptime
      const connectedAt = new Date(session.connected_at);
      const now = new Date();
      const uptimeMinutes = session.disconnected_at
        ? Math.floor((new Date(session.disconnected_at).getTime() - connectedAt.getTime()) / (1000 * 60))
        : Math.floor((now.getTime() - connectedAt.getTime()) / (1000 * 60));

      // Calculate average metrics across all dates
      const avgMetrics = agentMetrics.length > 0 ? {
        totalSessions: agentMetrics.reduce((sum: number, m: any) => sum + (m.total_sessions || 0), 0),
        totalActiveMinutes: agentMetrics.reduce((sum: number, m: any) => sum + (m.total_active_minutes || 0), 0),
        totalTasksClaimed: agentMetrics.reduce((sum: number, m: any) => sum + (m.tasks_claimed || 0), 0),
        totalTasksCompleted: agentMetrics.reduce((sum: number, m: any) => sum + (m.tasks_completed || 0), 0),
        avgTaskMinutes: agentMetrics.reduce((sum: number, m: any) => sum + (m.average_task_minutes || 0), 0) / agentMetrics.length,
        avgVelocityScore: agentMetrics.reduce((sum: number, m: any) => sum + (m.velocity_score || 0), 0) / agentMetrics.length,
        avgQualityScore: agentMetrics.reduce((sum: number, m: any) => sum + (m.quality_score || 1), 0) / agentMetrics.length,
        avgCollaborationScore: agentMetrics.reduce((sum: number, m: any) => sum + (m.collaboration_score || 0), 0) / agentMetrics.length
      } : null;

      return {
        letter: session.agent_letter,
        model: session.agent_model,
        project: session.project_id,
        status: session.status,
        connectedAt: session.connected_at,
        lastHeartbeat: session.last_heartbeat,
        disconnectedAt: session.disconnected_at,
        uptimeMinutes,
        tasksClaimed: session.tasks_claimed || 0,
        tasksCompleted: session.tasks_completed || 0,
        totalQueries: session.total_queries || 0,
        machineId: session.machine_id,
        metrics: avgMetrics,
        recentActivity: agentActivity.slice(0, 10).map((a: any) => ({
          id: a.id,
          type: a.activity_type,
          timestamp: a.timestamp,
          taskId: a.task_id,
          details: a.details,
          durationMs: a.duration_ms
        }))
      };
    });

    // Calculate summary statistics
    const activeSessions = sessions.filter((s: any) => s.status === 'ACTIVE');
    const summary = {
      total: sessions.length,
      active: activeSessions.length,
      idle: sessions.filter((s: any) => s.status === 'IDLE').length,
      disconnected: sessions.filter((s: any) => s.status === 'DISCONNECTED').length,
      totalTasksClaimed: sessions.reduce((sum: number, s: any) => sum + (s.tasks_claimed || 0), 0),
      totalTasksCompleted: sessions.reduce((sum: number, s: any) => sum + (s.tasks_completed || 0), 0),
      totalQueries: sessions.reduce((sum: number, s: any) => sum + (s.total_queries || 0), 0),
      avgSessionMinutes: sessions.reduce((sum: number, s: any) => sum + (s.session_duration_minutes || 0), 0) / sessions.length,
      completionRate: sessions.reduce((sum: number, s: any) => sum + (s.tasks_claimed || 0), 0) > 0
        ? (sessions.reduce((sum: number, s: any) => sum + (s.tasks_completed || 0), 0) /
           sessions.reduce((sum: number, s: any) => sum + (s.tasks_claimed || 0), 0) * 100)
        : 0
    };

    db.close();

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      agents: agentStats,
      recentActivity: activity.slice(0, 20).map((a: any) => ({
        agent: a.agent_letter,
        type: a.activity_type,
        timestamp: a.timestamp,
        taskId: a.task_id,
        details: a.details,
        durationMs: a.duration_ms
      }))
    });

    // Cache for 5 seconds
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');

    return response;
  } catch (error: any) {
    console.error('Agents API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch agent data',
      message: error.message
    }, { status: 500 });
  }
}
