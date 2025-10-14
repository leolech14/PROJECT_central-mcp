import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Force Node.js runtime for better-sqlite3 support
export const runtime = 'nodejs';

const DB_PATH = process.env.DATABASE_PATH || '/opt/central-mcp/data/registry.db';

/**
 * GET /api/tasks
 *
 * Returns REAL task data from Central-MCP database:
 * - tasks (19 rows)
 */
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all tasks
    const tasks = db.prepare(`
      SELECT
        id,
        name,
        agent,
        status,
        priority,
        phase,
        timeline,
        dependencies,
        deliverables,
        acceptance_criteria,
        location,
        claimed_by,
        claimed_at,
        started_at,
        completed_at,
        files_created,
        velocity,
        estimated_hours,
        actual_minutes,
        created_at,
        updated_at,
        project_id
      FROM tasks
      ORDER BY
        CASE priority
          WHEN 'P0' THEN 0
          WHEN 'P1' THEN 1
          WHEN 'P2' THEN 2
          ELSE 3
        END,
        created_at DESC
    `).all();

    // Parse JSON fields
    const parsedTasks = tasks.map((task: any) => ({
      ...task,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      deliverables: task.deliverables ? JSON.parse(task.deliverables) : [],
      acceptance_criteria: task.acceptance_criteria ? JSON.parse(task.acceptance_criteria) : [],
      files_created: task.files_created ? JSON.parse(task.files_created) : []
    }));

    // Calculate task metrics
    const summary = {
      total: tasks.length,
      byStatus: {
        complete: tasks.filter((t: any) => t.status === 'COMPLETE').length,
        in_progress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        blocked: tasks.filter((t: any) => t.status === 'BLOCKED').length,
        available: tasks.filter((t: any) => t.status === 'AVAILABLE').length,
        claimed: tasks.filter((t: any) => t.status === 'CLAIMED').length
      },
      byPriority: {
        p0: tasks.filter((t: any) => t.priority === 'P0').length,
        p1: tasks.filter((t: any) => t.priority === 'P1').length,
        p2: tasks.filter((t: any) => t.priority === 'P2').length
      },
      byAgent: tasks.reduce((acc: any, t: any) => {
        acc[t.agent] = (acc[t.agent] || 0) + 1;
        return acc;
      }, {}),
      byPhase: tasks.reduce((acc: any, t: any) => {
        acc[t.phase] = (acc[t.phase] || 0) + 1;
        return acc;
      }, {}),
      completionRate: tasks.length > 0
        ? (tasks.filter((t: any) => t.status === 'COMPLETE').length / tasks.length * 100)
        : 0,
      avgVelocity: tasks.reduce((sum: number, t: any) => sum + (t.velocity || 0), 0) / tasks.length || null,
      totalEstimatedHours: tasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0),
      totalActualMinutes: tasks.reduce((sum: number, t: any) => sum + (t.actual_minutes || 0), 0)
    };

    // Group tasks by status
    const tasksByStatus = {
      complete: parsedTasks.filter((t: any) => t.status === 'COMPLETE'),
      in_progress: parsedTasks.filter((t: any) => t.status === 'IN_PROGRESS'),
      blocked: parsedTasks.filter((t: any) => t.status === 'BLOCKED'),
      available: parsedTasks.filter((t: any) => t.status === 'AVAILABLE'),
      claimed: parsedTasks.filter((t: any) => t.status === 'CLAIMED')
    };

    // Group tasks by agent
    const tasksByAgent = parsedTasks.reduce((acc: any, task: any) => {
      if (!acc[task.agent]) {
        acc[task.agent] = [];
      }
      acc[task.agent].push(task);
      return acc;
    }, {});

    db.close();

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      tasks: parsedTasks,
      tasksByStatus,
      tasksByAgent
    });

    // Cache for 5 seconds
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');

    return response;
  } catch (error: any) {
    console.error('Tasks API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch task data',
      message: error.message
    }, { status: 500 });
  }
}
