import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = process.env.CENTRAL_MCP_DB_PATH || '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

export const dynamic = 'force-dynamic';

interface LoopExecution {
  id: string;
  loop_name: string;
  action: string;
  project_name: string | null;
  result: string | null;
  timestamp: string;
  execution_time_ms: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, stats, timeline
    const loopName = searchParams.get('loop') || '';
    const projectName = searchParams.get('project') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = new Database(DB_PATH, { readonly: true });

    if (action === 'stats') {
      // Get statistics
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_executions,
          COUNT(DISTINCT loop_name) as unique_loops,
          COUNT(DISTINCT project_name) as unique_projects,
          AVG(execution_time_ms) as avg_execution_time,
          MAX(execution_time_ms) as max_execution_time,
          MIN(execution_time_ms) as min_execution_time
        FROM auto_proactive_logs
      `).get() as any;

      // Get executions by loop
      const byLoop = db.prepare(`
        SELECT
          loop_name,
          COUNT(*) as execution_count,
          AVG(execution_time_ms) as avg_time
        FROM auto_proactive_logs
        GROUP BY loop_name
        ORDER BY execution_count DESC
      `).all();

      db.close();

      return NextResponse.json({
        ...stats,
        byLoop
      });
    }

    if (action === 'timeline') {
      // Get recent executions timeline
      let query = `
        SELECT * FROM auto_proactive_logs
        WHERE 1=1
      `;

      if (loopName) {
        query += ` AND loop_name = ?`;
      }
      if (projectName) {
        query += ` AND project_name = ?`;
      }

      query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;

      const params: any[] = [];
      if (loopName) params.push(loopName);
      if (projectName) params.push(projectName);
      params.push(limit, offset);

      const executions = db.prepare(query).all(...params) as LoopExecution[];

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM auto_proactive_logs WHERE 1=1`;
      const countParams: any[] = [];
      if (loopName) {
        countQuery += ` AND loop_name = ?`;
        countParams.push(loopName);
      }
      if (projectName) {
        countQuery += ` AND project_name = ?`;
        countParams.push(projectName);
      }

      const { total } = db.prepare(countQuery).get(...countParams) as any;

      db.close();

      return NextResponse.json({
        executions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    // Default: List all executions
    let query = `
      SELECT * FROM auto_proactive_logs
      WHERE 1=1
    `;

    if (loopName) {
      query += ` AND loop_name = ?`;
    }
    if (projectName) {
      query += ` AND project_name = ?`;
    }

    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;

    const params: any[] = [];
    if (loopName) params.push(loopName);
    if (projectName) params.push(projectName);
    params.push(limit, offset);

    const executions = db.prepare(query).all(...params) as LoopExecution[];

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM auto_proactive_logs WHERE 1=1`;
    const countParams: any[] = [];
    if (loopName) {
      countQuery += ` AND loop_name = ?`;
      countParams.push(loopName);
    }
    if (projectName) {
      countQuery += ` AND project_name = ?`;
      countParams.push(projectName);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as any;

    db.close();

    return NextResponse.json({
      executions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Loops API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loop executions', details: error.message },
      { status: 500 }
    );
  }
}
