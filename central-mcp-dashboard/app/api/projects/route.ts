import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Force Node.js runtime for better-sqlite3 support
export const runtime = 'nodejs';

const DB_PATH = process.env.DATABASE_PATH || '/opt/central-mcp/data/registry.db';

/**
 * GET /api/projects
 *
 * Returns REAL project data from Central-MCP database:
 * - projects (44 rows)
 * - Enriched with task stats, activity metrics, and health indicators
 */
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all projects
    const projects = db.prepare(`
      SELECT
        id,
        name,
        path,
        git_remote,
        type,
        vision,
        created_at,
        last_activity,
        discovered_by,
        metadata,
        project_number
      FROM projects
      ORDER BY last_activity DESC, name
    `).all();

    // Get task counts per project (if tasks table has project reference)
    let taskCounts: any[] = [];
    try {
      taskCounts = db.prepare(`
        SELECT
          project_id,
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks
        FROM tasks
        WHERE project_id IS NOT NULL
        GROUP BY project_id
      `).all();
    } catch (e) {
      // Tasks table might not have project_id column or might not exist
      console.log('Could not query tasks by project:', e);
    }

    // Build task map
    const taskMap = taskCounts.reduce((acc: any, count: any) => {
      acc[count.project_id] = count;
      return acc;
    }, {});

    // Get spec counts per project (if specs table exists)
    let specCounts: any[] = [];
    try {
      specCounts = db.prepare(`
        SELECT
          project_id,
          COUNT(*) as total_specs
        FROM specs
        WHERE project_id IS NOT NULL
        GROUP BY project_id
      `).all();
    } catch (e) {
      // Specs table might not have project_id column or might not exist
      console.log('Could not query specs by project:', e);
    }

    // Build spec map
    const specMap = specCounts.reduce((acc: any, count: any) => {
      acc[count.project_id] = count.total_specs;
      return acc;
    }, {});

    // Enrich projects with task and spec data
    const enrichedProjects = projects.map((project: any) => {
      const tasks = taskMap[project.id] || {
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        blocked_tasks: 0
      };

      const specs = specMap[project.id] || 0;

      // Calculate health metrics
      const lastActivity = new Date(project.last_activity);
      const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      // Health score based on recent activity and task completion
      const activityScore = Math.max(0, 100 - daysSinceActivity * 5);
      const taskCompletionRate = tasks.total_tasks > 0
        ? (tasks.completed_tasks / tasks.total_tasks * 100)
        : 0;
      const healthScore = Math.round((activityScore * 0.6) + (taskCompletionRate * 0.4));

      let healthStatus: string;
      if (healthScore >= 80) healthStatus = 'healthy';
      else if (healthScore >= 50) healthStatus = 'warning';
      else healthStatus = 'critical';

      return {
        ...project,
        metadataParsed: project.metadata ? (function() {
          try { return JSON.parse(project.metadata); } catch { return null; }
        })() : null,
        tasks: {
          total: tasks.total_tasks,
          completed: tasks.completed_tasks,
          inProgress: tasks.in_progress_tasks,
          blocked: tasks.blocked_tasks,
          completionRate: Math.round(taskCompletionRate)
        },
        specs: {
          total: specs
        },
        health: {
          score: healthScore,
          status: healthStatus,
          daysSinceActivity
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      total: projects.length,
      byType: projects.reduce((acc: any, p: any) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      byHealth: enrichedProjects.reduce((acc: any, p: any) => {
        acc[p.health.status] = (acc[p.health.status] || 0) + 1;
        return acc;
      }, {}),
      totalTasks: enrichedProjects.reduce((sum: number, p: any) => sum + p.tasks.total, 0),
      totalSpecs: enrichedProjects.reduce((sum: number, p: any) => sum + p.specs.total, 0),
      avgHealthScore: Math.round(enrichedProjects.reduce((sum: number, p: any) => sum + p.health.score, 0) / enrichedProjects.length)
    };

    // Get most active projects (top 10)
    const mostActive = enrichedProjects.slice(0, 10);

    // Group by type
    const projectsByType = enrichedProjects.reduce((acc: any, project: any) => {
      if (!acc[project.type]) {
        acc[project.type] = [];
      }
      acc[project.type].push(project);
      return acc;
    }, {});

    db.close();

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      projects: enrichedProjects,
      mostActive,
      byType: projectsByType
    });

    // Cache for 5 seconds
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');

    return response;
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch project data',
      message: error.message
    }, { status: 500 });
  }
}
