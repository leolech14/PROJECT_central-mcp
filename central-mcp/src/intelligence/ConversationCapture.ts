/**
 * Conversation Capture System
 * ============================
 *
 * CRITICAL: This captures ALL user messages as PRIMARY INTELLIGENCE SOURCE
 *
 * Every user message is:
 * 1. Stored immediately (raw preservation)
 * 2. Classified (WRITTEN vs SPOKEN)
 * 3. Analyzed for semantic density
 * 4. Queued for intelligence extraction
 *
 * This is the FOUNDATION of auto-proactive intelligence!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface UserMessage {
  id: string;
  sessionId: string;
  projectId: string;
  agentLetter: string;
  messageType: 'USER_INPUT' | 'AGENT_RESPONSE' | 'SYSTEM_MESSAGE';
  content: string;
  language: string;
  inputMethod: 'WRITTEN' | 'SPOKEN' | 'UNKNOWN';
  wordCount: number;
  characterCount: number;
  semanticDensity: number;
  timestamp: string;
  projectContext?: string;
  conversationContext?: string;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  hasCapitalLetters: boolean;
  hasCodeBlocks: boolean;
  hasURLs: boolean;
  hasCommands: boolean;
  hasEmojis: boolean;
  capitalLetterRatio: number;
  exclamationCount: number;
  questionCount: number;
}

export class ConversationCapture {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Capture user message immediately
   */
  captureUserMessage(
    content: string,
    sessionId: string,
    projectId: string,
    agentLetter: string
  ): UserMessage {
    console.log(`📝 CAPTURING USER MESSAGE (${content.length} chars)`);

    // Analyze message characteristics
    const analysis = this.analyzeMessage(content);

    // Create message record
    const message: UserMessage = {
      id: randomUUID(),
      sessionId,
      projectId,
      agentLetter,
      messageType: 'USER_INPUT',
      content,
      language: analysis.language,
      inputMethod: analysis.inputMethod,
      wordCount: analysis.wordCount,
      characterCount: content.length,
      semanticDensity: analysis.semanticDensity,
      timestamp: new Date().toISOString(),
      metadata: analysis.metadata
    };

    // Store in database
    const stmt = this.db.prepare(`
      INSERT INTO conversation_messages (
        id, session_id, project_id, agent_letter,
        message_type, content, language, input_method,
        word_count, character_count, semantic_density,
        timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.id,
      message.sessionId,
      message.projectId,
      message.agentLetter,
      message.messageType,
      message.content,
      message.language,
      message.inputMethod,
      message.wordCount,
      message.characterCount,
      message.semanticDensity,
      message.timestamp,
      JSON.stringify(message.metadata)
    );

    console.log(`✅ MESSAGE CAPTURED: ${message.id.slice(0, 8)}... (${message.inputMethod}, ${message.language})`);

    return message;
  }

  /**
   * Analyze message characteristics
   */
  private analyzeMessage(content: string): {
    language: string;
    inputMethod: 'WRITTEN' | 'SPOKEN' | 'UNKNOWN';
    wordCount: number;
    semanticDensity: number;
    metadata: MessageMetadata;
  } {
    // Word count
    const words = content.trim().split(/\s+/);
    const wordCount = words.length;

    // Character analysis
    const capitalLetters = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[a-zA-Z]/g) || []).length;
    const capitalRatio = totalLetters > 0 ? capitalLetters / totalLetters : 0;

    // Input method detection
    let inputMethod: 'WRITTEN' | 'SPOKEN' | 'UNKNOWN';
    if (capitalRatio > 0.3) {
      // HIGH capital letter ratio = WRITTEN (typed with emphasis)
      inputMethod = 'WRITTEN';
    } else if (capitalRatio < 0.05 && wordCount > 20) {
      // LOW capital ratio + long = SPOKEN (transcribed)
      inputMethod = 'SPOKEN';
    } else {
      inputMethod = 'UNKNOWN';
    }

    // Language detection (simple heuristic)
    const hasPortuguese = /\b(então|quando|pode|muito|para|isso|traz|tenho)\b/i.test(content);
    const language = hasPortuguese ? 'pt-BR' : 'en';

    // Semantic density (keywords / total words)
    const keywords = this.extractKeywords(content);
    const semanticDensity = wordCount > 0 ? keywords.length / wordCount : 0;

    // Metadata detection
    const metadata: MessageMetadata = {
      hasCapitalLetters: capitalRatio > 0.2,
      hasCodeBlocks: /```/.test(content),
      hasURLs: /https?:\/\//.test(content),
      hasCommands: /\$/.test(content) || /npm|git|cd/.test(content),
      hasEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(content),
      capitalLetterRatio: capitalRatio,
      exclamationCount: (content.match(/!/g) || []).length,
      questionCount: (content.match(/\?/g) || []).length
    };

    return {
      language,
      inputMethod,
      wordCount,
      semanticDensity,
      metadata
    };
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const text = content.toLowerCase();
    const keywords: string[] = [];

    // Technical keywords
    const technicalTerms = [
      'database', 'api', 'ui', 'frontend', 'backend', 'agent', 'task',
      'spec', 'implementation', 'deploy', 'test', 'build', 'central-mcp',
      'localbrain', 'orchestra', 'auto-proactive', 'workflow', 'project',
      'message', 'intelligence', 'conversation', 'capture', 'store'
    ];

    for (const term of technicalTerms) {
      if (text.includes(term)) {
        keywords.push(term);
      }
    }

    return keywords;
  }

  /**
   * Get recent messages for context
   */
  getRecentMessages(sessionId: string, limit: number = 10): UserMessage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conversation_messages
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(sessionId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      projectId: row.project_id,
      agentLetter: row.agent_letter,
      messageType: row.message_type,
      content: row.content,
      language: row.language,
      inputMethod: row.input_method,
      wordCount: row.word_count,
      characterCount: row.character_count,
      semanticDensity: row.semantic_density,
      timestamp: row.timestamp,
      projectContext: row.project_context,
      conversationContext: row.conversation_context,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Get messages for project (for Project 0 intelligence)
   */
  getProjectMessages(projectId: string, limit?: number): UserMessage[] {
    const sql = limit
      ? `SELECT * FROM conversation_messages WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM conversation_messages WHERE project_id = ? ORDER BY timestamp DESC`;

    const stmt = this.db.prepare(sql);
    const rows = limit ? stmt.all(projectId, limit) : stmt.all(projectId);

    return (rows as any[]).map(row => ({
      id: row.id,
      sessionId: row.session_id,
      projectId: row.project_id,
      agentLetter: row.agent_letter,
      messageType: row.message_type,
      content: row.content,
      language: row.language,
      inputMethod: row.input_method,
      wordCount: row.word_count,
      characterCount: row.character_count,
      semanticDensity: row.semantic_density,
      timestamp: row.timestamp,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Get statistics for dashboard
   */
  getConversationStats(projectId?: string): {
    totalMessages: number;
    writtenMessages: number;
    spokenMessages: number;
    averageSemanticDensity: number;
    languageDistribution: { [lang: string]: number };
    messagesLastHour: number;
    messagesLastDay: number;
  } {
    const baseWhere = projectId ? 'WHERE project_id = ?' : '';
    const params = projectId ? [projectId] : [];

    // Total messages
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversation_messages ${baseWhere}`);
    const total = (totalStmt.get(...params) as any).count;

    // By input method
    const writtenStmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversation_messages ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} input_method = 'WRITTEN'`);
    const written = (writtenStmt.get(...params) as any).count;

    const spokenStmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversation_messages ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} input_method = 'SPOKEN'`);
    const spoken = (spokenStmt.get(...params) as any).count;

    // Average semantic density
    const densityStmt = this.db.prepare(`SELECT AVG(semantic_density) as avg FROM conversation_messages ${baseWhere}`);
    const avgDensity = (densityStmt.get(...params) as any).avg || 0;

    // Recent activity
    const lastHourStmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversation_messages ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} timestamp >= datetime('now', '-1 hour')`);
    const lastHour = (lastHourStmt.get(...params) as any).count;

    const lastDayStmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversation_messages ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} timestamp >= datetime('now', '-1 day')`);
    const lastDay = (lastDayStmt.get(...params) as any).count;

    return {
      totalMessages: total,
      writtenMessages: written,
      spokenMessages: spoken,
      averageSemanticDensity: avgDensity,
      languageDistribution: { en: total - spoken, 'pt-BR': spoken }, // Simplified
      messagesLastHour: lastHour,
      messagesLastDay: lastDay
    };
  }
}
