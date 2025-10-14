import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = process.env.CENTRAL_MCP_DB_PATH || '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

export const dynamic = 'force-dynamic';

interface Conversation {
  id: string;
  agent_id: string;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  files_created: number;
  ideas_captured: number;
  metadata: string | null;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  timestamp: string;
  token_count: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, messages, stats
    const conversationId = searchParams.get('id') || '';
    const agentId = searchParams.get('agent') || '';
    const projectId = searchParams.get('project') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = new Database(DB_PATH, { readonly: true });

    if (action === 'stats') {
      // Get statistics
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_conversations,
          COUNT(DISTINCT agent_id) as unique_agents,
          COUNT(DISTINCT project_id) as unique_projects,
          SUM(message_count) as total_messages,
          SUM(files_created) as total_files_created,
          SUM(ideas_captured) as total_ideas_captured,
          AVG(message_count) as avg_messages_per_conversation
        FROM conversations
      `).get() as any;

      // Get conversations by agent
      const byAgent = db.prepare(`
        SELECT
          agent_id,
          COUNT(*) as conversation_count,
          SUM(message_count) as total_messages
        FROM conversations
        GROUP BY agent_id
        ORDER BY conversation_count DESC
        LIMIT 10
      `).all();

      db.close();

      return NextResponse.json({
        ...stats,
        byAgent
      });
    }

    if (action === 'messages' && conversationId) {
      // Get messages for a conversation
      const messages = db.prepare(`
        SELECT * FROM conversation_messages
        WHERE conversation_id = ?
        ORDER BY timestamp ASC
        LIMIT ? OFFSET ?
      `).all(conversationId, limit, offset) as ConversationMessage[];

      // Get total count
      const { total } = db.prepare(`
        SELECT COUNT(*) as total FROM conversation_messages
        WHERE conversation_id = ?
      `).get(conversationId) as any;

      // Get conversation details
      const conversation = db.prepare(`
        SELECT * FROM conversations
        WHERE id = ?
      `).get(conversationId) as Conversation | undefined;

      db.close();

      return NextResponse.json({
        conversation,
        messages,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    // Default: List conversations
    let query = `
      SELECT * FROM conversations
      WHERE 1=1
    `;

    const params: any[] = [];

    if (agentId) {
      query += ` AND agent_id = ?`;
      params.push(agentId);
    }
    if (projectId) {
      query += ` AND project_id = ?`;
      params.push(projectId);
    }

    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const conversations = db.prepare(query).all(...params) as Conversation[];

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM conversations WHERE 1=1`;
    const countParams: any[] = [];

    if (agentId) {
      countQuery += ` AND agent_id = ?`;
      countParams.push(agentId);
    }
    if (projectId) {
      countQuery += ` AND project_id = ?`;
      countParams.push(projectId);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as any;

    db.close();

    return NextResponse.json({
      conversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 }
    );
  }
}
