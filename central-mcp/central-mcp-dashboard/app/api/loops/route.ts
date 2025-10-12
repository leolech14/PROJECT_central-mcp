import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Force Node.js runtime for better-sqlite3 support
export const runtime = 'nodejs';

const DB_PATH = '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

/**
 * GET /api/loops
 *
 * Returns REAL auto-proactive loop data from Central-MCP database:
 * - auto_proactive_logs (7,602 rows!) - GOLDMINE OF DATA!
 *
 * Provides detailed metrics for all 10 loops with execution history,
 * performance analytics, and real-time status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const hours = parseInt(searchParams.get('hours') || '24');

    const db = new Database(DB_PATH, { readonly: true });

    // Get recent loop executions
    const recentLogs = db.prepare(`
      SELECT
        id,
        loop_name,
        timestamp,
        execution_time_ms,
        action,
        result,
        project_name
      FROM auto_proactive_logs
      WHERE timestamp > datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `).all();

    // Get aggregate stats per loop (last 24 hours)
    const loopStats = db.prepare(`
      SELECT
        loop_name,
        COUNT(*) as execution_count,
        AVG(execution_time_ms) as avg_execution_time,
        MIN(execution_time_ms) as min_execution_time,
        MAX(execution_time_ms) as max_execution_time,
        SUM(CASE WHEN result = 'success' OR result LIKE '%success%' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN result LIKE '%error%' OR result LIKE '%failed%' THEN 1 ELSE 0 END) as error_count,
        MAX(timestamp) as last_execution,
        MIN(timestamp) as first_execution
      FROM auto_proactive_logs
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY loop_name
      ORDER BY loop_name
    `).all();

    // Get overall system health (last hour)
    const systemHealth = db.prepare(`
      SELECT
        COUNT(*) as total_executions,
        AVG(execution_time_ms) as avg_response_time,
        SUM(CASE WHEN result = 'success' OR result LIKE '%success%' THEN 1 ELSE 0 END) as total_success,
        SUM(CASE WHEN result LIKE '%error%' OR result LIKE '%failed%' THEN 1 ELSE 0 END) as total_errors,
        COUNT(DISTINCT loop_name) as active_loops
      FROM auto_proactive_logs
      WHERE timestamp > datetime('now', '-1 hour')
    `).get();

    // Get execution timeline (last 24 hours, hourly buckets)
    const timeline = db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
        loop_name,
        COUNT(*) as executions,
        AVG(execution_time_ms) as avg_time
      FROM auto_proactive_logs
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY hour, loop_name
      ORDER BY hour DESC
    `).all();

    // Map loop names to IDs
    const loopMapping: { [key: string]: number } = {
      'SYSTEM_STATUS': 0,
      'AGENT_AUTO_DISCOVERY': 1,
      'PROJECT_DISCOVERY': 2,
      'CONTEXT_LEARNING': 3,
      'PROGRESS_MONITORING': 4,
      'STATUS_ANALYSIS': 5,
      'OPPORTUNITY_SCANNING': 6,
      'SPEC_GENERATION': 7,
      'TASK_ASSIGNMENT': 8,
      'GIT_PUSH_MONITOR': 9
    };

    // Build comprehensive loop details
    const loops = loopStats.map((loop: any) => {
      const loopId = loopMapping[loop.loop_name];
      const isActive = loop.execution_count > 0;
      const successRate = loop.execution_count > 0
        ? (loop.success_count / loop.execution_count * 100)
        : 0;

      // Calculate health status
      let health: string;
      if (loop.error_count > loop.success_count / 2) {
        health = 'critical';
      } else if (loop.error_count > 0) {
        health = 'degraded';
      } else if (successRate > 95) {
        health = 'healthy';
      } else {
        health = 'warning';
      }

      // Calculate uptime
      const firstExec = new Date(loop.first_execution);
      const lastExec = new Date(loop.last_execution);
      const uptimeMinutes = Math.floor((lastExec.getTime() - firstExec.getTime()) / (1000 * 60));

      return {
        loopId,
        name: loop.loop_name,
        status: isActive ? 'active' : 'inactive',
        health,
        executions: {
          total: loop.execution_count,
          success: loop.success_count,
          errors: loop.error_count,
          successRate: Math.round(successRate * 10) / 10
        },
        performance: {
          avgExecutionTime: Math.round(loop.avg_execution_time),
          minExecutionTime: Math.round(loop.min_execution_time),
          maxExecutionTime: Math.round(loop.max_execution_time)
        },
        timeline: {
          firstExecution: loop.first_execution,
          lastExecution: loop.last_execution,
          uptimeMinutes
        }
      };
    });

    // Group timeline by hour
    const hourlyTimeline = timeline.reduce((acc: any, entry: any) => {
      if (!acc[entry.hour]) {
        acc[entry.hour] = {};
      }
      acc[entry.hour][entry.loop_name] = {
        executions: entry.executions,
        avgTime: Math.round(entry.avg_time)
      };
      return acc;
    }, {});

    // Calculate summary
    const summary = {
      activeLoops: loops.filter(l => l.status === 'active').length,
      totalLoops: 10,
      systemHealth: systemHealth as any,
      overallSuccessRate: systemHealth && (systemHealth as any).total_executions > 0
        ? Math.round((systemHealth as any).total_success / (systemHealth as any).total_executions * 100 * 10) / 10
        : 0,
      avgResponseTime: systemHealth
        ? Math.round((systemHealth as any).avg_response_time)
        : null
    };

    db.close();

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      loops,
      recentExecutions: recentLogs.slice(0, 100).map((log: any) => ({
        id: log.id,
        loop: log.loop_name,
        timestamp: log.timestamp,
        executionTime: log.execution_time_ms,
        action: log.action,
        result: log.result,
        project: log.project_name
      })),
      timeline: hourlyTimeline
    });

    // Cache for 5 seconds
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');

    return response;
  } catch (error: any) {
    console.error('Loops API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch loop data',
      message: error.message
    }, { status: 500 });
  }
}
