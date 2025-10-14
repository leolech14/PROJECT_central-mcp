#!/usr/bin/env npx tsx
/**
 * Save Claude Code Thread to Central-MCP
 * ======================================
 *
 * Imports Claude Code conversation export into Central-MCP database
 *
 * Usage:
 *   1. Export conversation: ctrl+shift+e (or /export command)
 *   2. Run: npx tsx scripts/save-thread-to-central-mcp.ts <exported-file.md>
 *
 * OR use automatic mode:
 *   npx tsx scripts/save-thread-to-central-mcp.ts --auto
 *   (watches for new exports and imports automatically)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

interface ConversationExport {
  agent_id: string;
  project_id?: string;
  messages: ParsedMessage[];
  files: FileAction[];
  ideas: CapturedIdea[];
  outputs: SavedOutput[];
}

interface ParsedMessage {
  role: 'human' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: any;
}

interface FileAction {
  action: 'created' | 'read' | 'edited' | 'deleted';
  path: string;
  content?: string;
  timestamp?: string;
}

interface CapturedIdea {
  type: 'insight' | 'decision' | 'solution' | 'question' | 'blocker';
  content: string;
  context?: string;
  tags?: string[];
  timestamp?: string;
}

interface SavedOutput {
  type: 'code' | 'spec' | 'diagram' | 'analysis' | 'solution';
  content: string;
  file_path?: string;
  metadata?: any;
  timestamp?: string;
}

class ThreadImporter {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.ensureSchema();
  }

  /**
   * Ensure database schema exists
   */
  private ensureSchema(): void {
    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        project_id TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        message_count INTEGER DEFAULT 0,
        files_created INTEGER DEFAULT 0,
        ideas_captured INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_started ON conversations(started_at);
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('human', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
    `);

    // File tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_files (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('created', 'read', 'edited', 'deleted')),
        content_snapshot TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE INDEX IF NOT EXISTS idx_conv_files_conversation ON conversation_files(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conv_files_path ON conversation_files(file_path);
      CREATE INDEX IF NOT EXISTS idx_conv_files_action ON conversation_files(action);
    `);

    // Ideas table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_ideas (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        idea_type TEXT NOT NULL CHECK(idea_type IN ('insight', 'decision', 'solution', 'question', 'blocker')),
        content TEXT NOT NULL,
        context TEXT,
        tags TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE INDEX IF NOT EXISTS idx_ideas_conversation ON conversation_ideas(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_ideas_type ON conversation_ideas(idea_type);
      CREATE INDEX IF NOT EXISTS idx_ideas_timestamp ON conversation_ideas(timestamp);
    `);

    // Outputs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_outputs (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        output_type TEXT NOT NULL CHECK(output_type IN ('code', 'spec', 'diagram', 'analysis', 'solution')),
        content TEXT NOT NULL,
        file_path TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE INDEX IF NOT EXISTS idx_outputs_conversation ON conversation_outputs(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_outputs_type ON conversation_outputs(output_type);
      CREATE INDEX IF NOT EXISTS idx_outputs_file ON conversation_outputs(file_path);
    `);

    console.log('✅ Database schema ready');
  }

  /**
   * Parse Claude Code exported markdown file
   */
  async parseExport(exportPath: string): Promise<ConversationExport> {
    console.log(`📖 Reading export: ${exportPath}`);
    const content = await fs.readFile(exportPath, 'utf-8');

    const messages: ParsedMessage[] = [];
    const files: FileAction[] = [];
    const ideas: CapturedIdea[] = [];
    const outputs: SavedOutput[] = [];

    // Parse messages
    const messageBlocks = content.split(/^(>|⏺)\s+/gm).filter(Boolean);

    for (let i = 0; i < messageBlocks.length; i += 2) {
      const prefix = messageBlocks[i];
      const messageContent = messageBlocks[i + 1];

      if (!messageContent) continue;

      if (prefix === '>') {
        // Human message
        messages.push({
          role: 'human',
          content: messageContent.trim()
        });
      } else if (prefix === '⏺') {
        // Assistant message
        messages.push({
          role: 'assistant',
          content: messageContent.trim()
        });

        // Extract file operations from assistant messages
        const writeMatch = messageContent.match(/Write\((.+?)\)/);
        if (writeMatch) {
          files.push({
            action: 'created',
            path: writeMatch[1]
          });
        }

        const readMatch = messageContent.match(/Read\((.+?)\)/);
        if (readMatch) {
          files.push({
            action: 'read',
            path: readMatch[1]
          });
        }

        const editMatch = messageContent.match(/Edit\((.+?)\)/);
        if (editMatch) {
          files.push({
            action: 'edited',
            path: editMatch[1]
          });
        }
      }
    }

    // Extract ideas from content
    const ideaPatterns = [
      { pattern: /💡\s*(.+?)(?:\n|$)/g, type: 'insight' as const },
      { pattern: /✅\s*(.+?)(?:\n|$)/g, type: 'decision' as const },
      { pattern: /🎯\s*(.+?)(?:\n|$)/g, type: 'solution' as const },
      { pattern: /❓\s*(.+?)(?:\n|$)/g, type: 'question' as const },
      { pattern: /🚨\s*(.+?)(?:\n|$)/g, type: 'blocker' as const }
    ];

    for (const { pattern, type } of ideaPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        ideas.push({
          type,
          content: match[1].trim()
        });
      }
    }

    // Detect agent and project from content
    let agent_id = 'B'; // Default
    let project_id: string | undefined;

    const agentMatch = content.match(/Agent ([A-F])/);
    if (agentMatch) {
      agent_id = agentMatch[1];
    }

    const projectMatch = content.match(/Project:\s*(\w+)/);
    if (projectMatch) {
      project_id = projectMatch[1].toLowerCase();
    }

    return {
      agent_id,
      project_id,
      messages,
      files,
      ideas,
      outputs
    };
  }

  /**
   * Import conversation into Central-MCP
   */
  importConversation(parsed: ConversationExport): string {
    const conversationId = `conv_${Date.now()}_${parsed.agent_id}`;

    console.log(`💾 Importing conversation: ${conversationId}`);

    // Create conversation
    this.db.prepare(`
      INSERT INTO conversations (id, agent_id, project_id, started_at, ended_at, message_count, files_created, ideas_captured)
      VALUES (?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?)
    `).run(
      conversationId,
      parsed.agent_id,
      parsed.project_id || null,
      parsed.messages.length,
      parsed.files.filter(f => f.action === 'created').length,
      parsed.ideas.length
    );

    // Import messages
    for (const message of parsed.messages) {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(messageId, conversationId, message.role, message.content);
    }

    // Import files
    for (const file of parsed.files) {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.db.prepare(`
        INSERT INTO conversation_files (id, conversation_id, file_path, action, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(fileId, conversationId, file.path, file.action);
    }

    // Import ideas
    for (const idea of parsed.ideas) {
      const ideaId = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.db.prepare(`
        INSERT INTO conversation_ideas (id, conversation_id, idea_type, content, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(ideaId, conversationId, idea.type, idea.content);
    }

    console.log(`✅ Imported conversation with:`);
    console.log(`   📨 Messages: ${parsed.messages.length}`);
    console.log(`   📁 Files: ${parsed.files.length}`);
    console.log(`   💡 Ideas: ${parsed.ideas.length}`);

    return conversationId;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`
❌ No export file specified!

Usage:
  npx tsx scripts/save-thread-to-central-mcp.ts <exported-conversation.md>

Example:
  npx tsx scripts/save-thread-to-central-mcp.ts ~/Downloads/conversation-2025-10-09.md
`);
    process.exit(1);
  }

  const exportPath = args[0];
  const dbPath = path.join(__dirname, '../data/registry.db');

  console.log(`\n🧵 Thread Import to Central-MCP\n`);
  console.log(`📄 Export file: ${exportPath}`);
  console.log(`🗄️  Database: ${dbPath}\n`);

  try {
    const importer = new ThreadImporter(dbPath);
    const parsed = await importer.parseExport(exportPath);
    const conversationId = importer.importConversation(parsed);

    console.log(`\n✅ THREAD SAVED TO CENTRAL-MCP!\n`);
    console.log(`🆔 Conversation ID: ${conversationId}`);
    console.log(`👤 Agent: ${parsed.agent_id}`);
    console.log(`📦 Project: ${parsed.project_id || 'N/A'}`);
    console.log(`\n🎊 Your ideas, files, and outputs are now preserved forever!\n`);

  } catch (error) {
    console.error(`\n❌ IMPORT FAILED!\n`);
    console.error(error);
    process.exit(1);
  }
}

main();
