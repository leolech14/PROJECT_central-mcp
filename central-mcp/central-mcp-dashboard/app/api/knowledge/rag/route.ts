import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = process.env.CENTRAL_MCP_DB_PATH || '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

export const dynamic = 'force-dynamic';

interface RAGChunk {
  id: string;
  spec_id: string;
  chunk_index: number;
  content: string;
  file_path: string;
  file_name: string;
  section: string | null;
  subsection: string | null;
  chunk_type: string;
  importance: string;
  tags: string | null;
  line_start: number | null;
  line_end: number | null;
  created_at: string;
}

interface DoclingDocument {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  processed_at: string;
  metadata: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'chunks'; // chunks, documents, stats
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = new Database(DB_PATH, { readonly: true });

    if (type === 'stats') {
      // Get statistics
      const ragStats = db.prepare(`
        SELECT
          COUNT(*) as total_chunks,
          COUNT(DISTINCT spec_id) as total_specs,
          COUNT(DISTINCT file_name) as total_files,
          SUM(LENGTH(content)) as total_content_size
        FROM rag_spec_chunks
      `).get() as any;

      const doclingStats = db.prepare(`
        SELECT
          COUNT(*) as total_documents,
          COUNT(DISTINCT file_type) as total_file_types
        FROM docling_documents
      `).get() as any;

      db.close();

      return NextResponse.json({
        rag: ragStats,
        docling: doclingStats,
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'documents') {
      // Get docling documents
      let query = `
        SELECT * FROM docling_documents
        WHERE 1=1
      `;

      if (search) {
        query += ` AND (title LIKE ? OR file_path LIKE ?)`;
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

      const stmt = db.prepare(query);
      const params = search
        ? [`%${search}%`, `%${search}%`, limit, offset]
        : [limit, offset];

      const documents = stmt.all(...params) as DoclingDocument[];

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM docling_documents WHERE 1=1`;
      if (search) {
        countQuery += ` AND (title LIKE ? OR file_path LIKE ?)`;
      }
      const countStmt = db.prepare(countQuery);
      const countParams = search ? [`%${search}%`, `%${search}%`] : [];
      const { total } = countStmt.get(...countParams) as any;

      db.close();

      return NextResponse.json({
        documents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    // Default: Get RAG chunks
    let query = `
      SELECT * FROM rag_spec_chunks
      WHERE 1=1
    `;

    if (search) {
      query += ` AND (content LIKE ? OR file_name LIKE ? OR section LIKE ?)`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const stmt = db.prepare(query);
    const params = search
      ? [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
      : [limit, offset];

    const chunks = stmt.all(...params) as RAGChunk[];

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM rag_spec_chunks WHERE 1=1`;
    if (search) {
      countQuery += ` AND (content LIKE ? OR file_name LIKE ? OR section LIKE ?)`;
    }
    const countStmt = db.prepare(countQuery);
    const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const { total } = countStmt.get(...countParams) as any;

    db.close();

    return NextResponse.json({
      chunks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('RAG API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RAG data', details: error.message },
      { status: 500 }
    );
  }
}
