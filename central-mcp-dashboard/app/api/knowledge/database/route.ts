import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = process.env.CENTRAL_MCP_DB_PATH || '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

export const dynamic = 'force-dynamic';

interface TableInfo {
  name: string;
  type: string;
  sql: string;
}

interface TableStats {
  name: string;
  row_count: number;
  column_count: number;
  size_kb: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'tables'; // tables, schema, query, stats
    const tableName = searchParams.get('table') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = new Database(DB_PATH, { readonly: true });

    if (action === 'tables') {
      // List all tables
      const tables = db.prepare(`
        SELECT name, type, sql
        FROM sqlite_master
        WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all() as TableInfo[];

      db.close();

      return NextResponse.json({ tables });
    }

    if (action === 'schema' && tableName) {
      // Get table schema
      const schema = db.prepare(`
        SELECT sql
        FROM sqlite_master
        WHERE name = ?
      `).get(tableName) as { sql: string } | undefined;

      if (!schema) {
        db.close();
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }

      // Get column info
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

      // Get row count
      const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;

      db.close();

      return NextResponse.json({
        table: tableName,
        sql: schema.sql,
        columns,
        row_count: count
      });
    }

    if (action === 'query' && tableName) {
      // Query table data
      const query = `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`;
      const rows = db.prepare(query).all(limit, offset);

      // Get total count
      const { total } = db.prepare(`SELECT COUNT(*) as total FROM ${tableName}`).get() as any;

      db.close();

      return NextResponse.json({
        table: tableName,
        rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    if (action === 'stats') {
      // Get statistics for all tables
      const tables = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '%_fts%'
      `).all() as { name: string }[];

      const stats: TableStats[] = [];

      for (const table of tables) {
        try {
          const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as any;
          const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();

          stats.push({
            name: table.name,
            row_count: count,
            column_count: columns.length,
            size_kb: 0 // SQLite doesn't easily expose per-table size
          });
        } catch (err) {
          // Skip tables that error
          console.error(`Error getting stats for ${table.name}:`, err);
        }
      }

      // Sort by row count descending
      stats.sort((a, b) => b.row_count - a.row_count);

      db.close();

      return NextResponse.json({ stats });
    }

    db.close();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Database API error:', error);
    return NextResponse.json(
      { error: 'Failed to query database', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Security: Only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith('select')) {
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed' },
        { status: 403 }
      );
    }

    const db = new Database(DB_PATH, { readonly: true });

    const rows = db.prepare(query).all();

    db.close();

    return NextResponse.json({ rows, query });

  } catch (error: any) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to execute query', details: error.message },
      { status: 500 }
    );
  }
}
